# Email Notification System Integration

## Overview
Successfully integrated email notifications system-wide into all critical LEIRS incident workflows. Email notifications are sent to complainants automatically when key events occur in their incident cases.

## Email Provider
**Gmail SMTP** via Supabase Edge Function (`send-email`)
- Server: smtp.gmail.com:465
- Credentials: `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- Edge Function URL: `https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email`

## Environment Configuration

### Backend (Supabase Edge Function)
```env
GMAIL_USER=leirs.notifications@gmail.com
GMAIL_APP_PASSWORD=<16-character-app-password>
```

### Frontend (.env)
```env
VITE_EMAIL_API_URL=https://kyvhyhmqwcxbloiliojw.supabase.co/functions/v1/send-email
```

## Integrated Notification Workflows

### ✅ 1. Incident Submission Notification
**Trigger:** When a new incident is reported (public portal or admin)  
**Components:**
- `leirs-frontend/src/pages/public/ReportIncident.jsx`
- `leirs-frontend/src/pages/encoder/Reporting.jsx`

**Hook:** `useComplainantEmail.sendIncidentSubmitted(email, incidentData)`

**Email Content:**
- Incident reference number
- Incident type and location
- Submission date
- Next steps

**Status:** ✅ Implemented and working

---

### ✅ 2. Status Update Notification
**Trigger:** When incident/case status changes (Pending → Under Investigation → Resolved → Closed)  
**Components:**
- Status updates are handled by `useCaseStatus.updateCaseStatus()`

**Hook:** Direct API call to Edge Function (inline in `useCaseStatus.js`)

**Email Content:**
- Incident reference number
- Previous status → New status
- Status-specific guidance message
- Timestamp of status change

**Status:** ✅ Implemented (this session)

**Modified File:** `leirs-frontend/src/hooks/useCaseStatus.js`

---

### ✅ 3. Officer Assignment Notification
**Trigger:** When a police officer is assigned to an incident via dispatch  
**Components:**
- Officer assignment is handled by `useDispatchRequest.assignOfficer()`

**Hook:** Direct API call to Edge Function (inline in `useDispatchRequest.js`)

**Email Content:**
- Incident reference number
- Assigned officer name and badge number
- Assignment date/time
- Next steps

**Status:** ✅ Implemented (this session)

**Modified File:** `leirs-frontend/src/hooks/useDispatchRequest.js`

---

### ✅ 4. Evidence Update Notification
**Trigger:** When new evidence is added to an incident  
**Components:**
- Evidence creation is handled by `useEvidence.createEvidence()`

**Hook:** Direct API call to Edge Function (inline in `useEvidence.js`)

**Email Content:**
- Incident reference number
- Evidence number and type
- Evidence name and description
- Collection details
- Timestamp

**Status:** ✅ Implemented (this session)

**Modified File:** `leirs-frontend/src/hooks/useEvidence.js`

---

## Implementation Approach

### Non-Blocking Design
All email notifications are **non-blocking**:
- Email API calls use `fetch()` without `await`
- Email failures are logged but don't throw errors
- Workflow operations (status updates, assignments, evidence creation) complete successfully even if email fails
- Console warnings logged for debugging

### Error Handling
```javascript
// Non-blocking fetch pattern used throughout
fetch(emailApiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to, subject, body, html })
}).then(response => {
  if (response.ok) {
    console.log('Email sent successfully');
  } else {
    console.warn('Email API error:', response.status);
  }
}).catch(err => {
  console.warn('Failed to send email:', err.message);
});
```

### Email Template Structure
All emails follow consistent format:
```
Dear [Complainant Name],

[Opening message]

Reference Number: [Incident Number]
Incident Type: [Type]

[Event-specific details in formatted block]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Detail 1]
[Detail 2]
[Detail 3]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Closing message]

Best regards,
Barangay LEIRS Team
Law Enforcement and Incident Reporting System
```

## Data Flow

### Complainant Email Storage
Email addresses are stored in `incidents.complainant_email` field:
- Captured during incident submission (both public and admin routes)
- Retrieved when sending notifications
- If missing, notification is skipped with console log (non-fatal)

### Email Sending Flow
```
Workflow Event (status change, assignment, evidence)
    ↓
Fetch incident data (incident_number, complainant_email, complainant_name, etc.)
    ↓
Check if complainant_email exists
    ↓ (yes)
Check if VITE_EMAIL_API_URL configured
    ↓ (yes)
Build email subject and body
    ↓
Send non-blocking fetch() to Edge Function
    ↓
Log result (success or warning)
    ↓
Continue with workflow (email doesn't block)
```

## Testing Checklist

### End-to-End Testing
- [ ] Create new incident report (public portal) → verify submission email
- [ ] Create new incident report (admin portal) → verify submission email
- [ ] Update case status (Pending → Under Investigation) → verify status email
- [ ] Update case status (Under Investigation → Resolved) → verify status email
- [ ] Assign officer to incident → verify assignment email
- [ ] Add evidence to incident → verify evidence email

### Edge Cases
- [ ] Incident without complainant_email → verify workflow completes, no error thrown
- [ ] Edge Function unavailable → verify workflow completes, warning logged
- [ ] Invalid email address → verify workflow completes, API error logged

## Monitoring and Debugging

### Console Logs
All email operations include debug logging:
```
[useCaseStatus] Sending status update email to: email@example.com
[useDispatchRequest] Officer assignment email sent successfully
[useEvidence] No complainant email found for incident: <uuid>
[useEvidence] Email notification error (non-fatal): <error>
```

### Edge Function Logs
Check Supabase Edge Function logs:
```bash
# View recent invocations
Supabase Dashboard → Edge Functions → send-email → Invocations
```

## Future Enhancements

### Additional Notifications (Not Yet Implemented)
These templates exist in `useComplainantEmail.js` but aren't integrated yet:
- Summons issued (`sendSummonsIssued`)
- Hearing scheduled (`sendHearingScheduled`)
- Mediation scheduled (`sendMediationScheduled`)
- Case resolution completed (`sendResolutionCompleted`)

### Potential Improvements
- Add email retry logic for transient failures
- Implement email queue for batch processing
- Add email preferences (opt-in/opt-out)
- Support SMS notifications via Twilio
- Add email delivery tracking
- Create admin dashboard for email logs

## Related Documentation
- `GMAIL_SMTP_SETUP.md` - Gmail SMTP configuration guide
- `GMAIL_DEPLOY_CHECKLIST.txt` - Deployment verification steps
- `API_DOCUMENTATION.md` - Backend API reference
- `DATABASE_DOCUMENTATION.md` - Database schema

## Modified Files Summary

### This Session (Email Integration)
1. ✅ `leirs-frontend/src/hooks/useCaseStatus.js` - Status update emails
2. ✅ `leirs-frontend/src/hooks/useDispatchRequest.js` - Officer assignment emails
3. ✅ `leirs-frontend/src/hooks/useEvidence.js` - Evidence update emails

### Previous Session (Gmail Migration + Bug Fix)
4. ✅ `leirs-backend/supabase/functions/send-email/index.ts` - Gmail SMTP integration
5. ✅ `leirs-frontend/src/hooks/useComplainantEmail.js` - Email hook with templates
6. ✅ `leirs-frontend/src/pages/encoder/Reporting.jsx` - Admin incident submission emails
7. ✅ `leirs-frontend/src/pages/public/ReportIncident.jsx` - Public incident submission emails

## Support Contacts
For issues with:
- **Email delivery:** Check Gmail app password and SMTP configuration
- **Edge Function:** Check Supabase project settings and function logs
- **Email templates:** Modify `useComplainantEmail.js` or inline templates in hooks
- **Missing emails:** Verify `complainant_email` field is populated in incidents table
