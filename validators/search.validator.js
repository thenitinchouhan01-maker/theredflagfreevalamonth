const Joi = require('joi');

const createSearchSchema = Joi.object({
  searchType: Joi.string()
    .valid('name', 'username', 'photo', 'mixed')
    .required()
    .messages({
      'any.required': 'searchType is required',
      'any.only': 'searchType must be one of: name, username, photo, mixed'
    }),
  nameQuery: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .pattern(/^(?!\s*$).+/)
    .when('searchType', {
      is: Joi.valid('name', 'mixed'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'Name query must be at least 2 characters',
      'string.max': 'Name query cannot exceed 200 characters',
      'string.pattern.base': 'Name query cannot be empty or contain only whitespace',
      'any.required': 'nameQuery is required for name/mixed search types'
    }),
  usernameQuery: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^(?!\s*$).+/)
    .when('searchType', {
      is: Joi.valid('username', 'mixed'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'Username query must be at least 2 characters',
      'string.max': 'Username query cannot exceed 100 characters',
      'string.pattern.base': 'Username query cannot be empty or contain only whitespace',
      'any.required': 'usernameQuery is required for username/mixed search types'
    }),
  imageId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .when('searchType', {
      is: 'photo',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.pattern.base': 'Invalid imageId format',
      'any.required': 'imageId is required for photo search type'
    })
}).custom((value, helpers) => {
  // Additional validation: at least one query field must be provided
  if (!value.nameQuery && !value.usernameQuery && !value.imageId) {
    return helpers.error('object.missingQuery', {
      message: 'At least one of nameQuery, usernameQuery, or imageId must be provided'
    });
  }
  return value;
}).messages({
  'object.missingQuery': 'At least one search parameter must be provided'
});

const getSearchSchema = Joi.object({
  searchId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid searchId format',
      'any.required': 'searchId is required'
    })
});

const getSearchesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string()
    .valid('pending', 'processing', 'completed', 'failed', 'cancelled')
    .optional()
});

const getSearchResultSchema = Joi.object({
  searchId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid searchId format',
      'any.required': 'searchId is required'
    })
});

module.exports = {
  createSearchSchema,
  getSearchSchema,
  getSearchesSchema,
  getSearchResultSchema
};