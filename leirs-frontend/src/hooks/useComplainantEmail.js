import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Manages email notifications to complainants - REDEF Demo Version
 *
 * Minimal implementation for essential complainant notifications.
 * Emails are sent via Supabase Edge Function + Resend API.
 *
 * @param {string|null} incidentId — uuid of the incident
 *
 * Returns:
 *   sending       — true while email request is in flight
 *   error         — string | null
 *   sendIncidentSubmitted(complainantEmail)   → { error }  [NEW - REDEF]
 *   sendStatusUpdate(complainantEmail, prevStatus, newStatus) → { error }  [NEW - REDEF]
 *   sendMediationScheduled(complainantEmail, mediationDetails)  → { error }
 *   sendResolutionCompleted(complainantEmail, resolutionDetails) → { error }  [RENAMED]
 *   sendCustom(complainantEmail, subject, body) → { error }
 *
 * REDEF Demo Focus:
 *   - Incident Submitted (confirmation)
 *   - Case Status Updated (status changes)
 *   - Mediation Scheduled (date/time/mediator)
 *   - Resolution Completed (case closure)
 *
 * Backend email service configuration in .env:
 *   VITE_EMAIL_API_URL=<supabase-edge-function-url>
 *   VITE_EMAIL_API_KEY=<optional-not-needed-for-supabase>
 */
const useComplainantEmail = (incidentId) => {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  // ── Get incident details for email context ─────────────────────────────────

  const getIncidentDetails = useCallback(async () => {
    if (!incidentId) return null

    const { data, error: fetchError } = await supabase
      .from('incidents')
      .select('id, incident_number, incident_type, location, complainant_name, status')
      .eq('id', incidentId)
      .single()

    if (fetchError) {
      console.error('Failed to fetch incident details:', fetchError)
      return null
    }

    return data
  }, [incidentId])

  // ── Helper: Send email via API ─────────────────────────────────────────────

  const sendEmail = useCallback(async (toEmail, subject, body) => {
    if (!toEmail?.trim()) {
      console.error('[useComplainantEmail] No email address provided')
      return { error: 'Complainant email address is required.' }
    }

    console.log('[useComplainantEmail] Starting email send to:', toEmail)
    
    setSending(true)
    setError(null)

    try {
      const emailApiUrl = import.meta.env.VITE_EMAIL_API_URL
      console.log('[useComplainantEmail] Email API URL:', emailApiUrl)
      
      if (!emailApiUrl) {
        console.warn('[useComplainantEmail] Email API URL not configured. Email notification skipped.')
        setSending(false)
        return { error: null } // Non-fatal: don't block workflow on email
      }

      const payload = {
        to: toEmail.trim(),
        subject: subject,
        body: body,
        html: body, // Backend can use either plain text or HTML
      }

      console.log('[useComplainantEmail] Email payload:', {
        to: payload.to,
        subject: payload.subject,
        bodyLength: payload.body.length
      })

      // Add auth key if configured
      const emailApiKey = import.meta.env.VITE_EMAIL_API_KEY
      const headers = {
        'Content-Type': 'application/json',
      }
      if (emailApiKey) {
        headers['Authorization'] = `Bearer ${emailApiKey}`
      }

      console.log('[useComplainantEmail] Sending fetch request to:', emailApiUrl)
      
      const response = await fetch(emailApiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
      })

      console.log('[useComplainantEmail] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[useComplainantEmail] Email API error:', errorData)
        const msg = errorData.message || `Email API error: ${response.status}`
        setSending(false)
        setError(msg)
        return { error: msg }
      }

      const responseData = await response.json().catch(() => ({}))
      console.log('[useComplainantEmail] Email sent successfully:', responseData)

      setSending(false)
      return { error: null }
    } catch (err) {
      console.error('[useComplainantEmail] Fetch error:', err)
      setSending(false)
      const msg = err.message || 'Failed to send email.'
      setError(msg)
      return { error: msg }
    }
  }, [])

  // ── REDEF Demo Email Templates ─────────────────────────────────────────────

  /**
   * [REDEF #1] Send confirmation email when incident is first submitted.
   * @param {string} complainantEmail
   * @param {object} incidentData - Optional: pass incident data directly to avoid refetch
   * @returns {{ error: string|null }}
   */
  const sendIncidentSubmitted = async (complainantEmail, incidentData = null) => {
    // Use provided incident data or fetch it
    const incident = incidentData || await getIncidentDetails()
    if (!incident) {
      return { error: 'Could not retrieve incident details.' }
    }

    const subject = `LEIRS: Incident Report Received - ${incident.incident_number}`
    const body = `
Dear ${incident.complainant_name || 'Valued Citizen'},

Thank you for submitting your incident report to the LEIRS system.

Your Incident Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference Number: ${incident.incident_number}
Incident Type: ${incident.incident_type}
Location: ${incident.location}
Status: ${incident.status || 'Pending'}
Date Reported: ${new Date().toLocaleDateString('en-PH', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Your report has been successfully recorded and will be reviewed by our team.

You can track your incident status anytime using your reference number: ${incident.incident_number}

We will notify you of any updates or when further action is required.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Barangay LEIRS Team
Law Enforcement and Incident Reporting System

Note: Please keep your reference number for future correspondence.
    `.trim()

    return sendEmail(complainantEmail, subject, body)
  }

  /**
   * [REDEF #2] Send email when case status changes.
   * @param {string} complainantEmail
   * @param {string} previousStatus
   * @param {string} newStatus
   * @returns {{ error: string|null }}
   */
  const sendStatusUpdate = async (complainantEmail, previousStatus, newStatus) => {
    const incident = await getIncidentDetails()
    if (!incident) {
      return { error: 'Could not retrieve incident details.' }
    }

    const subject = `LEIRS: Status Update - ${incident.incident_number}`
    const body = `
Dear ${incident.complainant_name || 'Valued Citizen'},

The status of your incident report has been updated.

Reference Number: ${incident.incident_number}
Incident Type: ${incident.incident_type}

Status Update:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Previous Status: ${previousStatus}
Current Status: ${newStatus}
Updated: ${new Date().toLocaleDateString('en-PH', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

${newStatus === 'Under Investigation' ? 'Your case is now being actively investigated by our team.' : ''}
${newStatus === 'For Mediation' ? 'Your case has been scheduled for mediation. You will receive separate notification with the schedule details.' : ''}
${newStatus === 'Resolved' ? 'Your case has been resolved. Thank you for your patience throughout this process.' : ''}
${newStatus === 'Closed' ? 'Your case has been officially closed. If you have concerns, please contact our office.' : ''}

You can track your case progress using reference number: ${incident.incident_number}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Barangay LEIRS Team
Law Enforcement and Incident Reporting System
    `.trim()

    return sendEmail(complainantEmail, subject, body)
  }

  /**
   * [DEPRECATED] Send email when incident is forwarded to case documentation.
   * Use sendIncidentSubmitted() for REDEF demo instead.
   * @param {string} complainantEmail
   * @returns {{ error: string|null }}
   */
  const sendIncidentForwarded = async (complainantEmail) => {
    const incident = await getIncidentDetails()
    if (!incident) {
      return { error: 'Could not retrieve incident details.' }
    }

    const subject = `LEIRS: Your Incident ${incident.incident_number} Has Been Forwarded`
    const body = `
Dear ${incident.complainant_name || 'Valued Complainant'},

Your incident report (${incident.incident_number}) regarding ${incident.incident_type} at ${incident.location} has been received and forwarded to our Case Administration Department for processing.

Your reference number is: ${incident.incident_number}

You can track the status of your case using this reference number on our website.

Thank you for reporting this matter to us.

Best regards,
LEIRS System
Law Enforcement and Incident Reporting System
    `.trim()

    return sendEmail(complainantEmail, subject, body)
  }

  /**
   * Send email when summons is issued to respondent.
   * @param {string} complainantEmail
   * @returns {{ error: string|null }}
   */
  const sendSummonsIssued = async (complainantEmail) => {
    const incident = await getIncidentDetails()
    if (!incident) {
      return { error: 'Could not retrieve incident details.' }
    }

    const subject = `LEIRS: Summons Issued for Incident ${incident.incident_number}`
    const body = `
Dear ${incident.complainant_name || 'Valued Complainant'},

A summons has been issued to the respondent in your case (${incident.incident_number}).

The respondent has been formally notified and must comply with the summons.

Your reference number is: ${incident.incident_number}

For more information, you can track your case status on our website.

Best regards,
LEIRS System
Law Enforcement and Incident Reporting System
    `.trim()

    return sendEmail(complainantEmail, subject, body)
  }

  /**
   * Send email when barangay hearing is scheduled.
   * @param {string} complainantEmail
   * @param {{
   *   scheduled_date?: string,
   *   scheduled_time?: string,
   *   location?: string
   * }} hearingDetails
   * @returns {{ error: string|null }}
   */
  const sendHearingScheduled = async (complainantEmail, hearingDetails = {}) => {
    const incident = await getIncidentDetails()
    if (!incident) {
      return { error: 'Could not retrieve incident details.' }
    }

    const dateStr = hearingDetails.scheduled_date ? new Date(hearingDetails.scheduled_date).toLocaleDateString('en-PH') : 'TBD'
    const timeStr = hearingDetails.scheduled_time || 'TBD'
    const locStr = hearingDetails.location || 'To be confirmed'

    const subject = `LEIRS: Barangay Hearing Scheduled for Incident ${incident.incident_number}`
    const body = `
Dear ${incident.complainant_name || 'Valued Complainant'},

A barangay hearing has been scheduled for your case (${incident.incident_number}).

Hearing Details:
- Date: ${dateStr}
- Time: ${timeStr}
- Location: ${locStr}

Please ensure your attendance at the scheduled hearing. Contact the barangay office if you have any questions or need to reschedule.

Your reference number is: ${incident.incident_number}

Best regards,
LEIRS System
Law Enforcement and Incident Reporting System
    `.trim()

    return sendEmail(complainantEmail, subject, body)
  }

  /**
   * Send email when mediation is scheduled.
   * @param {string} complainantEmail
   * @param {{
   *   mediation_date?: string,
   *   mediator_name?: string
   * }} mediationDetails
   * @returns {{ error: string|null }}
   */
  const sendMediationScheduled = async (complainantEmail, mediationDetails = {}) => {
    const incident = await getIncidentDetails()
    if (!incident) {
      return { error: 'Could not retrieve incident details.' }
    }

    const dateStr = mediationDetails.mediation_date ? new Date(mediationDetails.mediation_date).toLocaleDateString('en-PH') : 'TBD'
    const mediatorStr = mediationDetails.mediator_name || 'To be assigned'

    const subject = `LEIRS: Lupon Mediation Scheduled for Incident ${incident.incident_number}`
    const body = `
Dear ${incident.complainant_name || 'Valued Complainant'},

A formal mediation session (Lupon process) has been scheduled for your case (${incident.incident_number}).

Mediation Details:
- Date: ${dateStr}
- Mediator: ${mediatorStr}

This mediation is part of our alternative dispute resolution process. Your cooperation in this process is appreciated.

Please contact the barangay office if you have any questions.

Your reference number is: ${incident.incident_number}

Best regards,
LEIRS System
Law Enforcement and Incident Reporting System
    `.trim()

    return sendEmail(complainantEmail, subject, body)
  }

  /**
   * [REDEF #4] Send email when case is resolved/closed.
   * @param {string} complainantEmail
   * @param {{
   *   resolution_type?: string,
   *   notes?: string
   * }} resolutionDetails
   * @returns {{ error: string|null }}
   */
  const sendResolutionCompleted = async (complainantEmail, resolutionDetails = {}) => {
    const incident = await getIncidentDetails()
    if (!incident) {
      return { error: 'Could not retrieve incident details.' }
    }

    const subject = `LEIRS: Case Resolution - ${incident.incident_number}`
    const body = `
Dear ${incident.complainant_name || 'Valued Citizen'},

Your case has been resolved and officially closed.

Reference Number: ${incident.incident_number}
Incident Type: ${incident.incident_type}
Resolution Date: ${new Date().toLocaleDateString('en-PH', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

Resolution Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${resolutionDetails.resolution_type ? `Resolution Type: ${resolutionDetails.resolution_type}` : ''}
${resolutionDetails.notes ? `\n${resolutionDetails.notes}` : 'Your case has been successfully resolved.'}

Thank you for your patience and cooperation throughout this process. 

If you have any questions or concerns about the resolution, please contact our office with your reference number.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Barangay LEIRS Team
Law Enforcement and Incident Reporting System

Your feedback helps us improve our services.
    `.trim()

    return sendEmail(complainantEmail, subject, body)
  }

  /**
   * [DEPRECATED - Use sendResolutionCompleted for REDEF]
   * Legacy function name maintained for backward compatibility.
   */
  const sendCaseResolved = sendResolutionCompleted

  /**
   * Send a custom email with user-provided subject and body.
   * @param {string} complainantEmail
   * @param {string} subject
   * @param {string} body
   * @returns {{ error: string|null }}
   */
  const sendCustom = async (complainantEmail, subject, body) => {
    if (!subject?.trim()) {
      return { error: 'Email subject is required.' }
    }
    if (!body?.trim()) {
      return { error: 'Email body is required.' }
    }

    return sendEmail(complainantEmail, subject.trim(), body.trim())
  }

  return {
    sending,
    error,
    // REDEF Demo - Essential Notifications
    sendIncidentSubmitted,
    sendStatusUpdate,
    sendMediationScheduled,
    sendResolutionCompleted,
    // Legacy functions (maintained for backward compatibility)
    sendIncidentForwarded,
    sendSummonsIssued,
    sendHearingScheduled,
    sendCaseResolved,
    // Custom email
    sendCustom,
  }
}

export default useComplainantEmail
