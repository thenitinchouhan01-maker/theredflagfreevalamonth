const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    trim: true
  },
  profileUrl: {
    type: String,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true
  },
  followers: {
    type: Number
  },
  following: {
    type: Number
  },
  posts: {
    type: Number
  },
  location: {
    type: String,
    trim: true
  },
  joinedDate: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { _id: false });

const imageMatchSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  similarity: {
    type: Number,
    min: 0,
    max: 100
  },
  pageTitle: {
    type: String
  },
  pageUrl: {
    type: String
  },
  foundAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const flagSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['warning', 'info', 'alert'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  source: {
    type: String
  }
}, { _id: false });

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String
  },
  searchedAt: {
    type: Date,
    default: Date.now
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed', 'skipped'],
    default: 'success'
  }
}, { _id: false });

const resultSchema = new mongoose.Schema(
  {
    searchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Search',
      required: [true, 'Search ID is required'],
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'completed',
      index: true
    },
    summary: {
      totalProfilesFound: {
        type: Number,
        default: 0
      },
      totalImageMatches: {
        type: Number,
        default: 0
      },
      platformsSearched: [{
        type: String
      }],
      platformsWithResults: [{
        type: String
      }],
      overallConfidence: {
        type: Number,
        min: 0,
        max: 100
      },
      summaryText: {
        type: String,
        trim: true
      }
    },
    matchedProfiles: [profileSchema],
    imageMatches: [imageMatchSchema],
    flags: [flagSchema],
    sources: [sourceSchema],
    rawData: {
      type: mongoose.Schema.Types.Mixed
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for performance
resultSchema.index({ userId: 1, createdAt: -1 });
resultSchema.index({ createdAt: -1 });
resultSchema.index({ status: 1, createdAt: -1 });
resultSchema.index({ 'summary.totalProfilesFound': 1 });

// Virtual for has results
resultSchema.virtual('hasResults').get(function () {
  return this.matchedProfiles.length > 0 || this.imageMatches.length > 0;
});

// Virtual for platforms count
resultSchema.virtual('platformsCount').get(function () {
  return this.matchedProfiles.length;
});

// Static method to get result by search ID
resultSchema.statics.findBySearchId = async function (searchId) {
  return this.findOne({ searchId });
};

// Static method to get user's results
resultSchema.statics.getUserResults = async function (userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('searchId', 'searchType nameQuery usernameQuery status createdAt');
};

// Instance method to add profile
resultSchema.methods.addProfile = async function (profile) {
  this.matchedProfiles.push(profile);
  this.summary.totalProfilesFound = this.matchedProfiles.length;
  
  if (!this.summary.platformsWithResults.includes(profile.platform)) {
    this.summary.platformsWithResults.push(profile.platform);
  }
  
  return this.save();
};

// Instance method to add image match
resultSchema.methods.addImageMatch = async function (match) {
  this.imageMatches.push(match);
  this.summary.totalImageMatches = this.imageMatches.length;
  return this.save();
};

// Instance method to add flag
resultSchema.methods.addFlag = async function (flag) {
  this.flags.push(flag);
  return this.save();
};

// Instance method to add source
resultSchema.methods.addSource = async function (source) {
  this.sources.push(source);
  if (!this.summary.platformsSearched.includes(source.name)) {
    this.summary.platformsSearched.push(source.name);
  }
  return this.save();
};

// Instance method to update summary
resultSchema.methods.updateSummary = async function (summaryData) {
  this.summary = { ...this.summary, ...summaryData };
  return this.save();
};

module.exports = mongoose.model('Result', resultSchema);