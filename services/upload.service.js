const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('../models');
const { config } = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class UploadService {
  constructor() {
    // Initialize S3 client for Cloudflare R2
    // CRITICAL: Endpoint must NOT include bucket name
    // Correct: https://account-id.r2.cloudflarestorage.com
    // Wrong: https://bucket-name.account-id.r2.cloudflarestorage.com
    
    const r2Endpoint = config.r2.endpoint;
    
    // Validate endpoint format
    if (!r2Endpoint || !r2Endpoint.startsWith('https://')) {
      console.error('❌ R2_ENDPOINT invalid or missing');
      console.error('Current endpoint:', r2Endpoint);
      console.error('Expected format: https://account-id.r2.cloudflarestorage.com');
    }
    
    // Log configuration for debugging
    console.log('🔧 Initializing R2 Client:');
    console.log('  Endpoint:', r2Endpoint);
    console.log('  Bucket:', config.r2.bucketName);
    console.log('  Region:', config.r2.region);
    console.log('  Access Key:', config.r2.accessKeyId ? '✅ SET' : '❌ MISSING');
    console.log('  Secret Key:', config.r2.secretAccessKey ? '✅ SET' : '❌ MISSING');
    
    this.s3Client = new S3Client({
      region: config.r2.region || 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey
      },
      // Force path-style addressing for R2 compatibility
      forcePathStyle: true
    });
    
    this.bucketName = config.r2.bucketName;
    this.publicUrl = config.r2.publicUrl;
    
    console.log('✅ R2 Client initialized successfully');
  }

  /**
   * Generate R2 key for file
   * @param {string} userId - User ID
   * @param {string} originalName - Original filename
   * @returns {string} R2 key
   */
  generateR2Key(userId, originalName) {
    const timestamp = Date.now();
    const uuid = uuidv4().split('-')[0];
    const ext = originalName.split('.').pop();
    return `uploads/${userId}/${timestamp}-${uuid}.${ext}`;
  }

  /**
   * Get public URL for R2 file
   * @param {string} r2Key - R2 key
   * @returns {string} Public URL
   */
  getPublicUrl(r2Key) {
    if (this.publicUrl) {
      return `${this.publicUrl}/${r2Key}`;
    }
    // Fallback to R2 endpoint URL
    return `${config.r2.endpoint}/${this.bucketName}/${r2Key}`;
  }

  /**
   * Upload image from buffer (for multer memory storage)
   * @param {Object} file - File object from multer (memory storage)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Upload record
   */
  async uploadImage(file, userId) {
    try {
      if (!file) {
        throw AppError.badRequest('No file provided', 'NO_FILE');
      }

      // Check if R2 is configured
      if (!this.bucketName || !config.r2.accessKeyId) {
        console.error('❌ UPLOAD_ERROR: Storage not configured');
        console.error('bucketName:', this.bucketName);
        console.error('accessKeyId:', config.r2.accessKeyId ? 'SET' : 'NOT SET');
        console.error('endpoint:', config.r2.endpoint);
        throw AppError.internal('Storage not configured', 'STORAGE_NOT_CONFIGURED');
      }

      const r2Key = this.generateR2Key(userId.toString(), file.originalname);
      
      console.log('📤 Uploading to R2:');
      console.log('  Bucket:', this.bucketName);
      console.log('  Key:', r2Key);
      console.log('  Size:', file.size, 'bytes');
      console.log('  Type:', file.mimetype);
      
      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: r2Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          userId: userId.toString()
        }
      });

      await this.s3Client.send(command);
      
      console.log('✅ Upload successful to R2');

      const fileUrl = this.getPublicUrl(r2Key);
      
      console.log('🔗 Public URL:', fileUrl);

      // Create upload record in database
      const upload = await Upload.create({
        userId,
        originalName: file.originalname,
        r2Key,
        fileUrl,
        format: file.mimetype.split('/')[1],
        width: null, // Will be populated if image processing is added
        height: null,
        bytes: file.size,
        resourceType: 'image',
        folder: 'uploads'
      });

      logger.info('Image uploaded to R2', {
        uploadId: upload._id.toString(),
        userId: userId.toString(),
        r2Key,
        fileUrl
      });

      return upload;
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      console.error('❌ UPLOAD_ERROR:', error.message);
      console.error('Error Code:', error.code);
      console.error('Error Name:', error.name);
      console.error('STACK:', error.stack);
      
      // Specific error handling for R2/S3 errors
      if (error.code === 'ENOTFOUND') {
        console.error('❌ DNS Resolution Failed');
        console.error('Endpoint:', config.r2.endpoint);
        console.error('Check: Is R2_ENDPOINT correct in .env?');
        throw AppError.internal('Storage endpoint not reachable', 'STORAGE_ENDPOINT_ERROR');
      }
      
      if (error.name === 'NoSuchBucket') {
        console.error('❌ Bucket not found:', this.bucketName);
        throw AppError.internal('Storage bucket not found', 'BUCKET_NOT_FOUND');
      }
      
      if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
        console.error('❌ Invalid R2 credentials');
        throw AppError.internal('Storage authentication failed', 'STORAGE_AUTH_FAILED');
      }
      
      logger.error('Error uploading image to R2', {
        error: error.message,
        errorCode: error.code,
        errorName: error.name,
        stack: error.stack,
        userId: userId?.toString()
      });
      
      throw AppError.internal('Failed to upload image', 'UPLOAD_FAILED');
    }
  }

  /**
   * Get upload by ID
   * @param {string} uploadId - Upload ID
   * @param {string} userId - User ID (for ownership check)
   * @returns {Promise<Object>} Upload
   */
  async getUploadById(uploadId, userId) {
    try {
      const upload = await Upload.findOne({ _id: uploadId, userId });
      if (!upload) {
        throw AppError.notFound('Upload not found', 'UPLOAD_NOT_FOUND');
      }
      return upload;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error getting upload', { error: error.message, uploadId });
      throw AppError.internal('Failed to get upload', 'UPLOAD_GET_FAILED');
    }
  }

  /**
   * Get user's uploads
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Uploads
   */
  async getUserUploads(userId, options = {}) {
    try {
      const { limit = 20, skip = 0 } = options;
      const uploads = await Upload.getUserUploads(userId, { limit, skip });
      return uploads;
    } catch (error) {
      logger.error('Error getting user uploads', { error: error.message, userId });
      throw AppError.internal('Failed to get uploads', 'UPLOADS_GET_FAILED');
    }
  }

  /**
   * Delete upload
   * @param {string} uploadId - Upload ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteUpload(uploadId, userId) {
    try {
      const upload = await Upload.findOne({ _id: uploadId, userId });
      if (!upload) {
        throw AppError.notFound('Upload not found', 'UPLOAD_NOT_FOUND');
      }

      // Delete from R2
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: upload.r2Key
        });
        await this.s3Client.send(command);
      } catch (r2Error) {
        logger.warn('Failed to delete from R2, continuing with DB deletion', {
          error: r2Error.message,
          r2Key: upload.r2Key
        });
      }

      // Delete from database
      await Upload.findByIdAndDelete(uploadId);

      logger.info('Upload deleted', {
        uploadId: upload._id.toString(),
        userId: userId.toString()
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting upload', { error: error.message, uploadId });
      throw AppError.internal('Failed to delete upload', 'UPLOAD_DELETE_FAILED');
    }
  }

  /**
   * Mark upload as processed
   * @param {string} uploadId - Upload ID
   * @param {Object} metadata - Processing metadata
   * @returns {Promise<Object>} Updated upload
   */
  async markAsProcessed(uploadId, metadata = {}) {
    try {
      const upload = await Upload.findById(uploadId);
      if (!upload) {
        throw AppError.notFound('Upload not found', 'UPLOAD_NOT_FOUND');
      }
      await upload.markAsProcessed(metadata);
      return upload;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error marking upload as processed', { error: error.message, uploadId });
      throw AppError.internal('Failed to update upload', 'UPLOAD_UPDATE_FAILED');
    }
  }

  /**
   * Link upload to search
   * @param {string} uploadId - Upload ID
   * @param {string} searchId - Search ID
   * @returns {Promise<Object>} Updated upload
   */
  async linkToSearch(uploadId, searchId) {
    try {
      const upload = await Upload.findById(uploadId);
      if (!upload) {
        throw AppError.notFound('Upload not found', 'UPLOAD_NOT_FOUND');
      }
      await upload.linkToSearch(searchId);
      return upload;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error linking upload to search', {
        error: error.message,
        uploadId,
        searchId
      });
      throw AppError.internal('Failed to link upload', 'UPLOAD_LINK_FAILED');
    }
  }
}

module.exports = new UploadService();
