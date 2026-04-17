const mongoose = require('mongoose');
const crypto = require('crypto');

const generateAppUserId = () => {
  // Format: DTX-XXXX-XXXX where X is alphanumeric
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const generateSegment = (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `DTX-${generateSegment(4)}-${generateSegment(4)}`;
};

const userSchema = new mongoose.Schema(
  {
    appUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: generateAppUserId
    },
    deviceId: {
      type: String,
      index: true,
      sparse: true
    },
    deviceInfo: {
      platform: String,
      version: String,
      manufacturer: String,
      model: String
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Update lastActiveAt on each find/update
userSchema.pre('save', function (next) {
  this.lastActiveAt = new Date();
  next();
});

// Static method to find or create user by device
userSchema.statics.findOrCreateByDevice = async function (deviceId, deviceInfo = {}) {
  let user = await this.findOne({ deviceId });
  
  if (!user) {
    user = await this.create({
      deviceId,
      deviceInfo
    });
  } else {
    user.lastActiveAt = new Date();
    if (Object.keys(deviceInfo).length > 0) {
      user.deviceInfo = { ...user.deviceInfo, ...deviceInfo };
    }
    await user.save();
  }
  
  return user;
};

// Static method to restore user by appUserId
userSchema.statics.restoreByAppUserId = async function (appUserId, deviceId, deviceInfo = {}) {
  const user = await this.findOne({ appUserId });
  
  if (!user) {
    return null;
  }
  
  // Update device info if provided
  if (deviceId) {
    user.deviceId = deviceId;
  }
  if (Object.keys(deviceInfo).length > 0) {
    user.deviceInfo = { ...user.deviceInfo, ...deviceInfo };
  }
  
  user.lastActiveAt = new Date();
  await user.save();
  
  return user;
};

module.exports = mongoose.model('User', userSchema);