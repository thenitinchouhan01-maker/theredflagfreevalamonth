const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('../models');
const { config } = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class UploadService {
  _getClient() {
    return new S3Client({
      region: config.r2.region || 'auto',
      endpoint: config.r2.endpoint,
      credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey
      },
      forcePathStyle: true
    });
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
    if (config.r2.publicUrl) {
      return `${config.r2.publicUrl}/${r2Key}`;
    }
    return `${config.r2.endpoint}/${config.r2.bucketName}/${r2Key}`;
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

      if (!config.r2.bucketName || !config.r2.accessKeyId || !config.r2.secretAccessKey) {
        console.error('❌ R2 not configured:', {
          bucket: config.r2.bucketName || 'MISSING',
          accessKey: config.r2.accessKeyId ? 'SET' : 'MISSING',
          secret: config.r2.secretAccessKey ? 'SET' : 'MISSING',
          endpoint: config.r2.endpoint || 'MISSING'
        });
        throw AppError.internal('Storage not configured', 'STORAGE_NOT_CONFIGURED');
      }

      const r2Key = this.generateR2Key(userId.toString(), file.originalname);
      const s3Client = this._getClient();

      const command = new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: r2Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          userId: userId.toString()
        }
      });

      await s3Client.send(command);

      const fileUrl = this.getPublicUrl(r2Key);

      const upload = await Upload.create({
        userId,
        originalName: file.originalname,
        r2Key,
        fileUrl,
        format: file.mimetype.split('/')[1],
        width: null,
        height: null,
        bytes: file.size,
        resourceType: 'image',
        folder: 'uploads'
      });

      logger.info('Image uploaded to R2', { uploadId: upload._id.toString(), userId: userId.toString(), r2Key });
      return upload;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('❌ UPLOAD_ERROR:', error.message, '| code:', error.code, '| name:', error.name);
      logger.error('Error uploading image to R2', { error: error.message, errorCode: error.code, userId: userId?.toString() });
      
      // Return detailed error in development/production for debugging
      const detailedError = `${error.name || 'Error'}: ${error.message} (code: ${error.code || 'N/A'})`;
      throw AppError.internal(detailedError, 'UPLOAD_FAILED');
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
        const s3Client = this._getClient();
        const command = new DeleteObjectCommand({
          Bucket: config.r2.bucketName,
          Key: upload.r2Key
        });
        await s3Client.send(command);
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
