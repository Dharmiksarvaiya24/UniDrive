const { google } = require('googleapis');
const { db } = require('../config/firebase');
const { decrypt, encrypt } = require('../utils/encryption');

// Bounded in-memory cache helper with TTL and LRU eviction to prevent memory leaks
class BoundedCache {
  constructor(maxSize, ttlMs) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  set(key, val) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    if (!val.expiresAt) {
      val.expiresAt = Date.now() + this.ttlMs;
    }
    this.cache.set(key, val);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  purgeExpired() {
    const now = Date.now();
    for (const [k, v] of this.cache.entries()) {
      if (v.expiresAt && v.expiresAt <= now) {
        this.cache.delete(k);
      }
    }
  }
}

// In-memory cache for resolved Drive clients & file metadata (capped at 500 items)
const FILE_INFO_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const fileInfoCache = new BoundedCache(500, FILE_INFO_CACHE_TTL);

// In-memory buffer cache for PDFs (capped at 20 items to prevent heap exhaustion)
const PDF_BUFFER_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const pdfBufferCache = new BoundedCache(20, PDF_BUFFER_CACHE_TTL);

// Periodically purge expired cache entries every 5 minutes
const cleanupTimer = setInterval(() => {
  fileInfoCache.purgeExpired();
  pdfBufferCache.purgeExpired();
}, 5 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();


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
        supportsAllDrives: true,
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
 * Formats a standard RFC 6266 Content-Disposition header with ASCII fallback
 * and UTF-8 encoded filename to support special characters across all browsers.
 */
function formatContentDisposition(dispositionType, filename) {
  const safeAscii = (filename || 'file').replace(/["\r\n\\]/g, '_').replace(/[^\x20-\x7E]/g, '_');
  const encoded = encodeURIComponent(filename || 'file').replace(/['()]/g, escape).replace(/\*/g, '%2A');
  return `${dispositionType}; filename="${safeAscii}"; filename*=UTF-8''${encoded}`;
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

    // Fast path: Check in-memory PDF buffer cache for instant 0ms responses.
    // For downloads, only use cached PDF if it is a genuine PDF (not an exported Google Doc/Sheet/Slide).
    const cachedPdf = pdfBufferCache.get(fileId);
    if (cachedPdf && cachedPdf.expiresAt > Date.now()) {
      if (!isDownload || !cachedPdf.isGoogleApp) {
        const buffer = cachedPdf.buffer;
        const total = buffer.length;
        const filename = cachedPdf.filename;

        res.setHeader('Content-Type', cachedPdf.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', formatContentDisposition(dispositionType, filename));
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
    }

    const driveInfo = await findDriveForFile(userId, fileId, accountId);
    if (!driveInfo) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    const { drive, file } = driveInfo;

    // Folders cannot be streamed or downloaded as a single file
    if (file.mimeType === 'application/vnd.google-apps.folder' || file.mimeType === 'folder') {
      return res.status(400).json({ error: 'Folders cannot be streamed or downloaded directly' });
    }

    // 1. Google Workspace Document (Docs, Sheets, Slides, Drawings)
    if (file.mimeType && file.mimeType.startsWith('application/vnd.google-apps.')) {
      let exportMimeType = 'application/pdf';
      let extension = '.pdf';

      if (isDownload) {
        if (file.mimeType === 'application/vnd.google-apps.document') {
          exportMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          extension = '.docx';
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
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
        let isAborted = false;
        req.on('close', () => {
          isAborted = true;
          if (exportRes.data && typeof exportRes.data.destroy === 'function') {
            exportRes.data.destroy();
          }
        });

        const chunks = [];
        exportRes.data.on('data', (c) => {
          if (!isAborted) chunks.push(c);
        });
        exportRes.data.on('end', () => {
          if (isAborted) return;
          const buffer = Buffer.concat(chunks);
          pdfBufferCache.set(fileId, {
            buffer,
            mimeType: exportMimeType,
            filename,
            isGoogleApp: true,
            expiresAt: Date.now() + PDF_BUFFER_CACHE_TTL,
          });

          res.setHeader('Content-Disposition', formatContentDisposition(dispositionType, filename));
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

      // Non-PDF exports (docs docx, sheets xlsx, slides pptx, drawings png)
      res.setHeader('Content-Disposition', formatContentDisposition(dispositionType, filename));
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

      let isAborted = false;
      req.on('close', () => {
        isAborted = true;
        if (streamRes.data && typeof streamRes.data.destroy === 'function') {
          streamRes.data.destroy();
        }
      });

      const chunks = [];
      streamRes.data.on('data', (c) => {
        if (!isAborted) chunks.push(c);
      });
      streamRes.data.on('end', () => {
        if (isAborted) return;
        const buffer = Buffer.concat(chunks);
        pdfBufferCache.set(fileId, {
          buffer,
          mimeType: 'application/pdf',
          filename,
          isGoogleApp: false,
          expiresAt: Date.now() + PDF_BUFFER_CACHE_TTL,
        });

        const total = buffer.length;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', formatContentDisposition(dispositionType, filename));
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

    res.setHeader('Content-Disposition', formatContentDisposition(dispositionType, filename));
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

    // 3. Concurrently fetch files and storage quota for all connected accounts
    const accountResults = await Promise.allSettled(
      accountsSnap.docs.map(async (accountDoc) => {
        const account = accountDoc.data();
        let accountStorage = null;
        let driveFiles = [];

        try {
          const drive = createOAuth2ClientForAccount(userId, accountDoc);

          // Fetch Storage Quota and file list in parallel
          const quotaPromise = drive.about
            .get({
              fields: 'storageQuota(limit, usage, usageInDrive, usageInDriveTrash)',
            })
            .then((aboutRes) => {
              if (aboutRes.data && aboutRes.data.storageQuota) {
                const quota = aboutRes.data.storageQuota;
                const limit = quota.limit ? parseInt(quota.limit, 10) : 0;
                const usage = quota.usage ? parseInt(quota.usage, 10) : 0;
                return { limit, usage };
              }
              return null;
            })
            .catch((aboutErr) => {
              console.warn(`Drive about quota error for ${account.email}:`, aboutErr.message);
              return null;
            });

          const qQuery = folderId
            ? `trashed = false and '${folderId}' in parents`
            : "trashed = false and 'root' in parents";

          const filesPromise = drive.files
            .list({
              pageSize: 100,
              fields:
                'files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink, webViewLink, starred, imageMediaMetadata(width, height), videoMediaMetadata(width, height), parents)',
              orderBy: 'modifiedTime desc',
              q: qQuery,
            })
            .then((response) => {
              return (response.data.files || []).map((file) => ({
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
                accountEmail: account.email,
                accountId: account.googleAccountId,
              }));
            });

          const [quotaRes, filesRes] = await Promise.all([quotaPromise, filesPromise]);
          accountStorage = quotaRes;
          driveFiles = filesRes;
        } catch (driveErr) {
          console.error(
            `Drive API error for account ${account.email}:`,
            driveErr.message
          );
        }

        return {
          account: {
            googleAccountId: account.googleAccountId,
            email: account.email,
            name: account.name,
            storage: accountStorage,
          },
          files: driveFiles,
          storage: accountStorage,
        };
      })
    );

    for (const r of accountResults) {
      if (r.status === 'fulfilled' && r.value) {
        const { account, files, storage } = r.value;
        accountsList.push(account);
        allFiles.push(...files);
        if (storage) {
          totalStorageLimit += storage.limit || 0;
          totalStorageUsage += storage.usage || 0;
        }
      }
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

/**
 * DELETE /api/files/:fileId
 * Deletes a single file from Google Drive using the associated connected account.
 */
exports.deleteFile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fileId } = req.params;
    const accountId = req.query.accountId || req.body?.accountId;

    if (!fileId) {
      return res.status(400).json({ error: 'Missing fileId parameter' });
    }

    // Invalidate stale cache entries so fresh client is created
    fileInfoCache.delete(`${userId}:${fileId}`);
    pdfBufferCache.delete(fileId);

    const driveInfo = await findDriveForFile(userId, fileId, accountId);
    if (!driveInfo) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    const { drive } = driveInfo;

    // Try permanent delete first, then fallback to moving to trash
    try {
      await drive.files.delete({ fileId, supportsAllDrives: true });
    } catch (deleteErr) {
      console.warn(`Permanent delete failed for ${fileId}, trying trash:`, deleteErr.message);
      await drive.files.update({
        fileId,
        supportsAllDrives: true,
        requestBody: { trashed: true },
      });
    }

    // Evict from in-memory caches
    fileInfoCache.delete(`${userId}:${fileId}`);
    pdfBufferCache.delete(fileId);

    return res.json({
      success: true,
      message: 'File deleted successfully',
      fileId,
    });
  } catch (err) {
    console.error('Delete file error:', err.message || err);
    const msg = err.message || '';
    const isInsufficientScope =
      msg.includes('insufficient authentication scopes') ||
      msg.includes('insufficientPermissions') ||
      msg.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
      err.code === 403;

    if (isInsufficientScope) {
      return res.status(403).json({
        code: 'INSUFFICIENT_SCOPES',
        error:
          'Insufficient Google Drive permissions. Your account was connected with read-only access. Please reconnect your Google Drive account in UniDrive to allow deleting files.',
      });
    }

    const status = err.code || err.status || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: err.message || 'Failed to delete file from Google Drive',
    });
  }
};

/**
 * POST /api/files/batch-delete
 * Deletes multiple files concurrently from Google Drive.
 * Body: { files: string[] | { fileId: string, accountId?: string }[] }
 */
exports.batchDeleteFiles = async (req, res) => {
  try {
    const userId = req.userId;
    const rawFiles = req.body.files || req.body.fileIds;

    if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
      return res.status(400).json({ error: 'Expected non-empty files array' });
    }

    const normalized = rawFiles.map((item) =>
      typeof item === 'string' ? { fileId: item } : item
    );

    const results = await Promise.allSettled(
      normalized.map(async ({ fileId, accountId }) => {
        fileInfoCache.delete(`${userId}:${fileId}`);
        pdfBufferCache.delete(fileId);

        const driveInfo = await findDriveForFile(userId, fileId, accountId);
        if (!driveInfo) {
          throw new Error(`File ${fileId} not found or access denied`);
        }
        try {
          await driveInfo.drive.files.delete({ fileId, supportsAllDrives: true });
        } catch (delErr) {
          console.warn(`Permanent batch delete failed for ${fileId}, trying trash:`, delErr.message);
          await driveInfo.drive.files.update({
            fileId,
            supportsAllDrives: true,
            requestBody: { trashed: true },
          });
        }
        fileInfoCache.delete(`${userId}:${fileId}`);
        pdfBufferCache.delete(fileId);
        return fileId;
      })
    );

    const deleted = [];
    const failed = [];

    results.forEach((r, idx) => {
      const fileId = normalized[idx].fileId;
      if (r.status === 'fulfilled') {
        deleted.push(fileId);
      } else {
        const rawErr = r.reason?.message || 'Failed to delete';
        const isScopeErr =
          rawErr.includes('insufficient authentication scopes') ||
          rawErr.includes('insufficientPermissions') ||
          r.reason?.code === 403;
        failed.push({
          fileId,
          error: isScopeErr
            ? 'Account needs reconnecting for delete permissions'
            : rawErr,
        });
      }
    });

    return res.json({
      success: true,
      deletedCount: deleted.length,
      failedCount: failed.length,
      deleted,
      failed,
    });
  } catch (err) {
    console.error('Batch delete error:', err.message || err);
    return res.status(500).json({ error: 'Batch delete operation failed' });
  }
};

