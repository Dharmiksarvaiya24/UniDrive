const crypto = require('crypto');

const rawSecret = process.env.SESSION_JWT_SECRET || process.env.JWT_SECRET || 'unidrive_default_session_secret_2026';
let SESSION_JWT_SECRET;
try {
  const buf = Buffer.from(rawSecret, 'base64');
  SESSION_JWT_SECRET = buf.length >= 16 ? buf : Buffer.from(rawSecret, 'utf-8');
} catch {
  SESSION_JWT_SECRET = Buffer.from(rawSecret, 'utf-8');
}


const SESSION_COOKIE_NAME = 'unidrive_session';
const SESSION_EXPIRY_DAYS = 7;
const SESSION_EXPIRY_SECONDS = SESSION_EXPIRY_DAYS * 24 * 60 * 60;

function createSessionToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SECONDS;
  const body = Buffer.from(JSON.stringify({ ...payload, exp, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function getSessionCookieOptions() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https'));
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: SESSION_EXPIRY_SECONDS * 1000,
    path: '/',
  };
}

function clearSessionCookieOptions() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith('https'));
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 0,
    path: '/',
  };
}


function setSessionCookie(res, userId) {
  const token = createSessionToken({ userId });
  res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return token;
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
}

function sessionMiddleware(req, res, next) {
  // 1. Try the HTTP-only session cookie first (same-domain deploys)
  let token = req.cookies?.[SESSION_COOKIE_NAME];

  // 2. Fall back to Authorization: Bearer header (cross-domain deploys where
  //    the browser silently blocks cross-site cookies)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 3. Fall back to query param (e.g. for media streaming, iframes, downloads)
  if (!token && req.query?.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No session.' });
  }

  const decoded = verifySessionToken(token);
  if (!decoded || !decoded.userId) {
    clearSessionCookie(res);
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }

  req.userId = decoded.userId;
  next();
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  setSessionCookie,
  clearSessionCookie,
  sessionMiddleware,
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_SECONDS,
};