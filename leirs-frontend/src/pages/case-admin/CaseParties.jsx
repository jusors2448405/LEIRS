import React, { useState, useEffect } from 'react'
import {
  User, Phone, Mail, Trash2, Edit2, Plus, AlertCircle, CheckCircle,
  Users, MapPin, FileText, Info
} from 'lucide-react'
import useCaseParties from '../../hooks/useCaseParties'
import { supabase } from '../../lib/supabase'

/**
 * CaseParties Component
 * Manage case parties (complainants and respondents) for an incident
 * 
 * @param {string} incidentId - The incident UUID
 */
const CaseParties = ({ incidentId }) => {
  const { parties, loading, saving, error, fetchParties, addParty, updateParty, deleteParty } = useCaseParties(incidentId)
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    party_type: 'Respondent',
    name: '',
    contact: '',
    email: '',
    address: '',
    notes: '',
    information_status: 'Pending Verification'
  })
  const [formError, setFormError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)
  const [incidentData, setIncidentData] = useState(null)
  const [hasPreFilled, setHasPreFilled] = useState(false)

  // ── Pre-fill from incident data ───────────────────────────────────────────

  useEffect(() => {
    const fetchIncidentAndPreFill = async () => {
      if (!incidentId || hasPreFilled) return

      try {
        // Fetch incident data
        const { data: incident, error: incidentError } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', incidentId)
          .single()

        if (incidentError) {
          console.warn('Failed to fetch incident:', incidentError)
          return
        }

        setIncidentData(incident)

        // Only pre-fill if no parties exist yet
        if (parties.length === 0 && incident) {
          // Pre-populate complainant if we have complainant data
          if (incident.complainant_name) {
            setFormData({
              party_type: 'Complainant',
              name: incident.complainant_name || '',
              contact: incident.complainant_contact || '',
              email: incident.complainant_email || '',
              address: '',
              notes: '',
              information_status: 'Pending Verification'
            })
          }
          // Pre-populate respondent if we have respondent data
          else if (incident.respondent_name) {
            setFormData({
              party_type: 'Respondent',
              name: incident.respondent_name || '',
              contact: incident.respondent_contact || '',
              email: '',
              address: '',
              notes: '',
              information_status: 'Pending Verification'
            })
          }

          setShowForm(true)
        }

        setHasPreFilled(true)
      } catch (err) {
        console.warn('Error in pre-fill logic:', err)
      }
    }

    fetchIncidentAndPreFill()
  }, [incidentId, parties.length, hasPreFilled])

  // ── Form handling ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      party_type: 'Respondent',
      name: '',
      contact: '',
      email: '',
      address: '',
      notes: '',
      information_status: 'Pending Verification'
    })
    setFormError(null)
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (party) => {
    setFormData({
      party_type: party.party_type,
      name: party.name,
      contact: party.contact || '',
      email: party.email || '',
      address: party.address || '',
      notes: party.notes || '',
      information_status: party.information_status || 'Pending Verification'
    })
    setEditingId(party.id)
    setShowForm(true)
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.name?.trim()) {
      setFormError('Name is required.')
      return
    }
    if (!formData.contact?.trim() && !formData.email?.trim()) {
      setFormError('At least contact or email is required.')
      return
    }

    let result
    if (editingId) {
      // Update existing party
      result = await updateParty(editingId, {
        name: formData.name.trim(),
        contact: formData.contact.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        information_status: formData.information_status
      })
    } else {
      // Add new party
      result = await addParty({
        party_type: formData.party_type,
        name: formData.name.trim(),
        contact: formData.contact.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        information_status: formData.information_status
      })
    }

    if (result.error) {
      setFormError(result.error)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      resetForm()
      await fetchParties()
    }
  }

  // ── Delete handling ───────────────────────────────────────────────────────

  const handleDelete = async (partyId) => {
    if (!window.confirm('Are you sure you want to delete this party?')) {
      return
    }

    const result = await deleteParty(partyId)
    if (result.error) {
      alert(`Error deleting party: ${result.error}`)
    } else {
      setDeleteSuccess(true)
      setTimeout(() => setDeleteSuccess(false), 3000)
      await fetchParties()
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!incidentId) {
    return (
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Case Parties</h2>
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
            <Users size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Case Parties</h2>
          </div>
        </div>
        <div className="p-6 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-3 text-sm text-muted">Loading parties...</p>
        </div>
      </div>
    )
  }

  // Group parties by type
  const complainants = parties.filter(p => p.party_type === 'Complainant')
  const respondents = parties.filter(p => p.party_type === 'Respondent')

  return (
    <div className="space-y-4">
      {/* Success Messages */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm text-green-800">
            {editingId ? 'Party updated successfully' : 'Party added successfully'}
          </p>
        </div>
      )}

      {deleteSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm text-green-800">Party deleted successfully</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Complainants Section */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <h3 className="text-base font-heading font-semibold text-text">
            Victim / Complainants ({complainants.length})
          </h3>
          <p className="text-xs text-muted mt-1">Individuals who filed the incident report</p>
        </div>
        <div className="p-6">
          {complainants.length === 0 ? (
            <p className="text-sm text-muted italic">No complainants added yet</p>
          ) : (
            <div className="space-y-3">
              {complainants.map(party => (
                <PartyCard
                  key={party.id}
                  party={party}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Respondents Section */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <h3 className="text-base font-heading font-semibold text-text">
            Suspect / Respondents ({respondents.length})
          </h3>
          <p className="text-xs text-muted mt-1">Individuals named in the incident report</p>
        </div>
        <div className="p-6">
          {respondents.length === 0 ? (
            <p className="text-sm text-muted italic">No respondents added yet</p>
          ) : (
            <div className="space-y-3">
              {respondents.map(party => (
                <PartyCard
                  key={party.id}
                  party={party}
                  onEdit={startEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <h3 className="text-base font-heading font-semibold text-text">
            {editingId ? 'Edit Party' : 'Add New Party'}
          </h3>
        </div>

        <div className="p-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Add Party
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Party Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.party_type}
                  onChange={(e) => setFormData({ ...formData, party_type: e.target.value })}
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Respondent">Respondent</option>
                  <option value="Complainant">Complainant</option>
                </select>
                {editingId && (
                  <p className="text-xs text-muted mt-1">Party type cannot be changed after creation</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="09XX-XXXX-XXXX"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete address (optional - may not be available immediately)"
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <p className="text-xs text-muted mt-1">
                  Optional - respondent address may not be available immediately
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Information Status
                </label>
                <select
                  value={formData.information_status}
                  onChange={(e) => setFormData({ ...formData, information_status: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Complete">Complete</option>
                </select>
                <p className="text-xs text-muted mt-1">
                  Track completeness of party information
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes (e.g., 'Address verification pending', 'Details collected during hearing')"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <p className="text-xs text-muted mt-1">
                  Optional - document additional party information
                </p>
              </div>

              <p className="text-xs text-muted">
                At least one contact method (phone or email) is required.
              </p>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {editingId ? 'Update Party' : 'Add Party'}
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
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: PartyCard ──────────────────────────────────────────────

const PartyCard = ({ party, onEdit, onDelete }) => {
  // Get status color
  const getStatusColor = (status) => {
    return status === 'Complete' 
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
  }

  // Get party type label
  const getPartyTypeLabel = (type) => {
    return type === 'Complainant' ? 'Victim / Complainant' : 'Suspect / Respondent'
  }

  return (
    <div className="flex items-start justify-between p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <User size={16} className="text-primary" />
          <p className="font-medium text-text">{party.name}</p>
          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">
            {party.party_type}
          </span>
          {party.information_status && (
            <span className={`text-xs px-2 py-1 rounded font-medium border ${getStatusColor(party.information_status)}`}>
              {party.information_status}
            </span>
          )}
        </div>
        <div className="space-y-1">
          {party.contact && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Phone size={14} />
              <span>{party.contact}</span>
            </div>
          )}
          {party.email && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Mail size={14} />
              <span>{party.email}</span>
            </div>
          )}
          {party.address && (
            <div className="flex items-start gap-2 text-sm text-muted">
              <MapPin size={14} className="mt-0.5 flex-shrink-0" />
              <span>{party.address}</span>
            </div>
          )}
          {party.notes && (
            <div className="flex items-start gap-2 text-sm text-muted mt-2 pt-2 border-t border-border">
              <FileText size={14} className="mt-0.5 flex-shrink-0" />
              <span className="italic">{party.notes}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <button
          onClick={() => onEdit(party)}
          className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={() => onDelete(party.id)}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default CaseParties
