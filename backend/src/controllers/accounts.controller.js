const { db } = require('../config/firebase');
const { google } = require('googleapis');

/**
 * GET /api/accounts?userId=X
 * List all connected Google accounts for a user
 */
exports.getAccounts = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId query parameter' });
    }

    const accountsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('connectedAccounts')
      .get();

    const accounts = accountsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        googleAccountId: data.googleAccountId,
        email: data.email,
        name: data.name,
        connectedAt: data.connectedAt,
      };
    });

    res.json({ accounts });
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

/**
 * DELETE /api/accounts/:accountId?userId=X
 * Disconnect/remove a connected Google account
 */
exports.removeAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { userId } = req.query;

    if (!userId || !accountId) {
      return res
        .status(400)
        .json({ error: 'Missing userId or accountId parameter' });
    }

    const accountRef = db
      .collection('users')
      .doc(userId)
      .collection('connectedAccounts')
      .doc(accountId);

    const doc = await accountRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Connected account not found' });
    }

    const accountData = doc.data();

    // Optionally revoke Google token
    if (accountData.accessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        await oauth2Client.revokeToken(accountData.accessToken);
      } catch (revokeErr) {
        console.warn('Could not revoke token with Google:', revokeErr.message);
      }
    }

    // Delete account from Firestore
    await accountRef.delete();

    res.json({
      success: true,
      message: `Account ${accountData.email || accountId} removed successfully`,
      removedAccountId: accountId,
    });
  } catch (err) {
    console.error('Error removing account:', err);
    res.status(500).json({ error: 'Failed to remove connected account' });
  }
};
