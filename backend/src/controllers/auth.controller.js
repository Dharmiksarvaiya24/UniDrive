const crypto = require('crypto');
const { google } = require('googleapis');
const { db } = require('../config/firebase');
const {
  setSessionCookie,
  clearSessionCookie,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} = require('../middleware/session.middleware');
const { encrypt } = require('../utils/encryption');

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.readonly',
];

// Allowed frontend origins for OAuth return — never trust arbitrary redirect targets
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Step 1: redirect user to Google's OAuth screen.
// userId comes ONLY from the verified session cookie (if present) — never from query params.
exports.googleLogin = (req, res) => {
  // Read verified session (optional — anonymous users have no session yet)
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const decoded = token ? verifySessionToken(token) : null;
  const verifiedUserId = decoded?.userId || null;

  const requestedHost = req.query.redirectUrl;
  const referer = req.headers.referer || req.headers.origin || '';
  const isLocal = referer.includes('localhost') || referer.includes('127.0.0.1');
  const defaultHost = isLocal ? 'http://localhost:5173' : (process.env.FRONTEND_URL || 'http://localhost:5173');

  // Only allow known-good origins in the state payload (prevents open redirect)
  let returnHost = defaultHost;
  if (requestedHost && ALLOWED_ORIGINS.includes(requestedHost)) {
    returnHost = requestedHost;
  }

  const statePayload = Buffer.from(
    JSON.stringify({ userId: verifiedUserId || '', returnHost })
  ).toString('base64');

  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent select_account',
    scope: SCOPES,
    include_granted_scopes: true,
    state: statePayload,
  });
  res.redirect(url);
};

// Map common Google OAuth error codes to user-readable messages (no internal detail leaked)
const GOOGLE_ERROR_MESSAGES = {
  access_denied: 'You declined Google permissions. Please try again and allow access to continue.',
  redirect_uri_mismatch: 'OAuth configuration error. Please contact support.',
  invalid_grant: 'This sign-in link has expired. Please try again.',
  invalid_client: 'OAuth configuration error. Please contact support.',
  server_error: 'Google encountered an error. Please try again.',
};

// Step 2: handle Google's redirect back with the code
exports.googleCallback = async (req, res) => {
  // Determine a safe return host early so we can redirect on any error
  let returnHost = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const { code, state, error: googleError } = req.query;

    // Handle errors returned directly from Google (e.g. access_denied)
    if (googleError) {
      const message = encodeURIComponent(
        GOOGLE_ERROR_MESSAGES[googleError] || 'Google sign-in failed. Please try again.'
      );
      return res.redirect(`${returnHost}/login?error=${message}`);
    }

    if (!code) {
      return res.redirect(`${returnHost}/login?error=${encodeURIComponent('Missing authorization code. Please try signing in again.')}`);
    }

    // Decode state
    let stateUserId = null;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        stateUserId = decoded.userId || null;
        if (decoded.returnHost && ALLOWED_ORIGINS.includes(decoded.returnHost)) {
          returnHost = decoded.returnHost;
        }
      } catch {
        // Malformed state — proceed without userId (treat as fresh login)
      }
    }

    const oauth2Client = getOAuth2Client();

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch the user's profile info
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data: profile } = await oauth2.userinfo.get();

    let userId = stateUserId || null;

    if (!userId) {
      // Find or create the UniDrive user, keyed by their Google email
      const usersRef = db.collection('users');
      const userQuery = await usersRef.where('email', '==', profile.email.toLowerCase().trim()).get();

      if (userQuery.empty) {
        const newUser = await usersRef.add({
          email: profile.email.toLowerCase().trim(),
          name: profile.name || profile.email.split('@')[0],
          picture: profile.picture || null,
          authProvider: 'google',
          createdAt: new Date(),
        });
        userId = newUser.id;
      } else {
        userId = userQuery.docs[0].id;
        // Update profile picture on each login
        const updateData = {};
        if (profile.picture) updateData.picture = profile.picture;
        if (profile.name) updateData.name = profile.name;
        if (Object.keys(updateData).length > 0) {
          await usersRef.doc(userId).update(updateData);
        }
      }
    } else {
      // "Add account" flow: attach to existing verified user — verify it still exists
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        // Session's user no longer exists — treat as fresh login
        userId = null;
      }
    }

    if (!userId) {
      return res.redirect(`${returnHost}/login?error=${encodeURIComponent('Account context is invalid. Please sign in again.')}`);
    }

    // Save this connected account's tokens under the user safely (ENCRYPTED at rest)
    const accountDocData = {
      googleAccountId: profile.id,
      email: profile.email || '',
      name: profile.name || profile.email?.split('@')[0] || 'User',
      accessToken: encrypt(tokens.access_token || ''),
      expiryDate: tokens.expiry_date || (Date.now() + 3600000),
      connectedAt: new Date(),
    };

    if (tokens.refresh_token) {
      accountDocData.refreshToken = encrypt(tokens.refresh_token);
    }

    await db
      .collection('users')
      .doc(userId)
      .collection('connectedAccounts')
      .doc(profile.id) // Google's account ID, unique per Google account
      .set(accountDocData, { merge: true });

    // Issue signed 7-day session as HTTP-only cookie (NOT in URL, NOT localStorage)
    setSessionCookie(res, userId);

    // Redirect back to the originating frontend dashboard — no tokens in URL
    res.redirect(`${returnHost}/dashboard`);
  } catch (err) {
    // Log the real error internally but never expose details to the client
    console.error('OAuth callback error:', err.message || err);
    res.redirect(`${returnHost}/login?error=${encodeURIComponent('Sign-in failed. Please try again.')}`);
  }
};

// Email & Password Registration
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const usersRef = db.collection('users');
    const existingSnap = await usersRef.where('email', '==', cleanEmail).get();

    if (!existingSnap.empty) {
      const userDoc = existingSnap.docs[0];
      const userData = userDoc.data();

      // If user already registered with password
      if (userData.passwordHash) {
        return res.status(400).json({ error: 'An account with this email already exists. Please sign in.' });
      }

      // If user previously signed in via Google only, add password to link account
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const displayName = userData.name || name?.trim() || cleanEmail.split('@')[0];

      await usersRef.doc(userDoc.id).update({
        passwordHash,
        salt,
        name: displayName,
        updatedAt: new Date(),
      });

      setSessionCookie(res, userDoc.id);

      return res.json({
        success: true,
        user: {
          id: userDoc.id,
          email: userData.email,
          name: displayName,
          picture: userData.picture || null,
        },
      });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const displayName = name?.trim() || cleanEmail.split('@')[0];

    const newUserRef = await usersRef.add({
      email: cleanEmail,
      name: displayName,
      passwordHash,
      salt,
      picture: null,
      authProvider: 'password',
      createdAt: new Date(),
    });

    setSessionCookie(res, newUserRef.id);

    res.status(201).json({
      success: true,
      user: {
        id: newUserRef.id,
        email: cleanEmail,
        name: displayName,
        picture: null,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

// Email & Password Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const usersRef = db.collection('users');
    const userSnap = await usersRef.where('email', '==', cleanEmail).get();

    if (userSnap.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    if (!userData.passwordHash || !userData.salt) {
      return res.status(400).json({
        error: 'This account was signed in with Google. Please use Continue with Google or register a password.',
      });
    }

    const computedHash = hashPassword(password, userData.salt);
    if (computedHash !== userData.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    setSessionCookie(res, userDoc.id);

    res.json({
      success: true,
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /auth/session — returns current user's basic info from the verified session cookie.
// Used by the frontend on app load ("am I logged in?") without hitting Google again.
exports.getSession = async (req, res) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ valid: false, error: 'No session' });
    }

    const decoded = verifySessionToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ valid: false, error: 'Invalid or expired session' });
    }

    const userDoc = await db.collection('users').doc(decoded.userId).get();
    if (!userDoc.exists) {
      clearSessionCookie(res);
      return res.status(401).json({ valid: false, error: 'User does not exist' });
    }

    const data = userDoc.data();
    res.json({
      valid: true,
      userId: userDoc.id,
      user: {
        id: userDoc.id,
        name: data.name || null,
        email: data.email || null,
        picture: data.picture || null,
      },
    });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ valid: false, error: 'Session verification failed' });
  }
};

// POST /auth/logout — clears the session cookie
exports.logout = (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out' });
};
