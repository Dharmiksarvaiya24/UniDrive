const { sessionMiddleware, verifySessionToken, SESSION_COOKIE_NAME } = require('./session.middleware');

/**
 * Middleware to verify user session via HTTP-only cookie.
 */
exports.requireAuth = sessionMiddleware;
exports.sessionMiddleware = sessionMiddleware;
exports.verifySessionToken = verifySessionToken;
exports.SESSION_COOKIE_NAME = SESSION_COOKIE_NAME;

