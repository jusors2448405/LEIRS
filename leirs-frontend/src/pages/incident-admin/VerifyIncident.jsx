import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, Save, Send, CheckCircle, XCircle, AlertCircle, 
  User, Phone, MapPin, FileText, Calendar, Clock, Tag 
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const VerifyIncident = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1) // 1: View, 2: Edit, 3: Review, 4: Forward
  
  const [formData, setFormData] = useState({
    incident_type: '',
    incident_date: '',
    incident_time: '',
    location: '',
    complainant_name: '',
    complainant_contact: '',
    description: '',
    priority: 'Low'
  })

  useEffect(() => {
    fetchIncident()
  }, [id])

  const fetchIncident = async () => {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setIncident(data)
    setFormData({
      incident_type: data.incident_type || '',
      incident_date: data.incident_date || '',
      incident_time: data.incident_time || '',
      location: data.location || '',
      complainant_name: data.complainant_name || '',
      complainant_contact: data.complainant_contact || '',
      description: data.description || '',
      priority: data.priority || 'Low'
    })
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('incidents')
      .update({
        incident_type: formData.incident_type,
        incident_date: formData.incident_date,
        incident_time: formData.incident_time || null,
        location: formData.location,
        complainant_name: formData.complainant_name,
        complainant_contact: formData.complainant_contact,
        description: formData.description,
        priority: formData.priority,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Refresh incident data
    await fetchIncident()
    setSaving(false)
    setStep(3) // Move to review step
  }

  const handleForward = async () => {
    setSaving(true)
    setError('')

    // Update status to "Under Investigation" to indicate forwarded to Case Documentation
    const { error: updateError } = await supabase
      .from('incidents')
      .update({
        status: 'Under Investigation',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setStep(4) // Success step
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return '—'
    const [h, m] = timeStr.split(':')
    const date = new Date()
    date.setHours(Number(h), Number(m))
    return date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading incident details...</p>
        </div>
      </div>
    )
  }

  if (error && !incident) {
    return (
      <div className="space-y-6">
        <Link to="/incident-admin" className="inline-flex items-center gap-2 text-muted hover:text-primary">
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </Link>
        
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <XCircle size={24} className="text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Failed to load incident</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Success - Forwarded
  if (step === 4) {
    return (
      <div className="space-y-6">
        <Link to="/incident-admin" className="inline-flex items-center gap-2 text-muted hover:text-primary">
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </Link>

        <div className="bg-green-50 border border-green-200 rounded-2xl overflow-hidden">
          <div className="px-8 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={28} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-green-800">
                Incident Successfully Forwarded
              </h2>
              <p className="text-sm text-green-700 mt-0.5">
                Incident {incident.incident_number} has been forwarded to Case Documentation
              </p>
            </div>
          </div>

          <div className="px-8 py-5 border-t border-green-200 bg-white flex gap-3">
            <Link to="/incident-admin" className="btn-primary">
              Return to Dashboard
            </Link>
            <Link to="/incident-admin/incidents" className="px-4 py-2 border border-border rounded-lg font-medium text-text hover:bg-background transition-colors">
              View All Incidents
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/incident-admin" className="inline-flex items-center gap-2 text-muted hover:text-primary mb-2">
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-heading font-bold text-text mb-1">
            {step === 1 ? 'Review Incident' : step === 2 ? 'Edit Incident Details' : 'Confirm & Forward'}
          </h1>
          <p className="text-muted">
            Incident {incident?.incident_number}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="text-sm font-medium hidden sm:inline">Review</span>
          </div>
          <div className="flex-1 h-0.5 bg-border mx-2"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Verify & Edit</span>
          </div>
          <div className="flex-1 h-0.5 bg-border mx-2"></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="text-sm font-medium hidden sm:inline">Forward</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step 1 & 3: View/Review Mode */}
      {(step === 1 || step === 3) && (
        <div className="bg-white border border-border rounded-xl p-6 space-y-6">
          {/* Incident Details */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-text mb-4">Incident Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Tag size={18} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase">Incident Type</p>
                  <p className="text-sm text-text mt-0.5">{incident.incident_type}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase">Priority</p>
                  <p className="text-sm text-text mt-0.5">{incident.priority}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase">Date</p>
                  <p className="text-sm text-text mt-0.5">{formatDate(incident.incident_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase">Time</p>
                  <p className="text-sm text-text mt-0.5">{formatTime(incident.incident_time)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin size={18} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase">Location</p>
                  <p className="text-sm text-text mt-0.5">{incident.location}</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Complainant Details */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-text mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              Complainant Information (Verified)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User size={18} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase">Complainant Name</p>
                  <p className="text-sm text-text mt-0.5">{incident.complainant_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-primary mt-0.5" />
                <div>
                  <p className="text-xs text-muted font-medium uppercase">Contact Number</p>
                  <p className="text-sm text-text mt-0.5">{incident.complainant_contact || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Narrative */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-text mb-3">Incident Narrative</h3>
            <div className="bg-background rounded-lg p-4">
              <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                {incident.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            {step === 1 && (
              <>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-border rounded-lg font-medium text-text hover:bg-background transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Proceed to Forward
                </button>
              </>
            )}
            {step === 3 && (
              <>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-border rounded-lg font-medium text-text hover:bg-background transition-colors"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleForward}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Send size={18} />
                  {saving ? 'Forwarding...' : 'Forward to Case Documentation'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Edit Mode */}
      {step === 2 && (
        <div className="bg-white border border-border rounded-xl p-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Incident Type *</label>
                <select
                  value={formData.incident_type}
                  onChange={(e) => setFormData({...formData, incident_type: e.target.value})}
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
                <label className="block text-sm font-medium text-text mb-2">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Incident Date *</label>
                <input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Incident Time</label>
                <input
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) => setFormData({...formData, incident_time: e.target.value})}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="input-field"
                  placeholder="Enter location"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Complainant Name *</label>
                <input
                  type="text"
                  value={formData.complainant_name}
                  onChange={(e) => setFormData({...formData, complainant_name: e.target.value})}
                  className="input-field"
                  placeholder="Enter name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Contact Number *</label>
                <input
                  type="text"
                  value={formData.complainant_contact}
                  onChange={(e) => setFormData({...formData, complainant_contact: e.target.value})}
                  className="input-field"
                  placeholder="Enter contact"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text mb-2">Incident Narrative *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-field min-h-32"
                  placeholder="Describe the incident in detail"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => { setStep(1); fetchIncident(); }}
                className="px-4 py-2 border border-border rounded-lg font-medium text-text hover:bg-background transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default VerifyIncident
