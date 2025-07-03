const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST /payments/create-payment-intent
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// POST /payments/webhook
router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handleWebhook);

// GET /payments/:userId
router.get('/:userId', paymentController.getPaymentHistory);

module.exports = router;
