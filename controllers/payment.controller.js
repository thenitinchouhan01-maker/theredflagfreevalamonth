const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

class PaymentController {
  createOrder = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { planId } = req.body;

    const order = await paymentService.createOrder({ userId, planId });

    const response = new ApiResponse(res);
    response.success({
      message: 'Order created',
      order
    });
  });

  verifyPayment = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const result = await paymentService.verifyPayment({
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    const response = new ApiResponse(res);
    response.success(result);
  });

  getUserPayments = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const payments = await paymentService.getUserPayments(userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const response = new ApiResponse(res);
    response.success({ payments });
  });
}

module.exports = new PaymentController();
