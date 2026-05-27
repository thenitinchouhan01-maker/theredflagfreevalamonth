const uploadService = require('../services/upload.service');
const ApiResponse = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');

class UploadController {
  /**
   * Upload an image
   * POST /api/uploads
   */
  uploadImage = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const file = req.file;

    if (!file) {
      console.error('UPLOAD_ERROR: No file in request');
      console.error('req.file:', req.file);
      console.error('req.body:', req.body);
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
        errorCode: 'NO_FILE',
        timestamp: new Date().toISOString()
      });
    }

    const upload = await uploadService.uploadImage(file, userId);

    const response = new ApiResponse(res);
    response.created({
      upload: {
        id: upload._id,
        originalName: upload.originalName,
        fileUrl: upload.fileUrl,
        format: upload.format,
        width: upload.width,
        height: upload.height,
        size: upload.sizeFormatted,
        createdAt: upload.createdAt
      }
    }, 'Image uploaded successfully');
  });

  /**
   * Get signed upload URL for direct browser upload
   * GET /api/uploads/signed-url
   */
  getSignedUploadUrl = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const signedData = await uploadService.generateSignedUpload(userId);

    const response = new ApiResponse(res);
    response.success({
      upload: signedData
    });
  });

  /**
   * Get user's uploads
   * GET /api/uploads
   */
  getUserUploads = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const uploads = await uploadService.getUserUploads(userId, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const response = new ApiResponse(res);
    response.success({
      uploads: uploads.map(upload => ({
        id: upload._id,
        originalName: upload.originalName,
        fileUrl: upload.fileUrl,
        format: upload.format,
        width: upload.width,
        height: upload.height,
        size: upload.sizeFormatted,
        isProcessed: upload.isProcessed,
        createdAt: upload.createdAt
      }))
    });
  });

  /**
   * Get upload by ID
   * GET /api/uploads/:uploadId
   */
  getUploadById = asyncHandler(async (req, res) => {
    const { uploadId } = req.params;
    const userId = req.user._id;

    const upload = await uploadService.getUploadById(uploadId, userId);

    const response = new ApiResponse(res);
    response.success({
      upload: {
        id: upload._id,
        originalName: upload.originalName,
        fileUrl: upload.fileUrl,
        format: upload.format,
        width: upload.width,
        height: upload.height,
        bytes: upload.bytes,
        size: upload.sizeFormatted,
        aspectRatio: upload.aspectRatio,
        isProcessed: upload.isProcessed,
        processedAt: upload.processedAt,
        searchId: upload.searchId,
        createdAt: upload.createdAt
      }
    });
  });

  /**
   * Delete upload
   * DELETE /api/uploads/:uploadId
   */
  deleteUpload = asyncHandler(async (req, res) => {
    const { uploadId } = req.params;
    const userId = req.user._id;

    await uploadService.deleteUpload(uploadId, userId);

    const response = new ApiResponse(res);
    response.success(null, 'Upload deleted successfully');
  });
}

module.exports = new UploadController();