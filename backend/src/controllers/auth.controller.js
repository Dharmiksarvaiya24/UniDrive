const { google } = require('googleapis');
const { db } = require('../config/firebase');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.readonly',
];

// Step 1: redirect user to Google's consent screen
exports.googleLogin = (req, res) => {
  const { userId, redirectUrl } = req.query;
  const referer = req.headers.referer || req.headers.origin || '';
  const isLocal = referer.includes('localhost') || referer.includes('127.0.0.1');
  const returnHost = redirectUrl || (isLocal ? 'http://localhost:5173' : (process.env.FRONTEND_URL || 'http://localhost:5173'));

  const statePayload = Buffer.from(
    JSON.stringify({ userId: userId || '', returnHost })
  ).toString('base64');

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',            // required to get a refresh token
    prompt: 'consent select_account',  // forces consent screen & account picker
    scope: SCOPES,
    include_granted_scopes: true,
    state: statePayload,
  });
  res.redirect(url);
};

// Step 2: handle Google's redirect back with the code
exports.googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Missing authorization code');

    // Decode state
    let userId = null;
    let returnHost = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        userId = decoded.userId || null;
        if (decoded.returnHost) returnHost = decoded.returnHost;
      } catch {
        // Fallback for legacy plain userId state
        userId = state;
      }
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch the user's profile info
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data: profile } = await oauth2.userinfo.get();

    if (!userId) {
      // Find or create the UniDrive user, keyed by their Google email
      const usersRef = db.collection('users');
      const userQuery = await usersRef.where('email', '==', profile.email).get();

      if (userQuery.empty) {
        const newUser = await usersRef.add({
          email: profile.email,
          name: profile.name,
          picture: profile.picture || null,
          createdAt: new Date(),
        });
        userId = newUser.id;
      } else {
        userId = userQuery.docs[0].id;
        // Update profile picture on each login
        await usersRef.doc(userId).update({
          picture: profile.picture || null,
        });
      }
    }

    // Save this connected account's tokens under the user
    await db
      .collection('users')
      .doc(userId)
      .collection('connectedAccounts')
      .doc(profile.id) // Google's account ID, unique per Google account
      .set({
        googleAccountId: profile.id,
        email: profile.email,
        name: profile.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        connectedAt: new Date(),
      });

    // Redirect back to the originating frontend dashboard
    res.redirect(`${returnHost}/dashboard?userId=${userId}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed');
  }
};