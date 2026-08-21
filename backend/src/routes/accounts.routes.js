const express = require('express');
const router = express.Router();
const {
  getAccounts,
  removeAccount,
} = require('../controllers/accounts.controller');
const { sessionMiddleware } = require('../middleware/session.middleware');

router.get('/', sessionMiddleware, getAccounts);
router.delete('/:accountId', sessionMiddleware, removeAccount);

module.exports = router;
