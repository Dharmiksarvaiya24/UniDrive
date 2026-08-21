const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/session', authController.getSession);
router.post('/logout', authController.logout);

module.exports = router;
