const { createSessionToken, verifySessionToken } = require('../middleware/session.middleware');

module.exports = {
  createToken: createSessionToken,
  verifyToken: verifySessionToken,
};

