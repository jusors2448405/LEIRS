# LEIRS Email Notification Integration Guide

This guide shows where and how to integrate email notifications into your existing LEIRS modules.

---

## 📧 Available Email Templates

The `useComplainantEmail` hook provides 5 predefined templates:

1. **Incident Forwarded** - `sendIncidentForwarded(email)`
2. **Summons Issued** - `sendSummonsIssued(email)`
3. **Hearing Scheduled** - `sendHearingScheduled(email, hearingDetails)`
4. **Mediation Scheduled** - `sendMediationScheduled(email, mediationDetails)`
5. **Case Resolved** - `sendCaseResolved(email, resolutionDetails)`
6. **Custom Email** - `sendCustom(email, subject, body)`

---

## 🔌 Integration Points

### 1. Case Documentation Module

**File:** `leirs-frontend/src/pages/case-admin/CaseDocumentation.jsx`

**When to send:** After creating new case record from incident

**Code Example:**

```javascript
import useComplainantEmail from '../../hooks/useComplainantEmail'

const CaseDocumentation = () => {
  // ... existing code ...
  
  const { sendIncidentForwarded } = useComplainantEmail(selectedIncident?.id)
  
  const handleCreateCase = async () => {
    // ... existing case creation logic ...
    
    // After successful case creation
    if (selectedIncident?.complainant_email) {
      const { error: emailError } = await sendIncidentForwarded(
        selectedIncident.complainant_email
      )
      
      if (emailError) {
        console.warn('Failed to send notification email:', emailError)
        // Don't block workflow on email failure
      } else {
        console.log('Notification email sent to complainant')
      }
    }
  }
  
  // ... rest of component ...
}
```

**User Experience:**
```
Complainant submits incident → Case admin creates case record → 
Complainant receives email:
  "Your incident INC-2024-001 has been forwarded to Case Administration"
```

---

### 2. Summons Management Module

**File:** `leirs-frontend/src/pages/summons-admin/SummonsManagement.jsx`

**When to send:** After issuing summons to respondent

**Code Example:**

```javascript
import useComplainantEmail from '../../hooks/useComplainantEmail'

const SummonsManagement = () => {
  // ... existing code ...
  
  const { sendSummonsIssued } = useComplainantEmail(selectedCase?.incident_id)
  
  const handleIssueSummons = async () => {
    // ... existing summons issuance logic ...
    
    // After successful summons creation
    if (selectedCase?.complainant_email) {
      const { error: emailError } = await sendSummonsIssued(
        selectedCase.complainant_email
      )
      
      if (emailError) {
        console.warn('Failed to send summons notification:', emailError)
      }
    }
  }
  
  // ... rest of component ...
}
```

**User Experience:**
```
Case admin issues summons → 
Complainant receives email:
  "A summons has been issued to the respondent in your case INC-2024-001"
```

---

### 3. Hearing Scheduler Module

**File:** `leirs-frontend/src/pages/hearing-admin/HearingScheduler.jsx`

**When to send:** After scheduling barangay hearing

**Code Example:**

```javascript
import useComplainantEmail from '../../hooks/useComplainantEmail'

const HearingScheduler = () => {
  // ... existing code ...
  
  const { sendHearingScheduled } = useComplainantEmail(selectedCase?.incident_id)
  
  const handleScheduleHearing = async (hearingData) => {
    // ... existing hearing scheduling logic ...
    
    // After successful hearing schedule creation
    if (selectedCase?.complainant_email && hearingData) {
      const hearingDetails = {
        scheduled_date: hearingData.hearing_date,
        scheduled_time: hearingData.hearing_time,
        location: hearingData.location || 'Barangay Hall Conference Room'
      }
      
      const { error: emailError } = await sendHearingScheduled(
        selectedCase.complainant_email,
        hearingDetails
      )
      
      if (emailError) {
        console.warn('Failed to send hearing notification:', emailError)
      }
    }
  }
  
  // ... rest of component ...
}
```

**User Experience:**
```
Case admin schedules hearing → 
Complainant receives email:
  "Barangay hearing scheduled for INC-2024-001
   Date: November 15, 2024
   Time: 10:00 AM
   Location: Barangay Hall Conference Room"
```

---

### 4. Lupon Mediation Scheduler

**File:** `leirs-frontend/src/pages/mediation-admin/MediationScheduler.jsx`

**When to send:** After scheduling mediation session

**Code Example:**

```javascript
import useComplainantEmail from '../../hooks/useComplainantEmail'

const MediationScheduler = () => {
  // ... existing code ...
  
  const { sendMediationScheduled } = useComplainantEmail(selectedCase?.incident_id)
  
  const handleScheduleMediation = async (mediationData) => {
    // ... existing mediation scheduling logic ...
    
    // After successful mediation schedule creation
    if (selectedCase?.complainant_email && mediationData) {
      const mediationDetails = {
        mediation_date: mediationData.mediation_date,
        mediator_name: mediationData.mediator_assigned || 'To be assigned'
      }
      
      const { error: emailError } = await sendMediationScheduled(
        selectedCase.complainant_email,
        mediationDetails
      )
      
      if (emailError) {
        console.warn('Failed to send mediation notification:', emailError)
      }
    }
  }
  
  // ... rest of component ...
}
```

**User Experience:**
```
Case admin schedules mediation → 
Complainant receives email:
  "Lupon mediation scheduled for INC-2024-001
   Date: November 20, 2024
   Mediator: Hon. Juan Dela Cruz"
```

---

### 5. Case Resolution Module

**File:** `leirs-frontend/src/pages/resolution-admin/CaseResolution.jsx`

**When to send:** After marking case as resolved

**Code Example:**

```javascript
import useComplainantEmail from '../../hooks/useComplainantEmail'

const CaseResolution = () => {
  // ... existing code ...
  
  const { sendCaseResolved } = useComplainantEmail(selectedCase?.incident_id)
  
  const handleResolveCase = async (resolutionData) => {
    // ... existing case resolution logic ...
    
    // After successful case resolution
    if (selectedCase?.complainant_email && resolutionData) {
      const resolutionDetails = {
        resolution_type: resolutionData.resolution_type,
        notes: resolutionData.resolution_notes || 'Case has been successfully resolved.'
      }
      
      const { error: emailError } = await sendCaseResolved(
        selectedCase.complainant_email,
        resolutionDetails
      )
      
      if (emailError) {
        console.warn('Failed to send resolution notification:', emailError)
      }
    }
  }
  
  // ... rest of component ...
}
```

**User Experience:**
```
Case admin marks case as resolved → 
Complainant receives email:
  "Your case INC-2024-001 has been resolved
   Notes: Parties reached amicable settlement through mediation."
```

---

## 🎨 UI Enhancement: Email Status Indicator

You can optionally add a visual indicator when emails are sent:

```javascript
import { useState } from 'react'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

const YourComponent = () => {
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState(null)
  
  const { sendIncidentForwarded } = useComplainantEmail(incidentId)
  
  const handleWithEmail = async () => {
    // Your existing logic...
    
    const result = await sendIncidentForwarded(email)
    
    if (result.error) {
      setEmailError(result.error)
    } else {
      setEmailSent(true)
    }
  }
  
  return (
    <div>
      {/* Your existing UI */}
      
      {emailSent && (
        <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
          <CheckCircleIcon className="w-5 h-5" />
          <span>Notification email sent to complainant</span>
        </div>
      )}
      
      {emailError && (
        <div className="flex items-center gap-2 text-yellow-600 text-sm mt-2">
          <ExclamationCircleIcon className="w-5 h-5" />
          <span>Note: Email notification could not be sent</span>
        </div>
      )}
    </div>
  )
}
```

---

## ⚠️ Best Practices

### 1. Non-Blocking Email Sends

**Always make emails non-blocking** - workflow should continue even if email fails:

```javascript
// ✅ Good: Email failure doesn't block workflow
const handleAction = async () => {
  try {
    // Critical workflow logic
    await saveCaseData()
    
    // Non-critical email notification
    if (complainantEmail) {
      const { error } = await sendEmail(complainantEmail)
      if (error) {
        console.warn('Email failed:', error) // Log but don't throw
      }
    }
    
    showSuccessMessage('Case created successfully')
  } catch (error) {
    showErrorMessage('Failed to create case')
  }
}
```

```javascript
// ❌ Bad: Email failure blocks workflow
const handleAction = async () => {
  try {
    await saveCaseData()
    await sendEmail(complainantEmail) // If this fails, workflow stops
    showSuccessMessage('Case created successfully')
  } catch (error) {
    showErrorMessage('Failed') // User sees error even if case was created
  }
}
```

### 2. Email Validation

**Always check if email exists before sending:**

```javascript
// ✅ Good: Check email exists
if (complainant?.email?.trim()) {
  await sendEmail(complainant.email)
}

// ❌ Bad: No validation
await sendEmail(complainant.email) // Might fail if email is null/undefined
```

### 3. User Feedback

**Provide subtle feedback, but don't make it intrusive:**

```javascript
// ✅ Good: Subtle success indicator
console.log('Email sent successfully')
// Optional: Small toast notification or icon

// ❌ Bad: Intrusive modal
alert('Email has been sent!') // Interrupts workflow
```

### 4. Error Logging

**Log email errors for debugging, but don't expose to users:**

```javascript
// ✅ Good: Log detailed error for admins
if (emailError) {
  console.error('Email failed:', {
    to: email,
    template: 'incident_forwarded',
    error: emailError,
    timestamp: new Date().toISOString()
  })
}

// ❌ Bad: Show technical error to user
if (emailError) {
  alert(`Email API Error: ${emailError}`) // Confusing for users
}
```

---

## 🧪 Testing Checklist

Before deploying email integrations:

- [ ] Test with valid email address
- [ ] Test with missing email (should not crash)
- [ ] Test with invalid email format (should handle gracefully)
- [ ] Verify email content is correct
- [ ] Check email arrives in inbox (not spam)
- [ ] Verify workflow continues even if email fails
- [ ] Test all 5 email templates
- [ ] Check email formatting in Gmail, Outlook, etc.

---

## 📊 Monitoring

### View Email Logs

```powershell
# View Edge Function logs
supabase functions logs send-email --follow
```

### Resend Dashboard

- All sent emails: https://resend.com/emails
- Delivery analytics: https://resend.com/analytics
- API usage: https://resend.com/settings/api-keys

### Common Metrics to Track

1. **Delivery Rate:** % of emails successfully delivered
2. **Open Rate:** % of emails opened by recipients
3. **Bounce Rate:** % of emails that bounced
4. **Template Usage:** Which templates are used most frequently

---

## 🚀 Quick Integration Steps

For each module:

1. **Import hook** at top of component:
   ```javascript
   import useComplainantEmail from '../../hooks/useComplainantEmail'
   ```

2. **Initialize in component:**
   ```javascript
   const { sendEmailTemplate } = useComplainantEmail(incidentId)
   ```

3. **Call after successful action:**
   ```javascript
   if (email) {
     const { error } = await sendEmailTemplate(email, details)
     if (error) console.warn('Email failed:', error)
   }
   ```

4. **Test thoroughly** before deploying

---

## 💡 Custom Email Example

For special cases not covered by templates:

```javascript
const { sendCustom } = useComplainantEmail(incidentId)

const handleSpecialNotification = async () => {
  const subject = "LEIRS: Important Update on Your Case"
  const body = `
Dear ${complainantName},

We wanted to inform you about an important update regarding your case ${incidentNumber}.

[Your custom message here]

If you have any questions, please contact our office.

Best regards,
LEIRS System
  `.trim()
  
  const { error } = await sendCustom(email, subject, body)
  
  if (error) {
    console.warn('Custom email failed:', error)
  }
}
```

---

## 📚 Additional Resources

- **Edge Function Code:** `leirs-backend/supabase/functions/send-email/index.ts`
- **Hook Implementation:** `leirs-frontend/src/hooks/useComplainantEmail.js`
- **Deployment Guide:** `leirs-backend/supabase/DEPLOY_EMAIL_FUNCTION.md`
- **Resend Docs:** https://resend.com/docs/send-with-deno

---

## ✨ Summary

**Email integration is:**
- ✅ **Non-blocking** - Never interrupts workflow
- ✅ **Simple** - 3 lines of code per integration point
- ✅ **Flexible** - 5 templates + custom option
- ✅ **Reliable** - Built on Resend's infrastructure
- ✅ **Professional** - Well-formatted, branded emails

**Start integrating emails today to enhance complainant communication!** 🚀
