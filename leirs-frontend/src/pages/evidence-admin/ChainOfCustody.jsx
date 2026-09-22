import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Shield, Clock, User, FileText, MapPin, Plus, ChevronRight, AlertCircle } from 'lucide-react';
import useEvidenceCustody from '../../hooks/useEvidenceCustody';

const CUSTODY_ACTIONS = [
  'Received',
  'Transferred',
  'Released',
  'Returned',
  'In Court',
  'Archived'
];

function ChainOfCustody() {
  const [evidenceList, setEvidenceList] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [formData, setFormData] = useState({
    actionType: 'Received',
    fromUser: '',
    toUser: '',
    location: '',
    notes: '',
    actionAt: ''
  });

  const { custodyHistory, loading: custodyLoading, saving, recordCustodyAction, fetchCustodyHistory, getLatestCustodyTimestamp, validateActionTimestamp } = useEvidenceCustody(selectedEvidence?.id);

  useEffect(() => {
    fetchEvidenceList();
  }, []);

  const fetchEvidenceList = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('evidence')
        .select('*, incident:incidents(incident_number, incident_type)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvidenceList(data || []);
    } catch (err) {
      console.error('Error fetching evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvidence = (evidence) => {
    setSelectedEvidence(evidence);
    setShowRecordForm(false);
  };

  const handleSubmitCustodyAction = async (e) => {
    e.preventDefault();

    // Frontend validation for chronological order
    const actionTimestamp = formData.actionAt || new Date().toISOString();
    const validation = validateActionTimestamp(actionTimestamp);
    
    if (!validation.valid) {
      alert(`Validation Error: ${validation.message}`);
      return;
    }

    const user = JSON.parse(localStorage.getItem('leirs_user') || '{}');

    const result = await recordCustodyAction({
      actionType: formData.actionType,
      fromUser: formData.fromUser.trim() || null,
      toUser: formData.toUser.trim() || null,
      location: formData.location.trim() || null,
      notes: formData.notes.trim() || null,
      createdBy: user.username || user.email || 'evidence_admin',
      actionAt: formData.actionAt || null
    });

    if (!result.error) {
      // Reset form
      setFormData({
        actionType: 'Received',
        fromUser: '',
        toUser: '',
        location: '',
        notes: '',
        actionAt: ''
      });
      setShowRecordForm(false);
      // Refresh evidence list to update status
      fetchEvidenceList();
      alert('Custody action recorded successfully!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get minimum datetime for action input (latest custody timestamp or null)
  const getMinActionDateTime = () => {
    const latestTimestamp = getLatestCustodyTimestamp();
    if (!latestTimestamp) return null;
    
    // Format as datetime-local input value (YYYY-MM-DDTHH:mm)
    const year = latestTimestamp.getFullYear();
    const month = String(latestTimestamp.getMonth() + 1).padStart(2, '0');
    const day = String(latestTimestamp.getDate()).padStart(2, '0');
    const hours = String(latestTimestamp.getHours()).padStart(2, '0');
    const minutes = String(latestTimestamp.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const filteredEvidence = evidenceList.filter(ev =>
    ev.evidence_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.evidence_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ev.evidence_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Loading evidence records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Chain of Custody</h1>
        <p className="text-muted">Track and manage evidence custody history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence List */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-border rounded-xl p-4">
            <h2 className="font-semibold text-text mb-4">Evidence Items</h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Search evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Evidence List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredEvidence.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">No evidence found</p>
              ) : (
                filteredEvidence.map((evidence) => (
                  <button
                    key={evidence.id}
                    onClick={() => handleSelectEvidence(evidence)}
                    className={`w-full text-left p-3 border rounded-lg transition-all ${
                      selectedEvidence?.id === evidence.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-background'
                    }`}
                  >
                    <p className="font-mono text-sm font-semibold text-text">{evidence.evidence_number}</p>
                    <p className="text-sm text-text mt-1">{evidence.evidence_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                        {evidence.evidence_type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        evidence.status === 'Logged' ? 'bg-green-100 text-green-700' :
                        evidence.status === 'In Custody' ? 'bg-blue-100 text-blue-700' :
                        evidence.status === 'In Court' ? 'bg-purple-100 text-purple-700' :
                        evidence.status === 'Released' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {evidence.status || 'Logged'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Custody History & Record Form */}
        <div className="lg:col-span-2">
          {!selectedEvidence ? (
            <div className="bg-white border border-border rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-muted" />
              </div>
              <p className="text-muted">Select an evidence item to view custody history</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Evidence Info */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="font-semibold text-text mb-4">Evidence Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted mb-1">Evidence Number</p>
                    <p className="font-mono font-semibold text-text">{selectedEvidence.evidence_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Current Status</p>
                    <span className={`inline-block text-xs px-2 py-1 rounded font-semibold ${
                      selectedEvidence.status === 'Logged' ? 'bg-green-100 text-green-700' :
                      selectedEvidence.status === 'In Custody' ? 'bg-blue-100 text-blue-700' :
                      selectedEvidence.status === 'In Court' ? 'bg-purple-100 text-purple-700' :
                      selectedEvidence.status === 'Released' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedEvidence.status || 'Logged'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Evidence Name</p>
                    <p className="text-sm text-text">{selectedEvidence.evidence_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Evidence Type</p>
                    <p className="text-sm text-text">{selectedEvidence.evidence_type}</p>
                  </div>
                  {selectedEvidence.current_custodian && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted mb-1">Current Custodian</p>
                      <p className="text-sm font-semibold text-text">{selectedEvidence.current_custodian}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowRecordForm(!showRecordForm)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Record Custody Action
                </button>
              </div>

              {/* Record Form */}
              {showRecordForm && (
                <div className="bg-white border border-border rounded-xl p-6">
                  <h3 className="font-semibold text-text mb-4">Record Custody Action</h3>

                  <form onSubmit={handleSubmitCustodyAction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Action Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.actionType}
                          onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        >
                          {CUSTODY_ACTIONS.map(action => (
                            <option key={action} value={action}>{action}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Action Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.actionAt}
                          onChange={(e) => setFormData({ ...formData, actionAt: e.target.value })}
                          min={getMinActionDateTime()}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        {getMinActionDateTime() && (
                          <p className="text-xs text-muted mt-1">
                            Must be on or after latest event
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          From (User/Entity)
                        </label>
                        <input
                          type="text"
                          value={formData.fromUser}
                          onChange={(e) => setFormData({ ...formData, fromUser: e.target.value })}
                          placeholder="e.g., Officer Juan Dela Cruz"
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          To (User/Entity)
                        </label>
                        <input
                          type="text"
                          value={formData.toUser}
                          onChange={(e) => setFormData({ ...formData, toUser: e.target.value })}
                          placeholder="e.g., Evidence Custodian"
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-text mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g., Evidence Room, Station 5"
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-text mb-2">
                          Notes
                        </label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Additional details about this custody action..."
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                      >
                        {saving ? 'Recording...' : 'Record Action'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRecordForm(false)}
                        className="px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Custody History Timeline */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h3 className="font-semibold text-text mb-4">Custody History</h3>

                {custodyLoading ? (
                  <div className="py-8 text-center text-muted">Loading history...</div>
                ) : custodyHistory.length === 0 ? (
                  <div className="py-8 text-center">
                    <AlertCircle size={32} className="text-muted mx-auto mb-2" />
                    <p className="text-muted">No custody history recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {custodyHistory.map((record, index) => (
                      <div key={record.id} className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0">
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary"></div>

                        <div className="bg-background rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                record.action_type === 'Received' ? 'bg-green-100 text-green-700' :
                                record.action_type === 'Transferred' ? 'bg-blue-100 text-blue-700' :
                                record.action_type === 'Released' ? 'bg-orange-100 text-orange-700' :
                                record.action_type === 'Returned' ? 'bg-cyan-100 text-cyan-700' :
                                record.action_type === 'In Court' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {record.action_type}
                              </span>
                            </div>
                            <p className="text-xs text-muted">{formatDateTime(record.action_at)}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {record.from_user && (
                              <div>
                                <p className="text-xs text-muted">From:</p>
                                <p className="text-text font-medium">{record.from_user}</p>
                              </div>
                            )}
                            {record.to_user && (
                              <div>
                                <p className="text-xs text-muted">To:</p>
                                <p className="text-text font-medium">{record.to_user}</p>
                              </div>
                            )}
                            {record.location && (
                              <div className="col-span-2">
                                <p className="text-xs text-muted">Location:</p>
                                <p className="text-text">{record.location}</p>
                              </div>
                            )}
                            {record.notes && (
                              <div className="col-span-2">
                                <p className="text-xs text-muted">Notes:</p>
                                <p className="text-text">{record.notes}</p>
                              </div>
                            )}
                          </div>

                          {record.created_by && (
                            <p className="text-xs text-muted mt-2">Recorded by: {record.created_by}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChainOfCustody;
