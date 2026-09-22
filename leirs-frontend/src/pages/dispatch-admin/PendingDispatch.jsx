import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, MapPin, Calendar, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function PendingDispatch() {
  const [pendingCases, setPendingCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingCases();
  }, []);

  const fetchPendingCases = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get cases marked "Ready for Dispatch" (For Mediation status)
      const { data: cases, error: casesError } = await supabase
        .from('case_documentations')
        .select('*')
        .eq('case_status', 'For Mediation')
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Get existing dispatch records
      const { data: dispatches, error: dispatchError } = await supabase
        .from('dispatch')
        .select('incident_id, dispatch_status');

      if (dispatchError) throw dispatchError;

      // Group dispatches by incident_id and check if any are NOT declined
      const dispatchMap = new Map();
      dispatches?.forEach(d => {
        const existing = dispatchMap.get(d.incident_id) || [];
        existing.push(d.dispatch_status);
        dispatchMap.set(d.incident_id, existing);
      });

      // Filter cases: include if NO dispatches OR ALL dispatches are Station Declined
      const pendingCaseIds = cases?.filter(c => {
        const statuses = dispatchMap.get(c.incident_id);
        if (!statuses || statuses.length === 0) {
          return true; // No dispatch records - include
        }
        // Only include if ALL dispatches are Station Declined
        return statuses.every(status => status === 'Station Declined');
      }) || [];

      // Fetch incident details for pending cases
      if (pendingCaseIds.length > 0) {
        const incidentIds = pendingCaseIds.map(c => c.incident_id);
        
        const { data: incidents, error: incidentsError } = await supabase
          .from('incidents')
          .select('*')
          .in('id', incidentIds);

        if (incidentsError) throw incidentsError;

        // Combine case and incident data
        const combined = pendingCaseIds.map(caseDoc => {
          const incident = incidents?.find(inc => inc.id === caseDoc.incident_id);
          return {
            ...caseDoc,
            incident
          };
        });

        setPendingCases(combined);
      } else {
        setPendingCases([]);
      }
    } catch (err) {
      console.error('Error fetching pending cases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = (caseItem) => {
    navigate(`/dispatch-admin/dispatch/${caseItem.incident_id}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-green-100 text-green-700',
      'Medium': 'bg-yellow-100 text-yellow-700',
      'High': 'bg-orange-100 text-orange-700',
      'Urgent': 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Loading pending dispatches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text mb-1">Pending Dispatch Requests</h1>
          <p className="text-muted">Cases ready for police station selection and dispatch</p>
        </div>
        <button
          onClick={fetchPendingCases}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-background transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error Loading Data</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!error && pendingCases.length === 0 && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">All Clear!</h3>
          <p className="text-muted">
            No cases are currently pending dispatch. All cases have been dispatched or are in progress.
          </p>
        </div>
      )}

      {/* Pending Cases Table */}
      {!error && pendingCases.length > 0 && (
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Case Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Incident Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingCases.map((item) => (
                  <tr key={item.id} className="hover:bg-background/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-primary flex-shrink-0" />
                        <span className="font-mono font-semibold text-primary">
                          {item.case_number}
                        </span>
                      </div>
                      {item.incident?.incident_number && (
                        <div className="text-xs text-muted mt-1">
                          Incident: {item.incident.incident_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text">
                        {item.incident?.incident_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-muted flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-text">
                          {item.incident?.location || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-muted flex-shrink-0" />
                        <span className="text-sm text-text">
                          {formatDate(item.incident?.incident_date)}
                        </span>
                      </div>
                      {item.incident?.incident_time && (
                        <div className="text-xs text-muted mt-1">
                          {item.incident.incident_time}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(item.incident?.priority)}`}>
                        {item.incident?.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDispatch(item)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        <MapPin size={16} />
                        Dispatch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Footer */}
      {!error && pendingCases.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Dispatch Workflow</p>
              <p>
                Click <strong>Dispatch</strong> to view the incident on a map, select a nearby police station, 
                and create a dispatch request. You'll manage the station's response in Active Dispatches. 
                If a station declines, the case will return here so you can select a different station.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingDispatch;
