import React, { useState } from 'react'
import { X, FileText, MapPin, User, Phone, Calendar, Clock, Tag, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react'

const STATUS_COLORS = {
  'Pending':              'bg-yellow-100 text-yellow-700',
  'Under Investigation':  'bg-blue-100 text-blue-700',
  'For Mediation':        'bg-purple-100 text-purple-700',
  'Resolved':             'bg-green-100 text-green-700',
  'Closed':               'bg-gray-100 text-gray-600',
}

const PRIORITY_COLORS = {
  'Low':    'bg-green-100 text-green-700',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'High':   'bg-orange-100 text-orange-700',
  'Urgent': 'bg-red-100 text-red-700',
}

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={15} className="text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-text mt-0.5">{value || <span className="text-muted italic">Not provided</span>}</p>
    </div>
  </div>
)

// ── PIN field — hidden by default, toggled by authorised staff only ───────────
const PinField = ({ pin }) => {
  const [visible, setVisible] = useState(false)

  if (!pin) return null

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <KeyRound size={15} className="text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted font-medium uppercase tracking-wide">Reference PIN</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm text-text font-mono tracking-[0.3em]">
            {visible ? pin : '••••••'}
          </p>
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border border-border rounded text-muted hover:text-primary hover:border-primary transition-colors"
          >
            {visible ? <EyeOff size={11} /> : <Eye size={11} />}
            {visible ? 'Hide' : 'Show PIN'}
          </button>
        </div>
        {visible && (
          <p className="text-xs text-muted mt-1">
            Share this PIN only with the complainant. Do not expose it publicly.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

/**
 * @param {object}  incident  — full incident row from Supabase
 * @param {boolean} showPin   — pass true for Encoder/Admin views; omit for public views
 * @param {func}    onClose
 */
const ViewIncidentModal = ({ incident, onClose, showPin = false }) => {
  if (!incident) return null

  const statusClass   = STATUS_COLORS[incident.status]   || 'bg-gray-100 text-gray-600'
  const priorityClass = PRIORITY_COLORS[incident.priority] || 'bg-gray-100 text-gray-600'

  const formatDate = (val) => {
    if (!val) return null
    return new Date(val + 'T00:00:00').toLocaleDateString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  }

  const formatTime = (val) => {
    if (!val) return null
    const [h, m] = val.split(':')
    const date = new Date()
    date.setHours(Number(h), Number(m))
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  }

  const formatCreatedAt = (val) => {
    if (!val) return null
    return new Date(val).toLocaleString('en-PH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wide">Incident Report</p>
            <h2 className="text-lg font-heading font-bold text-text">{incident.incident_number}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
              {incident.status}
            </span>
            <button
              onClick={onClose}
              className="ml-2 p-1.5 rounded-lg hover:bg-background transition-colors text-muted hover:text-text"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6">

          {/* Incident Details */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-text mb-3">Incident Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={Tag} label="Incident Type" value={incident.incident_type} />
              <Field icon={AlertCircle} label="Priority"
                value={
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityClass}`}>
                    {incident.priority}
                  </span>
                }
              />
              <Field icon={Calendar} label="Date"     value={formatDate(incident.incident_date)} />
              <Field icon={Clock}    label="Time"     value={formatTime(incident.incident_time)} />
              <Field icon={MapPin}   label="Location" value={incident.location} />
            </div>
          </div>

          <hr className="border-border" />

          {/* Reporter Details */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-text mb-3">Reporter Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={User}  label="Reporter Name"    value={incident.complainant_name} />
              <Field icon={Phone} label="Reporter Contact" value={incident.complainant_contact} />
            </div>
          </div>

          {/* Reference PIN — only for authorised staff */}
          {showPin && incident.reference_pin && (
            <>
              <hr className="border-border" />
              <div>
                <h3 className="text-sm font-heading font-semibold text-text mb-3">Tracking Credentials</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={Tag} label="Incident Number" value={incident.incident_number} />
                  <PinField pin={incident.reference_pin} />
                </div>
              </div>
            </>
          )}

          {/* Narrative */}
          {incident.description && (
            <>
              <hr className="border-border" />
              <div>
                <h3 className="text-sm font-heading font-semibold text-text mb-3">Narrative</h3>
                <div className="bg-background rounded-lg p-4">
                  <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{incident.description}</p>
                </div>
              </div>
            </>
          )}

          {/* Meta */}
          <hr className="border-border" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted">
            <div>
              <span className="font-medium">Encoded by: </span>
              {incident.created_by || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Created: </span>
              {formatCreatedAt(incident.created_at)}
            </div>
            {incident.assigned_officer && (
              <div>
                <span className="font-medium">Assigned Officer: </span>
                {incident.assigned_officer}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-background transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewIncidentModal
