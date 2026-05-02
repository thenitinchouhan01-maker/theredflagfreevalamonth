const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function handleDuplicateKeyError(err) {
    var field = Object.keys(err.keyValue)[0];
    var value = err.keyValue[field];
    var message = field + " '" + value + "' already exists";
    return AppError.conflict(message, 'DUPLICATE_KEY', { field: field, value: value });
}

function handleValidationError(err) {
    var errors = Object.values(err.errors).map(function(el) {
        return { field: el.path, message: el.message, value: el.value };
    });
    return AppError.validation('Validation failed', 'VALIDATION_ERROR', errors);
}

function handleCastError(err) {
    return AppError.badRequest('Invalid ' + err.path + ': ' + err.value, 'INVALID_ID', { path: err.path, value: err.value });
}

function sendErrorDev(err, res) {
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message,
        error: err,
        stack: err.stack,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        details: err.details
    });
}

function sendErrorProd(err, res) {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errorCode: err.errorCode,
            details: err.details,
            timestamp: new Date().toISOString()
        });
    } else {
        logger.error('UNEXPECTED_ERROR', { error: err.message, stack: err.stack });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            errorCode: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString()
        });
    }
}

function errorHandler(err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Comprehensive error logging with full request context
    const requestContext = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        appUserId: req.headers['x-app-user-id'] || null,
        deviceId: req.headers['x-device-id'] || null,
        statusCode: err.statusCode,
        errorName: err.name,
        errorCode: err.errorCode || null
    };

    // Log body for non-GET requests (helps identify bad payloads causing crashes)
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
        // Redact sensitive fields before logging
        const safeBody = { ...req.body };
        if (safeBody.razorpay_signature) safeBody.razorpay_signature = '[REDACTED]';
        if (safeBody.password) safeBody.password = '[REDACTED]';
        requestContext.body = safeBody;
    }

    if (err.statusCode >= 500) {
        logger.error('Server error: ' + err.message, {
            ...requestContext,
            stack: err.stack
        });
    } else {
        logger.logError(err, requestContext);
    }

    var error = err;
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'ValidationError') error = handleValidationError(err);

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = AppError.unauthorized('Invalid token', 'INVALID_TOKEN');
    }
    if (err.name === 'TokenExpiredError') {
        error = AppError.unauthorized('Token expired', 'TOKEN_EXPIRED');
    }

    // Handle syntax errors in JSON body parsing
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        error = AppError.badRequest('Invalid JSON in request body', 'INVALID_JSON');
    }

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }
}

module.exports = errorHandler;