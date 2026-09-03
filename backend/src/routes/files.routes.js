const express = require('express');
const router = express.Router();
const filesController = require('../controllers/files.controller');
const { sessionMiddleware } = require('../middleware/session.middleware');

// GET /api/files?folderId=X — userId comes from verified session cookie
router.get('/', sessionMiddleware, filesController.getFiles);

// GET /api/files/:fileId/preview — stream file content for in-browser preview
router.get('/:fileId/preview', sessionMiddleware, filesController.previewFile);

// GET /api/files/:fileId/download — stream file as attachment for download
router.get('/:fileId/download', sessionMiddleware, filesController.downloadFile);

module.exports = router;
