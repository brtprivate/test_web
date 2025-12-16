# User Next.js App Security

## 🔒 Security Features Implemented

### 1. **Middleware Protection** (`middleware.ts`)
- **IP Blocking**: Blocks known malicious IP addresses
- **Path Validation**: Blocks access to suspicious paths (`.env`, `.git`, `.ssh`, etc.)
- **User Agent Validation**: Blocks suspicious user agents (curl, wget, scanners, etc.)
- **Security Logging**: Logs all suspicious activities

### 2. **Security Headers** (`next.config.ts`)
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Permissions-Policy` - Restricts browser features
- `X-DNS-Prefetch-Control: off` - Disables DNS prefetching
- `X-Download-Options: noopen` - Prevents file execution
- `X-Permitted-Cross-Domain-Policies: none` - Restricts cross-domain policies
- Removed `X-Powered-By` header

### 3. **Blocked IPs**
Currently blocking:
- `67.217.57.240`
- `2.57.122.173`

To add more IPs, edit `middleware.ts`:
```typescript
const BLOCKED_IPS: string[] = [
  '67.217.57.240',
  '2.57.122.173',
  // Add more IPs here
];
```

### 4. **Blocked Paths**
- `/.env`, `/.git`, `/.ssh`
- `/wp-admin`, `/phpmyadmin`
- `/.aws`, `/.docker`, `/.npmrc`
- `/config.json`, `/credentials`
- `/.htaccess`, `/web.config`

### 5. **Blocked User Agents**
- `curl`, `wget`, `python-requests`
- `Go-http-client`, `scanner`, `bot`
- `crawler`, `masscan`, `nmap`

## 📊 Monitoring

All suspicious activities are logged with:
- Timestamp
- IP address
- Request method and path
- User agent
- Reason for blocking

## ⚠️ Important Notes

1. **Environment Variables**: Never commit `.env` files
2. **Regular Updates**: Keep Next.js and dependencies updated
3. **Monitoring**: Review logs regularly for new attack patterns
4. **IP Blocking**: Add more IPs as you identify attackers

## 🚀 Production Recommendations

1. Use a reverse proxy (nginx/Apache) for additional security
2. Enable HTTPS/SSL certificates
3. Set up rate limiting at the reverse proxy level
4. Use a WAF (Web Application Firewall)
5. Monitor logs with a centralized logging service

