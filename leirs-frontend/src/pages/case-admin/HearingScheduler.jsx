import React, { useState } from 'react'
import {
  Calendar, Clock, MapPin, AlertCircle, CheckCircle,
  Plus, Edit2, Trash2, Users, Mail
} from 'lucide-react'
import useCaseStages from '../../hooks/useCaseStages'
import useComplainantEmail from '../../hooks/useComplainantEmail'

/**
 * HearingScheduler Component
 * Manage barangay hearings (mediation sessions with complainant and respondent)
 * 
 * @param {string} incidentId - The incident UUID
 */
const HearingScheduler = ({ incidentId }) => {
  const { stages, loading, saving, error, fetchStages, addHearing, updateHearing, deleteHearing } = useCaseStages(incidentId)
  const { sending: sendingEmail, sendHearingScheduled } = useComplainantEmail(incidentId)
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [sendEmailAfterSave, setSendEmailAfterSave] = useState(false)
  const [complainantEmailForNotification, setComplainantEmailForNotification] = useState('')
  const [formData, setFormData] = useState({
    hearing_date: '',
    hearing_time: '',
    hearing_location: '',
    barangay_official: '',
    attendees_complainant: false,
    attendees_respondent: false,
    notes: ''
  })
  const [formError, setFormError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  // ── Form handling ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      hearing_date: '',
      hearing_time: '',
      hearing_location: '',
      barangay_official: '',
      attendees_complainant: false,
      attendees_respondent: false,
      notes: ''
    })
    setFormError(null)
    setEditingId(null)
    setShowForm(false)
    setSendEmailAfterSave(false)
    setComplainantEmailForNotification('')
  }

  const startEdit = (hearing) => {
    setFormData({
      hearing_date: hearing.scheduled_date || '',
      hearing_time: hearing.scheduled_time || '',
      hearing_location: hearing.location || '',
      barangay_official: hearing.presiding_official || '',
      attendees_complainant: hearing.attendees_complainant || false,
      attendees_respondent: hearing.attendees_respondent || false,
      notes: hearing.notes || ''
    })
    setEditingId(hearing.id)
    setShowForm(true)
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.hearing_date) {
      setFormError('Hearing date is required.')
      return
    }
    if (!formData.hearing_time) {
      setFormError('Hearing time is required.')
      return
    }
    if (!formData.hearing_location?.trim()) {
      setFormError('Hearing location is required.')
      return
    }
    if (!formData.barangay_official?.trim()) {
      setFormError('Barangay official/mediator name is required.')
      return
    }

    // If email notification enabled, require email
    if (sendEmailAfterSave && !complainantEmailForNotification?.trim()) {
      setFormError('Complainant email is required to send notification.')
      return
    }

    const hearingData = {
      scheduled_date: formData.hearing_date,
      scheduled_time: formData.hearing_time,
      location: formData.hearing_location.trim(),
      presiding_official: formData.barangay_official.trim(),
      attendees_complainant: formData.attendees_complainant,
      attendees_respondent: formData.attendees_respondent,
      notes: formData.notes.trim() || null
    }

    let result
    if (editingId) {
      result = await updateHearing(editingId, hearingData)
    } else {
      result = await addHearing(hearingData)
    }

    if (result.error) {
      setFormError(result.error)
      return
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)

    // Send email notification if requested
    if (sendEmailAfterSave && complainantEmailForNotification?.trim()) {
      const emailResult = await sendHearingScheduled(
        complainantEmailForNotification.trim(),
        {
          scheduled_date: formData.hearing_date,
          scheduled_time: formData.hearing_time,
          location: formData.hearing_location
        }
      )

      if (!emailResult.error) {
        setEmailSuccess(true)
        setTimeout(() => setEmailSuccess(false), 3000)
      } else {
        // Email error is non-fatal
        alert(`Hearing scheduled but email notification failed: ${emailResult.error}`)
      }
    }

    resetForm()
    await fetchStages()
  }

  // ── Delete handling ───────────────────────────────────────────────────────

  const handleDelete = async (hearingId) => {
    if (!window.confirm('Are you sure you want to delete this hearing?')) {
      return
    }

    const result = await deleteHearing(hearingId, 'hearing')
    if (result.error) {
      alert(`Error deleting hearing: ${result.error}`)
    } else {
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000)
      await fetchStages()
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return null
    const [h, m] = timeString.split(':')
    const d = new Date()
    d.setHours(+h, +m)
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  }

  // Get hearings from stages
  const hearings = Array.isArray(stages?.hearings) ? stages.hearings : []

  // ── Render ────────────────────────────────────────────────────────────────

  if (!incidentId) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Hearing Scheduler</h2>
          </div>
        </div>
        <div className="p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-border mb-2" />
          <p className="text-sm text-muted">No incident selected</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Hearing Scheduler</h2>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-3 text-sm text-muted">Loading hearings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Success Messages */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm text-green-800">
            {editingId ? 'Hearing updated successfully' : 'Hearing scheduled successfully'}
          </p>
        </div>
      )}

      {emailSuccess && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Mail size={20} className="text-blue-600" />
          <p className="text-sm text-blue-800">
            Hearing notification email sent to complainant successfully
          </p>
        </div>
      )}

      {deleteSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm text-green-800">Hearing deleted successfully</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Hearings List */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between">
          <h3 className="text-base font-heading font-semibold text-text">
            Barangay Hearings ({hearings.length})
          </h3>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Schedule Hearing
            </button>
          )}
        </div>

        <div className="p-6">
          {hearings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="mx-auto text-border mb-2" />
              <p className="text-sm text-muted">No hearings scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hearings.map(h => (
                <HearingCard
                  key={h.id}
                  hearing={h}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-background">
            <h3 className="text-base font-heading font-semibold text-text">
              {editingId ? 'Edit Hearing' : 'Schedule New Hearing'}
            </h3>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Hearing Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.hearing_date}
                    onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Hearing Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.hearing_time}
                    onChange={(e) => setFormData({ ...formData, hearing_time: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Hearing Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.hearing_location}
                  onChange={(e) => setFormData({ ...formData, hearing_location: e.target.value })}
                  placeholder="e.g., Barangay Hall, Purok 1, Barangay XYZ"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Barangay Official/Mediator <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.barangay_official}
                  onChange={(e) => setFormData({ ...formData, barangay_official: e.target.value })}
                  placeholder="Name and position (e.g., Kagawad John Doe)"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-text">Attendees</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.attendees_complainant}
                      onChange={(e) => setFormData({ ...formData, attendees_complainant: e.target.checked })}
                      className="rounded border border-border"
                    />
                    <span className="text-sm text-text">Complainant Present</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.attendees_respondent}
                      onChange={(e) => setFormData({ ...formData, attendees_respondent: e.target.checked })}
                      className="rounded border border-border"
                    />
                    <span className="text-sm text-text">Respondent Present</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Hearing Notes/Minutes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Summary of hearing, issues discussed, agreements reached..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Email Notification Section */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={sendEmailAfterSave}
                    onChange={(e) => setSendEmailAfterSave(e.target.checked)}
                    className="rounded border border-border"
                  />
                  <span className="text-sm font-medium text-text">Send notification email to complainant</span>
                  <Mail size={14} className="text-primary" />
                </label>
                {sendEmailAfterSave && (
                  <div className="mt-2">
                    <input
                      type="email"
                      value={complainantEmailForNotification}
                      onChange={(e) => setComplainantEmailForNotification(e.target.value)}
                      placeholder="complainant@example.com"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                    <p className="text-xs text-muted mt-1">
                      A notification email will be sent to the complainant with hearing date, time, and location details.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving || sendingEmail}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {editingId ? 'Update Hearing' : 'Schedule Hearing'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-component: HearingCard ────────────────────────────────────────────

const HearingCard = ({ hearing, onEdit, onDelete, formatDate, formatTime }) => {
  return (
    <div className="flex items-start justify-between p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={16} className="text-primary" />
          <p className="font-medium text-text">{formatDate(hearing.scheduled_date)}</p>
          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
            {hearing.document_number}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock size={14} />
            <span>{formatTime(hearing.scheduled_time)}</span>
          </div>
          {hearing.location && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <MapPin size={14} />
              <span>{hearing.location}</span>
            </div>
          )}
          {hearing.presiding_official && (
            <div className="text-sm text-muted ml-6">
              👤 {hearing.presiding_official}
            </div>
          )}
          {(hearing.attendees_complainant || hearing.attendees_respondent) && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Users size={14} />
              <span>
                {[
                  hearing.attendees_complainant && 'Complainant',
                  hearing.attendees_respondent && 'Respondent'
                ].filter(Boolean).join(', ')} present
              </span>
            </div>
          )}
          {hearing.notes && (
            <div className="text-sm text-muted mt-2 p-2 bg-white rounded border border-border">
              {hearing.notes}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={() => onEdit(hearing)}
          className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(hearing.id)}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default HearingScheduler
