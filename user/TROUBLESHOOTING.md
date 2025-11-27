# Troubleshooting Connection Errors

## Connection Refused Error

Agar aapko `ERR_CONNECTION_REFUSED` error aa raha hai, to yeh steps follow karein:

### Step 1: Check Server is Running

Server folder me jao aur server start karo:

```bash
cd server
pnpm dev
```

Server successfully start hone par aapko terminal me dikhega:
```
🚀 Server is running on http://0.0.0.0:5000
🌐 API URL: http://localhost:5000/api
```

### Step 2: Verify Server Port

Server ka port check karo. Default port 3000 hai, lekin agar aapne PORT environment variable set kiya hai to woh use hoga.

Server me check karo:
- `server/.env` file me `PORT=5000` (agar set hai)
- Ya `server/src/index.ts` me default port

### Step 3: Set Correct API URL

User app me `.env.local` file create/update karo:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Important:** Port number server ke port se match hona chahiye!

### Step 4: Test Server Connection

Browser me directly test karo:
```
http://localhost:5000/health
```

Agar server running hai, to response aayega:
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "..."
}
```

### Step 5: Common Issues

#### Issue 1: Port Mismatch
- Server: Port 5000
- User App: Port 3000
- **Solution:** `.env.local` me correct port set karo

#### Issue 2: Server Not Running
- **Solution:** Server start karo: `cd server && pnpm dev`

#### Issue 3: CORS Error
- Server me CORS already enabled hai
- Agar issue ho, check `server/src/index.ts` me CORS config

#### Issue 4: Firewall Blocking
- Windows Firewall ya antivirus connection block kar sakta hai
- **Solution:** Firewall me exception add karo

### Step 6: Verify Environment Variables

User folder me `.env.local` file check karo:

```env
# Correct format
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Wrong formats (don't use):
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/  (trailing slash)
# NEXT_PUBLIC_API_URL=localhost:5000/api          (missing http://)
```

### Step 7: Restart Both Apps

1. Server restart karo
2. User app restart karo (Ctrl+C then `pnpm dev`)

### Quick Check Commands

```bash
# Check if server is running
curl http://localhost:5000/health

# Or in browser
# Open: http://localhost:5000/health

# Check environment variable
# In user/.env.local file
cat .env.local
```

### Still Not Working?

1. **Check Console Logs:**
   - Browser console me detailed error messages check karo
   - Server terminal me errors check karo

2. **Verify Network:**
   - Same machine par dono apps chal rahe hain?
   - Agar different machines par hain, to IP address use karo

3. **Check Port Availability:**
   - Port already use ho raha hai kya?
   - `netstat -ano | findstr :5000` (Windows)
   - `lsof -i :5000` (Mac/Linux)

### Default Ports

- **Server Default:** 3000
- **User App Default:** 3001 (Next.js automatically next available port)

Agar aapne server port change kiya hai, to user app me bhi update karna hoga!








