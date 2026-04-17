const Joi = require('joi');

const createUserSchema = Joi.object({
  deviceId: Joi.string().trim().max(255).allow('').optional(),
  deviceInfo: Joi.object({
    platform: Joi.string().trim().max(50).optional(),
    version: Joi.string().trim().max(50).optional(),
    manufacturer: Joi.string().trim().max(100).optional(),
    model: Joi.string().trim().max(100).optional()
  }).optional()
});

const restoreUserSchema = Joi.object({
  appUserId: Joi.string()
    .pattern(/^DTX-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid appUserId format. Expected format: DTX-XXXX-XXXX',
      'any.required': 'appUserId is required'
    }),
  deviceId: Joi.string().trim().max(255).allow('').optional(),
  deviceInfo: Joi.object({
    platform: Joi.string().trim().max(50).optional(),
    version: Joi.string().trim().max(50).optional(),
    manufacturer: Joi.string().trim().max(100).optional(),
    model: Joi.string().trim().max(100).optional()
  }).optional()
});

const updateUserSchema = Joi.object({
  deviceInfo: Joi.object({
    platform: Joi.string().trim().max(50).optional(),
    version: Joi.string().trim().max(50).optional(),
    manufacturer: Joi.string().trim().max(100).optional(),
    model: Joi.string().trim().max(100).optional()
  }).optional()
});

module.exports = {
  createUserSchema,
  restoreUserSchema,
  updateUserSchema
};