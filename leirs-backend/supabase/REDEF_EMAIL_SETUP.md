# LEIRS Email Notifications - REDEF Demo Setup

**Quick setup guide for REDEF demonstration - 15 minutes**

---

## 📧 What You'll Get

**4 Essential Email Notifications:**

1. ✉️ **Incident Submitted** - Confirmation when incident is reported
2. ✉️ **Status Update** - Notification when case status changes
3. ✉️ **Mediation Scheduled** - Notification with date/time/mediator
4. ✉️ **Resolution Completed** - Final notification when case is closed

---

## 🚀 Quick Setup (15 Minutes)

### Prerequisites

1. **Supabase CLI** - Install globally
   ```powershell
   npm install -g supabase
   ```

2. **Resend Account** - Free tier (100 emails/day)
   - Sign up: https://resend.com/
   - Get API key: https://resend.com/api-keys
   - Use test domain: `onboarding@resend.dev` (no verification needed)

3. **Your Supabase Project**
   - Get project ref from: Dashboard > Settings > General

---

## 📝 Step-by-Step Commands

### 1. Navigate to Backend

```powershell
cd leirs-backend
```

### 2. Login to Supabase

```powershell
supabase login
```

This will open your browser for authentication.

### 3. Link Your Project

```powershell
# Replace with your actual project reference ID
supabase link --project-ref kyvhyhmqwcxbloiliojw
```

### 4. Set Email Secrets

```powershell
# Set your Resend API key (from resend.com/api-keys)
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here

# Set from email (use test domain for demo)
supabase secrets set FROM_EMAIL="LEIRS Barangay <onboarding@resend.dev>"
```

**Important:** Replace `re_your_actual_api_key_here` with your real Resend API key!

### 5. Deploy the Edge Function

```powershell
supabase functions deploy send-email --no-verify-jwt
```

**Expected Output:**
```
Deploying Function send-email...
✓ Function deployed successfully
Function URL: https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email
```

**📋 COPY THE FUNCTION URL - You'll need it in the next step!**

### 6. Update Frontend Environment

Edit `leirs-frontend/.env` and update:

```env
VITE_EMAIL_API_URL=https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email
```

Replace with YOUR actual function URL from step 5.

### 7. Restart Frontend Dev Server

```powershell
# Open new terminal
cd ..\leirs-frontend
npm run dev
```

---

## 🧪 Test Email Delivery

### Quick Test via PowerShell

```powershell
# Test email function
$testBody = @{
    to = "your-email@example.com"
    subject = "LEIRS Test Email"
    body = "Testing REDEF email notifications. If you receive this, setup is successful!"
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
  "message": "Email sent successfully",
  "id": "abc123-def456"
}
```

**✅ Check your inbox!** (Also check spam folder)

---

## 📊 REDEF Demo Scenarios

### Scenario 1: Incident Submission

**Action:** Create new incident with complainant email

**Expected Email:**
```
Subject: LEIRS: Incident Report Received - INC-2024-1115-001

Dear Juan Dela Cruz,

Thank you for submitting your incident report to the LEIRS system.

Your Incident Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference Number: INC-2024-1115-001
Incident Type: Noise Disturbance
Location: Purok 1
Status: Pending
Date Reported: November 15, 2024
...
```

### Scenario 2: Status Change

**Action:** Update incident status from "Pending" → "Under Investigation"

**Expected Email:**
```
Subject: LEIRS: Status Update - INC-2024-1115-001

Dear Juan Dela Cruz,

The status of your incident report has been updated.

Status Update:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Previous Status: Pending
Current Status: Under Investigation
Updated: November 15, 2024, 2:30 PM
...
```

### Scenario 3: Mediation Scheduled

**Action:** Schedule mediation session with date/time/mediator

**Expected Email:**
```
Subject: LEIRS: Lupon Mediation Scheduled - INC-2024-1115-001

Dear Juan Dela Cruz,

A formal mediation session has been scheduled for your case.

Mediation Details:
- Date: November 20, 2024
- Mediator: Hon. Maria Santos
...
```

### Scenario 4: Case Resolved

**Action:** Mark case as resolved with resolution notes

**Expected Email:**
```
Subject: LEIRS: Case Resolution - INC-2024-1115-001

Dear Juan Dela Cruz,

Your case has been resolved and officially closed.

Resolution Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Parties reached amicable settlement through mediation.
...
```

---

## 🔧 Troubleshooting

### Issue: "RESEND_API_KEY not configured"

**Check secrets:**
```powershell
supabase secrets list
```

**Re-set if missing:**
```powershell
supabase secrets set RESEND_API_KEY=re_your_key
```

### Issue: Email not delivered

**Checklist:**
1. ✅ Check spam/junk folder
2. ✅ Verify function logs: `supabase functions logs send-email`
3. ✅ Check Resend dashboard: https://resend.com/emails
4. ✅ Confirm FROM_EMAIL uses `onboarding@resend.dev` for testing

### Issue: "Function not found"

**Verify deployment:**
```powershell
supabase functions list
```

**Re-deploy if needed:**
```powershell
supabase functions deploy send-email --no-verify-jwt
```

### Issue: Frontend not sending emails

**Checklist:**
1. ✅ Verify `VITE_EMAIL_API_URL` in `.env`
2. ✅ Restart frontend dev server
3. ✅ Check browser console for errors
4. ✅ Verify incident has `complainant_email` field filled

---

## 📈 View Logs & Analytics

### Real-time Function Logs

```powershell
supabase functions logs send-email --follow
```

### Resend Dashboard

- **All emails:** https://resend.com/emails
- **Analytics:** https://resend.com/analytics  
- **API keys:** https://resend.com/api-keys

---

## ✅ REDEF Demo Checklist

Before demonstration:

- [ ] Supabase Edge Function deployed successfully
- [ ] Test email sent and received
- [ ] Frontend `.env` updated with function URL
- [ ] Dev server restarted
- [ ] Test incident has complainant email
- [ ] All 4 email scenarios tested:
  - [ ] Incident submission confirmation
  - [ ] Status update notification
  - [ ] Mediation schedule notification
  - [ ] Resolution completed notification
- [ ] Email formatting looks professional
- [ ] Emails not landing in spam

---

## 💰 Cost for Demo

**Total: $0/month**

- Supabase Edge Functions: FREE (500K invocations/month)
- Resend Free Tier: FREE (100 emails/day, 3,000/month)

Perfect for REDEF demonstration with zero infrastructure costs!

---

## 🎯 Next Steps After REDEF

If approved for production:

1. **Verify Custom Domain** in Resend
   - Add your barangay domain
   - Update `FROM_EMAIL` to use verified domain
   
2. **Restrict CORS** in Edge Function
   - Update to allow only your production domain
   
3. **Upgrade Resend Plan** (if needed)
   - Pro plan: $20/month for 50,000 emails
   
4. **Add Email Audit Trail**
   - Log all sent emails in database
   - Track delivery status

---

## 📚 Files Reference

- **Edge Function:** `leirs-backend/supabase/functions/send-email/index.ts`
- **Email Hook:** `leirs-frontend/src/hooks/useComplainantEmail.js`
- **Environment:** `leirs-frontend/.env`

---

## ⏱️ Total Setup Time

- **First-time setup:** 15-20 minutes
- **Subsequent deployments:** 2-3 minutes
- **Testing all scenarios:** 10 minutes

---

## 🎉 Success Indicators

✅ Edge Function deployed without errors  
✅ Test email received in inbox  
✅ Frontend shows no console errors  
✅ All 4 email templates work correctly  
✅ Emails formatted professionally  
✅ Zero infrastructure costs  

**Your LEIRS system now has professional email notifications! 🚀**

---

**Questions?** Check function logs: `supabase functions logs send-email`
