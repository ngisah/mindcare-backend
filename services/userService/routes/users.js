const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /users/profile
router.get('/profile', authMiddleware, userController.getProfile);

// PUT /users/profile
router.put('/profile', authMiddleware, userController.updateProfile);

// DELETE /users/account
router.delete('/account', authMiddleware, userController.deleteAccount);

// GET /users/settings
router.get('/settings', (req, res) => {
  res.send('Get user settings endpoint');
});

// PUT /users/settings
router.put('/settings', (req, res) => {
  res.send('Update user settings endpoint');
});

// POST /users/cultural-preferences
router.post('/cultural-preferences', (req, res) => {
  res.send('Set cultural preferences endpoint');
});

// GET /users/privacy-settings
router.get('/privacy-settings', (req, res) => {
  res.send('Get privacy settings endpoint');
});

// PUT /users/privacy-settings
router.put('/privacy-settings', (req, res) => {
  res.send('Update privacy settings endpoint');
});

module.exports = router;
