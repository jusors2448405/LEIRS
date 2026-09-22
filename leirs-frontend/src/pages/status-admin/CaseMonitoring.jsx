import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight, AlertCircle, FolderOpen } from 'lucide-react';
import useCaseStatus from '../../hooks/useCaseStatus';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Cases' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Under Investigation', label: 'Under Investigation' },
  { value: 'For Mediation', label: 'Ready for Dispatch' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Closed', label: 'Closed' }
];

const CaseMonitoring = () => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { cases, loading, error, getCurrentStatus } = useCaseStatus({
    search,
    status: statusFilter
  });

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700';
      case 'High':
        return 'bg-orange-100 text-orange-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusDisplay = (status) => {
    return status === 'For Mediation' ? 'Ready for Dispatch' : status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Case Monitoring</h1>
        <p className="text-muted">Monitor and track case progress across all stages</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by case number, incident number, type, or location..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-64">
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white"
              >
                {STATUS_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Case List */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="text-center mb-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-3"></div>
              <p className="text-muted">Loading cases...</p>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
            <p className="font-semibold text-text mb-2">Error Loading Cases</p>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen size={48} className="mx-auto text-border mb-3" />
            <p className="font-semibold text-text mb-1">No cases found</p>
            <p className="text-sm text-muted">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Cases will appear here once they are documented'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cases.map((caseItem) => (
              <div
                key={caseItem.id}
                onClick={() => navigate(`/status-admin/case/${caseItem.incident.id}`)}
                className="p-4 hover:bg-background transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  {/* Case Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-mono text-sm font-semibold text-primary">
                        {caseItem.case_number}
                      </p>
                      <p className="font-mono text-xs text-muted">
                        {caseItem.incident.incident_number}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPriorityColor(caseItem.incident.priority)}`}>
                        {caseItem.incident.priority}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted">Incident Type</p>
                        <p className="text-text font-medium truncate">{caseItem.incident.incident_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Location</p>
                        <p className="text-text truncate">{caseItem.incident.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Date Reported</p>
                        <p className="text-text">{formatDate(caseItem.incident.incident_date)}</p>
                      </div>
                    </div>

                    {/* Dispatch Info */}
                    {caseItem.dispatch && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-muted">Assigned Officer:</span>
                            <span className="ml-1 text-text font-medium">{caseItem.dispatch.officer_name}</span>
                          </div>
                          {caseItem.dispatch.police_stations && (
                            <div>
                              <span className="text-muted">Station:</span>
                              <span className="ml-1 text-text font-medium">{caseItem.dispatch.police_stations.station_name}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted">Dispatch Status:</span>
                            <span className="ml-1 text-text font-medium">{caseItem.dispatch.dispatch_status}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Evidence Count */}
                    {caseItem.evidenceCount > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-muted">
                          {caseItem.evidenceCount} evidence {caseItem.evidenceCount === 1 ? 'item' : 'items'} logged
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status and Action */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {(() => {
                      const currentStatus = getCurrentStatus(caseItem);
                      return (
                        <span className={`inline-block px-3 py-1.5 rounded text-sm font-semibold ${currentStatus.color}`}>
                          {currentStatus.display}
                        </span>
                      );
                    })()}
                    <ChevronRight size={20} className="text-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && cases.length > 0 && (
        <div className="text-center text-sm text-muted">
          Showing {cases.length} {cases.length === 1 ? 'case' : 'cases'}
        </div>
      )}
    </div>
  );
};

export default CaseMonitoring;
