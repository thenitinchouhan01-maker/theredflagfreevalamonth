const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const instagramSearchController = require('../controllers/instagramSearch.controller');
const { validateBody } = require('../middlewares/validate');
const Joi = require('joi');

/**
 * Rate limiter for Instagram search
 * Max 100 requests per hour per IP
 */
const instagramSearchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Max 100 requests per hour
  message: {
    success: false,
    message: 'Too many search requests. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});

/**
 * Validation schema for Instagram search
 */
const instagramSearchSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Query must be a string',
      'string.empty': 'Query is required',
      'string.min': 'Query must be at least 2 characters',
      'string.max': 'Query must be less than 100 characters',
      'any.required': 'Query is required'
    })
});

/**
 * POST /api/search/instagram-suggestions
 * Get Instagram profile suggestions based on query
 * 
 * Rate limited: 100 requests per hour per IP
 * 
 * Request body:
 * {
 *   "query": "username or name"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Instagram suggestions retrieved successfully",
 *   "data": {
 *     "query": "elonmusk",
 *     "suggestions": [
 *       {
 *         "username": "elonmusk",
 *         "displayName": "Elon Musk",
 *         "profileUrl": "https://www.instagram.com/elonmusk",
 *         "profilePic": "https://...",
 *         "snippet": "...",
 *         "source": "google_custom_search"
 *       }
 *     ],
 *     "count": 1
 *   },
 *   "timestamp": "2024-01-01T00:00:00.000Z"
 * }
 */
router.post(
  '/instagram-suggestions',
  instagramSearchLimiter,
  validateBody(instagramSearchSchema),
  instagramSearchController.getSuggestions
);

/**
 * Health check for Instagram search service
 * GET /api/search/health
 */
router.get('/health', (req, res) => {
  const isConfigured = 
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY && 
    process.env.GOOGLE_SEARCH_ENGINE_ID;

  res.status(200).json({
    success: true,
    service: 'Instagram Search',
    status: isConfigured ? 'configured' : 'not configured',
    rateLimit: {
      windowMs: 3600000, // 1 hour
      maxRequests: 100
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
