import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Activity, CheckCircle, XCircle, AlertCircle, FolderOpen, Clock } from 'lucide-react';
import useCaseStatus from '../../hooks/useCaseStatus';

const StatusAdminDashboard = () => {
  const navigate = useNavigate();
  const { stats, fetchCaseStats, loading, getCurrentStatus } = useCaseStatus();
  const [recentCases, setRecentCases] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setError(null);
      await fetchCaseStats();
      await fetchRecentCases();
    };
    loadDashboardData();
  }, [fetchCaseStats]);

  const fetchRecentCases = async () => {
    try {
      setLoadingRecent(true);
      setError(null);
      const { supabase } = await import('../../lib/supabase');
      
      const { data, error: fetchError } = await supabase
        .from('case_documentations')
        .select(`
          id,
          case_number,
          case_status,
          updated_at,
          incident:incidents!inner(
            id,
            incident_number,
            incident_type,
            location
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (fetchError) throw fetchError;

      // Fetch dispatch info for each case
      const casesWithDispatch = await Promise.all(
        (data || []).map(async (caseItem) => {
          const { data: dispatch } = await supabase
            .from('dispatch')
            .select('dispatch_status, officer_name, dispatched_at')
            .eq('incident_id', caseItem.incident.id)
            .order('dispatched_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...caseItem,
            dispatch: dispatch || null
          };
        })
      );

      setRecentCases(casesWithDispatch);
    } catch (err) {
      console.error('Error fetching recent cases:', err);
      setError(err.message);
    } finally {
      setLoadingRecent(false);
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Case Status Administration</h1>
        <p className="text-muted">Monitor case progress and manage case status</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900 mb-1">Error Loading Dashboard</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Cases */}
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FolderOpen size={24} className="text-primary" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-heading font-bold text-text">{stats.total}</p>
          )}
          <p className="text-sm text-muted mt-1">Total Cases</p>
        </div>

        {/* Active Cases (Total - Closed) */}
        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-blue-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-heading font-bold text-blue-600">
              {stats.total - stats.closed}
            </p>
          )}
          <p className="text-sm text-muted mt-1">Active Cases</p>
        </div>

        {/* Ready for Dispatch */}
        <div className="bg-white border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart size={24} className="text-purple-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-heading font-bold text-purple-600">{stats.readyForDispatch}</p>
          )}
          <p className="text-sm text-muted mt-1">Dispatched Cases</p>
        </div>

        {/* Under Investigation */}
        <div className="bg-white border border-orange-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-orange-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-heading font-bold text-orange-600">{stats.underInvestigation}</p>
          )}
          <p className="text-sm text-muted mt-1">Under Investigation</p>
        </div>

        {/* Resolved */}
        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-heading font-bold text-green-600">{stats.resolved}</p>
          )}
          <p className="text-sm text-muted mt-1">Resolved</p>
        </div>

        {/* Closed */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle size={24} className="text-gray-600" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-heading font-bold text-gray-600">{stats.closed}</p>
          )}
          <p className="text-sm text-muted mt-1">Closed</p>
        </div>
      </div>

      {/* Recent Cases */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-heading font-semibold text-text">Recently Updated Cases</h2>
        </div>
        
        <div className="p-6">
          {loadingRecent ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded flex-1" />
                  <div className="h-6 bg-gray-100 rounded w-24" />
                </div>
              ))}
            </div>
          ) : recentCases.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle size={32} className="mx-auto text-muted mb-2" />
              <p className="text-muted">No cases found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCases.map(caseItem => {
                const currentStatus = getCurrentStatus(caseItem);
                return (
                  <div
                    key={caseItem.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-background transition-colors cursor-pointer"
                    onClick={() => navigate(`/status-admin/case/${caseItem.incident.id}`)}
                  >
                    <div className="flex-shrink-0">
                      <p className="font-mono text-xs font-semibold text-primary">{caseItem.case_number}</p>
                      <p className="font-mono text-xs text-muted">{caseItem.incident.incident_number}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{caseItem.incident.incident_type}</p>
                      <p className="text-xs text-muted truncate">{caseItem.incident.location}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${currentStatus.color}`}>
                        {currentStatus.display}
                      </span>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted">{formatDateTime(caseItem.updated_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {recentCases.length > 0 && (
          <div className="px-6 py-4 border-t border-border">
            <button
              onClick={() => navigate('/status-admin/monitoring')}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View All Cases →
            </button>
          </div>
        )}
      </div>

      
    </div>
);
};

export default StatusAdminDashboard;
