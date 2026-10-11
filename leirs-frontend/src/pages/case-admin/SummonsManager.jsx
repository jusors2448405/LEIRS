import React, { useState, useEffect } from 'react'
import {
  FileText, Calendar, AlertCircle, CheckCircle,
  Plus, Edit2, Mail
} from 'lucide-react'
import useCaseStages from '../../hooks/useCaseStages'
import useComplainantEmail from '../../hooks/useComplainantEmail'
import { supabase } from '../../lib/supabase'

/**
 * SummonsManager Component
 * Manage case summons (notices to respondents) for an incident
 * 
 * @param {string} incidentId - The incident UUID
 */
const SummonsManager = ({ incidentId }) => {
  const { stages, loading, saving, error, addSummons, updateSummons } = useCaseStages(incidentId)
  const { sending: sendingEmail, sendSummonsIssued } = useComplainantEmail(incidentId)
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    respondent_id: '',
    issued_date: '',
    status: 'Issued',
    service_notes: ''
  })
  const [formError, setFormError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [sendEmailAfterSave, setSendEmailAfterSave] = useState(true) // Default to checked
  const [complainantEmailForNotification, setComplainantEmailForNotification] = useState('')
  const [complainantEmailFromIncident, setComplainantEmailFromIncident] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [caseParties, setCaseParties] = useState([])
  const [loadingParties, setLoadingParties] = useState(false)

  // ── Fetch case parties ────────────────────────────────────────────────────

  useEffect(() => {
    const fetchCaseParties = async () => {
      if (!incidentId) {
        setCaseParties([])
        return
      }

      setLoadingParties(true)
      const { data, error } = await supabase
        .from('case_parties')
        .select('*')
        .eq('incident_id', incidentId)
        .order('created_at', { ascending: true })

      console.log('🔍 Fetching ALL case_parties for incident:', incidentId)
      console.log('📊 Query result:', { data, error })

      if (!error && data) {
        setCaseParties(data)
        console.log('✅ Set caseParties (all types):', data)
      } else if (error) {
        console.error('❌ Error fetching case_parties:', error)
      }
      setLoadingParties(false)
    }

    fetchCaseParties()
  }, [incidentId])

  // ── Fetch complainant email from incident ──────────────────────────────────

  useEffect(() => {
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
      respondent_id: '',
      issued_date: '',
      status: 'Issued',
      service_notes: ''
    })
    setFormError(null)
    setEditingId(null)
    setShowForm(false)
    setSendEmailAfterSave(true)
    // Don't reset complainantEmailForNotification - keep the auto-fetched value
  }

  const startEdit = (summons) => {
    setFormData({
      respondent_id: summons.respondent_id || '',
      issued_date: summons.issued_date || '',
      status: summons.status || 'Issued',
      service_notes: summons.service_notes || ''
    })
    setEditingId(summons.id)
    setShowForm(true)
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.respondent_id) {
      setFormError('Respondent is required.')
      return
    }
    if (!formData.issued_date) {
      setFormError('Issued date is required.')
      return
    }
    if (!formData.status) {
      setFormError('Status is required.')
      return
    }

    // If email notification enabled, require email
    if (sendEmailAfterSave && !complainantEmailForNotification?.trim()) {
      setFormError('Complainant email is required to send notification.')
      return
    }

    const summonsData = {
      respondent_id: formData.respondent_id,
      issued_date: formData.issued_date,
      status: formData.status,
      service_notes: formData.service_notes.trim() || null
    }

    let result
    if (editingId) {
      result = await updateSummons(editingId, summonsData)
    } else {
      result = await addSummons(summonsData)
    }

    if (result.error) {
      setFormError(result.error)
      return
    }

    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)

    // Send email notification if requested (only for new summons, not edits)
    if (!editingId && sendEmailAfterSave && complainantEmailForNotification?.trim()) {
      const emailResult = await sendSummonsIssued(complainantEmailForNotification.trim())

      if (!emailResult.error) {
        setEmailSuccess(true)
        setTimeout(() => setEmailSuccess(false), 3000)
      } else {
        // Email error is non-fatal, but inform user
        alert(`Summons recorded but email notification failed: ${emailResult.error}`)
      }
    }

    resetForm()
  }

  // ── Delete handling ───────────────────────────────────────────────────────
  // Note: Delete functionality removed for simplicity. Staff can update status instead.

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRespondentName = (respondentId) => {
    console.log('🔍 Looking for respondent:', respondentId)
    console.log('📋 Available caseParties:', caseParties)
    const party = caseParties.find(p => p.id === respondentId)
    console.log('✅ Found party:', party)
    return party?.name || 'Unknown Respondent'
  }

  // Get summons from stages
  const summons = Array.isArray(stages?.summons) ? stages.summons : []

  // ── Render ────────────────────────────────────────────────────────────────

  if (!incidentId) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Summons Manager</h2>
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
            <FileText size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Summons Manager</h2>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-3 text-sm text-muted">Loading summons...</p>
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
            {editingId ? 'Summons updated successfully' : 'Summons created successfully'}
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Summons List */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between">
          <h3 className="text-base font-heading font-semibold text-text">
            Summons Issued ({summons.length})
          </h3>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Issue Summons
            </button>
          )}
        </div>

        <div className="p-6">
          {summons.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto text-border mb-2" />
              <p className="text-sm text-muted">No summons issued yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summons.map(s => (
                <SummonsCard
                  key={s.id}
                  summons={s}
                  onEdit={startEdit}
                  formatDate={formatDate}
                  getRespondentName={getRespondentName}
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
              {editingId ? 'Edit Summons' : 'Issue New Summons'}
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
                  Respondent <span className="text-red-500">*</span>
                </label>
                {loadingParties ? (
                  <div className="text-sm text-muted">Loading respondents...</div>
                ) : caseParties.filter(p => p.party_type === 'Respondent').length === 0 ? (
                  <div className="text-sm text-muted p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    No respondents found. Please add respondents in the Case Parties tab first.
                  </div>
                ) : (
                  <select
                    value={formData.respondent_id}
                    onChange={(e) => setFormData({ ...formData, respondent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select a respondent</option>
                    {caseParties.filter(p => p.party_type === 'Respondent').map(party => (
                      <option key={party.id} value={party.id}>
                        {party.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Issued Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.issued_date}
                    onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Issued">Issued</option>
                    <option value="Served">Served</option>
                    <option value="NotServed">Not Served</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Service Notes / Additional Information
                </label>
                <textarea
                  value={formData.service_notes}
                  onChange={(e) => setFormData({ ...formData, service_notes: e.target.value })}
                  placeholder="Any notes about service attempt, delivery method, or additional instructions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Email Notification Section - Only show for new summons */}
              {!editingId && (
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
                            <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
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
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving || sendingEmail || caseParties.filter(p => p.party_type === 'Respondent').length === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {editingId ? 'Update Summons' : 'Issue Summons'}
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

// ── Sub-component: SummonsCard ────────────────────────────────────────────

const SummonsCard = ({ summons, onEdit, formatDate, getRespondentName }) => {
  const statusColors = {
    'Issued': 'bg-blue-100 text-blue-700',
    'Served': 'bg-green-100 text-green-700',
    'NotServed': 'bg-red-100 text-red-700'
  }

  const statusLabels = {
    'Issued': 'Issued',
    'Served': 'Served',
    'NotServed': 'Not Served'
  }

  return (
    <div className="flex items-start justify-between p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={16} className="text-primary" />
          <p className="font-medium text-text">{getRespondentName(summons.respondent_id)}</p>
          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 font-medium">
            {summons.summons_number}
          </span>
          <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[summons.status] || 'bg-gray-100 text-gray-700'}`}>
            {statusLabels[summons.status] || summons.status}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Calendar size={14} />
            <span>Issued: {formatDate(summons.issued_date)}</span>
          </div>
          {summons.served_date && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Calendar size={14} />
              <span>Served: {formatDate(summons.served_date)}</span>
            </div>
          )}
          {summons.service_notes && (
            <div className="text-sm text-muted mt-2 p-2 bg-white rounded border border-border">
              {summons.service_notes}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={() => onEdit(summons)}
          className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default SummonsManager
