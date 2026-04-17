const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async createOrder({ userId, planId }) {
    try {
      if (!planId) {
        throw AppError.badRequest('Plan ID is required', 'PLAN_ID_REQUIRED');
      }

      const plan = await Plan.findActiveById(planId);
      if (!plan) {
        throw AppError.notFound('Plan not found or inactive', 'PLAN_NOT_FOUND');
      }

      const amountInPaise = Math.round(plan.price * 100);

      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}_${userId.toString().slice(-6)}`
      });

      const payment = await Payment.create({
        userId,
        planId,
        razorpayOrderId: razorpayOrder.id,
        amount: plan.price,
        currency: 'INR',
        status: 'created'
      });

      logger.info('Order created', {
        userId: userId.toString(),
        planId: planId.toString(),
        orderId: razorpayOrder.id,
        amount: plan.price,
        credits: plan.credits
      });

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        planName: plan.name,
        credits: plan.credits
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Error creating order', {
        error: error.message,
        userId: userId.toString(),
        planId: planId?.toString()
      });
      throw AppError.internal('Failed to create order', 'ORDER_CREATE_FAILED');
    }
  }

  async verifyPayment({ userId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    try {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw AppError.badRequest('Missing payment details', 'MISSING_PAYMENT_DETAILS');
      }

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        logger.error('Invalid payment signature', {
          userId: userId.toString(),
          orderId: razorpay_order_id
        });
        throw AppError.badRequest('Invalid payment signature', 'INVALID_SIGNATURE');
      }

      const payment = await Payment.findByOrderId(razorpay_order_id);

      if (!payment) {
        throw AppError.notFound('Payment not found', 'PAYMENT_NOT_FOUND');
      }

      if (payment.userId.toString() !== userId.toString()) {
        throw AppError.forbidden('Unauthorized payment access', 'UNAUTHORIZED_PAYMENT');
      }

      if (payment.status === 'paid') {
        logger.warn('Payment already processed', {
          userId: userId.toString(),
          orderId: razorpay_order_id
        });
        return {
          success: true,
          message: 'Payment already verified',
          alreadyProcessed: true
        };
      }

      const plan = payment.planId;
      if (!plan) {
        throw AppError.internal('Plan not found for payment', 'PLAN_NOT_FOUND');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: plan.credits } },
        { new: true }
      );

      if (!updatedUser) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.status = 'paid';
      payment.creditsAdded = plan.credits;
      await payment.save();

      logger.info('Payment verified successfully', {
        userId: userId.toString(),
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        creditsAdded: plan.credits,
        newBalance: updatedUser.credits
      });

      return {
        success: true,
        message: 'Payment verified and credits added',
        creditsAdded: plan.credits,
        totalCredits: updatedUser.credits
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Error verifying payment', {
        error: error.message,
        userId: userId.toString(),
        orderId: razorpay_order_id
      });
      throw AppError.internal('Failed to verify payment', 'PAYMENT_VERIFY_FAILED');
    }
  }

  async getUserPayments(userId, options = {}) {
    try {
      const payments = await Payment.getUserPayments(userId, options);
      return payments;
    } catch (error) {
      logger.error('Error fetching user payments', {
        error: error.message,
        userId: userId.toString()
      });
      throw AppError.internal('Failed to fetch payments', 'PAYMENTS_FETCH_FAILED');
    }
  }
}

module.exports = new PaymentService();
