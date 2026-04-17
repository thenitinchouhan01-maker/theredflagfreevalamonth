const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: [1, 'Credits must be at least 1']
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

planSchema.index({ isActive: 1, price: 1 });

planSchema.statics.getActivePlans = async function() {
  return this.find({ isActive: true }).sort({ price: 1 });
};

planSchema.statics.findActiveById = async function(planId) {
  return this.findOne({ _id: planId, isActive: true });
};

module.exports = mongoose.model('Plan', planSchema);
