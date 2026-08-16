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
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // required to get a refresh token
    prompt: 'consent',      // forces refresh token even on repeat logins
    scope: SCOPES,
  });
  res.redirect(url);
};

// Step 2: handle Google's redirect back with the code
exports.googleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing authorization code');

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch the user's profile info
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data: profile } = await oauth2.userinfo.get();

    // profile.id, profile.email, profile.name, profile.picture

    // Find or create the UniDrive user, keyed by their Google email
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', profile.email).get();

    let userId;
    if (userQuery.empty) {
      const newUser = await usersRef.add({
        email: profile.email,
        name: profile.name,
        createdAt: new Date(),
      });
      userId = newUser.id;
    } else {
      userId = userQuery.docs[0].id;
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

    // Redirect back to your frontend dashboard
    res.redirect(`http://localhost:5173/dashboard?userId=${userId}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Authentication failed');
  }
};