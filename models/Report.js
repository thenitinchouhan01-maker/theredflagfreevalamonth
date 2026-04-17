const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    searchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Search',
      required: [true, 'Search ID is required'],
      unique: true,
      index: true
    },
    resultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
      index: true
    },
    reportData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Report data is required']
    },
    reportJson: {
      type: String,
      required: [true, 'Report JSON is required']
    },
    version: {
      type: String,
      default: '1.0.0'
    },
    format: {
      type: String,
      enum: ['json', 'pdf', 'html'],
      default: 'json'
    },
    fileUrl: {
      type: String
    },
    fileSize: {
      type: Number
    },
    isDownloaded: {
      type: Boolean,
      default: false
    },
    downloadedAt: {
      type: Date
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    expiresAt: {
      type: Date
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ isArchived: 1, createdAt: -1 });

// Virtual for file size formatted
reportSchema.virtual('fileSizeFormatted').get(function () {
  if (!this.fileSize) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(k));
  return parseFloat((this.fileSize / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for is expired
reportSchema.virtual('isExpired').get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for age in days
reportSchema.virtual('ageInDays').get(function () {
  const diffTime = new Date() - this.createdAt;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to get user's reports
reportSchema.statics.getUserReports = async function (userId, options = {}) {
  const { limit = 20, skip = 0, includeArchived = false } = options;
  
  const query = { userId };
  if (!includeArchived) {
    query.isArchived = false;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('searchId', 'searchType nameQuery usernameQuery status createdAt')
    .populate('resultId', 'summary.totalProfilesFound summary.totalImageMatches');
};

// Static method to get report by search ID
reportSchema.statics.findBySearchId = async function (searchId) {
  return this.findOne({ searchId })
    .populate('searchId', 'searchType nameQuery usernameQuery status createdAt')
    .populate('resultId', 'summary.totalProfilesFound summary.totalImageMatches matchedProfiles');
};

// Static method to create report from result
reportSchema.statics.createFromResult = async function (result, reportData = {}) {
  const Search = mongoose.model('Search');
  const search = await Search.findById(result.searchId);
  
  if (!search) {
    throw new Error('Search not found');
  }

  // Build report data
  const reportPayload = {
    searchInfo: {
      searchType: search.searchType,
      nameQuery: search.nameQuery,
      usernameQuery: search.usernameQuery,
      searchedAt: search.startedAt,
      completedAt: search.completedAt,
      duration: search.durationSeconds
    },
    summary: result.summary,
    matchedProfiles: result.matchedProfiles,
    imageMatches: result.imageMatches,
    flags: result.flags,
    sources: result.sources,
    generatedAt: new Date(),
    ...reportData
  };

  const report = await this.create({
    userId: result.userId,
    searchId: result.searchId,
    resultId: result._id,
    reportData: reportPayload,
    reportJson: JSON.stringify(reportPayload, null, 2),
    format: 'json',
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  });

  return report;
};

// Instance method to mark as downloaded
reportSchema.methods.markAsDownloaded = async function () {
  this.isDownloaded = true;
  this.downloadedAt = new Date();
  this.downloadCount += 1;
  return this.save();
};

// Instance method to archive
reportSchema.methods.archive = async function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Instance method to update file info
reportSchema.methods.updateFileInfo = async function (fileUrl, fileSize) {
  this.fileUrl = fileUrl;
  this.fileSize = fileSize;
  return this.save();
};

module.exports = mongoose.model('Report', reportSchema);