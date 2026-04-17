const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan ID is required']
    },
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay Order ID is required']
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    razorpaySignature: {
      type: String,
      default: null
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created'
    },
    creditsAdded: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.set('autoIndex', true);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ planId: 1 });
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

paymentSchema.statics.findByOrderId = async function(razorpayOrderId) {
  return this.findOne({ razorpayOrderId }).populate('planId');
};

paymentSchema.statics.getUserPayments = async function(userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  return this.find({ userId })
    .populate('planId', 'name credits price')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Payment', paymentSchema);
