import React, { useState, useEffect, useCallback } from 'react'
import {
  Search, ClipboardList, FileText, MapPin, Calendar, Clock,
  User, Phone, AlertCircle, CheckCircle, Save,
  ChevronRight, FileX, Tag
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useCaseDocumentation from '../../hooks/useCaseDocumentation'

// ── Constants ─────────────────────────────────────────────────────────────────

// Case Documentation statuses - "Ready for Dispatch" maps to "For Mediation" in DB
const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Under Investigation', label: 'Under Investigation' },
  { value: 'For Mediation', label: 'Ready for Dispatch' },
]

// Post-dispatch statuses (read-only, set by other modules)
const POST_DISPATCH_STATUSES = ['Resolved', 'Closed']

const STATUS_COLORS = {
  'Pending':             'bg-yellow-100 text-yellow-700',
  'Under Investigation': 'bg-blue-100 text-blue-700',
  'For Mediation':       'bg-purple-100 text-purple-700', // Ready for Dispatch
  'Resolved':            'bg-green-100 text-green-700',
  'Closed':              'bg-gray-100 text-gray-600',
}

// Display mapping for status badges
const STATUS_DISPLAY = {
  'For Mediation': 'Ready for Dispatch',
}

// Get display status based on context (whether dispatched or not)
const getDisplayStatus = (status, isDispatched) => {
  if (status === 'For Mediation') {
    // If already dispatched, show "Forwarded to Dispatch" instead of misleading "Ready for Dispatch"
    return isDispatched ? 'Forwarded to Dispatch' : 'Ready for Dispatch'
  }
  return status
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (val) => {
  if (!val) return '—'
  return new Date(val + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

const formatDateTime = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const formatTime = (val) => {
  if (!val) return null
  const [h, m] = val.split(':')
  const d = new Date()
  d.setHours(+h, +m)
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status, isDispatched = false }) => {
  const displayStatus = getDisplayStatus(status, isDispatched)
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {displayStatus}
    </span>
  )
}

const DetailField = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={14} className="text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-text mt-0.5 whitespace-pre-wrap">
        {value || <span className="italic text-muted">Not provided</span>}
      </p>
    </div>
  </div>
)

// ── Create form (no existing case doc) ───────────────────────────────────────

const CaseDocForm = ({ onSave, saving, error }) => {
  const [form, setForm] = useState({
    case_status: 'Pending',
    case_notes: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation for Ready for Dispatch status
    if (form.case_status === 'For Mediation' && !form.case_notes.trim()) {
      alert('Please add case notes before marking as Ready for Dispatch')
      return
    }
    
    // Don't send assigned_officer field (not Case Documentation's responsibility)
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-heading font-semibold text-text">Create Case Documentation</h3>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Case Status</label>
        <select
          value={form.case_status}
          onChange={(e) => setForm({ ...form, case_status: e.target.value })}
          className="input-field text-sm"
        >
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Info banner for Ready for Dispatch */}
      {form.case_status === 'For Mediation' && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
          <p className="font-semibold mb-1">Ready for Dispatch</p>
          <p>
            Marking this case as Ready for Dispatch will make it available to the Law Enforcement Dispatch Module
            for officer assignment and dispatch operations.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          Case Notes {form.case_status === 'For Mediation' && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={form.case_notes}
          onChange={(e) => setForm({ ...form, case_notes: e.target.value })}
          placeholder="Enter case notes, findings, or updates..."
          rows={5}
          className="input-field text-sm resize-none"
          required={form.case_status === 'For Mediation'}
        />
        {form.case_status === 'For Mediation' && (
          <p className="text-xs text-muted mt-1">Required before marking Ready for Dispatch</p>
        )}
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
      >
        <Save size={16} />
        {saving ? 'Saving...' : 'Create Case Documentation'}
      </button>
    </form>
  )
}

// ── View / Edit (existing case doc) ──────────────────────────────────────────

const CaseDocView = ({ caseDoc, onUpdate, saving, error, isDispatched }) => {
  const [editing, setEditing]         = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [confirmDispatch, setConfirmDispatch] = useState(false)
  const [form, setForm]               = useState({
    case_status:      caseDoc.case_status,
    case_notes:       caseDoc.case_notes || '',
  })

  // Check if case is in post-dispatch status (set by other modules)
  const isPostDispatch = POST_DISPATCH_STATUSES.includes(caseDoc.case_status)
  
  // Combined lock condition: either post-dispatch status OR dispatch record exists
  const isLocked = isPostDispatch || isDispatched

  useEffect(() => {
    setForm({
      case_status:      caseDoc.case_status,
      case_notes:       caseDoc.case_notes || '',
    })
    setConfirmDispatch(false)
  }, [caseDoc])

  // When the status dropdown changes, reset the confirmation
  const handleStatusChange = (val) => {
    setForm((f) => ({ ...f, case_status: val }))
    if (val !== 'For Mediation') setConfirmDispatch(false)
  }

  const handleSave = async () => {
    // Guard: require explicit confirmation before marking Ready for Dispatch
    if (form.case_status === 'For Mediation' && !confirmDispatch) {
      if (!form.case_notes.trim()) {
        alert('Please add case notes before marking as Ready for Dispatch')
        return
      }
      setConfirmDispatch(true)
      return
    }
    
    const { error: err } = await onUpdate(form)
    if (!err) {
      setEditing(false)
      setConfirmDispatch(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted font-medium uppercase tracking-wide">Case Number</p>
          <p className="font-mono font-bold text-text">{caseDoc.case_number}</p>
        </div>
        <StatusBadge status={caseDoc.case_status} isDispatched={isDispatched} />
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle size={15} />
          Case documentation updated successfully.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Warning banner for post-dispatch cases */}
      {isPostDispatch && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-semibold mb-1">Post-Dispatch Case</p>
          <p>
            This case has been dispatched and is being handled by other modules. 
            Case Documentation Admin can view details but cannot modify status.
          </p>
        </div>
      )}

      {/* Warning banner for dispatched cases (new lock condition) */}
      {!isPostDispatch && isDispatched && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
          <p className="font-semibold mb-1">Case Forwarded to Dispatch</p>
          <p>
            This case documentation is locked because it has been forwarded to the Dispatch Module.
            Case Documentation Admin can view details but cannot edit or change status after dispatch handoff.
          </p>
        </div>
      )}

      {editing && !isLocked ? (
        <div className="space-y-4">
          <h3 className="text-sm font-heading font-semibold text-text">Edit Case Documentation</h3>

          {/* Show assigned officer as read-only info if it exists */}
          {caseDoc.assigned_officer && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-muted font-medium uppercase tracking-wide">Assigned Officer (Read-Only)</p>
              <p className="text-sm text-text mt-1">{caseDoc.assigned_officer}</p>
              <p className="text-xs text-muted mt-1">Officer assignment is managed by the Dispatch Module</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Case Status</label>
            <select
              value={form.case_status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="input-field text-sm"
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Ready for Dispatch confirmation banner */}
          {form.case_status === 'For Mediation' && (
            <div className={`p-3 rounded-lg border text-sm ${
              confirmDispatch
                ? 'bg-gray-50 border-gray-300 text-gray-700'
                : 'bg-purple-50 border-purple-300 text-purple-800'
            }`}>
              {confirmDispatch ? (
                <p className="font-medium">
                  Click <span className="font-semibold">Confirm — Mark Ready for Dispatch</span> to finalize.
                  The case will be available for officer assignment in the Dispatch Module.
                </p>
              ) : (
                <>
                  <p className="font-semibold mb-1">Mark case Ready for Dispatch?</p>
                  <p>
                    This will complete the Case Documentation workflow and make the case available for 
                    the Law Enforcement Dispatch Module to assign officers and manage dispatch operations.
                  </p>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Case Notes {form.case_status === 'For Mediation' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={form.case_notes}
              onChange={(e) => setForm({ ...form, case_notes: e.target.value })}
              rows={5}
              className="input-field text-sm resize-none"
              required={form.case_status === 'For Mediation'}
            />
            {form.case_status === 'For Mediation' && (
              <p className="text-xs text-muted mt-1">Required before marking Ready for Dispatch</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 disabled:opacity-60 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                form.case_status === 'For Mediation' && !confirmDispatch
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : form.case_status === 'For Mediation' && confirmDispatch
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'btn-primary'
              }`}
            >
              <Save size={15} />
              {saving
                ? 'Saving...'
                : form.case_status === 'For Mediation' && !confirmDispatch
                ? 'Review Ready for Dispatch'
                : form.case_status === 'For Mediation' && confirmDispatch
                ? 'Confirm — Mark Ready for Dispatch'
                : 'Save Changes'}
            </button>
            <button
              onClick={() => { setEditing(false); setConfirmDispatch(false) }}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Show assigned officer as read-only if it exists */}
            {caseDoc.assigned_officer && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-muted font-medium uppercase tracking-wide">Assigned Officer</p>
                <p className="text-sm text-text mt-1">{caseDoc.assigned_officer}</p>
                <p className="text-xs text-muted mt-1">Managed by Dispatch Module</p>
              </div>
            )}
            <DetailField icon={ClipboardList} label="Case Notes" value={caseDoc.case_notes} />
          </div>
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs text-muted">
            <div><span className="font-medium">Created: </span>{formatDateTime(caseDoc.created_at)}</div>
            <div><span className="font-medium">Updated: </span>{formatDateTime(caseDoc.updated_at)}</div>
          </div>
          {!isLocked && (
            <button onClick={() => setEditing(true)} className="btn-primary flex items-center gap-2">
              <Save size={15} />
              Edit Documentation
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const CaseDocumentation = ({ preselectedIncidentId = null }) => {
  const [incidents, setIncidents]               = useState([])
  const [incidentsLoading, setIncidentsLoading] = useState(true)
  const [incidentsError, setIncidentsError]     = useState(null)
  const [searchInput, setSearchInput]           = useState('')
  const [search, setSearch]                     = useState('')
  const [selectedIncident, setSelectedIncident] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setSelectedIncident(null) }, [search])

  // Auto-select incident if preselectedIncidentId is provided
  useEffect(() => {
    if (preselectedIncidentId) {
      const fetchPreselectedIncident = async () => {
        const { data, error } = await supabase
          .from('incidents')
          .select('id, incident_number, incident_type, incident_date, incident_time, location, complainant_name, complainant_contact, description, status, priority')
          .eq('id', preselectedIncidentId)
          .single()
        
        if (!error && data) {
          setSelectedIncident(data)
        }
      }
      fetchPreselectedIncident()
    }
  }, [preselectedIncidentId])

  const fetchIncidents = useCallback(async () => {
    setIncidentsLoading(true)
    setIncidentsError(null)

    let query = supabase
      .from('incidents')
      .select('id, incident_number, incident_type, incident_date, incident_time, location, complainant_name, complainant_contact, description, status, priority')
      .order('created_at', { ascending: false })

    if (search.trim()) {
      const term = `%${search.trim()}%`
      query = query.or(
        `incident_number.ilike.${term},incident_type.ilike.${term},location.ilike.${term},complainant_name.ilike.${term}`
      )
    }

    const { data, error } = await query.limit(50)
    if (error) setIncidentsError(error.message)
    else setIncidents(data || [])
    setIncidentsLoading(false)
  }, [search])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  const { caseDoc, loading: caseLoading, saving, error: caseError, isDispatched,
          createCaseDoc, updateCaseDoc } = useCaseDocumentation(selectedIncident?.id ?? null)

  // Sync selected incident and incidents list with case doc status
  useEffect(() => {
    if (selectedIncident && caseDoc && selectedIncident.status !== caseDoc.case_status) {
      // Update selected incident
      setSelectedIncident(prev => prev ? { ...prev, status: caseDoc.case_status } : null)
      
      // Update incident in the list
      setIncidents(prev => prev.map(inc => 
        inc.id === selectedIncident.id ? { ...inc, status: caseDoc.case_status } : inc
      ))
    }
  }, [caseDoc?.case_status, selectedIncident?.id]) // Only depend on the values that matter

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Case Documentation</h1>
        <p className="text-muted">Select an incident to view or create its case documentation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* Left panel — incident selector */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search incidents..."
                className="input-field pl-10 text-sm py-2"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            {incidentsLoading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 border-b border-border space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            ))}

            {!incidentsLoading && incidentsError && (
              <div className="p-4 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={15} />{incidentsError}
              </div>
            )}

            {!incidentsLoading && !incidentsError && incidents.length === 0 && (
              <div className="p-8 text-center text-sm text-muted">
                <FileX size={32} className="mx-auto mb-2 text-border" />
                No incidents found.
              </div>
            )}

            {!incidentsLoading && incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id
              // Use context-aware display for selected incident (we have isDispatched from hook)
              const incidentIsDispatched = isSelected ? isDispatched : false
              return (
                <button key={inc.id} onClick={() => setSelectedIncident(inc)}
                  className={`w-full text-left px-4 py-3.5 border-b border-border transition-colors flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-background'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-primary truncate">{inc.incident_number}</p>
                    <p className="text-sm text-text truncate mt-0.5">{inc.incident_type}</p>
                    <p className="text-xs text-muted truncate">{inc.location}</p>
                    <div className="mt-1"><StatusBadge status={inc.status} isDispatched={incidentIsDispatched} /></div>
                  </div>
                  <ChevronRight size={15} className={`flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted'}`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Right panel — details + case doc */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedIncident ? (
            <div className="bg-white border border-border rounded-xl p-12 text-center">
              <ClipboardList size={48} className="mx-auto mb-3 text-border" />
              <p className="font-heading font-semibold text-text">No incident selected</p>
              <p className="text-sm text-muted mt-1">Choose an incident from the list to view or create case documentation.</p>
            </div>
          ) : (
            <>
              {/* Incident details */}
              <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted font-medium uppercase tracking-wide">Selected Incident</p>
                    <p className="font-mono font-bold text-primary">{selectedIncident.incident_number}</p>
                  </div>
                  <StatusBadge status={selectedIncident.status} isDispatched={isDispatched} />
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailField icon={Tag}      label="Incident Type"    value={selectedIncident.incident_type} />
                  <DetailField icon={Calendar} label="Date"             value={formatDate(selectedIncident.incident_date)} />
                  <DetailField icon={MapPin}   label="Location"         value={selectedIncident.location} />
                  <DetailField icon={User}     label="Reporter Name"    value={selectedIncident.complainant_name} />
                  <DetailField icon={Phone}    label="Reporter Contact" value={selectedIncident.complainant_contact} />
                  <DetailField icon={Clock}    label="Time"             value={formatTime(selectedIncident.incident_time)} />
                  {selectedIncident.description && (
                    <div className="sm:col-span-2">
                      <DetailField icon={FileText} label="Narrative" value={selectedIncident.description} />
                    </div>
                  )}
                </div>
              </div>

              {/* Case documentation */}
              <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                {caseLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-20 bg-gray-100 rounded" />
                  </div>
                ) : caseDoc ? (
                  <CaseDocView caseDoc={caseDoc} onUpdate={updateCaseDoc} saving={saving} error={caseError} isDispatched={isDispatched} />
                ) : (
                  <CaseDocForm onSave={createCaseDoc} saving={saving} error={caseError} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CaseDocumentation
