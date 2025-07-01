
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/process', paymentController.processPayment);
router.post('/webhook', paymentController.handleWebhook);
router.get('/subscriptions/:userId', paymentController.getUserSubscriptions);
router.post('/subscriptions', paymentController.createSubscription);
router.put('/subscriptions/:subscriptionId', paymentController.updateSubscription);
router.delete('/subscriptions/:subscriptionId', paymentController.cancelSubscription);

module.exports = router;
