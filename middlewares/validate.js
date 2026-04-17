const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware to handle validation errors from express-validator
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    const error = AppError.validation(
      'Validation failed',
      'VALIDATION_ERROR',
      formattedErrors
    );

    next(error);
  };
};

/**
 * Middleware to validate request body
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const formattedErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const appError = AppError.validation(
        'Validation failed',
        'VALIDATION_ERROR',
        formattedErrors
      );

      return next(appError);
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate request params
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const formattedErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const appError = AppError.validation(
        'Invalid URL parameters',
        'INVALID_PARAMS',
        formattedErrors
      );

      return next(appError);
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware to validate request query
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const formattedErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      const appError = AppError.validation(
        'Invalid query parameters',
        'INVALID_QUERY',
        formattedErrors
      );

      return next(appError);
    }

    req.query = value;
    next();
  };
};

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery
};