const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { identifyUser } = require('./user.routes');

// Create Razorpay order
router.post('/create-order', identifyUser, paymentController.createOrder);

// Verify payment and add credits
router.post('/verify', identifyUser, paymentController.verifyPayment);

// Get user payment history
router.get('/history', identifyUser, paymentController.getUserPayments);

// Webhook endpoint (OPTIONAL - for future use)
// Razorpay will call this endpoint for payment events
// router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
