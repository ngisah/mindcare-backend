const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /auth/register
router.post('/register', authController.register);

// POST /auth/login
router.post('/login', authController.login);

// POST /auth/refresh
router.post('/refresh', authController.refresh);

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.send('User logout endpoint');
});

// POST /auth/forgot-password
router.post('/forgot-password', (req, res) => {
  res.send('Forgot password endpoint');
});

// POST /auth/reset-password
router.post('/reset-password', (req, res) => {
  res.send('Reset password endpoint');
});

// GET /auth/verify-email/:token
router.get('/verify-email/:token', (req, res) => {
  res.send(`Email verification for token: ${req.params.token}`);
});

module.exports = router;
