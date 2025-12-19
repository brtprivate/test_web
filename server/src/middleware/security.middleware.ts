import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import mongoSanitize from 'express-mongo-sanitize';

// Suspicious IP addresses and patterns to block
const BLOCKED_IPS: string[] = [
  '67.217.57.240',
  '2.57.122.173',
  // Add more suspicious IPs here
];

// Suspicious user agents
const SUSPICIOUS_USER_AGENTS: string[] = [
  'curl',
  'wget',
  'python-requests',
  'Go-http-client',
  'scanner',
  'bot',
  'crawler',
];

// Suspicious paths to monitor
const SUSPICIOUS_PATHS: string[] = [
  '/.env',
  '/.git',
  '/.ssh',
  '/admin',
  '/wp-admin',
  '/phpmyadmin',
  '/.aws',
  '/.docker',
  '/.npmrc',
  '/config.json',
  '/credentials',
];

/**
 * Get client IP address from request
 */
export const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Check if IP is blocked
 */
export const isBlockedIp = (ip: string): boolean => {
  return BLOCKED_IPS.some((blockedIp) => ip.includes(blockedIp));
};

/**
 * Check if user agent is suspicious
 */
export const isSuspiciousUserAgent = (userAgent: string | undefined): boolean => {
  if (!userAgent) return true; // Block requests without user agent
  const ua = userAgent.toLowerCase();
  return SUSPICIOUS_USER_AGENTS.some((suspicious) => ua.includes(suspicious));
};

/**
 * Check if path is suspicious
 */
export const isSuspiciousPath = (path: string): boolean => {
  return SUSPICIOUS_PATHS.some((suspicious) => path.toLowerCase().includes(suspicious));
};

/**
 * Log suspicious activity
 */
export const logSuspiciousActivity = (
  req: Request,
  reason: string,
  details?: Record<string, any>
): void => {
  const ip = getClientIp(req);
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    ip,
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    reason,
    ...details,
  };

  console.warn('🚨 SUSPICIOUS ACTIVITY DETECTED:', JSON.stringify(logData, null, 2));
  
  // In production, you should send this to a logging service
  // or write to a secure log file
};

/**
 * IP blocking middleware
 */
export const ipBlockingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Allow OPTIONS requests (CORS preflight) to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  const ip = getClientIp(req);

  if (isBlockedIp(ip)) {
    logSuspiciousActivity(req, 'Blocked IP address');
    res.status(403).json({
      status: 'error',
      message: 'Access denied',
    });
    return;
  }

  next();
};

/**
 * User agent validation middleware
 */
export const userAgentValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Allow OPTIONS requests (CORS preflight) to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  const userAgent = req.headers['user-agent'];

  // Allow requests to health check and API endpoints with proper user agents
  if (req.path === '/health' || req.path.startsWith('/api')) {
    // For API endpoints, we're more lenient but still log suspicious ones
    if (isSuspiciousUserAgent(userAgent)) {
      logSuspiciousActivity(req, 'Suspicious user agent on API endpoint');
      // Don't block, just log for API endpoints
    }
    next();
    return;
  }

  // For other endpoints, block suspicious user agents
  if (isSuspiciousUserAgent(userAgent)) {
    logSuspiciousActivity(req, 'Suspicious user agent blocked');
    res.status(403).json({
      status: 'error',
      message: 'Access denied',
    });
    return;
  }

  next();
};

/**
 * Path validation middleware
 */
export const pathValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Allow OPTIONS requests (CORS preflight) to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }

  const path = req.path.toLowerCase();

  // Allow API routes (they start with /api)
  if (path.startsWith('/api')) {
    return next();
  }

  // Allow health check
  if (path === '/health') {
    return next();
  }

  if (isSuspiciousPath(path)) {
    logSuspiciousActivity(req, 'Suspicious path access attempt');
    res.status(404).json({
      status: 'error',
      message: 'Not found',
    });
    return;
  }

  next();
};

/**
 * Request size limit middleware
 */
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = parseInt(contentLength, 10) / (1024 * 1024);
      const maxSizeInMB = parseFloat(maxSize.replace('mb', ''));
      
      if (sizeInMB > maxSizeInMB) {
        logSuspiciousActivity(req, 'Request size exceeded', { sizeInMB, maxSizeInMB });
        res.status(413).json({
          status: 'error',
          message: 'Request entity too large',
        });
        return;
      }
    }
    next();
  };
};

/**
 * General rate limiter for all routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSuspiciousActivity(req, 'Rate limit exceeded');
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    status: 'error',
    message: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req: Request, res: Response) => {
    logSuspiciousActivity(req, 'Auth rate limit exceeded');
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts, please try again later.',
    });
  },
});

/**
 * Admin rate limiter (stricter)
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSuspiciousActivity(req, 'Admin rate limit exceeded');
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.',
    });
  },
});

/**
 * Slow down middleware for repeated requests
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

/**
 * MongoDB injection protection
 */
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logSuspiciousActivity(req, 'MongoDB injection attempt detected', { key });
  },
});

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Request logging middleware for security monitoring
 */
export const securityLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip = getClientIp(req);
  const startTime = Date.now();

  // Log the request
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      ip,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
    };

    // Log errors and suspicious status codes
    if (res.statusCode >= 400) {
      console.warn('⚠️ Request Error:', JSON.stringify(logData, null, 2));
    }
  });

  next();
};

