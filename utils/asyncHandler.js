/**
 * Async handler to wrap async route handlers
 * Automatically catches errors and passes them to Express error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Async handler for controller methods
 * Similar to asyncHandler but returns a promise
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncController = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Async handler for service methods
 * Wraps service methods to ensure consistent error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function
 */
const asyncService = (fn, context = 'Service') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Add context to error
      error.context = context;
      throw error;
    }
  };
};

module.exports = {
  asyncHandler,
  asyncController,
  asyncService
};