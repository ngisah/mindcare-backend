const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /ai/chat
router.post('/chat', aiController.handleChat);

module.exports = router;
