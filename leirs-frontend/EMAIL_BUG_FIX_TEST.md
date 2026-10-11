# Email Bug Fix - Testing Checklist

## 🐛 Bug Fixed

**Issue:** Email notifications not sending on incident submission (no Edge Function invocation).

**Root Cause:** React hook initialized with `createdIncidentId = null`, never refetched incident data.

**Solution:** Pass incident data directly to email function instead of refetching.

---

## ✅ Testing Steps

### 1. Restart Dev Server (REQUIRED)

```powershell
# Stop current dev server (Ctrl+C)
# Then restart
cd leirs-frontend
npm run dev
```

**Why:** Vite needs restart to pick up .env variables.

---

### 2. Open Browser Console

- Open DevTools (F12)
- Go to Console tab
- Keep it open during testing

---

### 3. Test: Submit Incident WITH Email

**Steps:**
1. Go to: http://localhost:5173/report-incident
2. Fill form completely
3. **Add email address:** e.g., `test@example.com`
4. Click "Submit Report"

**Expected Console Output:**
```
Attempting to send email to: test@example.com
Using incident data: { id: "...", incident_number: "LEIRS-2024-...", ... }
[useComplainantEmail] Starting email send to: test@example.com
[useComplainantEmail] Email API URL: https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email
[useComplainantEmail] Email payload: { to: "test@example.com", subject: "...", bodyLength: 650 }
[useComplainantEmail] Sending fetch request to: https://...
[useComplainantEmail] Response status: 200
[useComplainantEmail] Email sent successfully: { success: true, ... }
Confirmation email sent successfully to: test@example.com
```

**Expected UI:**
- ✅ Success page with incident number
- ✅ Green banner: "Confirmation email sent successfully! Check your inbox."

**Expected in Supabase:**
```powershell
# Check Edge Function logs
supabase functions logs send-email

# Should show new invocation with:
# - Status: 200
# - Execution time: ~500ms
```

**Expected in Resend:**
- Go to: https://resend.com/emails
- Should show new email with status "Delivered"

**Expected in Inbox:**
- Email subject: "LEIRS: Incident Report Received - [INCIDENT_NUMBER]"
- Email contains incident details

---

### 4. Test: Submit Incident WITHOUT Email

**Steps:**
1. Fill form completely
2. **Leave email field BLANK**
3. Click "Submit Report"

**Expected Console Output:**
```
No email provided, skipping email notification
```

**Expected UI:**
- ✅ Success page with incident number
- ❌ No email banner (expected)

**Expected Behavior:**
- ✅ Incident created successfully
- ✅ No error shown
- ✅ Workflow completed normally

---

### 5. Test: Email API Failure (Simulate)

**Steps:**
1. Edit `leirs-frontend/.env`
2. Change: `VITE_EMAIL_API_URL=https://invalid-url.com`
3. Restart dev server
4. Submit incident with email

**Expected Console Output:**
```
[useComplainantEmail] Fetch error: Failed to fetch
Email notification failed: Failed to send email.
```

**Expected UI:**
- ✅ Success page with incident number
- ⚠️ Yellow banner: "Note: Confirmation email could not be sent."

**Expected Behavior:**
- ✅ Incident created successfully (NOT blocked by email failure)
- ⚠️ Warning shown but workflow continues

**After Test:**
5. Restore `.env` to correct URL
6. Restart dev server

---

## 📊 Debug Console Messages

### Success Flow Messages

```
✅ Attempting to send email to: [email]
✅ Using incident data: { id, incident_number, complainant_name }
✅ [useComplainantEmail] Starting email send to: [email]
✅ [useComplainantEmail] Email API URL: https://...
✅ [useComplainantEmail] Email payload: { ... }
✅ [useComplainantEmail] Sending fetch request to: https://...
✅ [useComplainantEmail] Response status: 200
✅ [useComplainantEmail] Email sent successfully
✅ Confirmation email sent successfully to: [email]
```

### Failure Flow Messages

```
❌ [useComplainantEmail] Email API URL: undefined
❌ [useComplainantEmail] Email API URL not configured
```

OR

```
❌ [useComplainantEmail] Response status: 500
❌ [useComplainantEmail] Email API error: { ... }
❌ Email notification failed: Email API error: 500
```

---

## 🔍 Verification Checklist

- [ ] Dev server restarted
- [ ] Browser console open
- [ ] Test 1: Email sent successfully
  - [ ] Console shows complete flow
  - [ ] Green success banner shown
  - [ ] Edge Function log shows invocation
  - [ ] Email appears in Resend dashboard
  - [ ] Email received in inbox
- [ ] Test 2: Without email works
  - [ ] No error shown
  - [ ] Incident created
- [ ] Test 3: API failure handled gracefully
  - [ ] Incident still created
  - [ ] Yellow warning shown
  - [ ] No blocking error

---

## 🚨 If Issues Persist

### Issue: Console shows "Could not retrieve incident details"

**Fix:** Old error - should be gone with new code. Clear browser cache:
```
Ctrl + Shift + Delete → Clear cache → Reload page
```

### Issue: Console shows "Email API URL: undefined"

**Fix:** Environment variable not loaded
```powershell
# 1. Verify .env has correct URL
cat leirs-frontend\.env

# 2. Restart dev server (REQUIRED)
npm run dev
```

### Issue: Console shows "Failed to fetch" or "Network error"

**Possible causes:**
1. Edge Function not deployed
2. Wrong URL in .env
3. Network/CORS issue

**Fix:**
```powershell
# Check Edge Function is deployed
supabase functions list

# Should show: send-email (deployed)

# Test Edge Function directly
$body = @{to="test@example.com"; subject="Test"; body="Test"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email" -Method POST -ContentType "application/json" -Body $body
```

### Issue: Email not received (but console shows success)

**Check:**
1. Spam/junk folder
2. Resend dashboard: https://resend.com/emails
3. Email address typo
4. Resend API key valid

---

## 📝 Expected Email Content

```
Subject: LEIRS: Incident Report Received - LEIRS-2024-1115-001

Dear Juan Dela Cruz,

Thank you for submitting your incident report to the LEIRS system.

Your Incident Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference Number: LEIRS-2024-1115-001
Incident Type: Noise Complaint
Location: Purok 1
Status: Pending
Date Reported: November 15, 2024

Your report has been successfully recorded and will be reviewed by our team.

You can track your incident status anytime using your reference number: LEIRS-2024-1115-001

We will notify you of any updates or when further action is required.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Barangay LEIRS Team
Law Enforcement and Incident Reporting System

Note: Please keep your reference number for future correspondence.
```

---

## ✅ Success Criteria

All must be true:

- [x] Console shows complete email flow
- [x] Green success banner appears
- [x] Supabase Edge Function log shows invocation
- [x] Resend dashboard shows email sent
- [x] Email received in inbox with correct content
- [x] Incident creation never blocked by email issues

---

## 🎉 When All Tests Pass

**Status:** ✅ Email notification integration working correctly!

**Next Steps:**
1. Remove test incidents from database (if needed)
2. Ready for REDEF demonstration
3. Consider integrating emails into other workflows:
   - Status updates
   - Mediation scheduling
   - Case resolution

---

**Bug fixed! Test and verify. 🚀**
