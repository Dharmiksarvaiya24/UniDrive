const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

module.exports = router;