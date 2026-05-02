const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 DEBUG: Log Razorpay credentials on startup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('\n🔑 [RAZORPAY] Checking credentials...');
console.log('🔑 KEY_ID:', process.env.RAZORPAY_KEY_ID || '❌ MISSING');
console.log('🔑 KEY_SECRET EXISTS:', !!process.env.RAZORPAY_KEY_SECRET ? '✅ YES' : '❌ NO');
if (process.env.RAZORPAY_KEY_SECRET) {
  console.log('🔑 KEY_SECRET LENGTH:', process.env.RAZORPAY_KEY_SECRET.length);
  console.log('🔑 KEY_SECRET PREVIEW:', process.env.RAZORPAY_KEY_SECRET.substring(0, 10) + '...');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

class PaymentService {

  /**
   * 🔴 FINAL FIX: Create Razorpay order with STRICT flow
   * CRITICAL: Razorpay MUST succeed BEFORE any database insert
   * @param {Object} params - { userId, planId }
   * @returns {Object} Order details
   */
  async createOrder({ userId, planId }) {
    try {
      console.log('\n💳 [CREATE ORDER] Starting...');
      console.log('User ID:', userId?.toString());
      console.log('Plan ID:', planId?.toString());

      // STEP 1: Get plan from database
      const plan = await Plan.findById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }
      console.log('✅ Plan found:', plan.name, '- Price:', plan.price, '- Credits:', plan.credits);

      // STEP 2: Create Razorpay instance (fresh instance each time)
      const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
      const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

      if (!keyId || !keySecret) {
        logger.error('Razorpay credentials missing', {
          hasKeyId: !!keyId,
          hasKeySecret: !!keySecret
        });
        throw AppError.internal('Payment gateway not configured', 'PAYMENT_NOT_CONFIGURED');
      }

      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
      console.log('✅ Razorpay instance created');

      // STEP 3: Prepare order data
      const orderData = {
        amount: plan.price * 100,  // Convert to paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`
      };

      console.log('\n📦 ORDER DATA:', JSON.stringify(orderData, null, 2));

      // STEP 4: Call Razorpay API (CRITICAL - MUST succeed before DB insert)
      console.log('\n🚀 Calling Razorpay API...');
      const order = await razorpay.orders.create(orderData);

      console.log('\n✅ Razorpay Response:', JSON.stringify(order, null, 2));

      // STEP 5: STRICT VALIDATION - order MUST have id
      if (!order || !order.id) {
        throw new Error('Razorpay did not return order id');
      }
      console.log('✅ Order ID validated:', order.id);

      // STEP 6: ONLY NOW save to database (Razorpay succeeded)
      console.log('\n💾 Saving to database...');
      const payment = await Payment.create({
        userId,
        planId,
        razorpayOrderId: order.id,  // GUARANTEED to be non-null
        amount: plan.price,
        currency: 'INR',
        status: 'created'
      });

      console.log('✅ Payment saved to database:', payment._id);
      console.log('✅ razorpayOrderId in DB:', payment.razorpayOrderId);

      // STEP 7: Return response
      const response = {
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: keyId
        }
      };

      console.log('\n✅ [SUCCESS] Order created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return response;

    } catch (err) {
      console.error('\n🔥 FINAL ERROR:', err.message);
      console.error('🔥 Error stack:', err.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      throw AppError.internal(
        `Payment order creation failed: ${err.message}`,
        'ORDER_CREATE_FAILED'
      );
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
      const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
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
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id }).populate('planId');

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
      const { limit = 20, skip = 0 } = options;
      const payments = await Payment.find({ userId })
        .populate('planId', 'name credits price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
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
