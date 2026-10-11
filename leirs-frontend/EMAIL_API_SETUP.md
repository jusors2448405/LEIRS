# Email API Configuration Guide

This document explains how to configure email notifications for the barangay mediation workflow in LEIRS.

## Overview

Email notifications are sent to complainants at key workflow stages:
- When case is forwarded to documentation
- When summons is issued to respondent
- When barangay hearing is scheduled
- When mediation session is scheduled
- When case resolution is recorded

Email notifications are **optional** and non-blocking. If the email service is not configured or unavailable, the workflow continues normally.

## Environment Variables

Configure these variables in your `.env` file (development) or deployment environment:

```
VITE_EMAIL_API_URL=<your-email-service-endpoint>
VITE_EMAIL_API_KEY=<optional-api-key>
```

### VITE_EMAIL_API_URL

**Required if you want to enable email notifications.**

The HTTP endpoint of your email service. This should accept POST requests with email payload.

**Examples:**
- Mailgun: `https://api.mailgun.net/v3/your-domain.com/messages`
- SendGrid: `https://api.sendgrid.com/v3/mail/send`
- Custom service: `https://your-email-service.example.com/api/send`
- Local development: `http://localhost:3001/send-email`

### VITE_EMAIL_API_KEY

**Optional.** API key or authentication token for your email service.

If provided, it will be sent in the request header:
```
Authorization: Bearer <VITE_EMAIL_API_KEY>
```

If your email service uses a different authentication method (Basic Auth, custom header, etc.), you may need to modify the hook implementation. See [Advanced Configuration](#advanced-configuration) below.

## Email Payload Format

The frontend sends POST requests with the following JSON structure:

```json
{
  "to": "complainant@example.com",
  "subject": "LEIRS: Your Case Has Been Resolved",
  "body": "Plain text email body...",
  "html": "<p>HTML email body...</p>"
}
```

**Fields:**
- `to`: Recipient email address (string)
- `subject`: Email subject line (string)
- `body`: Plain text email content (string)
- `html`: HTML email content (string, same as body for MVP)

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer <API_KEY>` (if VITE_EMAIL_API_KEY is configured)

## Popular Email Service Setup

### Option 1: Mailgun

1. **Create Mailgun account:** https://www.mailgun.com/
2. **Get your API endpoint:**
   - Go to Sending → Domain Settings
   - Note the domain name (e.g., `mail.example.com`)
   - Construct URL: `https://api.mailgun.net/v3/{domain}/messages`

3. **Get API key:**
   - Go to API Security
   - Copy the Private API Key

4. **Configure .env:**
   ```
   VITE_EMAIL_API_URL=https://api.mailgun.net/v3/mail.example.com/messages
   VITE_EMAIL_API_KEY=key-xxxxxxxxxxxx
   ```

5. **Important:** Mailgun expects form data, not JSON. If using Mailgun, you'll need to create a backend wrapper that:
   - Receives JSON from frontend
   - Converts to form data
   - Sends to Mailgun
   - Returns JSON response

### Option 2: SendGrid

1. **Create SendGrid account:** https://sendgrid.com/
2. **Generate API key:**
   - Go to Settings → API Keys
   - Create new API Key with Mail Send access

3. **Configure .env:**
   ```
   VITE_EMAIL_API_URL=https://api.sendgrid.com/v3/mail/send
   VITE_EMAIL_API_KEY=SG.xxxxxxxxxxxx
   ```

4. **Update request format** (SendGrid requires different JSON structure):
   - You'll need a backend wrapper or modify the hook
   - See [Advanced Configuration](#advanced-configuration)

### Option 3: AWS SES (Simple Email Service)

1. **Create AWS account and verify domain/email**
2. **Generate SMTP credentials:**
   - Go to SES → SMTP Settings
   - Create SMTP credentials
   - Note the Endpoint, Username, Password

3. **Option A - Use backend wrapper:**
   ```
   VITE_EMAIL_API_URL=https://your-backend.example.com/send-email
   VITE_EMAIL_API_KEY=<your-backend-auth-key>
   ```
   Backend handles SES authentication

4. **Option B - Use SES HTTP endpoint** (if available):
   - Similar to SendGrid, may require JSON format conversion

### Option 4: Custom Backend Service

**Recommended for production.**

Create a simple backend endpoint that:
1. Receives JSON from frontend
2. Validates the request
3. Sends email using your preferred method
4. Returns JSON response

**Backend example (Node.js/Express):**

```javascript
app.post('/send-email', (req, res) => {
  const { to, subject, body, html } = req.body;
  
  // Validate
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Send email using your service
  // (e.g., nodemailer, AWS SES, Mailgun, etc.)
  
  res.json({ success: true });
});
```

**Configure .env:**
```
VITE_EMAIL_API_URL=https://your-backend.example.com/send-email
VITE_EMAIL_API_KEY=your-backend-secret-key
```

## Testing Email Configuration

### Local Development

1. **Install and run a local SMTP server** (for testing only):
   ```bash
   npm install --save-dev mailhog
   mailhog # Runs on http://localhost:1025 (SMTP) and http://localhost:8025 (Web UI)
   ```

2. **Create a local backend wrapper:**
   ```javascript
   // backend.js
   const nodemailer = require('nodemailer');
   const express = require('express');
   const app = express();
   
   app.use(express.json());
   
   const transporter = nodemailer.createTransport({
     host: 'localhost',
     port: 1025
   });
   
   app.post('/send-email', async (req, res) => {
     try {
       const { to, subject, body } = req.body;
       await transporter.sendMail({
         from: 'leirs@localhost',
         to,
         subject,
         text: body
       });
       res.json({ success: true });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });
   
   app.listen(3001);
   ```

3. **Configure .env:**
   ```
   VITE_EMAIL_API_URL=http://localhost:3001/send-email
   ```

4. **Monitor emails:**
   - Open http://localhost:8025 in browser
   - Watch emails arrive in real-time

### Production Verification

1. **Test from Cases page:**
   - Navigate to Case → Resolution tab
   - Create a test resolution
   - Check "Send notification email to complainant"
   - Enter test email address
   - Click "Record Resolution"
   - Verify success message appears

2. **Check email delivery:**
   - If using Mailgun/SendGrid/AWS, check their dashboards
   - If using custom backend, check logs

## Advanced Configuration

### Custom Email Templates

To customize email content, modify the `useComplainantEmail` hook:

**File:** `leirs-frontend/src/hooks/useComplainantEmail.js`

Each method (e.g., `sendCaseResolved`, `sendHearingScheduled`) defines the email subject and body. Edit the `subject` and `body` variables to customize:

```javascript
const sendCaseResolved = async (complainantEmail, resolutionDetails = {}) => {
  const incident = await getIncidentDetails()
  
  // Customize subject
  const subject = `[CUSTOM] Your case outcome notification`
  
  // Customize body
  const body = `
Dear ${incident.complainant_name},

Your case outcome:
${resolutionDetails.notes}

Contact us if you have questions.
  `.trim()
  
  return sendEmail(complainantEmail, subject, body)
}
```

### Different Authentication Methods

The `useComplainantEmail` hook currently sends:
```javascript
headers['Authorization'] = `Bearer ${emailApiKey}`
```

If your email service uses different authentication:
1. Modify the `sendEmail` function in `useComplainantEmail.js`
2. Change the header format:
   - Basic Auth: `headers['Authorization'] = 'Basic ' + btoa(user + ':' + pass)`
   - Custom header: `headers['X-API-Key'] = emailApiKey`
   - Query parameter: append `?api_key=${emailApiKey}` to URL

### Different Request Formats

SendGrid and some services use different JSON structures. If your service requires a custom format:

**Option 1:** Use a backend wrapper (recommended)
- Wrapper handles format conversion
- Frontend stays simple and service-agnostic

**Option 2:** Modify the hook
- Edit `sendEmail` function to build service-specific payload
- Less maintainable, couples frontend to specific service

## Troubleshooting

### Email not sending

1. **Check configuration:**
   - Verify `VITE_EMAIL_API_URL` is set and correct
   - Test URL in Postman/curl:
     ```bash
     curl -X POST https://your-api/send \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer YOUR_KEY" \
       -d '{"to":"test@example.com","subject":"Test","body":"Test"}'
     ```

2. **Check browser console:**
   - Open DevTools (F12) → Console tab
   - Try sending an email notification
   - Look for error messages in console

3. **Check network tab:**
   - Open DevTools (F12) → Network tab
   - Trigger email send
   - Look for the POST request to VITE_EMAIL_API_URL
   - Check response status and body

4. **Email service logs:**
   - Check Mailgun/SendGrid/AWS dashboard
   - Look for failed deliveries
   - Check bounce and spam folders

### "Email API URL not configured" warning

This means `VITE_EMAIL_API_URL` environment variable is not set.

**Solution:**
1. Add `VITE_EMAIL_API_URL` to `.env` file
2. Restart development server: `npm run dev`
3. Clear browser cache (Ctrl+Shift+Del)

### CORS errors

If you see CORS errors in browser console, the email service doesn't allow cross-origin requests.

**Solution:** Use a backend wrapper service instead of calling email service directly.

## Disabling Email Notifications

If you don't want to set up email notifications:
1. Leave `VITE_EMAIL_API_URL` blank in `.env`
2. Workflow continues normally
3. Users simply won't see the email notification checkbox

## Security Considerations

1. **Never commit secrets:**
   - `.env` file should be in `.gitignore`
   - Use environment-specific configuration for production

2. **API key protection:**
   - Store API keys securely (use secrets manager, not version control)
   - For production, use backend wrapper instead of exposing API key to frontend

3. **Email validation:**
   - The hook validates email format before sending
   - Backend should also validate

4. **Rate limiting:**
   - Consider implementing rate limiting on email endpoint
   - Prevent abuse (e.g., spam emails)

5. **Email content:**
   - Don't include sensitive information in email subject
   - Use generic greetings if email list is not validated

## Support

For questions or issues:
- Check email service documentation
- Review browser DevTools console for error messages
- Check backend/email service logs
- Contact your email service support
