import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Eye, User, MapPin, Clock, AlertCircle, CheckCircle, Shield, Radio } from 'lucide-react';
import useDispatchRequest from '../../hooks/useDispatchRequest';

function ActiveDispatches() {
  const navigate = useNavigate();
  const [dispatches, setDispatches] = useState([]);
  const [filteredDispatches, setFilteredDispatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [officerName, setOfficerName] = useState('');
  const [officerBadge, setOfficerBadge] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [responseTypeFilter, setResponseTypeFilter] = useState('all');

  const { updateStationResponse, assignOfficer, updateDispatchStatus, updateActionTaken } = useDispatchRequest();

  useEffect(() => {
    fetchActiveDispatches();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('dispatch_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'dispatch' },
        () => {
          fetchActiveDispatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterDispatches();
  }, [searchTerm, statusFilter, responseTypeFilter, dispatches]);

  const fetchActiveDispatches = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('dispatch')
        .select(`
          *,
          incident:incidents (
            incident_number,
            incident_type,
            location,
            priority,
            description,
            location_latitude,
            location_longitude
          ),
          police_station:police_stations (
            station_name,
            address,
            contact_number
          )
        `)
        .neq('dispatch_status', 'Completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDispatches(data || []);
    } catch (err) {
      console.error('Error fetching dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterDispatches = () => {
    let filtered = [...dispatches];

    // Response Type filter
    if (responseTypeFilter !== 'all') {
      if (responseTypeFilter === 'barangay_tanod') {
        filtered = filtered.filter(d => d.response_type === 'barangay_tanod');
      } else if (responseTypeFilter === 'pnp_officer') {
        filtered = filtered.filter(d => !d.response_type || d.response_type === 'pnp_officer');
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.dispatch_status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d => 
        d.incident?.incident_number?.toLowerCase().includes(term) ||
        d.incident?.incident_type?.toLowerCase().includes(term) ||
        d.police_station?.station_name?.toLowerCase().includes(term) ||
        d.assigned_officer_name?.toLowerCase().includes(term) ||
        d.responder_name?.toLowerCase().includes(term) ||
        d.response_purpose?.toLowerCase().includes(term)
      );
    }

    setFilteredDispatches(filtered);
  };

  const handleStationResponse = async (dispatchId, response) => {
    if (!confirm(`Are you sure you want to mark this as Station ${response === 'accepted' ? 'Accepted' : 'Declined'}?`)) return;

    setActionLoading(true);
    const result = await updateStationResponse(dispatchId, response);
    setActionLoading(false);

    if (result.error) {
      alert(`Error updating station response: ${result.error}`);
      console.error('Station response update failed:', result.error);
      return;
    }

    if (!result.error) {
      fetchActiveDispatches();
      if (response === 'accepted') {
        alert('Station accepted. You can now assign an officer.');
      }
    }
  };

  const handleSelectAnotherStation = (dispatch) => {
    // Navigate back to dispatch request page to select a different station
    navigate(`/dispatch-admin/dispatch/${dispatch.incident_id}`);
  };

  const handleAssignOfficer = async () => {
    if (!selectedDispatch) return;
    if (!officerName.trim() || !officerBadge.trim()) {
      alert('Please enter both officer name and badge number');
      return;
    }

    setActionLoading(true);
    const result = await assignOfficer(
      selectedDispatch.id,
      officerName.trim(),
      officerBadge.trim()
    );
    setActionLoading(false);

    if (!result.error) {
      setShowModal(false);
      setOfficerName('');
      setOfficerBadge('');
      setSelectedDispatch(null);
      fetchActiveDispatches();
      alert('Officer assigned successfully!');
    }
  };

  const handleStatusUpdate = async (dispatchId, newStatus) => {
    if (!confirm(`Update dispatch status to "${newStatus}"?`)) return;

    setActionLoading(true);
    const result = await updateDispatchStatus(dispatchId, newStatus);
    setActionLoading(false);

    if (!result.error) {
      fetchActiveDispatches();
    }
  };

  const handleTanodStatusUpdate = async (dispatchId, newStatus) => {
    if (!confirm(`Update status to "${newStatus}"?`)) return;

    setActionLoading(true);
    const result = await updateDispatchStatus(dispatchId, newStatus);
    setActionLoading(false);

    if (!result.error) {
      fetchActiveDispatches();
    }
  };

  const handleRecordActionTaken = async () => {
    if (!selectedDispatch || !actionTaken.trim()) {
      alert('Please describe the action taken');
      return;
    }

    setActionLoading(true);
    const result = await updateActionTaken(
      selectedDispatch.id,
      actionTaken.trim(),
      new Date().toISOString()
    );
    setActionLoading(false);

    if (!result.error) {
      setShowActionModal(false);
      setActionTaken('');
      setSelectedDispatch(null);
      fetchActiveDispatches();
      alert('Action recorded successfully!');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending Station Response': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Station Accepted': 'bg-green-100 text-green-700 border-green-200',
      'Station Declined': 'bg-red-100 text-red-700 border-red-200',
      'Officer Assigned': 'bg-blue-100 text-blue-700 border-blue-200',
      'Dispatched': 'bg-purple-100 text-purple-700 border-purple-200',
      'Responding': 'bg-orange-100 text-orange-700 border-orange-200',
      'On Scene': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Completed': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      // 'Pending Station Response' is handled explicitly with custom buttons above
      'Station Accepted': ['Officer Assigned'],
      'Officer Assigned': ['Dispatched'],
      'Dispatched': ['Responding'],
      'Responding': ['On Scene'],
      'On Scene': ['Completed']
    };
    return statusFlow[currentStatus] || [];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Loading active dispatches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-2">Active Dispatches</h1>
        <p className="text-muted">Monitor and manage ongoing dispatch requests</p>
      </div>

      {/* Response Type Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setResponseTypeFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            responseTypeFilter === 'all'
              ? 'bg-primary text-white'
              : 'bg-white border border-border text-muted hover:bg-background'
          }`}
        >
          All Responses
        </button>
        <button
          onClick={() => setResponseTypeFilter('barangay_tanod')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            responseTypeFilter === 'barangay_tanod'
              ? 'bg-green-600 text-white'
              : 'bg-white border border-border text-muted hover:bg-background'
          }`}
        >
          🛡️ Barangay Tanod
        </button>
        <button
          onClick={() => setResponseTypeFilter('pnp_officer')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            responseTypeFilter === 'pnp_officer'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-border text-muted hover:bg-background'
          }`}
        >
          👮 PNP Officer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by incident #, type, station, or officer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Pending Station Response">Pending Station Response</option>
              <option value="Station Accepted">Station Accepted</option>
              <option value="Officer Assigned">Officer Assigned</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Responding">Responding</option>
              <option value="On Scene">On Scene</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">🛡️ Barangay Tanod</p>
          <p className="text-2xl font-bold text-green-900">
            {dispatches.filter(d => d.response_type === 'barangay_tanod').length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">👮 PNP Officer</p>
          <p className="text-2xl font-bold text-blue-900">
            {dispatches.filter(d => !d.response_type || d.response_type === 'pnp_officer').length}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700 mb-1">En Route / Dispatched</p>
          <p className="text-2xl font-bold text-orange-900">
            {dispatches.filter(d => d.dispatch_status === 'Dispatched' || d.dispatch_status === 'Responding').length}
          </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-700 mb-1">On Scene</p>
          <p className="text-2xl font-bold text-indigo-900">
            {dispatches.filter(d => d.dispatch_status === 'On Scene').length}
          </p>
        </div>
      </div>

      {/* Dispatches List */}
      {filteredDispatches.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-muted" />
          </div>
          <p className="text-muted">No active dispatches found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDispatches.map((dispatch) => {
            const isTanod = dispatch.response_type === 'barangay_tanod';
            const isPNP = !dispatch.response_type || dispatch.response_type === 'pnp_officer';

            return (
            <div key={dispatch.id} className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-text">
                      {dispatch.incident?.incident_number || 'N/A'}
                    </h3>
                    
                    {/* Response Type Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isTanod 
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                    }`}>
                      {isTanod ? '🛡️ Barangay Tanod' : '👮 PNP Officer'}
                    </span>

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(dispatch.dispatch_status)}`}>
                      {dispatch.dispatch_status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      dispatch.incident?.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                      dispatch.incident?.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {dispatch.incident?.priority || 'Medium'} Priority
                    </span>
                  </div>
                  <p className="text-sm text-muted">{dispatch.incident?.incident_type || 'N/A'}</p>
                  {dispatch.response_purpose && (
                    <p className="text-xs text-primary mt-1">Purpose: {dispatch.response_purpose}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-muted mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Incident Location</p>
                    <p className="text-sm text-text">{dispatch.incident?.location || 'N/A'}</p>
                  </div>
                </div>

                {/* CONDITIONAL: PNP shows Police Station, Tanod shows Responder */}
                {isPNP && (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted">Police Station</p>
                      <p className="text-sm font-semibold text-text">{dispatch.police_station?.station_name || 'N/A'}</p>
                    </div>
                  </div>
                )}

                {isTanod && (
                  <div className="flex items-start gap-2">
                    <User size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted">Assigned Responder</p>
                      <p className="text-sm font-semibold text-text">{dispatch.responder_name || 'Pending Assignment'}</p>
                      {dispatch.responder_role && (
                        <p className="text-xs text-muted">{dispatch.responder_role}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Clock size={16} className="text-muted mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted">Dispatched At</p>
                    <p className="text-sm text-text">{formatDateTime(dispatch.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* PNP Officer Info */}
              {isPNP && dispatch.assigned_officer_name && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    <div>
                      <p className="text-xs text-blue-700">Assigned Officer</p>
                      <p className="text-sm font-semibold text-blue-900">
                        {dispatch.assigned_officer_name}
                        {dispatch.assigned_officer_badge && ` (Badge #${dispatch.assigned_officer_badge})`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tanod Action Taken Info */}
              {isTanod && dispatch.action_taken && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-green-700">Action Taken</p>
                      <p className="text-sm text-green-900">{dispatch.action_taken}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Conditional by Response Type */}
              <div className="flex flex-wrap gap-2">
                {/* PNP WORKFLOW BUTTONS */}
                {isPNP && (
                  <>
                    {dispatch.dispatch_status === 'Pending Station Response' && (
                      <>
                        <button
                          onClick={() => handleStationResponse(dispatch.id, 'accepted')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Mark as Station Accepted
                        </button>
                        <button
                          onClick={() => handleStationResponse(dispatch.id, 'declined')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                          Mark as Station Declined
                        </button>
                      </>
                    )}

                    {dispatch.dispatch_status === 'Station Declined' && (
                      <button
                        onClick={() => handleSelectAnotherStation(dispatch)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <MapPin size={16} />
                        Select Another Station
                      </button>
                    )}

                    {dispatch.dispatch_status === 'Station Accepted' && !dispatch.assigned_officer_name && (
                      <button
                        onClick={() => {
                          setSelectedDispatch(dispatch);
                          setShowModal(true);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <User size={16} />
                        Assign Officer
                      </button>
                    )}

                    {getNextStatuses(dispatch.dispatch_status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => handleStatusUpdate(dispatch.id, nextStatus)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        Mark as {nextStatus}
                      </button>
                    ))}
                  </>
                )}

                {/* BARANGAY TANOD WORKFLOW BUTTONS */}
                {isTanod && (
                  <>
                    {dispatch.dispatch_status === 'Pending' && (
                      <button
                        onClick={() => handleTanodStatusUpdate(dispatch.id, 'Assigned')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <User size={16} />
                        Mark as Assigned
                      </button>
                    )}

                    {dispatch.dispatch_status === 'Assigned' && (
                      <button
                        onClick={() => handleTanodStatusUpdate(dispatch.id, 'Dispatched')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        Mark as Dispatched
                      </button>
                    )}

                    {dispatch.dispatch_status === 'Dispatched' && (
                      <button
                        onClick={() => handleTanodStatusUpdate(dispatch.id, 'On Scene')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <MapPin size={16} />
                        Mark as On Scene
                      </button>
                    )}

                    {dispatch.dispatch_status === 'On Scene' && (
                      <button
                        onClick={() => {
                          setSelectedDispatch(dispatch);
                          setShowActionModal(true);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Record Action Taken
                      </button>
                    )}

                    {dispatch.dispatch_status === 'Action Taken' && (
                      <button
                        onClick={() => handleTanodStatusUpdate(dispatch.id, 'Completed')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Mark as Completed
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Assign Officer Modal (PNP) */}
      {showModal && selectedDispatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-text mb-4">Assign Officer to Dispatch</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-muted mb-1">Incident Number</p>
                <p className="font-mono font-semibold text-text">{selectedDispatch.incident?.incident_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Officer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="Enter officer full name"
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Badge Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={officerBadge}
                  onChange={(e) => setOfficerBadge(e.target.value)}
                  placeholder="Enter badge number"
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAssignOfficer}
                disabled={actionLoading || !officerName.trim() || !officerBadge.trim()}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Assigning...' : 'Assign Officer'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedDispatch(null);
                  setOfficerName('');
                  setOfficerBadge('');
                }}
                disabled={actionLoading}
                className="px-4 py-2.5 border border-border rounded-lg hover:bg-background transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Action Taken Modal (Barangay Tanod) */}
      {showActionModal && selectedDispatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-text mb-4">Record Action Taken</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-muted mb-1">Incident Number</p>
                <p className="font-mono font-semibold text-text">{selectedDispatch.incident?.incident_number}</p>
              </div>

              <div>
                <p className="text-sm text-muted mb-1">Responder</p>
                <p className="font-semibold text-text">{selectedDispatch.responder_name}</p>
                <p className="text-xs text-muted">{selectedDispatch.responder_role}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Describe Action Taken <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Describe what action was taken to address the incident..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRecordActionTaken}
                disabled={actionLoading || !actionTaken.trim()}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Recording...' : 'Record Action'}
              </button>
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedDispatch(null);
                  setActionTaken('');
                }}
                disabled={actionLoading}
                className="px-4 py-2.5 border border-border rounded-lg hover:bg-background transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveDispatches;
