const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');
const { identifyUser } = require('./user.routes');

const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  },
});

// Multer error handler wrapper
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('MULTER_ERROR:', err);
      return res.status(400).json({
        success: false,
        message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum size is 10MB.' : err.message,
        errorCode: 'UPLOAD_ERROR',
        timestamp: new Date().toISOString()
      });
    }
    if (err) {
      console.error('FILE_FILTER_ERROR:', err);
      return res.status(400).json({
        success: false,
        message: err.message,
        errorCode: 'INVALID_FILE_TYPE',
        timestamp: new Date().toISOString()
      });
    }
    next();
  });
};

// Upload image
router.post('/', identifyUser, handleUpload, uploadController.uploadImage);

// Get user's uploads
router.get('/', identifyUser, uploadController.getUserUploads);

// Get upload by ID
router.get('/:uploadId', identifyUser, uploadController.getUploadById);

// Delete upload
router.delete('/:uploadId', identifyUser, uploadController.deleteUpload);

module.exports = router;
