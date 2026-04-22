const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Get Razorpay instance with validation
 * Throws error if credentials are missing
 */
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.error('Razorpay credentials missing in environment');
    throw new Error('Razorpay configuration error. Please contact support.');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

class PaymentService {
  /**
   * Create Razorpay order for a plan
   * @param {Object} params - { userId, planId }
   * @returns {Object} Order details with Razorpay key
   */
  async createOrder({ userId, planId }) {
    try {
      // Validate planId
      if (!planId) {
        throw AppError.badRequest('Plan ID is required', 'PLAN_ID_REQUIRED');
      }

      // Get plan details
      const plan = await Plan.findActiveById(planId);
      if (!plan) {
        throw AppError.notFound('Plan not found or inactive', 'PLAN_NOT_FOUND');
      }

      // Get Razorpay instance
      const razorpay = getRazorpayInstance();

      // Convert to paise (1 INR = 100 paise)
      const amountInPaise = Math.round(plan.price * 100);

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}_${userId.toString().slice(-6)}`,
        notes: {
          userId: userId.toString(),
          planId: planId.toString(),
          planName: plan.name,
          credits: plan.credits.toString()
        }
      });

      // Save payment record in database
      const payment = await Payment.create({
        userId,
        planId,
        razorpayOrderId: razorpayOrder.id,
        amount: plan.price,
        currency: 'INR',
        status: 'created'
      });

      logger.info('Razorpay order created', {
        userId: userId.toString(),
        planId: planId.toString(),
        orderId: razorpayOrder.id,
        amount: plan.price,
        credits: plan.credits
      });

      // Return order details (NEVER expose key_secret)
      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,  // Safe to expose (public key)
        planName: plan.name,
        credits: plan.credits
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Error creating Razorpay order', {
        error: error.message,
        stack: error.stack,
        userId: userId.toString(),
        planId: planId?.toString()
      });
      throw AppError.internal('Failed to create payment order', 'ORDER_CREATE_FAILED');
    }
  }

  /**
   * Verify Razorpay payment signature and add credits
   * CRITICAL: This is where credits are added - must be secure!
   * @param {Object} params - { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
   * @returns {Object} Verification result with credits info
   */
  async verifyPayment({ userId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    try {
      // Validate all required fields
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw AppError.badRequest('Missing payment details', 'MISSING_PAYMENT_DETAILS');
      }

      // STEP 1: VERIFY SIGNATURE (CRITICAL SECURITY CHECK)
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      // Compare signatures
      if (expectedSignature !== razorpay_signature) {
        logger.error('Invalid Razorpay signature', {
          userId: userId.toString(),
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        });
        throw AppError.badRequest('Payment verification failed. Invalid signature.', 'INVALID_SIGNATURE');
      }

      // STEP 2: GET PAYMENT RECORD
      const payment = await Payment.findByOrderId(razorpay_order_id);

      if (!payment) {
        throw AppError.notFound('Payment record not found', 'PAYMENT_NOT_FOUND');
      }

      // STEP 3: VERIFY USER OWNERSHIP
      if (payment.userId.toString() !== userId.toString()) {
        logger.error('Unauthorized payment access attempt', {
          paymentUserId: payment.userId.toString(),
          requestUserId: userId.toString(),
          orderId: razorpay_order_id
        });
        throw AppError.forbidden('Unauthorized payment access', 'UNAUTHORIZED_PAYMENT');
      }

      // STEP 4: PREVENT DUPLICATE CREDIT ADDITION (CRITICAL)
      if (payment.status === 'paid') {
        logger.warn('Duplicate payment verification attempt', {
          userId: userId.toString(),
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id
        });
        
        // Get current user credits
        const user = await User.findById(userId);
        
        return {
          success: true,
          message: 'Payment already verified',
          alreadyProcessed: true,
          creditsAdded: payment.creditsAdded || 0,
          totalCredits: user ? user.credits : 0
        };
      }

      // STEP 5: GET PLAN DETAILS
      const plan = payment.planId;
      if (!plan) {
        throw AppError.internal('Plan not found for payment', 'PLAN_NOT_FOUND');
      }

      // STEP 6: ADD CREDITS ATOMICALLY (PREVENTS RACE CONDITIONS)
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: plan.credits } },  // Atomic increment
        { new: true }
      );

      if (!updatedUser) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      // STEP 7: UPDATE PAYMENT STATUS
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.status = 'paid';
      payment.creditsAdded = plan.credits;
      await payment.save();

      logger.info('Payment verified and credits added', {
        userId: userId.toString(),
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        creditsAdded: plan.credits,
        newBalance: updatedUser.credits,
        planName: plan.name
      });

      return {
        success: true,
        message: 'Payment verified and credits added successfully',
        creditsAdded: plan.credits,
        totalCredits: updatedUser.credits
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Error verifying payment', {
        error: error.message,
        stack: error.stack,
        userId: userId.toString(),
        orderId: razorpay_order_id
      });
      throw AppError.internal('Payment verification failed', 'PAYMENT_VERIFY_FAILED');
    }
  }

  /**
   * Get user's payment history
   * @param {String} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Array} Payment records
   */
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
