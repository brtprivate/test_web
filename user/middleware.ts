import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Blocked IP addresses
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
  'masscan',
  'nmap',
];

// Suspicious paths to block
const SUSPICIOUS_PATHS: string[] = [
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
];

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Check if IP is blocked
 */
function isBlockedIp(ip: string): boolean {
  return BLOCKED_IPS.some((blockedIp) => ip.includes(blockedIp));
}

/**
 * Check if user agent is suspicious
 */
function isSuspiciousUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true; // Block requests without user agent
  const ua = userAgent.toLowerCase();
  return SUSPICIOUS_USER_AGENTS.some((suspicious) => ua.includes(suspicious));
}

/**
 * Check if path is suspicious
 */
function isSuspiciousPath(path: string): boolean {
  return SUSPICIOUS_PATHS.some((suspicious) => path.toLowerCase().includes(suspicious));
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  // Block suspicious IPs
  if (isBlockedIp(ip)) {
    logSuspiciousActivity(request, 'Blocked IP address');
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

  // Create response
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // Remove server information
  response.headers.delete('X-Powered-By');

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

