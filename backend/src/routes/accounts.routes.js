const express = require('express');
const router = express.Router();
const {
  getAccounts,
  removeAccount,
} = require('../controllers/accounts.controller');

router.get('/', getAccounts);
router.delete('/:accountId', removeAccount);

module.exports = router;
