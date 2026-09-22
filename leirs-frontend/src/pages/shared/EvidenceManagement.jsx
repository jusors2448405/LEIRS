import React, { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Search, Shield, FileText, MapPin, Calendar, Clock, User, Phone,
  AlertCircle, CheckCircle, Save, RefreshCw, ChevronRight, FileX,
  Tag, Plus, Trash2, Edit2, X, Eye, Filter, Paperclip, Download
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useEvidence from '../../hooks/useEvidence'

// ── Constants ─────────────────────────────────────────────────────────────────

const EVIDENCE_TYPES = [
  'Document', 'Image', 'Video', 'Audio', 'Physical', 'Digital', 'Testimony', 'Other',
]

const TYPE_COLORS = {
  Document:  'bg-blue-100 text-blue-700',
  Image:     'bg-green-100 text-green-700',
  Video:     'bg-purple-100 text-purple-700',
  Audio:     'bg-yellow-100 text-yellow-700',
  Physical:  'bg-orange-100 text-orange-700',
  Digital:   'bg-cyan-100 text-cyan-700',
  Testimony: 'bg-pink-100 text-pink-700',
  Other:     'bg-gray-100 text-gray-600',
}

const STATUS_COLORS = {
  'Pending':             'bg-yellow-100 text-yellow-700',
  'Under Investigation': 'bg-blue-100 text-blue-700',
  'For Mediation':       'bg-purple-100 text-purple-700',
  'Resolved':            'bg-green-100 text-green-700',
  'Closed':              'bg-gray-100 text-gray-600',
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

const toDatetimeLocal = (iso) => {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 16)
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
)

const TypeBadge = ({ type }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLORS[type] || TYPE_COLORS.Other}`}>
    {type}
  </span>
)

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

// ── Evidence Form (create / edit) ─────────────────────────────────────────────

const EMPTY_FORM = {
  evidence_type: 'Document',
  evidence_name: '',
  description: '',
  file_name: '',
  file_url: '',
  collected_by: '',
  collected_at: '',
}

const EvidenceForm = ({ initial, onSave, onCancel, saving, error, title }) => {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const fileInputRef = React.useRef(null)

  // When user picks a file, auto-populate file_name from the real filename.
  // file_url is left for manual entry (Supabase Storage not yet configured).
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) set('file_name', file.name)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.evidence_name.trim()) return
    onSave({
      ...form,
      collected_at: form.collected_at
        ? new Date(form.collected_at).toISOString()
        : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-heading font-semibold text-text">{title}</h3>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Evidence Type <span className="text-red-500">*</span></label>
          <select value={form.evidence_type} onChange={(e) => set('evidence_type', e.target.value)} className="input-field text-sm" required>
            {EVIDENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Evidence Name / Title <span className="text-red-500">*</span></label>
          <input type="text" value={form.evidence_name} onChange={(e) => set('evidence_name', e.target.value)}
            placeholder="e.g. CCTV Footage, Witness Statement" className="input-field text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Collected By</label>
          <input type="text" value={form.collected_by} onChange={(e) => set('collected_by', e.target.value)}
            placeholder="Officer or staff name" className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Date &amp; Time Collected</label>
          <input type="datetime-local" value={form.collected_at} onChange={(e) => set('collected_at', e.target.value)}
            className="input-field text-sm" />
        </div>

        {/* File picker — auto-fills filename, no storage upload yet */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-text mb-1.5">
            Attach File <span className="text-muted font-normal text-xs">(auto-fills filename)</span>
          </label>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <label className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg cursor-pointer hover:bg-background transition-colors text-sm text-muted">
                <Paperclip size={14} className="flex-shrink-0" />
                <span className="truncate">{form.file_name || 'Choose file…'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            </div>
            {form.file_name && (
              <button type="button" onClick={() => { set('file_name', ''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="p-2 text-muted hover:text-red-500 transition-colors">
                <X size={15} />
              </button>
            )}
          </div>
          <p className="text-xs text-muted mt-1">Filename is recorded automatically. File storage upload will be available in a future update.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-text mb-1.5">File URL / Storage Path <span className="text-muted font-normal text-xs">(optional)</span></label>
          <input type="text" value={form.file_url} onChange={(e) => set('file_url', e.target.value)}
            placeholder="https://... or leave blank" className="input-field text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
          placeholder="Describe the evidence in detail..." rows={4} className="input-field text-sm resize-none" />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-60">
          <Save size={15} />
          {saving ? 'Saving...' : title}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-background transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// ── Evidence Detail Modal ─────────────────────────────────────────────────────

const EvidenceDetailModal = ({ ev, onClose, onEdit, onDelete, canEdit, canDelete, saving }) => {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    const { error } = await onDelete(ev.id)
    if (!error) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wide">Evidence Record</p>
            <h2 className="font-mono font-bold text-text">{ev.evidence_number}</h2>
          </div>
          <div className="flex items-center gap-2">
            <TypeBadge type={ev.evidence_type} />
            <button onClick={onClose} className="ml-1 p-1.5 rounded-lg hover:bg-background transition-colors text-muted">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          <DetailField icon={Tag}      label="Evidence Name"    value={ev.evidence_name} />
          <DetailField icon={User}     label="Collected By"     value={ev.collected_by} />
          <DetailField icon={Clock}    label="Collected At"     value={formatDateTime(ev.collected_at)} />
          <DetailField icon={Paperclip} label="File Name"       value={ev.file_name} />
          {ev.file_url && (
            <div className="flex items-center gap-2">
              <a href={ev.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary underline font-medium">
                <Download size={14} /> View / Download File
              </a>
            </div>
          )}
          <DetailField icon={FileText} label="Description"      value={ev.description} />
          <div className="pt-3 border-t border-border grid grid-cols-2 gap-3 text-xs text-muted">
            <div><span className="font-medium">Created: </span>{formatDateTime(ev.created_at)}</div>
            <div><span className="font-medium">Updated: </span>{formatDateTime(ev.updated_at)}</div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
          <div className="flex gap-2">
            {canDelete && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                <Trash2 size={14} /> Delete
              </button>
            )}
            {canDelete && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">Confirm delete?</span>
                <button onClick={handleDelete} disabled={saving}
                  className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {saving ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg">
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button onClick={() => onEdit(ev)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-lg text-text hover:bg-background transition-colors">
                <Edit2 size={14} /> Edit
              </button>
            )}
            <button onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-background transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Right panel: evidence list + add form ─────────────────────────────────────

const EvidencePanel = ({ incident, role }) => {
  const canEdit   = role === 'encoder' || role === 'officer' || role === 'admin'
  const canDelete = role === 'admin'
  const canAdd    = role === 'encoder' || role === 'officer' || role === 'admin'

  const { evidence, loading, saving, error, fetchEvidence,
          createEvidence, updateEvidence, deleteEvidence } = useEvidence(incident.id)

  const [showAddForm, setShowAddForm]     = useState(false)
  const [viewingEvidence, setViewingEvidence] = useState(null)
  const [editingEvidence, setEditingEvidence] = useState(null)
  const [addSuccess, setAddSuccess]       = useState('')

  const handleCreate = async (fields) => {
    const { error: err } = await createEvidence(fields)
    if (!err) {
      setShowAddForm(false)
      setAddSuccess('Evidence record added successfully.')
      setTimeout(() => setAddSuccess(''), 3000)
    }
  }

  const handleUpdate = async (fields) => {
    const { error: err } = await updateEvidence(editingEvidence.id, fields)
    if (!err) {
      setEditingEvidence(null)
      setViewingEvidence(null)
    }
  }

  const handleDelete = async (id) => {
    return await deleteEvidence(id)
  }

  return (
    <div className="space-y-4">
      {/* Incident header */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-background border-b border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wide">Incident</p>
            <p className="font-mono font-bold text-primary">{incident.incident_number}</p>
          </div>
          <StatusBadge status={incident.status} />
        </div>
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><span className="text-xs text-muted uppercase font-medium block">Type</span>{incident.incident_type}</div>
          <div><span className="text-xs text-muted uppercase font-medium block">Date</span>{formatDate(incident.incident_date)}</div>
          <div className="col-span-2 sm:col-span-1"><span className="text-xs text-muted uppercase font-medium block">Location</span>{incident.location}</div>
        </div>
      </div>

      {/* Evidence list header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold text-text">Evidence Records</h3>
          <p className="text-xs text-muted mt-0.5">
            {loading ? 'Loading...' : `${evidence.length} item${evidence.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchEvidence} disabled={loading} title="Refresh"
            className="p-2 border border-border rounded-lg text-muted hover:text-primary transition-colors disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {canAdd && !showAddForm && (
            <button onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4">
              <Plus size={15} /> Add Evidence
            </button>
          )}
        </div>
      </div>

      {addSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle size={15} />{addSuccess}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border border-primary/20 rounded-xl p-6 shadow-sm">
          <EvidenceForm
            title="Add Evidence"
            onSave={handleCreate}
            onCancel={() => setShowAddForm(false)}
            saving={saving}
            error={null}
          />
        </div>
      )}

      {/* Edit form */}
      {editingEvidence && (
        <div className="bg-white border border-primary/20 rounded-xl p-6 shadow-sm">
          <EvidenceForm
            title="Save Changes"
            initial={{
              evidence_type: editingEvidence.evidence_type,
              evidence_name: editingEvidence.evidence_name,
              description:   editingEvidence.description   || '',
              file_name:     editingEvidence.file_name     || '',
              file_url:      editingEvidence.file_url      || '',
              collected_by:  editingEvidence.collected_by  || '',
              collected_at:  toDatetimeLocal(editingEvidence.collected_at),
            }}
            onSave={handleUpdate}
            onCancel={() => setEditingEvidence(null)}
            saving={saving}
            error={error}
          />
        </div>
      )}

      {/* Evidence list */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-border rounded-xl p-4 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && evidence.length === 0 && !showAddForm && (
        <div className="bg-white border border-border rounded-xl p-10 text-center">
          <Shield size={40} className="mx-auto mb-3 text-border" />
          <p className="font-heading font-semibold text-text">No evidence recorded</p>
          <p className="text-sm text-muted mt-1">
            {canAdd ? 'Click "Add Evidence" to record the first piece of evidence for this incident.'
                     : 'No evidence has been recorded for this incident yet.'}
          </p>
        </div>
      )}

      {!loading && evidence.map((ev) => (
        <div key={ev.id} className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-mono text-xs font-semibold text-primary">{ev.evidence_number}</p>
                <TypeBadge type={ev.evidence_type} />
              </div>
              <p className="font-medium text-text text-sm">{ev.evidence_name}</p>
              {ev.collected_by && (
                <p className="text-xs text-muted mt-0.5">
                  Collected by <span className="font-medium">{ev.collected_by}</span>
                  {ev.collected_at && <> · {formatDateTime(ev.collected_at)}</>}
                </p>
              )}
              {ev.file_name && (
                <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                  <Paperclip size={11} />{ev.file_name}
                </p>
              )}
            </div>
            <button onClick={() => setViewingEvidence(ev)}
              className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-colors">
              <Eye size={13} /> View
            </button>
          </div>
        </div>
      ))}

      {/* Detail modal */}
      {viewingEvidence && !editingEvidence && (
        <EvidenceDetailModal
          ev={viewingEvidence}
          onClose={() => setViewingEvidence(null)}
          onEdit={(ev) => { setEditingEvidence(ev); setViewingEvidence(null) }}
          onDelete={handleDelete}
          canEdit={canEdit}
          canDelete={canDelete}
          saving={saving}
        />
      )}
    </div>
  )
}

// ── Main EvidenceManagement page ─────────────────────────────────────────────

const EvidenceManagement = ({ role = 'encoder' }) => {
  const location = useLocation()
  const [incidents, setIncidents]               = useState([])
  const [incidentsLoading, setIncidentsLoading] = useState(true)
  const [incidentsError, setIncidentsError]     = useState(null)
  const [searchInput, setSearchInput]           = useState('')
  const [search, setSearch]                     = useState('')
  const [statusFilter, setStatusFilter]         = useState('All')
  const [selectedIncident, setSelectedIncident] = useState(null)

  // Handle pre-selected incident from navigation state (e.g., from dashboard)
  useEffect(() => {
    if (location.state?.selectedIncidentId && incidents.length > 0) {
      const incident = incidents.find(inc => inc.id === location.state.selectedIncidentId)
      if (incident) {
        setSelectedIncident(incident)
        // Clear the navigation state after using it
        window.history.replaceState({}, document.title)
      }
    }
  }, [location.state, incidents])

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setSelectedIncident(null) }, [search, statusFilter])

  const fetchIncidents = useCallback(async () => {
    setIncidentsLoading(true)
    setIncidentsError(null)

    try {
      // First, get all incidents with their dispatch status
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('incidents')
        .select(`
          id, 
          incident_number, 
          incident_type, 
          incident_date, 
          location, 
          status
        `)
        .order('created_at', { ascending: false })

      if (incidentsError) throw incidentsError

      // Get all dispatches with Completed status
      const { data: completedDispatches, error: dispatchError } = await supabase
        .from('dispatch')
        .select('incident_id, dispatch_status')
        .eq('dispatch_status', 'Completed')

      if (dispatchError) throw dispatchError

      // Create a Set of incident IDs that have completed dispatches
      const completedDispatchIncidentIds = new Set(
        completedDispatches?.map(d => d.incident_id) || []
      )

      // Get all incidents that already have evidence records
      const { data: existingEvidence, error: evidenceError } = await supabase
        .from('evidence')
        .select('incident_id')

      if (evidenceError) throw evidenceError

      // Create a Set of incident IDs that already have evidence
      const incidentsWithEvidence = new Set(
        existingEvidence?.map(e => e.incident_id) || []
      )

      // Filter incidents to only include those with completed dispatches AND no existing evidence
      let filteredIncidents = (incidentsData || []).filter(inc => 
        completedDispatchIncidentIds.has(inc.id) && !incidentsWithEvidence.has(inc.id)
      )

      // Apply status filter if not "All"
      if (statusFilter !== 'All') {
        filteredIncidents = filteredIncidents.filter(inc => inc.status === statusFilter)
      }

      // Apply search filter
      if (search.trim()) {
        const term = search.trim().toLowerCase()
        filteredIncidents = filteredIncidents.filter(inc =>
          inc.incident_number?.toLowerCase().includes(term) ||
          inc.incident_type?.toLowerCase().includes(term) ||
          inc.location?.toLowerCase().includes(term)
        )
      }

      // Limit to 100 results
      filteredIncidents = filteredIncidents.slice(0, 100)

      setIncidents(filteredIncidents)
    } catch (err) {
      console.error('Error fetching incidents for evidence:', err)
      setIncidentsError(err.message)
    } finally {
      setIncidentsLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  const STATUS_FILTER_OPTIONS = [
    'All', 'Pending', 'Under Investigation', 'For Mediation', 'Resolved', 'Closed',
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text mb-1">Evidence Management</h1>
          <p className="text-muted">Incidents with completed dispatches ready for evidence logging.</p>
        </div>
        <button onClick={fetchIncidents} disabled={incidentsLoading} title="Refresh"
          className="p-2.5 border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-50">
          <RefreshCw size={16} className={incidentsLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* Left panel — incident selector */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border space-y-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search incidents..." className="input-field pl-10 text-sm py-2" />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field pl-9 text-sm py-2 appearance-none cursor-pointer">
                {STATUS_FILTER_OPTIONS.map(s => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
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
                <p className="font-medium text-text">No incidents ready for evidence</p>
                <p className="text-xs mt-1">
                  Incidents appear here after their dispatch is marked as Completed.
                </p>
              </div>
            )}
            {!incidentsLoading && incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id
              return (
                <button key={inc.id} onClick={() => setSelectedIncident(inc)}
                  className={`w-full text-left px-4 py-3.5 border-b border-border transition-colors flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-background'
                  }`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono text-xs font-semibold text-primary truncate">{inc.incident_number}</p>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700 flex-shrink-0">
                        Ready for Evidence
                      </span>
                    </div>
                    <p className="text-sm text-text truncate mt-0.5">{inc.incident_type}</p>
                    <p className="text-xs text-muted truncate">{inc.location}</p>
                    <div className="mt-1"><StatusBadge status={inc.status} /></div>
                  </div>
                  <ChevronRight size={15} className={`flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted'}`} />
                </button>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-3">
          {!selectedIncident ? (
            <div className="bg-white border border-border rounded-xl p-12 text-center">
              <Shield size={48} className="mx-auto mb-3 text-border" />
              <p className="font-heading font-semibold text-text">No incident selected</p>
              <p className="text-sm text-muted mt-1">
                Choose an incident with completed dispatch from the list to manage its evidence records.
              </p>
            </div>
          ) : (
            <EvidencePanel incident={selectedIncident} role={role} />
          )}
        </div>
      </div>
    </div>
  )
}

export default EvidenceManagement
