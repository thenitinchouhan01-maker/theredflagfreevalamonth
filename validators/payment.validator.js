const Joi = require('joi');

const createOrderSchema = Joi.object({
  planId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid planId format',
      'any.required': 'planId is required'
    })
});

const verifyPaymentSchema = Joi.object({
  razorpayOrderId: Joi.string()
    .required()
    .messages({
      'any.required': 'razorpayOrderId is required'
    }),
  razorpayPaymentId: Joi.string()
    .required()
    .messages({
      'any.required': 'razorpayPaymentId is required'
    }),
  razorpaySignature: Joi.string()
    .required()
    .messages({
      'any.required': 'razorpaySignature is required'
    })
});

const getPaymentHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
  getPaymentHistorySchema
};