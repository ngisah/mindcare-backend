const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

// GET /conversations
router.get('/', conversationController.getConversations);

// POST /conversations
router.post('/', conversationController.createConversation);

// GET /conversations/:id
router.get('/:id', conversationController.getConversationById);

// DELETE /conversations/:id
router.delete('/:id', conversationController.deleteConversation);

// GET /conversations/:id/messages
router.get('/:id/messages', conversationController.getMessages);

// POST /conversations/:id/messages
router.post('/:id/messages', conversationController.createMessage);

// PUT /conversations/:id/messages/:messageId
router.put('/:id/messages/:messageId', conversationController.updateMessage);

module.exports = router;
