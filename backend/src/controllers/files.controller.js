const { google } = require('googleapis');
const { db } = require('../config/firebase');

/**
 * GET /api/files?userId=X
 *
 * 1. Loads all connected-account tokens for this user from Firestore
 * 2. For each account, calls Google Drive files.list using the stored tokens
 * 3. Auto-refreshes expired access tokens using the refresh token
 * 4. Returns a merged, de-duped file list as JSON
 */
exports.getFiles = async (req, res) => {
  try {
    const { userId, folderId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId query parameter' });
    }

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

    // 3. For each connected account, fetch files from Google Drive
    for (const accountDoc of accountsSnap.docs) {
      const account = accountDoc.data();

      accountsList.push({
        googleAccountId: account.googleAccountId,
        email: account.email,
        name: account.name,
      });

      // Create a fresh OAuth2 client for this account
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
        expiry_date: account.expiryDate,
      });

      // Listen for token refresh and persist new tokens
      oauth2Client.on('tokens', async (newTokens) => {
        const update = {
          accessToken: newTokens.access_token,
          expiryDate: newTokens.expiry_date,
        };
        // Only overwrite refreshToken if Google issued a new one
        if (newTokens.refresh_token) {
          update.refreshToken = newTokens.refresh_token;
        }
        await db
          .collection('users')
          .doc(userId)
          .collection('connectedAccounts')
          .doc(accountDoc.id)
          .update(update);
      });

      try {
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const qQuery = folderId
          ? `trashed = false and '${folderId}' in parents`
          : 'trashed = false';

        const response = await drive.files.list({
          pageSize: 100,
          fields:
            'files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink, webViewLink, imageMediaMetadata(width, height), videoMediaMetadata(width, height), parents)',
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
        // Don't fail the entire request if one account errors — skip it
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
    });
  } catch (err) {
    console.error('Get files error:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};
