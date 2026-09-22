import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

function ForwardedIncidents() {
  const [forwardedIncidents, setForwardedIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchForwardedIncidents();
  }, []);

  const fetchForwardedIncidents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch incidents with status 'Under Investigation' that don't have case documentation yet
      const { data: incidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .eq('status', 'Under Investigation')
        .order('created_at', { ascending: false });

      if (incidentsError) throw incidentsError;

      // Fetch existing case documentations to filter out incidents that already have cases
      const { data: caseDocs, error: caseDocsError } = await supabase
        .from('case_documentations')
        .select('incident_id');

      if (caseDocsError) throw caseDocsError;

      // Filter out incidents that already have case documentation
      const caseDocIncidentIds = new Set(caseDocs.map(c => c.incident_id));
      const filtered = incidents.filter(inc => !caseDocIncidentIds.has(inc.id));

      setForwardedIncidents(filtered);
    } catch (err) {
      console.error('Error fetching forwarded incidents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = (incident) => {
    // Navigate to cases page with the incident ID to create a case
    navigate('/case-admin/cases', { state: { incidentId: incident.id } });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Forwarded Incidents Awaiting Case Creation</h2>
          <p className="text-muted small mb-0">Review and create case documentation for forwarded incidents</p>
        </div>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => fetchForwardedIncidents()}
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Empty State */}
      {forwardedIncidents.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
            <h5 className="mt-3 mb-2">All Clear!</h5>
            <p className="text-muted mb-0">
              No forwarded incidents awaiting case creation at this time.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Table Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3" style={{ minWidth: '140px' }}>Reference #</th>
                      <th className="px-4 py-3" style={{ minWidth: '150px' }}>Incident Type</th>
                      <th className="px-4 py-3" style={{ minWidth: '130px' }}>Date & Time</th>
                      <th className="px-4 py-3" style={{ minWidth: '150px' }}>Location</th>
                      <th className="px-4 py-3" style={{ minWidth: '160px' }}>Complainant</th>
                      <th className="px-4 py-3" style={{ minWidth: '120px' }}>Status</th>
                      <th className="px-4 py-3 text-center" style={{ minWidth: '140px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forwardedIncidents.map((incident) => (
                      <tr key={incident.id}>
                        <td className="px-4 py-3">
                          <span className="font-monospace fw-semibold text-primary">
                            {incident.incident_number || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {incident.incident_type || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          {incident.incident_date ? (
                            <>
                              <div className="fw-medium">
                                {new Date(incident.incident_date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <small className="text-muted">
                                {incident.incident_time || '—'}
                              </small>
                            </>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {incident.location || (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {incident.complainant_name ? (
                            <>
                              <div className="fw-medium">{incident.complainant_name}</div>
                              {incident.complainant_contact && (
                                <small className="text-muted">{incident.complainant_contact}</small>
                              )}
                            </>
                          ) : (
                            <span className="text-muted">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-warning text-dark px-3 py-2">
                            {incident.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            className="btn btn-sm btn-primary px-3 py-2"
                            onClick={() => handleCreateCase(incident)}
                            title="Create Case Documentation"
                          >
                            <i className="bi bi-folder-plus me-2"></i>
                            Create Case
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-3 p-3 bg-light border rounded-3">
            <div className="d-flex align-items-start">
              <i className="bi bi-info-circle text-muted me-2 mt-1"></i>
              <small className="text-muted">
                Showing incidents with status <strong>"Under Investigation"</strong> that do not have case documentation yet.
              </small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ForwardedIncidents;
