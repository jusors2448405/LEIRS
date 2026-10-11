import React, { useState } from 'react'
import {
  BookOpen, Calendar, AlertCircle, CheckCircle,
  Plus, Edit2, Trash2, MessageSquare
} from 'lucide-react'
import useCaseStages from '../../hooks/useCaseStages'

/**
 * MediationLogger Component
 * Log and track mediation records (progress notes and outcomes during mediation process)
 * 
 * @param {string} incidentId - The incident UUID
 */
const MediationLogger = ({ incidentId }) => {
  const { stages, loading, saving, error, fetchStages, addMediation, updateMediation, deleteMediation } = useCaseStages(incidentId)
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    mediator_name: '',
    mediation_date: '',
    mediation_time: '',
    outcome: '',
    session_notes: '',
    agreements_reached: '',
    next_steps: ''
  })
  const [formError, setFormError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  // ── Form handling ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      mediator_name: '',
      mediation_date: '',
      mediation_time: '',
      outcome: '',
      session_notes: '',
      agreements_reached: '',
      next_steps: ''
    })
    setFormError(null)
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (mediation) => {
    setFormData({
      mediator_name: mediation.mediator_name || '',
      mediation_date: mediation.mediation_date || '',
      mediation_time: mediation.mediation_time || '',
      outcome: mediation.outcome || '',
      session_notes: mediation.session_notes || '',
      agreements_reached: mediation.agreements_reached || '',
      next_steps: mediation.next_steps || ''
    })
    setEditingId(mediation.id)
    setShowForm(true)
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.mediator_name?.trim()) {
      setFormError('Mediator name is required.')
      return
    }
    if (!formData.mediation_date) {
      setFormError('Mediation date is required.')
      return
    }
    if (!formData.outcome) {
      setFormError('Outcome is required.')
      return
    }
    if (!formData.session_notes?.trim()) {
      setFormError('Session notes are required.')
      return
    }

    const mediationData = {
      mediator_name: formData.mediator_name.trim(),
      mediation_date: formData.mediation_date,
      mediation_time: formData.mediation_time || null,
      outcome: formData.outcome,
      agreement_text: formData.session_notes.trim(),
      agreed_terms: formData.agreements_reached.trim() || null,
      notes: formData.next_steps.trim() || null
    }

    let result
    if (editingId) {
      result = await updateMediation(editingId, mediationData)
    } else {
      result = await addMediation(mediationData)
    }

    if (result.error) {
      setFormError(result.error)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      resetForm()
    }
  }

  // ── Delete handling ───────────────────────────────────────────────────────

  const handleDelete = async (mediationId) => {
    if (!window.confirm('Are you sure you want to delete this mediation record?')) {
      return
    }

    const result = await deleteMediation(mediationId, 'mediation')
    if (result.error) {
      alert(`Error deleting mediation record: ${result.error}`)
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

  const formatDateTime = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get mediation records from stages
  const mediations = Array.isArray(stages?.mediations) ? stages.mediations : []

  // ── Render ────────────────────────────────────────────────────────────────

  if (!incidentId) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Mediation Logger</h2>
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
            <BookOpen size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Mediation Logger</h2>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-3 text-sm text-muted">Loading mediation records...</p>
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
            {editingId ? 'Mediation record updated successfully' : 'Mediation record created successfully'}
          </p>
        </div>
      )}

      {deleteSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm text-green-800">Mediation record deleted successfully</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Mediation Records List */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between">
          <h3 className="text-base font-heading font-semibold text-text">
            Mediation Sessions ({mediations.length})
          </h3>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Log Session
            </button>
          )}
        </div>

        <div className="p-6">
          {mediations.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-border mb-2" />
              <p className="text-sm text-muted">No mediation sessions logged yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mediations.map(m => (
                <MediationCard
                  key={m.id}
                  mediation={m}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
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
              {editingId ? 'Edit Mediation Record' : 'Log Mediation Session'}
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

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Mediator Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mediator_name}
                  onChange={(e) => setFormData({ ...formData, mediator_name: e.target.value })}
                  placeholder="Name of the mediator or barangay official"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Mediation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.mediation_date}
                    onChange={(e) => setFormData({ ...formData, mediation_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Mediation Time
                  </label>
                  <input
                    type="time"
                    value={formData.mediation_time}
                    onChange={(e) => setFormData({ ...formData, mediation_time: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Outcome <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.outcome}
                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select outcome</option>
                    <option value="Success">Success</option>
                    <option value="Partial">Partial</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Session Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.session_notes}
                  onChange={(e) => setFormData({ ...formData, session_notes: e.target.value })}
                  placeholder="Detailed notes from the mediation session (e.g., issues discussed, parties' positions, questions raised, discussions held)..."
                  rows={5}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Agreements Reached
                </label>
                <textarea
                  value={formData.agreements_reached}
                  onChange={(e) => setFormData({ ...formData, agreements_reached: e.target.value })}
                  placeholder="Any agreements or commitments made by parties during this session..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Next Steps
                </label>
                <textarea
                  value={formData.next_steps}
                  onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                  placeholder="Recommended next steps, follow-up actions, or follow-up hearing date..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {editingId ? 'Update Record' : 'Log Session'}
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

// ── Sub-component: MediationCard ──────────────────────────────────────────

const MediationCard = ({ mediation, onEdit, onDelete, formatDate, formatDateTime }) => {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <p className="font-medium text-text">{formatDate(mediation.mediation_date)}</p>
            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
              {mediation.document_number}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
            title="View details"
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={() => onEdit(mediation)}
            className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(mediation.id)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 mt-4 pt-4 border-t border-border">
          {mediation.mediator_name && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Mediator</p>
              <p className="text-sm text-text">{mediation.mediator_name}</p>
            </div>
          )}
          {mediation.mediation_time && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Time</p>
              <p className="text-sm text-text">{mediation.mediation_time}</p>
            </div>
          )}
          {mediation.outcome && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Outcome</p>
              <span className={`inline-block text-xs px-2 py-1 rounded font-medium ${
                mediation.outcome === 'Success' ? 'bg-green-100 text-green-700' :
                mediation.outcome === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {mediation.outcome}
              </span>
            </div>
          )}
          {mediation.agreement_text && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Session Notes</p>
              <p className="text-sm text-text whitespace-pre-wrap">{mediation.agreement_text}</p>
            </div>
          )}
          {mediation.agreed_terms && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Agreements Reached</p>
              <p className="text-sm text-text whitespace-pre-wrap">{mediation.agreed_terms}</p>
            </div>
          )}
          {mediation.notes && (
            <div>
              <p className="text-xs font-medium text-muted uppercase mb-1">Next Steps</p>
              <p className="text-sm text-text whitespace-pre-wrap">{mediation.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MediationLogger
