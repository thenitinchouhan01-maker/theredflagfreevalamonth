const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    searchType: {
      type: String,
      enum: ['name', 'username', 'photo', 'mixed'],
      required: [true, 'Search type is required'],
      index: true
    },
    nameQuery: {
      type: String,
      trim: true,
      index: true
    },
    usernameQuery: {
      type: String,
      trim: true,
      lowercase: true,
      index: true
    },
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    failureReason: {
      type: String
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    sourcesSearched: [{
      type: String,
      enum: ['google', 'bing', 'social_media', 'public_records', 'news', 'images']
    }],
    totalSources: {
      type: Number,
      default: 0
    },
    completedSources: {
      type: Number,
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes
searchSchema.index({ userId: 1, createdAt: -1 });
searchSchema.index({ status: 1, createdAt: -1 });
searchSchema.index({ searchType: 1, status: 1 });

// Virtual for duration
searchSchema.virtual('duration').get(function () {
  if (!this.completedAt || !this.startedAt) return null;
  return this.completedAt - this.startedAt;
});

// Virtual for duration in seconds
searchSchema.virtual('durationSeconds').get(function () {
  const duration = this.duration;
  return duration ? Math.round(duration / 1000) : null;
});

// Virtual for is complete
searchSchema.virtual('isComplete').get(function () {
  return ['completed', 'failed', 'cancelled'].includes(this.status);
});

// Static method to get user's searches
searchSchema.statics.getUserSearches = async function (userId, options = {}) {
  const { limit = 20, skip = 0, status } = options;
  
  const query = { userId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('imageId', 'secureUrl width height');
};

// Static method to get pending searches
searchSchema.statics.getPendingSearches = async function () {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .populate('userId', 'appUserId')
    .populate('imageId', 'secureUrl');
};

// Static method to get searches by status
searchSchema.statics.getByStatus = async function (status, options = {}) {
  const { limit = 50, skip = 0 } = options;
  
  return this.find({ status })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Instance method to start processing
searchSchema.methods.startProcessing = async function () {
  this.status = 'processing';
  this.startedAt = new Date();
  return this.save();
};

// Instance method to mark as completed
searchSchema.methods.markAsCompleted = async function () {
  this.status = 'completed';
  this.completedAt = new Date();
  this.progress = 100;
  return this.save();
};

// Instance method to mark as failed
searchSchema.methods.markAsFailed = async function (reason) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  return this.save();
};

// Instance method to update progress
searchSchema.methods.updateProgress = async function (progress, sourcesSearched = []) {
  this.progress = Math.min(100, Math.max(0, progress));
  if (sourcesSearched.length > 0) {
    // Validate enum values before adding
    const validSources = ['google', 'bing', 'social_media', 'public_records', 'news', 'images'];
    const sanitizedSources = sourcesSearched.filter(source => validSources.includes(source));
    
    if (sanitizedSources.length !== sourcesSearched.length) {
      const invalid = sourcesSearched.filter(s => !validSources.includes(s));
      console.warn(`[Search.updateProgress] Invalid source values filtered out: ${invalid.join(', ')}`);
    }
    
    this.sourcesSearched = [...new Set([...this.sourcesSearched, ...sanitizedSources])];
    this.completedSources = this.sourcesSearched.length;
  }
  return this.save();
};

// Instance method to add source searched
searchSchema.methods.addSourceSearched = async function (source) {
  // Validate enum value
  const validSources = ['google', 'bing', 'social_media', 'public_records', 'news', 'images'];
  
  if (!validSources.includes(source)) {
    console.warn(`[Search.addSourceSearched] Invalid source value: ${source}`);
    return this;
  }
  
  if (!this.sourcesSearched.includes(source)) {
    this.sourcesSearched.push(source);
    this.completedSources = this.sourcesSearched.length;
  }
  return this.save();
};

module.exports = mongoose.model('Search', searchSchema);