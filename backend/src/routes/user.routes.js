const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { sessionMiddleware } = require('../middleware/session.middleware');

router.get('/me', sessionMiddleware, userController.getUser);

module.exports = router;
