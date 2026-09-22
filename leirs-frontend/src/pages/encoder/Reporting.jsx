import React, { useState } from 'react'
import { Save, X, CheckCircle, Copy, Check, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import LocationSearch from '../../components/LocationSearch'

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
    reporterName: '',
    reporterContact: '',
    narrative: '',
    priority: 'Low',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successIncidentNumber, setSuccessIncidentNumber] = useState('')
  const [successReferencePin, setSuccessReferencePin] = useState('')

  const resetForm = () => {
    setFormData({
      type: '',
      location: '',
      locationLat: null,
      locationLng: null,
      reporterName: '',
      reporterContact: '',
      narrative: '',
      priority: 'Low',
    })
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
    setSubmitError('')
    setSuccessIncidentNumber('')

    const incidentType = formData.type.trim()
    const location = formData.location.trim()
    const complainantName = formData.reporterName.trim()
    const complainantContact = formData.reporterContact.trim()
    const description = formData.narrative.trim()

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

      const { error } = await supabase
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
            description,
            priority: formData.priority,
            status: 'Pending',
            assigned_officer: null,
            created_by: createdBy,
            reference_pin: referencePin,
          },
        ])

      if (!error) {
        setSuccessIncidentNumber(incidentNumber)
        setSuccessReferencePin(referencePin)
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

          {/* Credentials */}
          <div className="px-8 py-6 space-y-4">
            <p className="text-sm font-medium text-text">
              Save the details below — you will need them to track this report on the public portal.
            </p>

            {/* Incident Number row */}
            <div className="flex items-center justify-between gap-4 p-4 bg-background rounded-xl border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted font-medium uppercase tracking-wide mb-0.5">
                    Incident Number
                  </p>
                  <p className="font-mono font-bold text-text text-base tracking-wide truncate">
                    {successIncidentNumber}
                  </p>
                </div>
              </div>
              <CopyButton value={successIncidentNumber} />
            </div>

            {/* Reference PIN row */}
            <div className="flex items-center justify-between gap-4 p-4 bg-background rounded-xl border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted font-medium uppercase tracking-wide mb-0.5">
                    Reference PIN
                  </p>
                  <p className="font-mono font-bold text-text text-2xl tracking-[0.35em]">
                    {successReferencePin}
                  </p>
                </div>
              </div>
              <CopyButton value={successReferencePin} />
            </div>

            {/* Warning note */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
              This PIN will not be shown again once you leave this page. Keep it in a safe place.
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
              <div>
                <label className="block text-sm font-medium text-text mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
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
              <div>
                <label className="block text-sm font-medium text-text mb-2">Reporter Name</label>
                <input
                  type="text"
                  value={formData.reporterName}
                  onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
                  className="input-field"
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Reporter Contact</label>
                <input
                  type="text"
                  value={formData.reporterContact}
                  onChange={(e) => setFormData({...formData, reporterContact: e.target.value})}
                  className="input-field"
                  placeholder="Enter contact number"
                  required
                />
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
