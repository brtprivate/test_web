# User Next.js App Security

## 🔒 Security Features Implemented

### 1. **DDoS Protection & Rate Limiting** (`middleware.ts`)
- **Rate Limiting**: Implements sliding window algorithm for request tracking
  - **General routes**: 100 requests per 15 minutes per IP
  - **Authentication endpoints**: 5 requests per 15 minutes per IP (stricter for login/register)
  - **API endpoints**: 60 requests per 15 minutes per IP
- **Automatic IP Blocking**: IPs exceeding rate limits are temporarily blocked for 30 minutes
- **Request Throttling**: Tracks throttling information (delay applied at proxy/CDN level)
- **Request Size Limits**: Maximum 10MB request size enforced
- **Memory Management**: Automatic cleanup of old tracking data to prevent memory leaks

### 2. **IP Blocking** (`middleware.ts`)
- **Permanent Blocklist**: Blocks known malicious IP addresses using Set for O(1) lookup
- **Temporary Blocking**: Automatically blocks IPs that exceed rate limits
- **Cloudflare Support**: Detects IP from Cloudflare headers (`cf-connecting-ip`)
- Currently blocking:
  - `67.217.57.240`
  - `2.57.122.173`

To add more IPs, edit `middleware.ts`:
```typescript
const BLOCKED_IPS = new Set([
  '67.217.57.240',
  '2.57.122.173',
  // Add more IPs here
]);
```

### 3. **Path Protection** (`middleware.ts`)
Blocks access to suspicious paths:
- Configuration files: `/.env`, `/.git`, `/.ssh`, `/.aws`, `/.docker`, `/.npmrc`
- Admin panels: `/wp-admin`, `/phpmyadmin`
- Credentials: `/config.json`, `/credentials`, `/.htaccess`, `/web.config`
- Development files: `/.vscode`, `/.idea`, `composer.json`, `package.json`, `yarn.lock`

### 4. **User Agent Validation** (`middleware.ts`)
Blocks suspicious user agents (comprehensive list):
- Scripts: `curl`, `wget`, `python-requests`, `go-http-client`
- Scanners: `scanner`, `bot`, `crawler`, `masscan`, `nmap`, `nikto`
- Security tools: `sqlmap`, `acunetix`, `burp`, `netsparker`, `nessus`
- Blocks requests without user agent

### 5. **Security Headers** (`middleware.ts` & `next.config.ts`)
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features (geolocation, microphone, camera, etc.)
- `X-DNS-Prefetch-Control: off` - Disables DNS prefetching
- `X-Download-Options: noopen` - Prevents file execution
- `X-Permitted-Cross-Domain-Policies: none` - Restricts cross-domain policies
- `Strict-Transport-Security` - Enforces HTTPS (HSTS)
- `Content-Security-Policy` - Comprehensive CSP policy
- Removed `X-Powered-By` and `Server` headers

### 6. **Rate Limit Headers**
- `X-RateLimit-Limit`: Maximum allowed requests
- `X-RateLimit-Remaining`: Remaining requests in current window
- `Retry-After`: Seconds until retry is allowed (on 429 response)

## 📊 Monitoring & Logging

All suspicious activities are logged with:
- Timestamp (ISO format)
- IP address
- Request method and path
- User agent
- Reason for blocking/rate limiting
- Additional context (request count, rate limit configuration, etc.)

Example log output:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "ip": "192.168.1.1",
  "method": "GET",
  "path": "/login",
  "userAgent": "curl/7.68.0",
  "reason": "Rate limit exceeded - IP temporarily blocked for 30 minutes",
  "requestsCount": 101,
  "maxRequests": 5
}
```

## ⚙️ Configuration

### Rate Limiting Configuration
Edit `middleware.ts` to adjust rate limits:

```typescript
const RATE_LIMIT_CONFIG = {
  general: { windowMs: 15 * 60 * 1000, maxRequests: 100 },
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  api: { windowMs: 15 * 60 * 1000, maxRequests: 60 },
};
```

### Temporary Block Duration
```typescript
const TEMP_BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes
```

### Request Size Limit
```typescript
const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
```

## ⚠️ Important Notes

1. **In-Memory Storage**: Rate limiting uses in-memory Maps, which means:
   - Data is lost on server restart (Edge Runtime limitation)
   - Each edge function instance has its own tracking
   - For persistent rate limiting, use external services (Redis, Upstash, etc.)

2. **Edge Runtime Limitations**: 
   - Cannot use Node.js modules or file system
   - Stateless by default
   - Memory is limited per edge function

3. **Production Recommendations**:
   - Use a CDN/proxy (Cloudflare, AWS CloudFront) with rate limiting
   - Implement persistent rate limiting with Redis/Upstash
   - Use a WAF (Web Application Firewall) for additional protection
   - Monitor logs with centralized logging service (Datadog, LogRocket, etc.)

4. **Environment Variables**: Never commit `.env` files

5. **Regular Updates**: Keep Next.js and dependencies updated

6. **Monitoring**: Review logs regularly for new attack patterns

## 🚀 Production Best Practices

1. **CDN/Proxy Layer**:
   - Use Cloudflare, AWS CloudFront, or similar
   - Enable DDoS protection at CDN level
   - Configure rate limiting at proxy level
   - Use geo-blocking if needed

2. **Persistent Rate Limiting**:
   - Consider using Upstash Redis (Edge-compatible)
   - Or implement rate limiting at API gateway level
   - Use database-backed IP blocking for persistent blocks

3. **Monitoring & Alerting**:
   - Set up alerts for rate limit violations
   - Monitor suspicious activity patterns
   - Track blocked IPs and attack patterns
   - Use services like Sentry, Datadog, or LogRocket

4. **SSL/HTTPS**:
   - Always use HTTPS in production
   - Configure HSTS headers (already included)
   - Use strong TLS configurations

5. **Additional Security Layers**:
   - Implement CAPTCHA for login/registration
   - Use 2FA for user accounts
   - Regular security audits
   - Penetration testing

## 🔍 Testing Rate Limits

To test rate limiting:
1. Make multiple requests from the same IP
2. Check response headers: `X-RateLimit-Remaining` decreases with each request
3. After exceeding limit, receive `429 Too Many Requests`
4. Check logs for automatic IP blocking messages
5. Verify temporary block expires after configured duration

## 📝 Response Codes

- `200 OK`: Request allowed
- `403 Forbidden`: IP blocked or suspicious user agent/path
- `404 Not Found`: Suspicious path access attempt
- `413 Payload Too Large`: Request exceeds size limit
- `429 Too Many Requests`: Rate limit exceeded
