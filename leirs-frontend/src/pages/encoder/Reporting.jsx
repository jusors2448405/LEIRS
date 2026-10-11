import React, { useState } from 'react'
import { Save, X, CheckCircle, Copy, Check, FileText, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import LocationSearch from '../../components/LocationSearch'
import useComplainantEmail from '../../hooks/useComplainantEmail'

// ── CopyButton: shows a tick for 2 seconds after copying ─────────────────────
const CopyButton = ({ value }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
        copied
          ? 'border-green-300 bg-green-100 text-green-700'
          : 'border-green-300 bg-white text-green-700 hover:bg-green-50'
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const Reporting = () => {
  const [formData, setFormData] = useState({
    type: '',
    location: '',
    locationLat: null,
    locationLng: null,
    complainantName: '',
    complainantContact: '',
    complainantEmail: '',
    complainantAddress: '',
    respondentName: '',
    respondentContact: '',
    respondentAddress: '',
    narrative: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successIncidentNumber, setSuccessIncidentNumber] = useState('')
  const [successReferencePin, setSuccessReferencePin] = useState('')
  const [createdIncidentId, setCreatedIncidentId] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState(null)

  // Initialize email hook
  const { sendIncidentSubmitted, sending: sendingEmail } = useComplainantEmail(createdIncidentId)

  const resetForm = () => {
    setFormData({
      type: '',
      location: '',
      locationLat: null,
      locationLng: null,
      complainantName: '',
      complainantContact: '',
      complainantEmail: '',
      complainantAddress: '',
      respondentName: '',
      respondentContact: '',
      respondentAddress: '',
      narrative: '',
    })
    setCreatedIncidentId(null)
    setEmailSent(false)
    setEmailError(null)
  }

  const formatDateForIncidentNumber = (date) => {
    const yyyy = String(date.getFullYear())
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return { yyyy, mmdd: `${mm}${dd}` }
  }

  const getRandomInt = (maxExclusive) => {
    try {
      const arr = new Uint32Array(1)
      crypto.getRandomValues(arr)
      return arr[0] % maxExclusive
    } catch {
      return Math.floor(Math.random() * maxExclusive)
    }
  }

  const generateIncidentNumber = () => {
    const now = new Date()
    const { yyyy, mmdd } = formatDateForIncidentNumber(now)
    const seq = String(getRandomInt(1000)).padStart(3, '0')
    return `LEIRS-${yyyy}-${mmdd}-${seq}`
  }

  // Generates a cryptographically random 6-digit zero-padded PIN string.
  // Stored as text so leading zeros are preserved ("004821").
  const generateReferencePin = () => {
    try {
      const arr = new Uint32Array(1)
      crypto.getRandomValues(arr)
      return String(arr[0] % 1000000).padStart(6, '0')
    } catch {
      return String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    console.log('=== FORM SUBMISSION STARTED (Reporting.jsx) ===')
    console.log('Form data:', formData)
    console.log('complainantEmail field:', formData.complainantEmail)
    
    setSubmitError('')
    setSuccessIncidentNumber('')
    setEmailSent(false)
    setEmailError(null)

    const incidentType = formData.type.trim()
    const location = formData.location.trim()
    const complainantName = formData.complainantName.trim()
    const complainantContact = formData.complainantContact.trim()
    const complainantEmail = formData.complainantEmail.trim()
    const description = formData.narrative.trim()
    
    console.log('=== EXTRACTED VALUES ===')
    console.log('complainantEmail:', complainantEmail)
    console.log('complainantName:', complainantName)
    console.log('incidentType:', incidentType)

    if (!incidentType || !location || !complainantName || !complainantContact || !description) {
      setSubmitError('Please complete all required fields.')
      return
    }

    const today = new Date()
    const incidentDate = today.toISOString().slice(0, 10)

    let createdBy = null
    try {
      const rawUser = localStorage.getItem('leirs_user')
      if (rawUser) {
        const user = JSON.parse(rawUser)
        createdBy = user?.email || user?.name || null
      }
    } catch {
      createdBy = null
    }

    setIsSubmitting(true)

    let lastError = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const incidentNumber = generateIncidentNumber()
      const referencePin   = generateReferencePin()

      const { data: createdIncident, error } = await supabase
        .from('incidents')
        .insert([
          {
            incident_number: incidentNumber,
            incident_type: incidentType,
            incident_date: incidentDate,
            incident_time: null,
            location,
            location_latitude: formData.locationLat,
            location_longitude: formData.locationLng,
            complainant_name: complainantName,
            complainant_contact: complainantContact,
            complainant_email: complainantEmail || null,
            complainant_address: formData.complainantAddress.trim() || null,
            respondent_name: formData.respondentName.trim() || null,
            respondent_contact: formData.respondentContact.trim() || null,
            respondent_address: formData.respondentAddress.trim() || null,
            description,
            priority: 'Low',
            status: 'Pending',
            assigned_officer: null,
            created_by: createdBy,
            reference_pin: referencePin,
          },
        ])
        .select()
        .single()

      if (!error && createdIncident) {
        console.log('=== INCIDENT CREATED SUCCESSFULLY ===')
        console.log('Created incident data:', createdIncident)
        
        setSuccessIncidentNumber(incidentNumber)
        setSuccessReferencePin(referencePin)
        setCreatedIncidentId(createdIncident.id)
        
        console.log('=== EMAIL NOTIFICATION CHECK ===')
        console.log('complainantEmail value:', complainantEmail)
        console.log('complainantEmail type:', typeof complainantEmail)
        console.log('complainantEmail length:', complainantEmail?.length)
        console.log('Is email truthy?', !!complainantEmail)
        
        // Send email notification (non-blocking)
        if (complainantEmail) {
          console.log('✅ Email condition passed - entering email block')
          console.log('Attempting to send email to:', complainantEmail)
          
          try {
            const incidentDataForEmail = {
              id: createdIncident.id,
              incident_number: createdIncident.incident_number,
              incident_type: createdIncident.incident_type,
              location: createdIncident.location,
              complainant_name: createdIncident.complainant_name,
              status: createdIncident.status
            }
            
            console.log('📧 About to call sendIncidentSubmitted()')
            console.log('Email:', complainantEmail)
            console.log('Incident data:', incidentDataForEmail)
            
            const result = await sendIncidentSubmitted(complainantEmail, incidentDataForEmail)
            
            console.log('📬 sendIncidentSubmitted() returned:', result)
            console.log('Result type:', typeof result)
            console.log('Result keys:', result ? Object.keys(result) : 'null')
            
            if (result?.error) {
              console.error('❌ Email error returned:', result.error)
              setEmailError('Note: Confirmation email could not be sent.')
            } else {
              console.log('✅ Email sent successfully!')
              setEmailSent(true)
            }
          } catch (err) {
            console.error('💥 Exception caught during email send:', err)
            console.error('Error name:', err.name)
            console.error('Error message:', err.message)
            setEmailError('Note: Confirmation email could not be sent.')
          }
        } else {
          console.log('❌ Email condition failed - no email provided')
          console.log('Skipping email notification')
        }
        
        console.log('=== CLEANING UP ===')
        resetForm()
        setIsSubmitting(false)
        return
      }

      lastError = error
      if (error.code !== '23505') break
    }

    setIsSubmitting(false)
    setSubmitError(lastError?.message || 'Failed to save incident report. Please try again.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">New Incident Report</h1>
        <p className="text-muted">Fill out the form to create a new incident report.</p>
      </div>

      {/* ── Success card — shown instead of the form after a successful submit ── */}
      {successIncidentNumber ? (
        <div className="bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm">

          {/* Header strip */}
          <div className="bg-green-50 border-b border-green-200 px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-green-800">
                Incident report submitted successfully!
              </h2>
              <p className="text-sm text-green-700 mt-0.5">
                Your report has been received and is now pending review.
              </p>
            </div>
          </div>

          {/* Email Confirmation */}
          <div className="px-8 py-6 space-y-4">
            {emailSent && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                <Mail size={16} className="text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  Confirmation email sent successfully! Check your inbox.
                </p>
              </div>
            )}

            {emailError && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                <Mail size={16} className="text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  {emailError}
                </p>
              </div>
            )}
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-2">
                {emailSent 
                  ? 'Email notifications enabled for this incident' 
                  : 'Check your email for updates regarding your report.'}
              </p>
              <p className="text-sm text-blue-800">
                {emailSent
                  ? 'You will receive email updates for important status changes.'
                  : 'Updates will be sent to the email address you provided during the report submission.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-5 border-t border-border flex flex-wrap gap-3 justify-end bg-white">
            <button
              type="button"
              onClick={() => {
                setSuccessIncidentNumber('')
                setSuccessReferencePin('')
                setSubmitError('')
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              Submit Another Report
            </button>
          </div>
        </div>

      ) : (

        /* ── Form ── */
        <div className="bg-white border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Incident Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select type</option>
                  <option value="Theft">Theft</option>
                  <option value="Assault">Assault</option>
                  <option value="Vandalism">Vandalism</option>
                  <option value="Noise Complaint">Noise Complaint</option>
                  <option value="Traffic Violation">Traffic Violation</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Location</label>
                <LocationSearch
                  value={formData.location}
                  onLocationSelect={(loc) => setFormData({
                    ...formData,
                    location: loc.address,
                    locationLat: loc.latitude,
                    locationLng: loc.longitude
                  })}
                  required
                />
              </div>
            </div>

            {/* Complainant Information Section */}
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium text-text mb-4">Complainant Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Complainant Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.complainantName}
                    onChange={(e) => setFormData({...formData, complainantName: e.target.value})}
                    className="input-field"
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Contact Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.complainantContact}
                    onChange={(e) => setFormData({...formData, complainantContact: e.target.value})}
                    className="input-field"
                    placeholder="Enter contact number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={formData.complainantEmail}
                    onChange={(e) => setFormData({...formData, complainantEmail: e.target.value})}
                    className="input-field"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Address (Optional)</label>
                  <input
                    type="text"
                    value={formData.complainantAddress}
                    onChange={(e) => setFormData({...formData, complainantAddress: e.target.value})}
                    className="input-field"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Respondent Details Section */}
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-medium text-text mb-4">Respondent Details (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Respondent Name</label>
                  <input
                    type="text"
                    value={formData.respondentName}
                    onChange={(e) => setFormData({...formData, respondentName: e.target.value})}
                    className="input-field"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Respondent Contact</label>
                  <input
                    type="text"
                    value={formData.respondentContact}
                    onChange={(e) => setFormData({...formData, respondentContact: e.target.value})}
                    className="input-field"
                    placeholder="Enter contact number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text mb-2">Respondent Address</label>
                  <input
                    type="text"
                    value={formData.respondentAddress}
                    onChange={(e) => setFormData({...formData, respondentAddress: e.target.value})}
                    className="input-field"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Narrative</label>
              <textarea
                value={formData.narrative}
                onChange={(e) => setFormData({...formData, narrative: e.target.value})}
                className="input-field min-h-32"
                placeholder="Describe the incident in detail"
                required
              />
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => {
                  setSubmitError('')
                  setSuccessIncidentNumber('')
                  setSuccessReferencePin('')
                  resetForm()
                }}
                className="px-6 py-2.5 border border-border rounded-lg font-medium text-text hover:bg-background transition-colors flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
              <button type="submit" className="btn-primary flex items-center gap-2" disabled={isSubmitting}>
                <Save size={18} />
                {isSubmitting ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Reporting
