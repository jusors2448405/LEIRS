# Debug Console Output Guide

## 🔍 What to Look For

After adding extensive debugging, you should see this **exact sequence** in the browser console when submitting an incident with an email address.

---

## ✅ Expected Console Output (Success Flow)

```
=== FORM SUBMISSION STARTED ===
Form data: {type: "Noise Complaint", location: "Purok 1", reporterName: "Juan", reporterContact: "09123456789", reporterEmail: "test@example.com", ...}
reporterEmail field: test@example.com

=== EXTRACTED VALUES ===
complainantEmail: test@example.com
complainantName: Juan
incidentType: Noise Complaint

=== INCIDENT CREATED SUCCESSFULLY ===
Created incident data: {id: "abc-123-...", incident_number: "LEIRS-2024-...", incident_type: "Noise Complaint", ...}

=== EMAIL NOTIFICATION CHECK ===
complainantEmail value: test@example.com
complainantEmail type: string
complainantEmail length: 17
complainantEmail trimmed: test@example.com
Is email truthy? true

✅ Email condition passed - entering email block
Attempting to send email to: test@example.com
Using incident data: {id: "...", incident_number: "LEIRS-2024-...", incident_type: "Noise Complaint", ...}

📧 About to call sendIncidentSubmitted()
Email: test@example.com
Incident data: {id: "...", incident_number: "...", incident_type: "...", ...}

[useComplainantEmail] Starting email send to: test@example.com
[useComplainantEmail] Email API URL: https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email
[useComplainantEmail] Email payload: {to: "test@example.com", subject: "LEIRS: Incident Report...", bodyLength: 650}
[useComplainantEmail] Sending fetch request to: https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email
[useComplainantEmail] Response status: 200
[useComplainantEmail] Email sent successfully: {success: true, id: "..."}

📬 sendIncidentSubmitted() returned: {error: null}
Result type: object
Result keys: ["error"]

✅ Email sent successfully!

=== CLEANING UP ===
```

---

## ❌ If Email Field is Empty

```
=== FORM SUBMISSION STARTED ===
reporterEmail field: ""

=== EXTRACTED VALUES ===
complainantEmail: 
complainantName: Juan

=== INCIDENT CREATED SUCCESSFULLY ===

=== EMAIL NOTIFICATION CHECK ===
complainantEmail value: 
complainantEmail type: string
complainantEmail length: 0
complainantEmail trimmed: 
Is email truthy? false

❌ Email condition failed - no email provided
Skipping email notification

=== CLEANING UP ===
```

---

## 🔴 Failure Scenarios

### Scenario 1: Email API URL Not Configured

```
✅ Email condition passed - entering email block
📧 About to call sendIncidentSubmitted()

[useComplainantEmail] Starting email send to: test@example.com
[useComplainantEmail] Email API URL: undefined
[useComplainantEmail] Email API URL not configured. Email notification skipped.

📬 sendIncidentSubmitted() returned: {error: null}
✅ Email sent successfully!  ← (Non-blocking, returns success even when skipped)
```

### Scenario 2: Network Error

```
✅ Email condition passed - entering email block
📧 About to call sendIncidentSubmitted()

[useComplainantEmail] Starting email send to: test@example.com
[useComplainantEmail] Email API URL: https://...
[useComplainantEmail] Sending fetch request to: https://...
[useComplainantEmail] Fetch error: Failed to fetch

📬 sendIncidentSubmitted() returned: {error: "Failed to send email."}

❌ Email error returned: Failed to send email.
```

### Scenario 3: Edge Function Error (500)

```
✅ Email condition passed - entering email block
📧 About to call sendIncidentSubmitted()

[useComplainantEmail] Starting email send to: test@example.com
[useComplainantEmail] Sending fetch request to: https://...
[useComplainantEmail] Response status: 500
[useComplainantEmail] Email API error: {message: "Internal server error"}

📬 sendIncidentSubmitted() returned: {error: "Email API error: 500"}

❌ Email error returned: Email API error: 500
```

---

## 🎯 Key Checkpoints

### Checkpoint 1: Email Value Check
Look for:
```
complainantEmail value: test@example.com
Is email truthy? true
✅ Email condition passed
```

**If you see:**
- `Is email truthy? false` → Email field is empty
- `❌ Email condition failed` → Email not provided, this is expected behavior

### Checkpoint 2: Function Call
Look for:
```
📧 About to call sendIncidentSubmitted()
Email: test@example.com
```

**If missing:** The if statement failed, check email value above.

### Checkpoint 3: Hook Execution
Look for:
```
[useComplainantEmail] Starting email send to: test@example.com
[useComplainantEmail] Email API URL: https://...
```

**If missing:** Function wasn't called or hook isn't working.

### Checkpoint 4: Fetch Request
Look for:
```
[useComplainantEmail] Sending fetch request to: https://...
[useComplainantEmail] Response status: 200
```

**If missing:** 
- Check if Email API URL is undefined
- Check for fetch errors
- Check network connection

### Checkpoint 5: Result Handling
Look for:
```
📬 sendIncidentSubmitted() returned: {error: null}
✅ Email sent successfully!
```

**If you see:**
- `{error: null}` → Success
- `{error: "..."}` → Failure with reason

---

## 🚨 Critical Issues to Identify

### Issue: Email Condition Never Enters

```
❌ Email condition failed - no email provided
```

**Diagnosis:** Form field not capturing email or variable name mismatch.

**Check:**
1. Form has `reporterEmail` field
2. Input has `value={formData.reporterEmail}`
3. onChange updates `reporterEmail` in formData

### Issue: Function Called but No Hook Logs

```
📧 About to call sendIncidentSubmitted()
(no [useComplainantEmail] logs)
```

**Diagnosis:** Hook not imported or sendIncidentSubmitted not defined.

**Check:**
1. `import useComplainantEmail from '../../hooks/useComplainantEmail'`
2. Hook is initialized: `const { sendIncidentSubmitted } = useComplainantEmail(...)`

### Issue: Email API URL Undefined

```
[useComplainantEmail] Email API URL: undefined
```

**Diagnosis:** Environment variable not loaded.

**Fix:**
1. Verify `.env` has `VITE_EMAIL_API_URL=https://...`
2. Restart dev server (REQUIRED for Vite to reload .env)
3. Check variable name is exactly `VITE_EMAIL_API_URL` (case-sensitive)

### Issue: Fetch Returns Error

```
[useComplainantEmail] Response status: 404
[useComplainantEmail] Email API error: {...}
```

**Diagnosis:** Edge Function URL incorrect or not deployed.

**Fix:**
1. Check Edge Function is deployed: `supabase functions list`
2. Test directly: `Invoke-RestMethod -Uri "URL" -Method POST ...`
3. Verify URL in .env matches deployed function URL

---

## 📋 Testing Checklist

Before reporting results, verify:

- [ ] Dev server was restarted after adding debug logs
- [ ] Browser console is open (F12 → Console tab)
- [ ] Console is cleared before test (right-click → Clear console)
- [ ] Form is filled with valid data
- [ ] Email address is entered in the email field
- [ ] Submit button is clicked
- [ ] Full console output is captured (scroll up to see all logs)

---

## 📸 What to Share

If issue persists, share:

1. **Full console output** from `=== FORM SUBMISSION STARTED ===` to `=== CLEANING UP ===`
2. **Screenshot of form** before submission (showing email field filled)
3. **Current .env content** (sanitize sensitive keys):
   ```
   VITE_EMAIL_API_URL=https://...
   ```
4. **Edge Function status:**
   ```powershell
   supabase functions list
   ```

---

## ✅ Success Indicators

If everything works, you'll see ALL of these:

- ✅ Form data includes reporterEmail
- ✅ complainantEmail extracted correctly
- ✅ Email condition passes
- ✅ sendIncidentSubmitted() called
- ✅ Hook logs show fetch request
- ✅ Response status: 200
- ✅ Result: {error: null}
- ✅ Green banner appears in UI

---

**Now test and share the console output!** 🔍
