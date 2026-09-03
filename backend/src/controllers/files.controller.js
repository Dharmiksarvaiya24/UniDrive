const { google } = require('googleapis');
const { db } = require('../config/firebase');
const { decrypt, encrypt } = require('../utils/encryption');

// In-memory cache for resolved Drive clients & file metadata
const fileInfoCache = new Map();
const FILE_INFO_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// In-memory buffer cache for PDFs (standard PDFs and exported Google Docs)
const pdfBufferCache = new Map();
const PDF_BUFFER_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Creates an authorized OAuth2 Google Drive client for a given account doc
 * with auto-refresh token persistence.
 */
function createOAuth2ClientForAccount(userId, accountDoc) {
  const account = accountDoc.data();
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: decrypt(account.accessToken),
    refresh_token: account.refreshToken ? decrypt(account.refreshToken) : undefined,
    expiry_date: account.expiryDate,
  });

  // Persist auto-refreshed access tokens
  oauth2Client.on('tokens', async (newTokens) => {
    try {
      const update = {
        accessToken: encrypt(newTokens.access_token),
        expiryDate: newTokens.expiry_date,
      };
      if (newTokens.refresh_token) {
        update.refreshToken = encrypt(newTokens.refresh_token);
      }
      await db
        .collection('users')
        .doc(userId)
        .collection('connectedAccounts')
        .doc(accountDoc.id)
        .update(update);
    } catch (err) {
      console.warn('Failed to persist refreshed tokens:', err.message);
    }
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Locates the connected account that has access to the requested file.
 * Uses an in-memory cache to avoid redundant Firestore reads and Drive API calls.
 */
async function findDriveForFile(userId, fileId, preferredAccountId) {
  const cacheKey = `${userId}:${fileId}`;
  const cached = fileInfoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const accountsSnap = await db
    .collection('users')
    .doc(userId)
    .collection('connectedAccounts')
    .get();

  if (accountsSnap.empty) {
    return null;
  }

  let preferredDoc = null;
  const otherDocs = [];

  for (const doc of accountsSnap.docs) {
    const data = doc.data();
    if (
      preferredAccountId &&
      (data.googleAccountId === preferredAccountId ||
        doc.id === preferredAccountId ||
        data.email === preferredAccountId)
    ) {
      preferredDoc = doc;
    } else {
      otherDocs.push(doc);
    }
  }

  const docsToTry = preferredDoc ? [preferredDoc, ...otherDocs] : otherDocs;

  for (const accountDoc of docsToTry) {
    try {
      const drive = createOAuth2ClientForAccount(userId, accountDoc);
      const metaRes = await drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, webViewLink',
      });
      if (metaRes.data && metaRes.data.id) {
        const result = {
          drive,
          file: metaRes.data,
          account: accountDoc.data(),
          expiresAt: Date.now() + FILE_INFO_CACHE_TTL,
        };
        fileInfoCache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      if (err.code !== 404 && err.status !== 404) {
        console.warn(`Drive check error on ${accountDoc.data().email}:`, err.message);
      }
    }
  }

  return null;
}

/**
 * Common handler to stream or download a file from Google Drive using the
 * user's stored OAuth credentials, bypassing Google login requirements.
 */
async function streamFile(req, res, { isDownload = false }) {
  try {
    const userId = req.userId;
    const { fileId } = req.params;
    const { accountId } = req.query;

    if (!fileId) {
      return res.status(400).json({ error: 'Missing fileId parameter' });
    }

    const dispositionType = isDownload ? 'attachment' : 'inline';

    // Fast path: Check in-memory PDF buffer cache for instant 0ms responses
    const cachedPdf = pdfBufferCache.get(fileId);
    if (cachedPdf && cachedPdf.expiresAt > Date.now()) {
      const buffer = cachedPdf.buffer;
      const total = buffer.length;
      const filename = cachedPdf.filename;

      res.setHeader('Content-Type', cachedPdf.mimeType || 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `${dispositionType}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
      res.setHeader('Cache-Control', 'private, max-age=86400');
      res.setHeader('Accept-Ranges', 'bytes');

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
        if (start < total && end < total && start <= end) {
          const chunksize = end - start + 1;
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
          res.setHeader('Content-Length', chunksize);
          return res.end(buffer.subarray(start, end + 1));
        }
      }

      res.setHeader('Content-Length', total);
      return res.end(buffer);
    }

    const driveInfo = await findDriveForFile(userId, fileId, accountId);
    if (!driveInfo) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    const { drive, file } = driveInfo;

    // 1. Google Workspace Document (Docs, Sheets, Slides, Drawings)
    if (file.mimeType && file.mimeType.startsWith('application/vnd.google-apps.')) {
      let exportMimeType = 'application/pdf';
      let extension = '.pdf';

      if (isDownload) {
        if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
          exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = '.xlsx';
        } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
          exportMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          extension = '.pptx';
        } else if (file.mimeType === 'application/vnd.google-apps.drawing') {
          exportMimeType = 'image/png';
          extension = '.png';
        }
      }

      const baseName = file.name || 'document';
      const filename = baseName.toLowerCase().endsWith(extension) ? baseName : `${baseName}${extension}`;

      const exportRes = await drive.files.export(
        { fileId, mimeType: exportMimeType },
        { responseType: 'stream' }
      );

      // Buffer Google Docs exported to PDF for instant subsequent page loading
      if (exportMimeType === 'application/pdf') {
        const chunks = [];
        exportRes.data.on('data', (c) => chunks.push(c));
        exportRes.data.on('end', () => {
          const buffer = Buffer.concat(chunks);
          pdfBufferCache.set(fileId, {
            buffer,
            mimeType: exportMimeType,
            filename,
            expiresAt: Date.now() + PDF_BUFFER_CACHE_TTL,
          });

          res.setHeader(
            'Content-Disposition',
            `${dispositionType}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
          );
          res.setHeader('Content-Type', exportMimeType);
          res.setHeader('Content-Length', buffer.length);
          res.setHeader('Cache-Control', 'private, max-age=86400');
          res.setHeader('Accept-Ranges', 'bytes');
          res.end(buffer);
        });

        exportRes.data.on('error', (err) => {
          console.error('Export buffer error:', err.message);
          if (!res.headersSent) res.status(500).json({ error: 'Failed to export document' });
        });
        return;
      }

      // Non-PDF exports (sheets xlsx, slides pptx)
      res.setHeader(
        'Content-Disposition',
        `${dispositionType}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
      res.setHeader('Content-Type', exportMimeType);

      req.on('close', () => {
        if (exportRes.data && typeof exportRes.data.destroy === 'function') {
          exportRes.data.destroy();
        }
      });

      exportRes.data.on('error', (err) => {
        console.error('Export stream error:', err.message);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to stream exported document' });
      });

      return exportRes.data.pipe(res);
    }

    const filename = file.name || 'file';

    // 2. Standard PDF file optimization: buffer in memory to eliminate preview lag
    if (file.mimeType === 'application/pdf' && (!file.size || file.size <= 25 * 1024 * 1024)) {
      const streamRes = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      const chunks = [];
      streamRes.data.on('data', (c) => chunks.push(c));
      streamRes.data.on('end', () => {
        const buffer = Buffer.concat(chunks);
        pdfBufferCache.set(fileId, {
          buffer,
          mimeType: 'application/pdf',
          filename,
          expiresAt: Date.now() + PDF_BUFFER_CACHE_TTL,
        });

        const total = buffer.length;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `${dispositionType}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
        );
        res.setHeader('Cache-Control', 'private, max-age=86400');
        res.setHeader('Accept-Ranges', 'bytes');

        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
          if (start < total && end < total && start <= end) {
            const chunksize = end - start + 1;
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
            res.setHeader('Content-Length', chunksize);
            return res.end(buffer.subarray(start, end + 1));
          }
        }

        res.setHeader('Content-Length', total);
        res.end(buffer);
      });

      streamRes.data.on('error', (err) => {
        console.error('PDF buffer error:', err.message);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to load PDF' });
      });
      return;
    }

    // 3. Other standard binary files (images, videos, audio, text, zip, etc.)
    const getOptions = { responseType: 'stream' };
    if (req.headers.range) {
      getOptions.headers = { Range: req.headers.range };
    }

    const streamRes = await drive.files.get(
      { fileId, alt: 'media' },
      getOptions
    );

    res.setHeader(
      'Content-Disposition',
      `${dispositionType}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=86400');

    if (streamRes.status === 206 || streamRes.headers?.['content-range']) {
      res.status(206);
      if (streamRes.headers['content-range']) res.setHeader('Content-Range', streamRes.headers['content-range']);
      if (streamRes.headers['accept-ranges']) res.setHeader('Accept-Ranges', streamRes.headers['accept-ranges']);
      if (streamRes.headers['content-length']) res.setHeader('Content-Length', streamRes.headers['content-length']);
    } else if (file.size) {
      res.setHeader('Content-Length', file.size);
      res.setHeader('Accept-Ranges', 'bytes');
    }

    req.on('close', () => {
      if (streamRes.data && typeof streamRes.data.destroy === 'function') {
        streamRes.data.destroy();
      }
    });

    streamRes.data.on('error', (err) => {
      console.error('Drive file stream error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file' });
    });

    return streamRes.data.pipe(res);
  } catch (err) {
    console.error('Stream/Download error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to access file' });
    }
  }
}

/**
 * GET /api/files/:fileId/preview
 * Streams file content inline for in-browser preview without requiring Google login.
 */
exports.previewFile = async (req, res) => {
  await streamFile(req, res, { isDownload: false });
};

/**
 * GET /api/files/:fileId/download
 * Streams file as attachment for direct download without requiring Google login.
 */
exports.downloadFile = async (req, res) => {
  await streamFile(req, res, { isDownload: true });
};

/**
 * GET /api/files?folderId=X
 * userId comes from the verified session cookie (req.userId), never from query params.
 *
 * 1. Loads all connected-account tokens for this user from Firestore (decrypting them)
 * 2. For each account, calls Google Drive files.list using the stored tokens
 * 3. Auto-refreshes expired access tokens using the refresh token (re-encrypting on save)
 * 4. Returns a merged, de-duped file list as JSON
 */
exports.getFiles = async (req, res) => {
  try {
    const userId = req.userId;
    const { folderId } = req.query;

    // 1. Verify user exists
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Load all connected accounts
    const accountsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('connectedAccounts')
      .get();

    if (accountsSnap.empty) {
      return res.json({ files: [], accounts: [] });
    }

    const allFiles = [];
    const accountsList = [];
    let totalStorageLimit = 0;
    let totalStorageUsage = 0;

    // 3. For each connected account, fetch files and storage quota from Google Drive
    for (const accountDoc of accountsSnap.docs) {
      const account = accountDoc.data();
      let accountStorage = null;

      try {
        const drive = createOAuth2ClientForAccount(userId, accountDoc);

        // Fetch Storage Quota for this account
        try {
          const aboutRes = await drive.about.get({
            fields: 'storageQuota(limit, usage, usageInDrive, usageInDriveTrash)',
          });
          if (aboutRes.data && aboutRes.data.storageQuota) {
            const quota = aboutRes.data.storageQuota;
            const limit = quota.limit ? parseInt(quota.limit, 10) : 0;
            const usage = quota.usage ? parseInt(quota.usage, 10) : 0;
            totalStorageLimit += limit;
            totalStorageUsage += usage;
            accountStorage = { limit, usage };
          }
        } catch (aboutErr) {
          console.warn(`Drive about quota error for ${account.email}:`, aboutErr.message);
        }

        const qQuery = folderId
          ? `trashed = false and '${folderId}' in parents`
          : "trashed = false and 'root' in parents";

        const response = await drive.files.list({
          pageSize: 100,
          fields:
            'files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink, webViewLink, starred, imageMediaMetadata(width, height), videoMediaMetadata(width, height), parents)',
          orderBy: 'modifiedTime desc',
          q: qQuery,
        });

        const driveFiles = (response.data.files || []).map((file) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size ? parseInt(file.size, 10) : 0,
          modifiedTime: file.modifiedTime,
          iconLink: file.iconLink,
          thumbnailLink: file.thumbnailLink,
          webViewLink: file.webViewLink,
          starred: !!file.starred,
          parents: file.parents || [],
          dimensions: file.imageMediaMetadata
            ? `${file.imageMediaMetadata.width} × ${file.imageMediaMetadata.height}`
            : file.videoMediaMetadata
            ? `${file.videoMediaMetadata.width} × ${file.videoMediaMetadata.height}`
            : null,
          // Tag every file with which account it came from
          accountEmail: account.email,
          accountId: account.googleAccountId,
        }));

        allFiles.push(...driveFiles);
      } catch (driveErr) {
        console.error(
          `Drive API error for account ${account.email}:`,
          driveErr.message
        );
      }

      accountsList.push({
        googleAccountId: account.googleAccountId,
        email: account.email,
        name: account.name,
        storage: accountStorage,
      });
    }

    // 4. Sort all files by modifiedTime (newest first)
    allFiles.sort(
      (a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
    );

    res.json({
      files: allFiles,
      accounts: accountsList,
      totalFiles: allFiles.length,
      storage: {
        totalLimit: totalStorageLimit,
        totalUsage: totalStorageUsage,
      },
    });
  } catch (err) {
    console.error('Get files error:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};
