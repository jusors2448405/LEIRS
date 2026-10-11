import React, { useState } from 'react'
import {
  CheckCircle as CheckCircleIcon, AlertCircle, Save, Radio,
  XCircle, Plus, Edit2, Trash2, Mail
} from 'lucide-react'
import useCaseStages from '../../hooks/useCaseStages'
import useComplainantEmail from '../../hooks/useComplainantEmail'
import { supabase } from '../../lib/supabase'

/**
 * ResolutionForm Component
 * Log case resolution outcomes (mediation successful, PNP referral, etc.)
 * 
 * @param {string} incidentId - The incident UUID
 */
const ResolutionForm = ({ incidentId }) => {
  const { stages, loading, saving, error, refetchAll, addResolution, updateResolution } = useCaseStages(incidentId)
  const { sending: sendingEmail, sendCaseResolved, sendCustom } = useComplainantEmail(incidentId)
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [sendEmailAfterSave, setSendEmailAfterSave] = useState(true) // Default to checked
  const [complainantEmailForNotification, setComplainantEmailForNotification] = useState('')
  const [complainantEmailFromIncident, setComplainantEmailFromIncident] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [formData, setFormData] = useState({
    resolution_date: '',
    resolution_type: 'Mediation Successful',
    description: '',
    referral_agency: '',
    referral_reason: '',
    recommendations: ''
  })
  const [formError, setFormError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const RESOLUTION_TYPES = [
    { value: 'Mediation Successful', label: 'Mediation Successful' },
    { value: 'Arbitration', label: 'Arbitration' },
    { value: 'Dismissed', label: 'Dismissed' },
    { value: 'Withdrawn', label: 'Withdrawn' },
    { value: 'Referred to Court', label: 'Referred to Court' },
    { value: 'Other', label: 'Other' }
  ]

  // ── Fetch complainant email from incident ──────────────────────────────────

  React.useEffect(() => {
    const fetchComplainantEmail = async () => {
      if (!incidentId) {
        setComplainantEmailFromIncident('')
        return
      }

      setLoadingEmail(true)
      const { data, error } = await supabase
        .from('incidents')
        .select('complainant_email')
        .eq('id', incidentId)
        .single()

      if (!error && data?.complainant_email) {
        setComplainantEmailFromIncident(data.complainant_email)
        // Auto-populate the manual field with the fetched email
        setComplainantEmailForNotification(data.complainant_email)
      } else {
        setComplainantEmailFromIncident('')
        console.warn('No complainant email found for incident:', incidentId)
      }
      setLoadingEmail(false)
    }

    fetchComplainantEmail()
  }, [incidentId])

  // ── Form handling ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      resolution_date: '',
      resolution_type: 'Mediation Successful',
      description: '',
      referral_agency: '',
      referral_reason: '',
      recommendations: ''
    })
    setFormError(null)
    setEditingId(null)
    setShowForm(false)
    setSendEmailAfterSave(false)
    setComplainantEmailForNotification('')
  }

  const startEdit = (resolution) => {
    setFormData({
      resolution_date: resolution.resolution_date || '',
      resolution_type: resolution.resolution_type || 'Mediation Successful',
      description: resolution.description || '',
      referral_agency: resolution.referral_agency || '',
      referral_reason: resolution.referral_reason || '',
      recommendations: resolution.recommendations || ''
    })
    setEditingId(resolution.id)
    setShowForm(true)
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.resolution_date) {
      setFormError('Resolution date is required.')
      return
    }
    if (!formData.resolution_type) {
      setFormError('Resolution type is required.')
      return
    }
    if (!formData.description?.trim()) {
      setFormError('Resolution description is required.')
      return
    }

    // If email notification enabled, require email
    if (sendEmailAfterSave && !complainantEmailForNotification?.trim()) {
      setFormError('Complainant email is required to send notification.')
      return
    }

    const resolutionData = {
      resolution_date: formData.resolution_date,
      resolution_type: formData.resolution_type,
      resolution_description: formData.description.trim(),
      recommendations: formData.recommendations.trim() || null,
      complainant_email: sendEmailAfterSave ? complainantEmailForNotification.trim() : null
    }

    let result
    if (editingId) {
      result = await updateResolution(editingId, resolutionData)
    } else {
      result = await addResolution(resolutionData)
    }

    if (result.error) {
      setFormError(result.error)
      return
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)

    // Send email notification if requested
    if (sendEmailAfterSave && complainantEmailForNotification?.trim()) {
      const emailResult = await sendCaseResolved(
        complainantEmailForNotification.trim(),
        {
          resolution_type: formData.resolution_type,
          notes: formData.description
        }
      )

      if (!emailResult.error) {
        setEmailSuccess(true)
        setTimeout(() => setEmailSuccess(false), 3000)
      } else {
        // Email error is non-fatal, but inform user
        alert(`Resolution recorded but email notification failed: ${emailResult.error}`)
      }
    }

    resetForm()
    await refetchAll()
  }

  // ── Delete handling ───────────────────────────────────────────────────────

  const handleDelete = async (resolutionId) => {
    if (!window.confirm('Are you sure you want to delete this resolution record?')) {
      return
    }

    const result = await deleteResolution(resolutionId, 'resolution')
    if (result.error) {
      alert(`Error deleting resolution: ${result.error}`)
    } else {
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000)
      await refetchAll()
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

  const getResolutionColor = (type) => {
    switch (type) {
      case 'Mediation Successful':
        return 'bg-green-100 text-green-700'
      case 'Mediation Unsuccessful':
        return 'bg-yellow-100 text-yellow-700'
      case 'Referred to PNP':
      case 'Referred to Prosecutor':
        return 'bg-blue-100 text-blue-700'
      case 'Withdrawn by Complainant':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-purple-100 text-purple-700'
    }
  }

  const getResolutionIcon = (type) => {
    if (type === 'Mediation Successful') {
      return <CheckCircleIcon size={16} />
    } else if (type.includes('Referred')) {
      return <Radio size={16} />
    } else if (type === 'Withdrawn by Complainant') {
      return <XCircle size={16} />
    }
    return <AlertCircle size={16} />
  }

  // Get resolution records from stages
  const resolutions = Array.isArray(stages?.resolutions) ? stages.resolutions : []

  // ── Render ────────────────────────────────────────────────────────────────

  if (!incidentId) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Case Resolution</h2>
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
            <CheckCircleIcon size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Case Resolution</h2>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-3 text-sm text-muted">Loading resolution records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Success Messages */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircleIcon size={20} className="text-green-600" />
          <p className="text-sm text-green-800">
            {editingId ? 'Resolution updated successfully' : 'Resolution recorded successfully'}
          </p>
        </div>
      )}

      {emailSuccess && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Mail size={20} className="text-blue-600" />
          <p className="text-sm text-blue-800">
            Notification email sent to complainant successfully
          </p>
        </div>
      )}

      {deleteSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircleIcon size={20} className="text-green-600" />
          <p className="text-sm text-green-800">Resolution deleted successfully</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Resolution Records List */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between">
          <h3 className="text-base font-heading font-semibold text-text">
            Case Resolutions ({resolutions.length})
          </h3>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Record Resolution
            </button>
          )}
        </div>

        <div className="p-6">
          {resolutions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon size={32} className="mx-auto text-border mb-2" />
              <p className="text-sm text-muted">No resolutions recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resolutions.map(r => (
                <ResolutionCard
                  key={r.id}
                  resolution={r}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                  getResolutionColor={getResolutionColor}
                  getResolutionIcon={getResolutionIcon}
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
              {editingId ? 'Edit Resolution' : 'Record Case Resolution'}
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
                    Resolution Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.resolution_date}
                    onChange={(e) => setFormData({ ...formData, resolution_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Resolution Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.resolution_type}
                    onChange={(e) => setFormData({ ...formData, resolution_type: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {RESOLUTION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Resolution Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of the case outcome and resolution details..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {formData.resolution_type.includes('Referred') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      Referral Agency <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.referral_agency}
                      onChange={(e) => setFormData({ ...formData, referral_agency: e.target.value })}
                      placeholder="e.g., PNP Headquarters, Municipal Prosecutor's Office"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      Reason for Referral
                    </label>
                    <textarea
                      value={formData.referral_reason}
                      onChange={(e) => setFormData({ ...formData, referral_reason: e.target.value })}
                      placeholder="Why was this case referred? What factors led to the referral decision?"
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Recommendations for Follow-up
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  placeholder="Any recommendations for further action, community support, or monitoring..."
                  rows={3}
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
                    {loadingEmail ? (
                      <p className="text-xs text-muted">Loading complainant email...</p>
                    ) : complainantEmailFromIncident ? (
                      <div>
                        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
                          <CheckCircleIcon size={14} className="text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-800 font-medium">{complainantEmailFromIncident}</span>
                        </div>
                        <p className="text-xs text-muted">
                          Email will be sent to the complainant email from the incident record. You can override it below if needed.
                        </p>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg mb-2">
                          <AlertCircle size={14} className="text-yellow-600 flex-shrink-0" />
                          <span className="text-xs text-yellow-800">No email found in incident record</span>
                        </div>
                        <p className="text-xs text-muted mb-2">Please enter complainant email manually:</p>
                      </div>
                    )}
                    <input
                      type="email"
                      value={complainantEmailForNotification}
                      onChange={(e) => setComplainantEmailForNotification(e.target.value)}
                      placeholder="complainant@example.com"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                    {complainantEmailFromIncident && complainantEmailForNotification !== complainantEmailFromIncident && (
                      <p className="text-xs text-yellow-700 mt-1">
                        ⚠️ Using custom email (different from incident record)
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving || sendingEmail}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  {editingId ? 'Update Resolution' : 'Record Resolution'}
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

// ── Sub-component: ResolutionCard ─────────────────────────────────────────

const ResolutionCard = ({ resolution, onEdit, onDelete, formatDate, getResolutionColor, getResolutionIcon }) => {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${getResolutionColor(resolution.resolution_type)}`}>
              {getResolutionIcon(resolution.resolution_type)}
              {resolution.resolution_type}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
              {formatDate(resolution.resolution_date)}
            </span>
          </div>
          <p className="text-sm text-text line-clamp-2">{resolution.description}</p>
          {resolution.referral_agency && (
            <p className="text-xs text-muted mt-1">
              Referred to: <span className="font-medium">{resolution.referral_agency}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
            title="View details"
          >
            <AlertCircle size={16} />
          </button>
          <button
            onClick={() => onEdit(resolution)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(resolution.id)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border">
          {resolution.description && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Description</p>
              <p className="text-sm text-text whitespace-pre-wrap">{resolution.description}</p>
            </div>
          )}
          {resolution.referral_reason && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Referral Reason</p>
              <p className="text-sm text-text whitespace-pre-wrap">{resolution.referral_reason}</p>
            </div>
          )}
          {resolution.recommendations && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Recommendations</p>
              <p className="text-sm text-text whitespace-pre-wrap">{resolution.recommendations}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ResolutionForm
