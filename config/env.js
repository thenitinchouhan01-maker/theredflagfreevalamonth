/**
 * Environment Configuration with Production Validation
 * Ensures all required credentials are present before starting the server
 */

const requiredProductionEnvVars = [
  'MONGODB_URI',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'R2_BUCKET_NAME',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY'
];

const optionalProductionEnvVars = [
  'RAZORPAY_WEBHOOK_SECRET',
  'CORS_ORIGIN',
  'R2_PUBLIC_URL',
  'R2_REGION'
];

/**
 * Validate environment variables
 * In production, all required vars must be present
 * In development, warns about missing vars but doesn't exit
 */
const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = requiredProductionEnvVars.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    
    if (isProduction) {
      console.error('❌ PRODUCTION ERROR:', message);
      console.error('❌ Cannot start server without required credentials');
      process.exit(1);
    } else {
      console.warn('⚠️  WARNING:', message);
      console.warn('⚠️  Some features will not work without real credentials');
    }
  }

  // Check optional vars
  const missingOptional = optionalProductionEnvVars.filter((env) => !process.env[env]);
  if (missingOptional.length > 0 && isProduction) {
    console.warn('⚠️  Optional env vars not set:', missingOptional.join(', '));
  }

  // Validate MongoDB URI format
  if (process.env.MONGODB_URI) {
    if (!process.env.MONGODB_URI.startsWith('mongodb://') && 
        !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      console.error('❌ Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
      if (isProduction) process.exit(1);
    }
  }

  // Validate Razorpay keys format (only if provided)
  if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.startsWith('rzp_')) {
    console.warn('⚠️  RAZORPAY_KEY_ID should start with rzp_');
  }

  // Validate PORT
  const port = parseInt(process.env.PORT);
  if (process.env.PORT && (isNaN(port) || port < 1 || port > 65535)) {
    console.error('❌ Invalid PORT value. Must be between 1 and 65535');
    if (isProduction) process.exit(1);
  }

  if (!missing.length && isProduction) {
    console.log('✅ All required environment variables are set');
  }
};

/**
 * Configuration object with defaults
 * ✅ RAILWAY OPTIMIZED: All values use process.env
 */
const config = {
  // Server - Railway provides PORT dynamically
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'DeepTrust',
  
  // Database - Railway MongoDB connection
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/deeptrust',
  
  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
  },
  
  // Cloudflare R2 (S3-compatible)
  r2: {
    bucketName: process.env.R2_BUCKET_NAME || '',
    accountId: process.env.R2_ACCOUNT_ID || '',
    endpoint: process.env.R2_ENDPOINT || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    region: process.env.R2_REGION || 'auto',
    publicUrl: process.env.R2_PUBLIC_URL || ''
  },
  
  // Provider API Keys - All from environment
  providers: {
    serperApiKey: process.env.SERPER_API_KEY || '',
    googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || ''
  },
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || process.env.RATE_LIMIT_MAX) || 100,
  
  // CORS - Railway deployment friendly
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : '*'
  },
  
  // Feature Flags
  features: {
    enableWebhook: process.env.ENABLE_WEBHOOK !== 'false',
    enableUploads: process.env.ENABLE_UPLOADS !== 'false',
    enablePayments: process.env.ENABLE_PAYMENTS !== 'false'
  }
};

/**
 * Check if running with real credentials
 */
const hasRealCredentials = () => {
  const hasRazorpay = (
    config.razorpay.keyId.startsWith('rzp_live_') ||
    (config.razorpay.keyId.startsWith('rzp_test_') && config.razorpay.keyId !== 'rzp_test_key')
  );
  
  const hasR2 = (
    config.r2.bucketName !== '' &&
    config.r2.accessKeyId !== '' &&
    config.r2.secretAccessKey !== ''
  );
  
  const hasDatabase = (
    config.mongoUri.includes('mongodb.net') || // MongoDB Atlas
    config.mongoUri.includes('localhost') === false
  );
  
  return hasDatabase && hasR2;
};

/**
 * Get configuration summary for logging
 */
const getConfigSummary = () => {
  return {
    environment: config.nodeEnv,
    port: config.port,
    database: config.mongoUri.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB',
    razorpay: config.razorpay.keyId ? 
      (config.razorpay.keyId.startsWith('rzp_live_') ? 'Live' : 'Test') : 
      'Not Configured',
    storage: config.r2.bucketName ? 'Cloudflare R2' : 'Not Configured',
    cors: Array.isArray(config.cors.origin) ? config.cors.origin.join(', ') : config.cors.origin,
    hasRealCredentials: hasRealCredentials()
  };
};

module.exports = { 
  validateEnv, 
  config, 
  hasRealCredentials,
  getConfigSummary,
  requiredProductionEnvVars,
  optionalProductionEnvVars
};
