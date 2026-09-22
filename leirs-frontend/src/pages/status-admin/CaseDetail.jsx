import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, MapPin, Calendar, Clock, User, Phone,
  Radio, Shield, Activity, AlertCircle, Save, CheckCircle
} from 'lucide-react';
import useCaseStatus from '../../hooks/useCaseStatus';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Under Investigation', label: 'Under Investigation' },
  { value: 'For Mediation', label: 'Ready for Dispatch' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' }
];

const CaseDetail = () => {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { fetchCaseDetail, updateCaseStatus, getCurrentStatus } = useCaseStatus();
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    loadCaseDetail();
  }, [incidentId]);

  const loadCaseDetail = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchCaseDetail(incidentId);
    
    if (result.error) {
      setError(result.error);
    } else {
      setCaseData(result.data);
      setNewStatus(result.data.caseDoc.case_status);
    }
    
    setLoading(false);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }

    if (newStatus === caseData.caseDoc.case_status) {
      alert('Status has not changed');
      return;
    }

    if (!statusNotes.trim()) {
      alert('Please provide notes for the status update');
      return;
    }

    setUpdating(true);

    const result = await updateCaseStatus(incidentId, newStatus, statusNotes);

    if (result.error) {
      alert(`Error updating status: ${result.error}`);
    } else {
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      setShowStatusUpdate(false);
      setStatusNotes('');
      // Reload case detail
      loadCaseDetail();
    }

    setUpdating(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Under Investigation':
        return 'bg-blue-100 text-blue-700';
      case 'For Mediation':
        return 'bg-purple-100 text-purple-700';
      case 'Resolved':
        return 'bg-green-100 text-green-700';
      case 'Closed':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return null;
    const [h, m] = timeString.split(':');
    const d = new Date();
    d.setHours(+h, +m);
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusDisplay = (status) => {
    return status === 'For Mediation' ? 'Ready for Dispatch' : status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
          <p className="text-red-600 mb-4">{error || 'Case not found'}</p>
          <button
            onClick={() => navigate('/status-admin/monitoring')}
            className="btn-primary"
          >
            Back to Case List
          </button>
        </div>
      </div>
    );
  }

  const { caseDoc, incident, dispatches, caseUpdates, evidence } = caseData;
  const latestDispatch = dispatches[0];
  
  // Get current status including dispatch status
  const currentStatusInfo = getCurrentStatus({
    case_status: caseDoc.case_status,
    dispatch: latestDispatch
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/status-admin/monitoring')}
          className="p-2 hover:bg-background rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-text mb-1">Case Details</h1>
          <p className="text-muted">Monitor case progress and update status</p>
        </div>
      </div>

      {/* Success Message */}
      {updateSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm text-green-800">Case status updated successfully</p>
        </div>
      )}

      {/* Current Status Overview */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <h2 className="text-lg font-heading font-semibold text-text">Current Status</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Active Status</p>
              <span className={`inline-block px-4 py-2 rounded text-base font-semibold ${currentStatusInfo.color}`}>
                {currentStatusInfo.display}
              </span>
              <p className="text-xs text-muted mt-2">
                Source: {currentStatusInfo.source === 'dispatch' ? 'Dispatch Workflow' : 'Case Documentation'}
              </p>
            </div>
            {currentStatusInfo.source === 'dispatch' && (
              <div className="flex-1 border-l border-border pl-6">
                <p className="text-xs text-muted uppercase tracking-wide mb-2">Case Documentation Status</p>
                <span className={`inline-block px-3 py-1.5 rounded text-sm font-semibold ${getStatusColor(caseDoc.case_status)}`}>
                  {getStatusDisplay(caseDoc.case_status)}
                </span>
                <p className="text-xs text-muted mt-2">
                  (Dispatch workflow is currently active)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Case Information */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background flex items-center justify-between">
          <div>
            <p className="text-xs text-muted font-medium uppercase tracking-wide">Case Number</p>
            <p className="font-mono font-bold text-primary">{caseDoc.case_number}</p>
          </div>
          <span className={`px-3 py-1.5 rounded text-sm font-semibold ${getStatusColor(caseDoc.case_status)}`}>
            {getStatusDisplay(caseDoc.case_status)}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <FileText size={18} className="text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Incident Number</p>
              <p className="font-mono text-sm font-semibold text-text">{incident.incident_number}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText size={18} className="text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Incident Type</p>
              <p className="text-sm text-text">{incident.incident_type}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Date</p>
              <p className="text-sm text-text">{formatDate(incident.incident_date)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={18} className="text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Time</p>
              <p className="text-sm text-text">{formatTime(incident.incident_time) || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Location</p>
              <p className="text-sm text-text">{incident.location}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User size={18} className="text-primary mt-0.5" />
            <div>
              <p className="text-xs text-muted uppercase tracking-wide">Complainant</p>
              <p className="text-sm text-text">{incident.complainant_name}</p>
            </div>
          </div>

          {incident.complainant_contact && (
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Contact</p>
                <p className="text-sm text-text">{incident.complainant_contact}</p>
              </div>
            </div>
          )}

          {incident.description && (
            <div className="md:col-span-2 flex items-start gap-3">
              <FileText size={18} className="text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Description</p>
                <p className="text-sm text-text whitespace-pre-wrap">{incident.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Information */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Dispatch Information</h2>
          </div>
          <p className="text-xs text-muted mt-1">Officer assignment managed by Dispatch Module</p>
        </div>

        <div className="p-6">
          {latestDispatch ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Assigned Officer</p>
                <p className="text-sm text-text font-medium">{latestDispatch.officer_name}</p>
              </div>

              {latestDispatch.police_stations && (
                <div>
                  <p className="text-xs text-muted uppercase tracking-wide">Police Station</p>
                  <p className="text-sm text-text font-medium">{latestDispatch.police_stations.station_name}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Dispatch Status</p>
                <span className="inline-block mt-1 px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                  {latestDispatch.dispatch_status}
                </span>
              </div>

              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Dispatched At</p>
                <p className="text-sm text-text">{formatDateTime(latestDispatch.dispatched_at)}</p>
              </div>

              {latestDispatch.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs text-muted uppercase tracking-wide">Dispatch Notes</p>
                  <p className="text-sm text-text whitespace-pre-wrap">{latestDispatch.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Radio size={32} className="mx-auto text-border mb-2" />
              <p className="text-sm text-muted">No dispatch record yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Summary */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Evidence Summary</h2>
          </div>
        </div>

        <div className="p-6">
          {evidence.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                {evidence.length} evidence {evidence.length === 1 ? 'item' : 'items'} logged
              </p>
              <div className="space-y-2">
                {evidence.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                    <div className="flex-1">
                      <p className="font-mono text-xs font-semibold text-primary">{item.evidence_number}</p>
                      <p className="text-sm text-text">{item.evidence_name}</p>
                      <p className="text-xs text-muted">{item.evidence_type}</p>
                    </div>
                    {item.status && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                        {item.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield size={32} className="mx-auto text-border mb-2" />
              <p className="text-sm text-muted">No evidence logged yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Case Updates Timeline */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            <h2 className="text-lg font-heading font-semibold text-text">Activity Timeline</h2>
          </div>
        </div>

        <div className="p-6">
          {caseUpdates.length > 0 ? (
            <div className="space-y-4">
              {caseUpdates.map((update) => (
                <div key={update.id} className="flex gap-4">
                  <div className="flex-shrink-0 w-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-text">{update.officer_name}</p>
                      <span className="text-xs text-muted">{formatDateTime(update.created_at)}</span>
                    </div>
                    <p className="text-sm text-text whitespace-pre-wrap">{update.update_text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity size={32} className="mx-auto text-border mb-2" />
              <p className="text-sm text-muted">No activity updates yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Section */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-background">
          <h2 className="text-lg font-heading font-semibold text-text">Update Case Status</h2>
        </div>

        <div className="p-6">
          {!showStatusUpdate ? (
            <button
              onClick={() => setShowStatusUpdate(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={16} />
              Update Status
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Current Status
                </label>
                <span className={`inline-block px-3 py-1.5 rounded text-sm font-semibold ${getStatusColor(caseDoc.case_status)}`}>
                  {getStatusDisplay(caseDoc.case_status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  New Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Status Update Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Provide reason or notes for this status change..."
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  {updating ? 'Updating...' : 'Confirm Update'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusUpdate(false);
                    setNewStatus(caseDoc.case_status);
                    setStatusNotes('');
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Case Notes */}
      {caseDoc.case_notes && (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-background">
            <h2 className="text-lg font-heading font-semibold text-text">Case Notes</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-text whitespace-pre-wrap">{caseDoc.case_notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
