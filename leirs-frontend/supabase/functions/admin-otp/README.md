# LEIRS Admin OTP Edge Function

## Overview

Secure OTP generation, storage, and verification for admin users.

## Features

- ✅ **Secure OTP Generation**: Random 6-digit codes
- ✅ **Server-Side Storage**: OTP never exposed to client
- ✅ **Expiration**: 5-minute validity period
- ✅ **Rate Limiting**: 3 requests per 10 minutes per email
- ✅ **Attempt Limiting**: 3 incorrect attempts before invalidation
- ✅ **One-Time Use**: OTP deleted after successful verification
- ✅ **Admin Verification**: Checks user role and status

## Actions

### 1. Generate OTP

**Request:**
```json
{
  "action": "generate",
  "email": "admin@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent to email",
  "expiresIn": 300,
  "remaining": 2,
  "dev_otp": "123456"  // ONLY in development
}
```

**Response (Rate Limited):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "resetIn": 420,
  "message": "Too many OTP requests. Please try again in 7 minutes."
}
```

### 2. Verify OTP

**Request:**
```json
{
  "action": "verify",
  "email": "admin@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "email": "admin@example.com"
}
```

**Response (Incorrect):**
```json
{
  "success": false,
  "error": "Incorrect OTP",
  "attemptsLeft": 2
}
```

**Response (Expired):**
```json
{
  "success": false,
  "error": "OTP has expired"
}
```

### 3. Resend OTP

**Request:**
```json
{
  "action": "resend",
  "email": "admin@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP resent to email",
  "expiresIn": 180,
  "dev_otp": "123456"  // ONLY in development
}
```

## Security Features

### In-Memory Storage
- OTPs stored in function memory (Map)
- Automatically cleared on expiration
- No database table required for capstone demo
- Production: Replace with Redis or database table

### Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 3 per email
- **Automatic Reset**: After 10 minutes
- **Cleanup**: Expired entries removed periodically

### OTP Security
- **Length**: 6 digits
- **Expiration**: 5 minutes
- **Max Attempts**: 3 incorrect attempts
- **One-Time Use**: Deleted after verification
- **Server-Only**: Never sent to client

### Admin Verification
- Checks email exists in `profiles` table
- Verifies role is one of 6 admin roles
- Confirms account status is 'Active'

## Testing Locally

### Start Supabase Functions
```bash
cd leirs-frontend
npx supabase functions serve admin-otp --env-file .env.local
```

### Test Generate OTP
```bash
curl -X POST http://localhost:54321/functions/v1/admin-otp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "email": "leirs.admin@gmail.com"
  }'
```

### Test Verify OTP
```bash
curl -X POST http://localhost:54321/functions/v1/admin-otp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "verify",
    "email": "leirs.admin@gmail.com",
    "otp": "123456"
  }'
```

### Test Resend OTP
```bash
curl -X POST http://localhost:54321/functions/v1/admin-otp \
  -H "Content-Type: application/json" \
  -d '{
    "action": "resend",
    "email": "leirs.admin@gmail.com"
  }'
```

## Development Mode

In development (`ENVIRONMENT !== 'production'`):
- OTP is returned in `dev_otp` field
- OTP is logged to console
- Easier testing and debugging

**⚠️ Production Mode**: `dev_otp` field removed, OTP only sent via email

## Environment Variables

Required in `.env.local`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=development  # or 'production'
```

## Deployment

```bash
cd leirs-frontend
npx supabase functions deploy admin-otp
```

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid email format | Email validation failed |
| 400 | Invalid OTP format | OTP must be 6 digits |
| 400 | Invalid action | Action must be generate/verify/resend |
| 401 | Incorrect OTP | Wrong OTP code entered |
| 403 | User is not an admin | User role not in admin roles |
| 403 | User account is not active | Account status is Inactive |
| 403 | Too many incorrect attempts | Max 3 wrong attempts reached |
| 404 | User not found | Email doesn't exist in profiles |
| 404 | No OTP found | No active OTP for email |
| 410 | OTP has expired | OTP older than 5 minutes |
| 429 | Rate limit exceeded | More than 3 requests in 10 minutes |
| 500 | Internal server error | Server error |

## Integration with Login.jsx

**Step 1: Generate OTP**
```javascript
const response = await supabase.functions.invoke('admin-otp', {
  body: { action: 'generate', email: userEmail }
})

if (response.data.success) {
  console.log('OTP sent!')
  // Show OTP input UI
}
```

**Step 2: Verify OTP**
```javascript
const response = await supabase.functions.invoke('admin-otp', {
  body: { action: 'verify', email: userEmail, otp: userOTP }
})

if (response.data.success) {
  console.log('OTP verified!')
  // Complete login flow
}
```

**Step 3: Resend OTP**
```javascript
const response = await supabase.functions.invoke('admin-otp', {
  body: { action: 'resend', email: userEmail }
})

if (response.data.success) {
  console.log('OTP resent!')
}
```

## Production Considerations

### Email Sending
Current implementation logs OTP to console. For production:
1. Implement `sendOTPEmail()` function
2. Use Supabase Auth email or custom SMTP
3. Remove `dev_otp` from response
4. Set `ENVIRONMENT=production`

### Storage
Current: In-memory Map (sufficient for capstone)
Production options:
1. Redis for distributed deployment
2. Database table `admin_otp_temp` with auto-cleanup
3. Supabase Realtime for session management

### Monitoring
Add logging:
- OTP generation events
- Failed verification attempts
- Rate limit triggers
- Expired OTP cleanup

## License

Part of LEIRS Capstone Project - Barangay 178, Camarin
