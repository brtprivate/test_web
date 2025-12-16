# Security Implementation Guide

This document outlines the comprehensive security measures implemented to protect the application from attacks.

## 🔒 Security Features Implemented

### 1. **Rate Limiting**
- **General Rate Limiter**: 100 requests per 15 minutes per IP
- **Auth Rate Limiter**: 5 login attempts per 15 minutes per IP (stricter for authentication)
- **Admin Rate Limiter**: 30 requests per 15 minutes per IP (stricter for admin endpoints)
- **Speed Limiter**: Slows down requests after 50 requests in 15 minutes

### 2. **IP Blocking**
- Blocks known malicious IP addresses
- Currently blocking:
  - `67.217.57.240` (known attacker)
  - `2.57.122.173` (known attacker)
- Easy to add more IPs to the blocklist in `security.middleware.ts`

### 3. **User Agent Validation**
- Blocks suspicious user agents (curl, wget, python-requests, etc.)
- Logs suspicious user agents for monitoring
- More lenient for API endpoints but still logs suspicious activity

### 4. **Path Validation**
- Blocks access to suspicious paths:
  - `/.env`, `/.git`, `/.ssh`
  - `/admin`, `/wp-admin`, `/phpmyadmin`
  - `/.aws`, `/.docker`, `/.npmrc`
  - `/config.json`, `/credentials`

### 5. **Input Validation & Sanitization**
- **Express Validator**: Validates all input data
- **MongoDB Injection Protection**: Sanitizes input to prevent NoSQL injection
- **XSS Protection**: Sanitizes strings to remove dangerous characters
- **Type Validation**: Validates data types (email, numbers, MongoDB IDs, etc.)

### 6. **Enhanced Authentication**
- Token format validation
- Token payload structure validation
- MongoDB ObjectId format validation
- User/admin verification with database checks
- Suspicious activity logging for failed authentication attempts

### 7. **Security Headers**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restrictions
- Removes `X-Powered-By` header

### 8. **Request Size Limits**
- Maximum request size: 10MB
- Prevents large payload attacks

### 9. **Security Logging**
- Logs all suspicious activities:
  - Blocked IPs
  - Suspicious user agents
  - Failed authentication attempts
  - MongoDB injection attempts
  - Rate limit violations
  - Invalid token attempts
- All logs include:
  - Timestamp
  - IP address
  - Request method and path
  - User agent
  - Reason for logging

### 10. **CORS Configuration**
- Configured with proper origin handling
- Supports credentials when needed
- Restricted HTTP methods

## 📁 Files Modified/Created

### New Security Files:
- `server/src/middleware/security.middleware.ts` - All security middleware
- `server/src/middleware/validation.middleware.ts` - Input validation rules
- `server/SECURITY.md` - This documentation

### Enhanced Files:
- `server/src/index.ts` - Added all security middleware
- `server/src/middleware/auth.middleware.ts` - Enhanced with security checks
- `server/src/middleware/admin.middleware.ts` - Enhanced with security checks
- All route files - Added rate limiting and validation

## 🛡️ Route Protection

### Admin Routes (`/api/admin/*`)
- Strict rate limiting (30 requests/15min)
- Enhanced authentication with token validation
- Input validation for all endpoints
- Suspicious activity logging

### User Routes (`/api/auth/*`, `/api/users/*`, etc.)
- Rate limiting (100 requests/15min general, 5/15min for auth)
- Input validation
- Authentication required for protected routes
- Suspicious activity logging

### Public Routes
- Health check endpoint (`/health`) - minimal protection
- Rate limiting still applies
- Path validation still applies

## 🔧 Configuration

### Adding Blocked IPs
Edit `server/src/middleware/security.middleware.ts`:
```typescript
const BLOCKED_IPS: string[] = [
  '67.217.57.240',
  '2.57.122.173',
  // Add more IPs here
];
```

### Adjusting Rate Limits
Edit rate limiter configurations in `server/src/middleware/security.middleware.ts`:
```typescript
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Adjust this value
  // ...
});
```

### Adding Suspicious Paths
Edit `server/src/middleware/security.middleware.ts`:
```typescript
const SUSPICIOUS_PATHS: string[] = [
  '/.env',
  // Add more paths here
];
```

## 📊 Monitoring

All suspicious activities are logged to the console with the format:
```json
{
  "timestamp": "2025-12-14T20:47:30.000Z",
  "ip": "67.217.57.240",
  "method": "GET",
  "path": "/.env",
  "userAgent": "curl/7.68.0",
  "reason": "Suspicious path access attempt"
}
```

**Recommendation**: In production, send these logs to:
- A centralized logging service (e.g., Loggly, Papertrail)
- A security monitoring system
- A database for analysis

## ⚠️ Important Notes

1. **Environment Variables**: Never commit `.env` files. Use environment variables for all sensitive data.

2. **Regular Updates**: Keep all dependencies updated to patch security vulnerabilities.

3. **Monitoring**: Regularly review security logs to identify new attack patterns.

4. **IP Blocking**: The current IP blocklist is based on the attack logs you provided. Monitor logs and add more IPs as needed.

5. **Rate Limits**: Adjust rate limits based on your application's usage patterns. Too strict limits may affect legitimate users.

6. **SSL/TLS**: Ensure your production server uses HTTPS to encrypt all traffic.

## 🚀 Next Steps (Recommended)

1. **Set up proper logging**: Send security logs to a monitoring service
2. **Add CAPTCHA**: For login endpoints to prevent automated attacks
3. **Implement 2FA**: Two-factor authentication for admin accounts
4. **Add IP whitelisting**: For admin endpoints (optional but recommended)
5. **Regular security audits**: Review and update security measures regularly
6. **Backup strategy**: Ensure regular backups of database and critical data

## 📝 Testing Security

To test if security is working:

1. **Rate Limiting**: Make multiple rapid requests - should get 429 error
2. **IP Blocking**: Try accessing from a blocked IP - should get 403 error
3. **Path Validation**: Try accessing `/.env` - should get 404 error
4. **Input Validation**: Send invalid data - should get 400 error with validation details

## 🔐 Security Best Practices Applied

✅ Rate limiting on all endpoints
✅ Input validation and sanitization
✅ MongoDB injection protection
✅ XSS protection
✅ Security headers
✅ Request size limits
✅ IP blocking
✅ User agent validation
✅ Path validation
✅ Enhanced authentication
✅ Security logging
✅ Error handling without exposing sensitive information

