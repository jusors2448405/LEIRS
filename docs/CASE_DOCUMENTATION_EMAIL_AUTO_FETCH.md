# Case Documentation Module - Auto-Fetch Complainant Email

## Overview
Modified the Case Documentation module to automatically retrieve complainant email addresses from incident records, eliminating the need for manual email entry in summons and resolution forms.

## Problem Statement
Previously, staff had to manually type complainant email addresses when:
1. Issuing summons to respondents
2. Recording case resolutions

This created:
- Data entry burden on staff
- Risk of typos/incorrect emails
- Inconsistent email addresses across workflows

## Solution
Automatically fetch `complainant_email` from the `incidents` table using the `incident_id` and:
- Auto-populate email fields
- Default email notification checkbox to checked
- Keep manual input as fallback for cases without stored email
- Show clear visual feedback about email source

## Modified Components

### 1. ResolutionForm Component
**File:** `leirs-frontend/src/pages/case-admin/ResolutionForm.jsx`

**Changes:**
- ✅ Added `supabase` import
- ✅ Added `loadingEmail`, `complainantEmailFromIncident` state
- ✅ Added `useEffect` to fetch `complainant_email` from incidents table
- ✅ Changed `sendEmailAfterSave` default to `true` (checked by default)
- ✅ Auto-populate `complainantEmailForNotification` with fetched email
- ✅ Enhanced email notification UI:
  - Green badge showing auto-fetched email
  - Yellow warning if no email found in record
  - Warning if user overrides with custom email
  - Manual input remains as fallback

**Email Notification Logic:**
```javascript
// Fetch complainant email on mount
useEffect(() => {
  const fetchComplainantEmail = async () => {
    const { data } = await supabase
      .from('incidents')
      .select('complainant_email')
      .eq('id', incidentId)
      .single()
    
    if (data?.complainant_email) {
      setComplainantEmailFromIncident(data.complainant_email)
      setComplainantEmailForNotification(data.complainant_email)
    }
  }
  fetchComplainantEmail()
}, [incidentId])
```

**UI States:**
1. **Email Found:** Green badge with auto-fetched email + editable input
2. **No Email:** Yellow warning + manual input required
3. **Custom Override:** Warning badge showing deviation from record

---

### 2. SummonsManager Component
**File:** `leirs-frontend/src/pages/case-admin/SummonsManager.jsx`

**Changes:**
- ✅ Added `Mail` icon import
- ✅ Added `useComplainantEmail` hook integration
- ✅ Added email-related state variables:
  - `sendingEmail` from hook
  - `emailSuccess` for success message
  - `sendEmailAfterSave` (default: true)
  - `complainantEmailForNotification`
  - `complainantEmailFromIncident`
  - `loadingEmail`
- ✅ Added `useEffect` to fetch complainant email from incidents
- ✅ Modified `resetForm()` to preserve auto-fetched email
- ✅ Enhanced `handleSubmit()`:
  - Validate email if notification enabled
  - Send email using `sendSummonsIssued()` hook
  - Email only sent for **new summons** (not edits)
  - Non-blocking email (failure shows alert but doesn't block save)
- ✅ Added email success message banner
- ✅ Added email notification section to form (only for new summons)
- ✅ Disabled submit button while email sending

**Email Notification Logic:**
```javascript
// Send email after successful summons creation
if (!editingId && sendEmailAfterSave && complainantEmailForNotification?.trim()) {
  const emailResult = await sendSummonsIssued(complainantEmailForNotification.trim())
  
  if (!emailResult.error) {
    setEmailSuccess(true)
  } else {
    alert(`Summons recorded but email notification failed: ${emailResult.error}`)
  }
}
```

**Email Section UI:**
- Checkbox to enable/disable notification (default: checked)
- Auto-fetched email with green badge
- Yellow warning if no email found
- Manual input as fallback
- Warning if custom email differs from record
- **Only shown for new summons** (not when editing)

---

## Email Templates Used

### Summons Notification
**Hook Function:** `useComplainantEmail.sendSummonsIssued(email)`

**Template Content:**
```
Subject: LEIRS: Summons Issued for Incident [INCIDENT_NUMBER]

Dear [COMPLAINANT_NAME],

A summons has been issued to the respondent in your case ([INCIDENT_NUMBER]).

The respondent has been formally notified and must comply with the summons.

Your reference number is: [INCIDENT_NUMBER]

For more information, you can track your case status on our website.

Best regards,
LEIRS System
Law Enforcement and Incident Reporting System
```

### Resolution Notification
**Hook Function:** `useComplainantEmail.sendCaseResolved(email, { resolution_type, notes })`

**Template Content:**
```
Subject: LEIRS: Case Resolution - [INCIDENT_NUMBER]

Dear [COMPLAINANT_NAME],

Your case has been resolved and officially closed.

Reference Number: [INCIDENT_NUMBER]
Incident Type: [INCIDENT_TYPE]
Resolution Date: [CURRENT_DATE]

Resolution Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Resolution Type: [RESOLUTION_TYPE]
[NOTES]

Thank you for your patience and cooperation throughout this process.

Best regards,
Barangay LEIRS Team
```

---

## User Experience Flow

### Summons Workflow

1. **Staff opens SummonsManager** for an incident
   - System fetches `complainant_email` from incident record
   - If email exists: green badge shows email, checkbox pre-checked
   - If no email: yellow warning, manual input required

2. **Staff fills summons form**
   - Select respondent
   - Set issued date and status
   - Add service notes
   - Email section appears (new summons only)

3. **Staff submits form**
   - Summons record created in database
   - If email checkbox checked: notification sent automatically
   - Success message shows summons saved
   - Blue banner confirms email sent (if applicable)

4. **Email notification sent to complainant**
   - Non-blocking (doesn't delay form submission)
   - Failure shows alert but doesn't prevent save

### Resolution Workflow

1. **Staff opens ResolutionForm** for an incident
   - System fetches `complainant_email` from incident record
   - Email checkbox pre-checked by default

2. **Staff fills resolution form**
   - Resolution date and type
   - Description and recommendations
   - Email notification section auto-populated

3. **Staff submits form**
   - Resolution record saved
   - Email sent if checkbox checked
   - Success messages for save + email

---

## Benefits

### ✅ Reduced Manual Work
- No need to look up and type email addresses
- Auto-population saves time per form

### ✅ Data Consistency
- Email comes directly from source of truth (incidents table)
- Eliminates typos and inconsistencies

### ✅ Better User Experience
- Clear visual feedback (green badge = auto-fetched)
- Manual fallback for edge cases
- Non-blocking email (doesn't delay workflow)

### ✅ Improved Communication
- Default-checked notifications ensure complainants stay informed
- Consistent notification timing

---

## Fallback Behavior

### When No Email in Incident Record
1. Yellow warning badge appears
2. Manual input field remains editable
3. User can type email manually
4. Validation requires email if notification enabled
5. System proceeds normally with manual email

### When Email Sending Fails
1. Resolution/summons is still saved successfully
2. Alert dialog informs user of email failure
3. User can manually notify complainant
4. No data loss or workflow blocking

---

## Technical Details

### Database Query
```javascript
const { data, error } = await supabase
  .from('incidents')
  .select('complainant_email')
  .eq('id', incidentId)
  .single()
```

### Email Sending (Non-Blocking)
```javascript
// Resolution: uses useComplainantEmail hook
const emailResult = await sendCaseResolved(
  complainantEmailForNotification.trim(),
  { resolution_type, notes }
)

// Summons: uses useComplainantEmail hook
const emailResult = await sendSummonsIssued(
  complainantEmailForNotification.trim()
)
```

### State Management
```javascript
// Email states
const [complainantEmailFromIncident, setComplainantEmailFromIncident] = useState('')
const [complainantEmailForNotification, setComplainantEmailForNotification] = useState('')
const [sendEmailAfterSave, setSendEmailAfterSave] = useState(true)
const [loadingEmail, setLoadingEmail] = useState(false)
const [emailSuccess, setEmailSuccess] = useState(false)
```

---

## Testing Checklist

### ResolutionForm
- [ ] Open form with incident that has `complainant_email`
  - ✓ Email auto-populated
  - ✓ Green badge shows email
  - ✓ Checkbox pre-checked
- [ ] Submit resolution with email notification enabled
  - ✓ Resolution saved
  - ✓ Email sent
  - ✓ Success messages appear
- [ ] Override auto-fetched email with custom email
  - ✓ Yellow warning appears
  - ✓ Custom email used
- [ ] Open form with incident without email
  - ✓ Yellow warning badge
  - ✓ Manual input required
- [ ] Uncheck email notification
  - ✓ No email sent
  - ✓ Resolution still saves

### SummonsManager
- [ ] Open form with incident that has `complainant_email`
  - ✓ Email auto-populated
  - ✓ Green badge shows email
  - ✓ Checkbox pre-checked
- [ ] Issue new summons with email notification
  - ✓ Summons saved
  - ✓ Email sent
  - ✓ Success messages appear
- [ ] Edit existing summons
  - ✓ Email section hidden
  - ✓ No email sent on update
- [ ] Issue summons without email in record
  - ✓ Yellow warning appears
  - ✓ Manual input works
- [ ] Uncheck email notification
  - ✓ No email sent
  - ✓ Summons still saves

---

## Related Documentation
- `EMAIL_NOTIFICATION_INTEGRATION.md` - System-wide email notification overview
- `API_DOCUMENTATION.md` - Backend API endpoints
- `DATABASE_DOCUMENTATION.md` - Database schema reference

## Modified Files Summary
1. ✅ `leirs-frontend/src/pages/case-admin/ResolutionForm.jsx`
2. ✅ `leirs-frontend/src/pages/case-admin/SummonsManager.jsx`

## Existing Email Infrastructure Used
- `useComplainantEmail` hook with `sendSummonsIssued()` and `sendCaseResolved()`
- Supabase Edge Function `send-email`
- Gmail SMTP backend
- Environment: `VITE_EMAIL_API_URL`
