const express = require('express');
const router = express.Router();
const filesController = require('../controllers/files.controller');
const { sessionMiddleware } = require('../middleware/session.middleware');

// GET /api/files?folderId=X — userId comes from verified session cookie
router.get('/', sessionMiddleware, filesController.getFiles);

// POST /api/files/upload?name=&folderId=&accountId= — stream a file into Google Drive
// (when accountId is omitted, the account with the most free storage is used)
router.post('/upload', sessionMiddleware, filesController.uploadFile);

// POST /api/files/folder — create a new folder in Google Drive
router.post('/folder', sessionMiddleware, filesController.createFolder);

// GET /api/files/:fileId/preview — stream file content for in-browser preview
router.get('/:fileId/preview', sessionMiddleware, filesController.previewFile);

// GET /api/files/:fileId/download — stream file as attachment for download
router.get('/:fileId/download', sessionMiddleware, filesController.downloadFile);

// DELETE /api/files/:fileId — delete file from Google Drive
router.delete('/:fileId', sessionMiddleware, filesController.deleteFile);

// POST /api/files/batch-delete — delete multiple files from Google Drive
router.post('/batch-delete', sessionMiddleware, filesController.batchDeleteFiles);

// POST /api/files/:fileId/share — make a file viewable by anyone with the link
router.post('/:fileId/share', sessionMiddleware, filesController.shareFile);

module.exports = router;
