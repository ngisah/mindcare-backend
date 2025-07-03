const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// POST /notifications/email
router.post('/email', notificationController.sendEmailNotification);

// POST /notifications/sms
router.post('/sms', notificationController.sendSmsNotification);

// GET /notifications/:userId
router.get('/:userId', notificationController.getNotificationsByUser);

module.exports = router; 