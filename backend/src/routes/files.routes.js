const express = require('express');
const router = express.Router();
const filesController = require('../controllers/files.controller');
const { sessionMiddleware } = require('../middleware/session.middleware');

// GET /api/files?folderId=X — userId comes from verified session cookie
router.get('/', sessionMiddleware, filesController.getFiles);

module.exports = router;
