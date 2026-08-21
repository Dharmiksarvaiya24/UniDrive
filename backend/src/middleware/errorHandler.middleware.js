/**
 * Central Error Handler Middleware
 * Logs errors internally and returns clean error responses without leaking stack traces.
 */
module.exports = (err, req, res, next) => {
  const isCorsError = err && err.message === 'Not allowed by CORS';
  if (!isCorsError) {
    console.error('API Error:', err.message || err);
  }
  res.status(isCorsError ? 403 : err.status || 500).json({
    error: isCorsError ? 'Not allowed by CORS' : (err.message && err.status ? err.message : 'Internal server error'),
  });
};