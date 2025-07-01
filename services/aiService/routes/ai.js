const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// POST /ai/process
router.post('/process', aiController.processAIRequest);

module.exports = router;
