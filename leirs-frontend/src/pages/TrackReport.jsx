import React, { useState } from 'react'
import { Search, Calendar, Building2, Clock, ArrowLeft, AlertCircle, Tag, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  'Pending':             'bg-yellow-100 text-yellow-700',
  'Under Investigation': 'bg-blue-100 text-blue-700',
  'For Mediation':       'bg-purple-100 text-purple-700',
  'Resolved':            'bg-green-100 text-green-700',
  'Closed':              'bg-gray-100 text-gray-600',
}

const formatDate = (val) => {
  if (!val) return '—'
  return new Date(val + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

const formatDateTime = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Only these columns are fetched — no PII (complainant name/contact/description
// are deliberately excluded from the public tracking query).
const PUBLIC_COLUMNS = [
  'incident_number',
  'incident_type',
  'incident_date',
  'location',
  'status',
  'priority',
  'assigned_officer',
  'created_at',
  'updated_at',
].join(', ')

// ── component ─────────────────────────────────────────────────────────────────

const TrackReport = () => {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [referencePin, setReferencePin]     = useState('')
  const [result, setResult]                 = useState(null)
  const [error, setError]                   = useState('')
  const [isSearching, setIsSearching]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)

    const incidentNumber = trackingNumber.trim().toUpperCase()
    const pin            = referencePin.trim()

    // Basic client-side validation before hitting Supabase
    if (!incidentNumber) {
      setError('Please enter your tracking number.')
      return
    }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('Please enter a valid 6-digit reference PIN.')
      return
    }

    setIsSearching(true)

    // Query: both incident_number AND reference_pin must match the same row.
    // Only non-sensitive columns are selected — no complainant name, contact,
    // narrative, or other PII is returned to the public tracking page.
    const { data, error: fetchError } = await supabase
      .from('incidents')
      .select(PUBLIC_COLUMNS)
      .eq('incident_number', incidentNumber)
      .eq('reference_pin', pin)
      .maybeSingle()

    setIsSearching(false)

    if (fetchError) {
      setError('Unable to retrieve your report. Please try again later.')
      return
    }

    if (!data) {
      // No row found — either wrong number, wrong PIN, or the incident was
      // submitted before the reference_pin column existed.
      setError('Invalid incident number or PIN. Please check your credentials and try again.')
      return
    }

    setResult(data)
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setTrackingNumber('')
    setReferencePin('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="text-center mb-10">
        <h1 className="font-heading text-3xl font-bold text-text mb-3">Track Your Incident Report</h1>
        <p className="text-muted">Enter your tracking number and reference PIN to check your report status</p>
      </div>

        {/* ── Search form (always visible unless a result is showing) ── */}
        {!result ? (
          <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block text-sm font-medium text-text mb-2">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., LEIRS-2026-0805-042"
                  className="input-field"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Reference PIN (6 digits)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={referencePin}
                  onChange={(e) => setReferencePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit PIN"
                  maxLength={6}
                  className="input-field tracking-widest"
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSearching ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Track Report
                  </>
                )}
              </button>
            </form>
          </div>

        ) : (
          /* ── Result panel ── */
          <div className="space-y-6">

            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Track Another Report
            </button>

            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">

              {/* Result header */}
              <div className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm text-muted mb-1">Tracking Number</p>
                    <p className="font-heading font-bold text-xl text-text font-mono">
                      {result.incident_number}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${STATUS_COLORS[result.status] || 'bg-gray-100 text-gray-600'}`}>
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Result body */}
              <div className="p-6 space-y-6">

                <div className="grid sm:grid-cols-2 gap-6">

                  {/* Incident type */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tag size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Incident Type</p>
                      <p className="font-medium text-text">{result.incident_type}</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Location</p>
                      <p className="font-medium text-text">{result.location}</p>
                    </div>
                  </div>

                  {/* Assigned office */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Assigned Officer</p>
                      <p className="font-medium text-text">
                        {result.assigned_officer || 'Pending assignment'}
                      </p>
                    </div>
                  </div>

                  {/* Date submitted */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Date Submitted</p>
                      <p className="font-medium text-text">{formatDate(result.incident_date)}</p>
                    </div>
                  </div>

                </div>

                {/* Last updated */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted mb-1">Last Updated</p>
                      <p className="text-text leading-relaxed">{formatDateTime(result.updated_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Status guidance */}
                <div className="p-4 bg-background rounded-xl border border-border text-sm text-muted">
                  {result.status === 'Pending' && (
                    <p>Your report has been received and is awaiting review by barangay staff.</p>
                  )}
                  {result.status === 'Under Investigation' && (
                    <p>Your case is currently being investigated by an assigned officer.</p>
                  )}
                  {result.status === 'For Mediation' && (
                    <p>Your case has been scheduled for mediation. You will be contacted by barangay staff.</p>
                  )}
                  {result.status === 'Resolved' && (
                    <p>Your case has been resolved. Thank you for reporting.</p>
                  )}
                  {result.status === 'Closed' && (
                    <p>This case has been closed. Contact the barangay hall for further information.</p>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    
  )
}

export default TrackReport
