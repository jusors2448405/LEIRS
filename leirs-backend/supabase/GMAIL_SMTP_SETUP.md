# LEIRS Email Notification - Gmail SMTP Setup Guide

**Switched from Resend to Gmail SMTP for email delivery**

---

## 📧 Gmail SMTP Configuration

### Prerequisites

1. **Gmail Account** for LEIRS notifications
   - Recommended: Create dedicated account (e.g., `leirs.notifications@gmail.com`)
   - Do NOT use personal Gmail account

2. **Google App Password** (NOT your regular Gmail password)
   - Required for SMTP authentication
   - More secure than using account password

---

## 🔐 Step 1: Create Gmail App Password

### A. Enable 2-Step Verification (Required)

1. Go to: https://myaccount.google.com/security
2. Click **"2-Step Verification"**
3. Click **"Get started"**
4. Follow prompts to enable 2FA using your phone

### B. Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. If prompted, sign in again
3. Under "Select app", choose **"Mail"**
4. Under "Select device", choose **"Other (Custom name)"**
5. Enter: **"LEIRS Supabase Function"**
6. Click **"Generate"**
7. **COPY THE 16-CHARACTER PASSWORD** (e.g., `abcd efgh ijkl mnop`)
8. **IMPORTANT:** Remove spaces when using (becomes: `abcdefghijklmnop`)

---

## 🚀 Step 2: Deploy Edge Function with Gmail

### Set Supabase Secrets

```powershell
# Navigate to backend directory
cd leirs-backend

# Set Gmail user (your LEIRS notification Gmail address)
supabase secrets set GMAIL_USER=leirs.notifications@gmail.com

# Set Gmail app password (16-character password WITHOUT spaces)
supabase secrets set GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**IMPORTANT:** 
- Use the **full Gmail address** for GMAIL_USER
- Use the **app password** (NOT your regular Gmail password)
- Remove all spaces from the app password

### Deploy Function

```powershell
# Deploy the updated function
supabase functions deploy send-email --no-verify-jwt
```

Expected output:
```
Deploying Function send-email...
✓ Function deployed successfully
Function URL: https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email
```

---

## 🧪 Step 3: Test Gmail SMTP

### Test via PowerShell

```powershell
$testBody = @{
    to = "your-test-email@example.com"
    subject = "LEIRS Gmail SMTP Test"
    body = "Testing Gmail SMTP integration. If you receive this, the setup is working!"
} | ConvertTo-Json

$functionUrl = "https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email"

Invoke-RestMethod `
  -Uri $functionUrl `
  -Method POST `
  -ContentType "application/json" `
  -Body $testBody
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email sent successfully via Gmail SMTP"
}
```

**Check:**
1. Email received in test inbox
2. Check spam folder if not in inbox
3. Sender should show: `leirs.notifications@gmail.com`

---

## 📊 Verify Deployment

### Check Secrets

```powershell
# List all secrets
supabase secrets list

# Should show:
# - GMAIL_USER
# - GMAIL_APP_PASSWORD
```

### Check Function Logs

```powershell
# View real-time logs
supabase functions logs send-email --follow
```

### Test from Frontend

1. Go to: `/incident-admin/new-incident`
2. Fill form with email address
3. Submit incident
4. Check console for email confirmation
5. Check email inbox

---

## 🔧 Configuration Details

### Gmail SMTP Settings (Used by Edge Function)

```typescript
SMTP Server: smtp.gmail.com
Port: 465 (SSL/TLS)
Authentication: GMAIL_USER + GMAIL_APP_PASSWORD
From Address: GMAIL_USER (e.g., leirs.notifications@gmail.com)
To Address: Complainant email from request
```

### Email Format

- **Sender:** Your Gmail address (GMAIL_USER)
- **Recipient:** Complainant email (from form)
- **Content:** HTML formatted (line breaks converted)
- **Character Set:** UTF-8

---

## 📝 Frontend Configuration

**No changes needed!** The frontend `.env` remains the same:

```env
VITE_EMAIL_API_URL=https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email
```

The frontend doesn't need to know about Gmail credentials - they're securely stored in Supabase.

---

## 🚨 Troubleshooting

### Issue: "Gmail credentials not configured"

**Check secrets:**
```powershell
supabase secrets list
```

**Re-set if missing:**
```powershell
supabase secrets set GMAIL_USER=your-email@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=your-app-password
```

### Issue: "Username and Password not accepted"

**Causes:**
1. Using regular Gmail password instead of app password
2. 2-Step Verification not enabled
3. App password has spaces (remove them)
4. Wrong Gmail address

**Fix:**
1. Verify 2FA is enabled: https://myaccount.google.com/security
2. Generate new app password: https://myaccount.google.com/apppasswords
3. Remove ALL spaces from app password
4. Re-set secrets with correct values

### Issue: Email not received

**Check:**
1. Spam/junk folder
2. Gmail sent mail folder (confirms sent)
3. Function logs: `supabase functions logs send-email`
4. Recipient email address is valid

### Issue: "Connection timeout"

**Causes:**
- Network firewall blocking port 465
- Gmail SMTP temporarily unavailable

**Fix:**
- Check network connection
- Try again in a few minutes
- Verify port 465 is not blocked

---

## 📊 Gmail Sending Limits

### Free Gmail Account
- **Limit:** 500 emails per day
- **Rate:** ~20 emails per minute
- **Reset:** Daily at midnight Pacific Time

### Google Workspace Account (Recommended for Production)
- **Limit:** 2,000 emails per day
- **Rate:** Higher throughput
- **Cost:** ~$6/user/month

**For REDEF demo:** Free Gmail is sufficient (testing only)

**For Production:** Consider Google Workspace for higher limits

---

## 🔒 Security Best Practices

### ✅ DO:
- Use dedicated Gmail account for LEIRS
- Use app passwords (never regular password)
- Keep app password secret (stored in Supabase only)
- Rotate app passwords periodically
- Monitor sent mail for abuse

### ❌ DON'T:
- Use personal Gmail account
- Share app password
- Commit credentials to git
- Use regular Gmail password
- Expose credentials in frontend

---

## 📈 Monitoring

### View Sent Emails

1. Login to Gmail: https://mail.google.com/
2. Go to "Sent" folder
3. All emails sent via SMTP appear here

### Track Delivery

- **Success:** Email appears in Sent folder
- **Failure:** Check Edge Function logs
- **Bounce:** Gmail will receive bounce notification

### Edge Function Metrics

```powershell
# View function invocations
supabase functions logs send-email

# Shows:
# - Timestamp
# - Status (success/error)
# - Recipient email
# - Error messages (if any)
```

---

## 🔄 Migration from Resend

### What Changed:
- ❌ Removed: Resend API integration
- ❌ Removed: RESEND_API_KEY secret
- ❌ Removed: FROM_EMAIL secret
- ✅ Added: Gmail SMTP client
- ✅ Added: GMAIL_USER secret
- ✅ Added: GMAIL_APP_PASSWORD secret

### What Stayed the Same:
- ✅ Frontend code unchanged
- ✅ useComplainantEmail.js unchanged
- ✅ API request format unchanged
- ✅ Response format unchanged
- ✅ CORS support unchanged
- ✅ Non-blocking behavior unchanged

---

## ✅ Deployment Checklist

- [ ] Gmail account created (dedicated for LEIRS)
- [ ] 2-Step Verification enabled
- [ ] App password generated
- [ ] GMAIL_USER secret set in Supabase
- [ ] GMAIL_APP_PASSWORD secret set in Supabase
- [ ] Edge Function deployed successfully
- [ ] Test email sent via PowerShell
- [ ] Test email received in inbox
- [ ] Test from frontend form
- [ ] Function logs show success
- [ ] No errors in browser console

---

## 🎯 Quick Command Reference

```powershell
# Set secrets
supabase secrets set GMAIL_USER=leirs.notifications@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=abcdefghijklmnop

# Deploy function
supabase functions deploy send-email --no-verify-jwt

# Test
$body = @{to="test@example.com"; subject="Test"; body="Test"} | ConvertTo-Json
Invoke-RestMethod -Uri "YOUR_FUNCTION_URL" -Method POST -ContentType "application/json" -Body $body

# View logs
supabase functions logs send-email --follow

# List secrets
supabase secrets list
```

---

## 📞 Support

### Gmail Issues
- Google Account Help: https://support.google.com/accounts
- App Passwords Help: https://support.google.com/accounts/answer/185833

### Supabase Issues
- Functions Docs: https://supabase.com/docs/guides/functions
- Edge Functions: https://supabase.com/docs/guides/functions/quickstart

---

## 🎉 Success Indicators

✅ Secrets set in Supabase  
✅ Edge Function deployed  
✅ Test email received  
✅ No errors in function logs  
✅ Gmail Sent folder shows email  
✅ Frontend console shows success  
✅ Complainant receives email  

**Gmail SMTP integration complete! 📧**
