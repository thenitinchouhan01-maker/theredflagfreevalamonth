class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  // Common error factory methods
  static badRequest(message = 'Bad request', errorCode = 'BAD_REQUEST', details = null) {
    return new AppError(message, 400, errorCode, details);
  }

  static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED', details = null) {
    return new AppError(message, 401, errorCode, details);
  }

  static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN', details = null) {
    return new AppError(message, 403, errorCode, details);
  }

  static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND', details = null) {
    return new AppError(message, 404, errorCode, details);
  }

  static conflict(message = 'Conflict', errorCode = 'CONFLICT', details = null) {
    return new AppError(message, 409, errorCode, details);
  }

  static validation(message = 'Validation error', errorCode = 'VALIDATION_ERROR', details = null) {
    return new AppError(message, 422, errorCode, details);
  }

  static tooManyRequests(message = 'Too many requests', errorCode = 'RATE_LIMIT', details = null) {
    return new AppError(message, 429, errorCode, details);
  }

  static internal(message = 'Internal server error', errorCode = 'INTERNAL_ERROR', details = null) {
    return new AppError(message, 500, errorCode, details);
  }

  static serviceUnavailable(message = 'Service unavailable', errorCode = 'SERVICE_UNAVAILABLE', details = null) {
    return new AppError(message, 503, errorCode, details);
  }

  // Payment specific errors
  static paymentRequired(message = 'Payment required', errorCode = 'PAYMENT_REQUIRED', details = null) {
    return new AppError(message, 402, errorCode, details);
  }

  static paymentFailed(message = 'Payment failed', errorCode = 'PAYMENT_FAILED', details = null) {
    return new AppError(message, 402, errorCode, details);
  }

  // Access specific errors
  static noActiveAccess(message = 'No active access plan', errorCode = 'NO_ACTIVE_ACCESS', details = null) {
    return new AppError(message, 403, errorCode, details);
  }

  static accessExpired(message = 'Access plan expired', errorCode = 'ACCESS_EXPIRED', details = null) {
    return new AppError(message, 403, errorCode, details);
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      details: this.details,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

module.exports = AppError;