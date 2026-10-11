# LEIRS Email Notification Service

**Supabase Edge Function + Resend Integration**

This Edge Function provides email notification capabilities for the LEIRS system using [Resend](https://resend.com/) as the email service provider.

## 📋 Prerequisites

1. **Supabase CLI** installed
   ```powershell
   npm install -g supabase
   ```

2. **Resend Account** (free tier: 100 emails/day)
   - Sign up at https://resend.com/
   - Get your API key from https://resend.com/api-keys

3. **Supabase Project** linked
   ```powershell
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref YOUR_PROJECT_REF
   ```

## 🚀 Deployment Steps (5 minutes)

### Step 1: Set Secrets in Supabase

```powershell
# Navigate to backend directory
cd leirs-backend

# Set Resend API key
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here

# Set from email (must be verified domain in Resend)
supabase secrets set FROM_EMAIL="LEIRS System <noreply@yourdomain.com>"
```

**Note:** For testing, you can use `onboarding@resend.dev` as FROM_EMAIL (Resend's test domain).

### Step 2: Deploy the Function

```powershell
# Deploy without JWT verification (handled by CORS)
supabase functions deploy send-email --no-verify-jwt
```

Expected output:
```
Deploying Function send-email...
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email
```

### Step 3: Update Frontend Environment

Add the function URL to `leirs-frontend/.env`:

```env
VITE_EMAIL_API_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email
# No VITE_EMAIL_API_KEY needed (function handles authentication)
```

## 🧪 Testing

### Test via curl (PowerShell)

```powershell
$body = @{
    to = "test@example.com"
    subject = "Test Email from LEIRS"
    body = "This is a test email from the LEIRS notification system."
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Test via Frontend Hook

In any React component:

```javascript
import useComplainantEmail from '../hooks/useComplainantEmail'

const MyComponent = () => {
  const { sendIncidentForwarded, sending, error } = useComplainantEmail(incidentId)
  
  const handleSendEmail = async () => {
    const result = await sendIncidentForwarded('complainant@example.com')
    if (result.error) {
      console.error('Failed to send email:', result.error)
    } else {
      console.log('Email sent successfully!')
    }
  }
  
  return <button onClick={handleSendEmail} disabled={sending}>Send Email</button>
}
```

## 📧 Email Templates Available

The `useComplainantEmail` hook provides 5 predefined templates:

1. **Incident Forwarded** - `sendIncidentForwarded(email)`
2. **Summons Issued** - `sendSummonsIssued(email)`
3. **Hearing Scheduled** - `sendHearingScheduled(email, hearingDetails)`
4. **Mediation Scheduled** - `sendMediationScheduled(email, mediationDetails)`
5. **Case Resolved** - `sendCaseResolved(email, resolutionDetails)`
6. **Custom Email** - `sendCustom(email, subject, body)`

## 🔒 Security

- **CORS:** Wide-open (`*`) for MVP, restrict to your domain in production
- **No JWT verification:** Function is public but rate-limited by Supabase
- **API key:** Stored as Supabase secret, never exposed to frontend
- **Validation:** Email format, required fields checked in function

## 🚨 Production Checklist

Before going live:

- [ ] Set up custom domain in Resend and verify DNS
- [ ] Update `FROM_EMAIL` to use verified domain
- [ ] Restrict CORS to your production domain only
- [ ] Enable Supabase function rate limiting
- [ ] Upgrade Resend plan if sending >100 emails/day
- [ ] Add email logging/audit trail in database
- [ ] Test all 5 email templates thoroughly
- [ ] Add retry mechanism for failed emails

## 📊 Monitoring

### View Function Logs

```powershell
supabase functions logs send-email --follow
```

### Check Resend Dashboard

- Delivery status: https://resend.com/emails
- Analytics: https://resend.com/analytics
- Bounce/complaint handling: https://resend.com/settings/webhooks

## 🛠️ Troubleshooting

### Error: "RESEND_API_KEY not configured"
- Check secrets: `supabase secrets list`
- Re-set the key: `supabase secrets set RESEND_API_KEY=re_...`

### Error: "Email not verified"
- Use `onboarding@resend.dev` for testing
- For production, verify your domain in Resend

### Error: "Function not found"
- Verify deployment: `supabase functions list`
- Check project link: `supabase projects list`

### Emails not arriving
- Check spam folder
- View logs: `supabase functions logs send-email`
- Check Resend dashboard for delivery status

## 💰 Cost Estimate

- **Supabase Edge Functions:** Free tier (500K invocations/month)
- **Resend Free Tier:** 100 emails/day, 3,000/month
- **Resend Pro Plan:** $20/month for 50,000 emails/month

**Total for MVP:** $0/month (using free tiers)

## 📝 Notes

- Emails are sent synchronously (may add queue in future)
- No retry mechanism yet (add if needed)
- Plain text emails with basic HTML formatting
- Designed for transactional emails, not marketing
