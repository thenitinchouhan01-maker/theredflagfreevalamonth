const Joi = require('joi');

const createUploadSchema = Joi.object({
  originalName: Joi.string().trim().max(255).optional(),
  metadata: Joi.object().optional()
});

const getUploadSchema = Joi.object({
  uploadId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid uploadId format',
      'any.required': 'uploadId is required'
    })
});

const getUploadsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});

const deleteUploadSchema = Joi.object({
  uploadId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid uploadId format',
      'any.required': 'uploadId is required'
    })
});

module.exports = {
  createUploadSchema,
  getUploadSchema,
  getUploadsSchema,
  deleteUploadSchema
};