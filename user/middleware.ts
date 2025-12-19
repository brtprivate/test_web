import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// CONFIGURATION - Adjust these values based on your needs
// ============================================================================

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // General rate limit: 100 requests per 15 minutes per IP
  general: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
  // Auth endpoints: 5 requests per 15 minutes per IP
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  // API endpoints: 60 requests per 15 minutes per IP
  api: { windowMs: 15 * 60 * 1000, maxRequests: 60 },
};

// Temporary IP blocking after exceeding limits (30 minutes)
const TEMP_BLOCK_DURATION = 30 * 60 * 1000;

// Request throttling: slow down after X requests
const THROTTLE_CONFIG = {
  delayAfter: 50, // Start delaying after 50 requests
  delayMs: 500, // Add 500ms delay per request
  maxDelayMs: 20000, // Maximum 20 seconds delay
};

// Maximum request size (10MB)
const MAX_REQUEST_SIZE = 10 * 1024 * 1024;

// ============================================================================
// IN-MEMORY STORAGE (Edge Runtime compatible)
// ============================================================================

// Request tracking: IP -> { requests: timestamp[], lastReset: number }
const requestTracker = new Map<string, { requests: number[]; lastReset: number; delayCount: number }>();

// Temporarily blocked IPs: IP -> unblock timestamp
const tempBlockedIPs = new Map<string, number>();

// Permanently blocked IPs
const BLOCKED_IPS = new Set([
  '67.217.57.240',
  '2.57.122.173',
  // Add more suspicious IPs here
]);

// Suspicious user agents
const SUSPICIOUS_USER_AGENTS = new Set([
  'curl',
  'wget',
  'python-requests',
  'go-http-client',
  'scanner',
  'bot',
  'crawler',
  'masscan',
  'nmap',
  'nikto',
  'sqlmap',
  'acunetix',
  'burp',
  'netsparker',
  'nessus',
]);

// Suspicious paths to block
const SUSPICIOUS_PATHS = new Set([
  '/.env',
  '/.git',
  '/.ssh',
  '/wp-admin',
  '/phpmyadmin',
  '/.aws',
  '/.docker',
  '/.npmrc',
  '/config.json',
  '/credentials',
  '/.htaccess',
  '/web.config',
  '/.vscode',
  '/.idea',
  '/composer.json',
  '/package.json',
  '/yarn.lock',
  '/package-lock.json',
]);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Clean up old request tracking data (prevent memory leaks)
 */
function cleanupOldRequests() {
  const now = Date.now();
  const cleanupThreshold = 60 * 60 * 1000; // 1 hour

  for (const [ip, data] of requestTracker.entries()) {
    if (now - data.lastReset > cleanupThreshold) {
      requestTracker.delete(ip);
    }
  }

  // Clean up expired temporary blocks
  for (const [ip, unblockTime] of tempBlockedIPs.entries()) {
    if (now > unblockTime) {
      tempBlockedIPs.delete(ip);
    }
  }
}

/**
 * Check if IP is blocked (permanent or temporary)
 */
function isBlockedIp(ip: string): boolean {
  // Check permanent blocklist
  if (BLOCKED_IPS.has(ip)) return true;

  // Check temporary blocks
  const unblockTime = tempBlockedIPs.get(ip);
  if (unblockTime && Date.now() < unblockTime) {
    return true;
  }

  // Clean up expired temporary block
  if (unblockTime && Date.now() >= unblockTime) {
    tempBlockedIPs.delete(ip);
  }

  return false;
}

/**
 * Check if user agent is suspicious
 */
function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true; // Block requests without user agent
  const ua = userAgent.toLowerCase();
  for (const suspicious of SUSPICIOUS_USER_AGENTS) {
    if (ua.includes(suspicious)) return true;
  }
  return false;
}

/**
 * Check if path is suspicious
 */
function isSuspiciousPath(path: string): boolean {
  const lowerPath = path.toLowerCase();
  for (const suspicious of SUSPICIOUS_PATHS) {
    if (lowerPath.includes(suspicious)) return true;
  }
  return false;
}

/**
 * Get rate limit config based on path
 */
function getRateLimitConfig(pathname: string): { windowMs: number; maxRequests: number } {
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/auth')) {
    return RATE_LIMIT_CONFIG.auth;
  }
  if (pathname.startsWith('/api')) {
    return RATE_LIMIT_CONFIG.api;
  }
  return RATE_LIMIT_CONFIG.general;
}

/**
 * Check rate limit for an IP
 */
function checkRateLimit(ip: string, pathname: string, request: NextRequest): { allowed: boolean; remaining: number; retryAfter?: number } {
  const config = getRateLimitConfig(pathname);
  const now = Date.now();

  // Clean up old data periodically (every 1000 requests, roughly)
  if (Math.random() < 0.001) {
    cleanupOldRequests();
  }

  // Get or initialize tracking data
  let data = requestTracker.get(ip);
  if (!data) {
    data = { requests: [], lastReset: now, delayCount: 0 };
    requestTracker.set(ip, data);
  }

  // Remove requests outside the window
  const windowStart = now - config.windowMs;
  data.requests = data.requests.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  if (data.requests.length >= config.maxRequests) {
    // Automatically block IP temporarily after exceeding limit
    if (!tempBlockedIPs.has(ip)) {
      tempBlockedIPs.set(ip, now + TEMP_BLOCK_DURATION);
      logSuspiciousActivity(
        request,
        `Rate limit exceeded - IP temporarily blocked for ${TEMP_BLOCK_DURATION / 1000 / 60} minutes`,
        { ip, requestsCount: data.requests.length, maxRequests: config.maxRequests }
      );
    }

    const oldestRequest = Math.min(...data.requests);
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Add current request
  data.requests.push(now);

  return { allowed: true, remaining: config.maxRequests - data.requests.length };
}

/**
 * Calculate throttle delay
 */
function getThrottleDelay(ip: string): number {
  const data = requestTracker.get(ip);
  if (!data) return 0;

  if (data.requests.length > THROTTLE_CONFIG.delayAfter) {
    const excessRequests = data.requests.length - THROTTLE_CONFIG.delayAfter;
    const delay = Math.min(
      excessRequests * THROTTLE_CONFIG.delayMs,
      THROTTLE_CONFIG.maxDelayMs
    );
    data.delayCount = excessRequests;
    return delay;
  }

  data.delayCount = 0;
  return 0;
}

/**
 * Log suspicious activity
 */
function logSuspiciousActivity(
  request: NextRequest,
  reason: string,
  details?: Record<string, any>
): void {
  const ip = getClientIp(request);
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    ip,
    method: request.method,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get('user-agent'),
    reason,
    ...details,
  };

  console.warn('🚨 [USER] SUSPICIOUS ACTIVITY DETECTED:', JSON.stringify(logData, null, 2));
}

/**
 * Check request size
 */
function checkRequestSize(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_REQUEST_SIZE) {
      logSuspiciousActivity(request, 'Request size exceeded', { size, maxSize: MAX_REQUEST_SIZE });
      return false;
    }
  }
  return true;
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  // Block permanently blocked IPs
  if (isBlockedIp(ip)) {
    logSuspiciousActivity(request, 'Blocked IP address (permanent or temporary)');
    return new NextResponse('Access Denied', { status: 403 });
  }

  // Block suspicious paths
  if (isSuspiciousPath(pathname)) {
    logSuspiciousActivity(request, 'Suspicious path access attempt');
    return new NextResponse('Not Found', { status: 404 });
  }

  // Block suspicious user agents (except for API routes)
  if (!pathname.startsWith('/api') && isSuspiciousUserAgent(userAgent)) {
    logSuspiciousActivity(request, 'Suspicious user agent blocked');
    return new NextResponse('Access Denied', { status: 403 });
  }

  // Check request size
  if (!checkRequestSize(request)) {
    return new NextResponse('Request Too Large', { status: 413 });
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(ip, pathname, request);
  if (!rateLimitResult.allowed) {
    const response = new NextResponse('Too Many Requests', { status: 429 });
    if (rateLimitResult.retryAfter) {
      response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
    }
    response.headers.set('X-RateLimit-Limit', getRateLimitConfig(pathname).maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    return response;
  }

  // Create response
  const response = NextResponse.next();

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', getRateLimitConfig(pathname).maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy (adjust based on your needs)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust as needed
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // Remove server information
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  // Apply throttling delay if needed (in a real scenario, this would need async handling)
  // Note: Edge middleware is synchronous, so we can't actually delay the response
  // Throttling info is tracked but actual delay should be handled at proxy/CDN level

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
