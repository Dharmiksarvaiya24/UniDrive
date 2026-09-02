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
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,
  'https://unidrive.dharmik.live',
  'https://www.unidrive.dharmik.live',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
].filter(Boolean);

function isLocalRequest(req) {
  if (!req) return false;
  const host = req.headers?.['x-forwarded-host'] || req.get?.('host') || '';
  const referer = req.headers?.referer || req.headers?.origin || '';
  return (
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    referer.includes('localhost') ||
    referer.includes('127.0.0.1')
  );
}

function getOAuth2RedirectUri(req) {
  const isLocal = isLocalRequest(req);

  if (isLocal) {
    if (process.env.LOCAL_GOOGLE_REDIRECT_URI) {
      return process.env.LOCAL_GOOGLE_REDIRECT_URI;
    }
    if (process.env.GOOGLE_REDIRECT_URI && (process.env.GOOGLE_REDIRECT_URI.includes('localhost') || process.env.GOOGLE_REDIRECT_URI.includes('127.0.0.1'))) {
      return process.env.GOOGLE_REDIRECT_URI;
    }
    return 'http://localhost:5001/auth/google/callback';
  }

  // Production:
  // If explicitly configured with a non-localhost redirect URI, honor it
  if (
    process.env.GOOGLE_REDIRECT_URI &&
    !process.env.GOOGLE_REDIRECT_URI.includes('localhost') &&
    !process.env.GOOGLE_REDIRECT_URI.includes('127.0.0.1')
  ) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  // Default production redirect URI registered in Google Cloud Console
  return 'https://unidrive.dharmik.live/auth/google/callback';
}

function getOAuth2Client(customRedirectUri) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    customRedirectUri || getOAuth2RedirectUri()
  );
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Step 1: redirect user to Google's OAuth screen.
// userId comes from verified session (cookie, Bearer token header, or query param)
exports.googleLogin = (req, res) => {
  let token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  if (!token && req.query.token) {
    token = req.query.token;
  }

  const decoded = token ? verifySessionToken(token) : null;
  const verifiedUserId = decoded?.userId || null;

  const requestedHost = req.query.redirectUrl;
  const isLocal = isLocalRequest(req);
  const defaultHost = isLocal
    ? 'http://localhost:5173'
    : (process.env.FRONTEND_URL || 'https://unidrive.dharmik.live');

  // Only allow known-good origins in the state payload (prevents open redirect)
  let returnHost = defaultHost.replace(/\/$/, '');
  if (requestedHost) {
    const cleanRequested = requestedHost.replace(/\/$/, '');
    if (ALLOWED_ORIGINS.includes(cleanRequested)) {
      returnHost = cleanRequested;
    }
  }

  const redirectUri = getOAuth2RedirectUri(req);

  const statePayload = Buffer.from(
    JSON.stringify({
      userId: verifiedUserId || '',
      returnHost,
      redirectUri,
    })
  ).toString('base64');

  const oauth2Client = getOAuth2Client(redirectUri);
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
  const isLocal = isLocalRequest(req);
  // Determine a safe return host early so we can redirect on any error
  let returnHost = (isLocal ? 'http://localhost:5173' : (process.env.FRONTEND_URL || 'https://unidrive.dharmik.live')).replace(/\/$/, '');

  try {
    const { code, state, error: googleError } = req.query;

    // Decode state early so returnHost and redirectUri are accurate
    let stateUserId = null;
    let stateRedirectUri = null;

    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        stateUserId = decoded.userId || null;
        stateRedirectUri = decoded.redirectUri || null;
        if (decoded.returnHost) {
          const cleanReturn = decoded.returnHost.replace(/\/$/, '');
          if (ALLOWED_ORIGINS.includes(cleanReturn)) {
            returnHost = cleanReturn;
          }
        }
      } catch {
        // Malformed state — proceed without userId (treat as fresh login)
      }
    }

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

    const redirectUri = stateRedirectUri || getOAuth2RedirectUri(req);
    const oauth2Client = getOAuth2Client(redirectUri);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch the user's profile info
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data: profile } = await oauth2.userinfo.get();

    const cleanEmail = profile?.email ? profile.email.toLowerCase().trim() : '';
    if (!cleanEmail) {
      return res.redirect(`${returnHost}/login?error=${encodeURIComponent('Could not retrieve email from Google profile.')}`);
    }

    let userId = stateUserId || null;

    if (!userId) {
      // Find or create the UniDrive user, keyed by their Google email
      const usersRef = db.collection('users');
      const userQuery = await usersRef.where('email', '==', cleanEmail).get();

      if (userQuery.empty) {
        const newUser = await usersRef.add({
          email: cleanEmail,
          name: profile.name || cleanEmail.split('@')[0],
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

    // Issue signed 7-day session as HTTP-only cookie + pass in URL fragment for cross-domain support
    const sessionToken = setSessionCookie(res, userId);

    // Redirect back to the originating frontend dashboard with session token in hash fragment
    res.redirect(`${returnHost}/dashboard#session=${sessionToken}`);
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

      const token = setSessionCookie(res, userDoc.id);

      return res.json({
        success: true,
        token,
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

    const token = setSessionCookie(res, newUserRef.id);

    res.status(201).json({
      success: true,
      token,
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

    const token = setSessionCookie(res, userDoc.id);

    res.json({
      success: true,
      token,
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

// GET /auth/session — returns current user's basic info from the verified session.
// Checks cookie first, then Bearer header.
exports.getSession = async (req, res) => {
  try {
    let token = req.cookies?.[SESSION_COOKIE_NAME];
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

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
