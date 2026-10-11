import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Send, AlertCircle, CheckCircle, Building2, User, Radio } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DispatchMap from '../../components/dispatch/DispatchMap';
import usePoliceStations from '../../hooks/usePoliceStations';
import useDispatchRequest from '../../hooks/useDispatchRequest';

/**
 * Unified Response Dispatch Form
 * Supports both Barangay Tanod and PNP Officer dispatch workflows
 * with conditional field rendering based on selected response type
 */
function UnifiedDispatchForm() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  
  const [incident, setIncident] = useState(null);
  const [caseDoc, setCaseDoc] = useState(null);
  
  // Response Type Selection
  const [responseType, setResponseType] = useState(''); // Empty until user selects
  const [showTypeModal, setShowTypeModal] = useState(true);
  
  // Common Fields
  const [responsePurpose, setResponsePurpose] = useState('');
  const [notes, setNotes] = useState('');
  
  // PNP Fields
  const [selectedStation, setSelectedStation] = useState(null);
  
  // Barangay Tanod Fields
  const [responderName, setResponderName] = useState('');
  const [responderRole, setResponderRole] = useState('Tanod Member');
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [previouslyDeclinedStations, setPreviouslyDeclinedStations] = useState([]);

  const { stations, loading: stationsLoading } = usePoliceStations();
  const { loading: submitting, error: submitError, createDispatchRequest } = useDispatchRequest();

  const RESPONSE_PURPOSES = [
    'Initial Verification',
    'Public Assistance',
    'Mediation Support',
    'Law Enforcement Response',
    'Emergency Response'
  ];

  const RESPONDER_ROLES = [
    'Tanod Captain',
    'Tanod Vice Captain',
    'Tanod Member',
    'Desk Officer',
    'Patrol Officer'
  ];

  useEffect(() => {
    fetchIncidentAndCase();
  }, [incidentId]);

  const fetchIncidentAndCase = async () => {
    try {
      setLoadingData(true);
      setError(null);

      // Fetch incident details
      const { data: incidentData, error: incidentError } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', incidentId)
        .single();

      if (incidentError) throw incidentError;
      setIncident(incidentData);

      // Fetch case documentation
      const { data: caseData, error: caseError } = await supabase
        .from('case_documentations')
        .select('*')
        .eq('incident_id', incidentId)
        .single();

      if (caseError) {
        console.warn('No case documentation found:', caseError);
      } else {
        setCaseDoc(caseData);
      }

      // Check for previously declined dispatches (PNP only)
      const { data: declinedDispatches, error: declinedError } = await supabase
        .from('dispatch')
        .select('police_station_id, police_stations(station_name)')
        .eq('incident_id', incidentId)
        .eq('dispatch_status', 'Station Declined');

      if (!declinedError && declinedDispatches && declinedDispatches.length > 0) {
        setPreviouslyDeclinedStations(declinedDispatches.map(d => ({
          id: d.police_station_id,
          name: d.police_stations?.station_name || 'Unknown'
        })));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleResponseTypeSelect = (type) => {
    setResponseType(type);
    setShowTypeModal(false);
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
    setShowConfirm(false);
  };

  const handleProceedToConfirm = () => {
    // Validation
    if (responseType === 'pnp_officer' && !selectedStation) {
      alert('Please select a police station');
      return;
    }
    if (responseType === 'barangay_tanod' && !responderName.trim()) {
      alert('Please enter responder name');
      return;
    }
    if (!responsePurpose) {
      alert('Please select response purpose');
      return;
    }
    
    setShowConfirm(true);
  };

  const handleSubmitDispatch = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Delete any declined dispatches for this incident (PNP workflow)
    if (responseType === 'pnp_officer') {
      const { error: deleteError } = await supabase
        .from('dispatch')
        .delete()
        .eq('incident_id', incident.id)
        .eq('dispatch_status', 'Station Declined');

      if (deleteError) {
        console.error('Error deleting declined dispatches:', deleteError);
      }
    }

    const result = await createDispatchRequest({
      incidentId: incident.id,
      policeStationId: responseType === 'pnp_officer' ? selectedStation.id : null,
      responseType: responseType,
      responsePurpose: responsePurpose,
      responderName: responseType === 'barangay_tanod' ? responderName.trim() : null,
      responderRole: responseType === 'barangay_tanod' ? responderRole : null,
      notes: notes.trim() || null,
      createdBy: user.username || 'dispatch_admin'
    });

    if (!result.error) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/dispatch-admin/active');
      }, 2000);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(2);
  };

  const sortedStations = incident?.location_latitude && incident?.location_longitude
    ? [...stations].sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const distA = parseFloat(calculateDistance(
          incident.location_latitude, incident.location_longitude,
          a.latitude, a.longitude
        ) || 999);
        const distB = parseFloat(calculateDistance(
          incident.location_latitude, incident.location_longitude,
          b.latitude, b.longitude
        ) || 999);
        return distA - distB;
      })
    : stations;

  if (loadingData || stationsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Loading dispatch information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/dispatch-admin/pending')}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Pending
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Error Loading Data</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">
            {responseType === 'barangay_tanod' ? 'Barangay Tanod Dispatched!' : 'Dispatch Request Sent!'}
          </h3>
          <p className="text-muted mb-4">Redirecting to active responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Response Type Selection Modal */}
      {showTypeModal && !responseType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-text mb-2">Select Response Type</h3>
            <p className="text-sm text-muted mb-6">Choose how to respond to this incident</p>

            <div className="space-y-3">
              <button
                onClick={() => handleResponseTypeSelect('barangay_tanod')}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">🛡️ Barangay Tanod</p>
                    <p className="text-sm text-muted">Assign local barangay responder</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleResponseTypeSelect('pnp_officer')}
                className="w-full p-4 border-2 border-border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Radio size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-text">👮 PNP Officer</p>
                    <p className="text-sm text-muted">Select police station and dispatch</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => navigate('/dispatch-admin/pending')}
              className="w-full mt-4 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dispatch-admin/pending')}
          className="flex items-center gap-2 text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Pending
        </button>
        
        {responseType && (
          <span className={`px-4 py-2 rounded-lg font-semibold ${
            responseType === 'barangay_tanod'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {responseType === 'barangay_tanod' ? '🛡️ Barangay Tanod Response' : '👮 PNP Officer Response'}
          </span>
        )}
      </div>

      {/* Incident Details Card */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-heading font-semibold text-text mb-4">Incident Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted mb-1">Incident Number</p>
            <p className="font-mono font-semibold text-text">{incident?.incident_number || 'N/A'}</p>
          </div>
          {caseDoc && (
            <div>
              <p className="text-sm text-muted mb-1">Case Number</p>
              <p className="font-mono font-semibold text-primary">{caseDoc.case_number}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted mb-1">Type</p>
            <p className="text-text">{incident?.incident_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Priority</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              incident?.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
              incident?.priority === 'High' ? 'bg-orange-100 text-orange-700' :
              incident?.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {incident?.priority || 'Medium'}
            </span>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted mb-1">Location</p>
            <p className="text-text">{incident?.location || 'N/A'}</p>
          </div>
          {incident?.description && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted mb-1">Description</p>
              <p className="text-sm text-text">{incident.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Response Purpose Field (COMMON) */}
      {responseType && !showConfirm && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-text mb-4">Response Purpose <span className="text-red-500">*</span></h3>
          <select
            value={responsePurpose}
            onChange={(e) => setResponsePurpose(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          >
            <option value="">Select response purpose...</option>
            {RESPONSE_PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>{purpose}</option>
            ))}
          </select>
        </div>
      )}

      {/* PNP WORKFLOW: Map and Station Selection */}
      {responseType === 'pnp_officer' && !showConfirm && (
        <>
          {previouslyDeclinedStations.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900 mb-1">Previous Station Declined</p>
                  <p className="text-sm text-orange-800">
                    The following station(s) previously declined this dispatch request:
                    {' '}<strong>{previouslyDeclinedStations.map(s => s.name).join(', ')}</strong>
                  </p>
                  <p className="text-sm text-orange-800 mt-1">
                    Please select a different police station to send a new dispatch request.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-text mb-4">Incident Location & Nearby Stations</h3>
                <DispatchMap
                  incident={incident}
                  policeStations={stations}
                  onSelectStation={handleStationSelect}
                  selectedStationId={selectedStation?.id}
                />
              </div>
            </div>

            {/* Station List */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-border rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-text mb-4">Police Stations</h3>
                {sortedStations.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">No police stations available</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {sortedStations.map((station) => {
                      const distance = incident?.location_latitude && incident?.location_longitude && station.latitude && station.longitude
                        ? calculateDistance(
                            incident.location_latitude,
                            incident.location_longitude,
                            station.latitude,
                            station.longitude
                          )
                        : null;
                      
                      const isSelected = selectedStation?.id === station.id;
                      const wasDeclined = previouslyDeclinedStations.some(s => s.id === station.id);

                      return (
                        <div
                          key={station.id}
                          onClick={() => handleStationSelect(station)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : wasDeclined
                              ? 'border-orange-300 bg-orange-50/50'
                              : 'border-border hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Building2 size={20} className={isSelected ? 'text-blue-600' : wasDeclined ? 'text-orange-600' : 'text-muted'} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-text truncate">{station.station_name}</p>
                                {wasDeclined && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                                    Previously Declined
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted mt-1">{station.address}</p>
                              {distance && (
                                <p className="text-xs font-semibold text-primary mt-1">
                                  📍 {distance} km away
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* BARANGAY TANOD WORKFLOW: Responder Assignment */}
      {responseType === 'barangay_tanod' && !showConfirm && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="font-semibold text-text">Barangay Tanod Assignment</h3>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Responder Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={responderName}
                onChange={(e) => setResponderName(e.target.value)}
                placeholder="Enter full name of Barangay Tanod"
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Responder Role
            </label>
            <select
              value={responderRole}
              onChange={(e) => setResponderRole(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {RESPONDER_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Dispatch Notes (COMMON) */}
      {responseType && !showConfirm && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-text mb-4">Dispatch Notes (Optional)</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any special instructions or notes for the dispatch request..."
            rows={4}
            className="w-full px-4 py-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleProceedToConfirm}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Send size={20} />
              Review Dispatch Request
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Panel */}
      {showConfirm && (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Send size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text mb-1">Confirm Dispatch Request</h3>
              <p className="text-sm text-muted">Review the details before sending the dispatch request</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted mb-1">Case Number</p>
                <p className="font-mono font-semibold text-text">{caseDoc?.case_number || incident?.incident_number}</p>
              </div>
              <div>
                <p className="text-xs text-muted mb-1">Incident Type</p>
                <p className="text-text">{incident?.incident_type}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted mb-1">Response Type</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                responseType === 'barangay_tanod'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {responseType === 'barangay_tanod' ? '🛡️ Barangay Tanod' : '👮 PNP Officer'}
              </span>
            </div>

            <div>
              <p className="text-xs text-muted mb-1">Response Purpose</p>
              <p className="font-semibold text-text">{responsePurpose}</p>
            </div>

            {responseType === 'pnp_officer' && selectedStation && (
              <div>
                <p className="text-xs text-muted mb-1">Selected Police Station</p>
                <p className="font-semibold text-text">{selectedStation.station_name}</p>
                <p className="text-sm text-muted">{selectedStation.address}</p>
              </div>
            )}

            {responseType === 'barangay_tanod' && (
              <div>
                <p className="text-xs text-muted mb-1">Assigned Responder</p>
                <p className="font-semibold text-text">{responderName}</p>
                <p className="text-sm text-muted">{responderRole}</p>
              </div>
            )}

            {notes && (
              <div>
                <p className="text-xs text-muted mb-1">Dispatch Notes</p>
                <p className="text-sm text-text">{notes}</p>
              </div>
            )}
          </div>

          {submitError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmitDispatch}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send Dispatch Request
                </>
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={submitting}
              className="px-6 py-3 border border-border rounded-lg hover:bg-background transition-colors font-medium disabled:opacity-50"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedDispatchForm;
