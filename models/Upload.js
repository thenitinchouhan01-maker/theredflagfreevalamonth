const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    originalName: {
      type: String,
      trim: true
    },
    r2Key: {
      type: String,
      required: [true, 'R2 key is required'],
      unique: true,
      index: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    format: {
      type: String,
      trim: true
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    bytes: {
      type: Number
    },
    resourceType: {
      type: String,
      enum: ['image', 'video', 'raw', 'auto'],
      default: 'image'
    },
    folder: {
      type: String,
      default: 'uploads'
    },
    isProcessed: {
      type: Boolean,
      default: false
    },
    processedAt: {
      type: Date
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    searchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Search',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for user uploads
uploadSchema.index({ userId: 1, createdAt: -1 });

// Virtual for file size in human readable format
uploadSchema.virtual('sizeFormatted').get(function () {
  if (!this.bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.bytes) / Math.log(k));
  return parseFloat((this.bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for aspect ratio
uploadSchema.virtual('aspectRatio').get(function () {
  if (!this.width || !this.height) return null;
  return (this.width / this.height).toFixed(2);
});

// Static method to get user's uploads
uploadSchema.statics.getUserUploads = async function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find upload by R2 key
uploadSchema.statics.findByR2Key = async function (r2Key) {
  return this.findOne({ r2Key });
};

// Instance method to mark as processed
uploadSchema.methods.markAsProcessed = async function (metadata = {}) {
  this.isProcessed = true;
  this.processedAt = new Date();
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

// Instance method to link to search
uploadSchema.methods.linkToSearch = async function (searchId) {
  this.searchId = searchId;
  return this.save();
};

module.exports = mongoose.model('Upload', uploadSchema);