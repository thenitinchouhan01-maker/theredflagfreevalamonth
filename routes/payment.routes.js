const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { identifyUser } = require('./user.routes');

router.post('/create-order', identifyUser, paymentController.createOrder);
router.post('/verify', identifyUser, paymentController.verifyPayment);
router.get('/history', identifyUser, paymentController.getUserPayments);

module.exports = router;
