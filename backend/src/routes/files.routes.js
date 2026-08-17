const express = require('express');
const router = express.Router();
const filesController = require('../controllers/files.controller');

// GET /api/files?userId=X
router.get('/', filesController.getFiles);

module.exports = router;
