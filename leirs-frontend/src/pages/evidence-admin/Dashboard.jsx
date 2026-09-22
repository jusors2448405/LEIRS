import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Archive, FileText, Shield, CheckCircle, Clock, Eye, ChevronRight, Scale, FolderArchive, AlertCircle, MapPin, Calendar, Tag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useEvidenceStats from '../../hooks/useEvidenceStats'

const EvidenceAdminDashboard = () => {
  const navigate = useNavigate()
  const { stats, loading: statsLoading, error: statsError } = useEvidenceStats()
  
  const [newCases, setNewCases] = useState([])
  const [loadingNewCases, setLoadingNewCases] = useState(true)
  const [newCasesError, setNewCasesError] = useState(null)

  // Fetch incidents with completed dispatches
  useEffect(() => {
    const fetchNewCasesReadyForEvidence = async () => {
      try {
        setLoadingNewCases(true)
        setNewCasesError(null)

        // Get all completed dispatches with their incidents, sorted by completion time
        const { data: completedDispatches, error: dispatchError } = await supabase
          .from('dispatch')
          .select(`
            id,
            incident_id,
            dispatch_status,
            updated_at,
            dispatched_at,
            incident:incidents (
              id,
              incident_number,
              incident_type,
              incident_date,
              location,
              status
            )
          `)
          .eq('dispatch_status', 'Completed')
          .order('updated_at', { ascending: false })
          .limit(50) // Get more initially, we'll filter down

        if (dispatchError) throw dispatchError

        // Get all evidence records to check which incidents already have evidence
        const { data: evidenceRecords, error: evidenceError } = await supabase
          .from('evidence')
          .select('incident_id')

        if (evidenceError) throw evidenceError

        // Create a Set of incident IDs that already have evidence
        const incidentsWithEvidence = new Set(
          evidenceRecords?.map(e => e.incident_id) || []
        )

        // Filter out any null incidents, flatten the structure, 
        // and EXCLUDE incidents that already have evidence
        const casesWithIncidents = (completedDispatches || [])
          .filter(d => d.incident)
          .map(d => ({
            ...d.incident,
            dispatch_updated_at: d.updated_at,
            dispatch_id: d.id
          }))
          .filter(incident => !incidentsWithEvidence.has(incident.id)) // KEY FILTER
          .slice(0, 10) // Limit to 10 after filtering

        setNewCases(casesWithIncidents)
      } catch (err) {
        console.error('Error fetching new cases ready for evidence:', err)
        setNewCasesError(err.message)
      } finally {
        setLoadingNewCases(false)
      }
    }

    fetchNewCasesReadyForEvidence()

    // Set up real-time subscription for dispatch AND evidence changes
    const dispatchChannel = supabase
      .channel('new_cases_dispatch_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'dispatch' },
        () => fetchNewCasesReadyForEvidence()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'evidence' },
        () => fetchNewCasesReadyForEvidence()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(dispatchChannel)
    }
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (iso) => {
    if (!iso) return 'N/A'
    return new Date(iso).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewCase = (incidentId) => {
    // Navigate to Evidence Management with this incident pre-selected
    navigate('/evidence-admin/evidence', { state: { selectedIncidentId: incidentId } })
  }

  const loading = statsLoading || loadingNewCases
  const error = statsError || newCasesError

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Loading evidence dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Error loading dashboard: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Evidence Management Administration</h1>
        <p className="text-muted">Evidence logging and chain of custody management</p>
      </div>

      {/* NEW SECTION: Cases Ready for Evidence */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-text flex items-center gap-2">
              <CheckCircle size={22} className="text-green-600" />
              New Cases Ready for Evidence
            </h2>
            <p className="text-sm text-muted mt-1">
              Cases recently completed by Dispatch and ready for evidence logging
            </p>
          </div>
          <Link 
            to="/evidence-admin/evidence" 
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>

        {loadingNewCases ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted">Loading new cases...</p>
            </div>
          </div>
        ) : newCasesError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{newCasesError}</p>
          </div>
        ) : newCases.length === 0 ? (
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <Shield size={40} className="mx-auto mb-3 text-muted opacity-50" />
            <p className="font-semibold text-text">No new cases ready for evidence</p>
            <p className="text-sm text-muted mt-1">
              Cases will appear here after Dispatch marks them as Completed
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {newCases.slice(0, 5).map((incident) => (
              <div
                key={incident.id}
                className="bg-white border-2 border-green-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleViewCase(incident.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-mono text-sm font-bold text-primary">
                        {incident.incident_number}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                        Ready for Evidence
                      </span>
                    </div>
                    
                    <p className="text-base font-semibold text-text mb-2">
                      {incident.incident_type}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{incident.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span>Incident: {formatDate(incident.incident_date)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted">
                        <Clock size={14} className="flex-shrink-0" />
                        <span>Completed: {formatDateTime(incident.dispatch_updated_at)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-muted flex-shrink-0" />
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          incident.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                          incident.status === 'Closed' ? 'bg-gray-100 text-gray-600' :
                          incident.status === 'For Mediation' ? 'bg-purple-100 text-purple-700' :
                          incident.status === 'Under Investigation' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewCase(incident.id)
                    }}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <FileText size={16} />
                    Add Evidence
                  </button>
                </div>
              </div>
            ))}

            {newCases.length > 5 && (
              <div className="text-center pt-2">
                <Link
                  to="/evidence-admin/evidence"
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  View {newCases.length - 5} more case{newCases.length - 5 !== 1 ? 's' : ''} →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Archive size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-text">{stats.total}</p>
          <p className="text-sm text-muted mt-1">Total Evidence</p>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-green-600">{stats.byStatus['Logged'] || 0}</p>
          <p className="text-sm text-muted mt-1">Logged</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-blue-600">{stats.byStatus['In Custody'] || 0}</p>
          <p className="text-sm text-muted mt-1">In Custody</p>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Scale size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-purple-600">{stats.byStatus['In Court'] || 0}</p>
          <p className="text-sm text-muted mt-1">In Court</p>
        </div>
      </div>

      {/* Additional Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-orange-600" />
            <div>
              <p className="text-lg font-bold text-orange-600">{stats.byStatus['Released'] || 0}</p>
              <p className="text-sm text-muted">Released</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-cyan-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-cyan-600" />
            <div>
              <p className="text-lg font-bold text-cyan-600">{stats.byStatus['Returned'] || 0}</p>
              <p className="text-sm text-muted">Returned</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FolderArchive size={20} className="text-gray-600" />
            <div>
              <p className="text-lg font-bold text-gray-600">{stats.byStatus['Archived'] || 0}</p>
              <p className="text-sm text-muted">Archived</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Evidence */}
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-text">Recent Evidence</h2>
            <Link to="/evidence-admin/evidence" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {stats.recentEvidence.length === 0 ? (
            <p className="text-sm text-muted">No evidence records yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentEvidence.slice(0, 5).map((evidence) => (
                <div key={evidence.id} className="flex items-start justify-between p-3 border border-border rounded-lg hover:bg-background transition-colors">
                  <div className="flex-1">
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
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {evidence.status || 'Logged'}
                      </span>
                    </div>
                  </div>
                  <Link to={`/evidence-admin/evidence`} className="ml-3 p-2 hover:bg-background rounded-lg transition-colors">
                    <Eye size={18} className="text-muted" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Custody Activity */}
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-heading font-semibold text-text">Recent Custody Activity</h2>
            <Link to="/evidence-admin/custody" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          {stats.recentCustody.length === 0 ? (
            <p className="text-sm text-muted">No custody activity yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentCustody.slice(0, 5).map((custody) => (
                <div key={custody.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    custody.action_type === 'Received' ? 'bg-green-100' :
                    custody.action_type === 'Transferred' ? 'bg-blue-100' :
                    custody.action_type === 'Released' ? 'bg-orange-100' :
                    custody.action_type === 'Returned' ? 'bg-cyan-100' :
                    'bg-gray-100'
                  }`}>
                    <Shield size={16} className={
                      custody.action_type === 'Received' ? 'text-green-600' :
                      custody.action_type === 'Transferred' ? 'text-blue-600' :
                      custody.action_type === 'Released' ? 'text-orange-600' :
                      custody.action_type === 'Returned' ? 'text-cyan-600' :
                      'text-gray-600'
                    } />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text">{custody.action_type}</p>
                    <p className="text-xs font-mono text-muted">{custody.evidence?.evidence_number || 'N/A'}</p>
                    {custody.to_user && (
                      <p className="text-xs text-muted mt-1">To: {custody.to_user}</p>
                    )}
                    <p className="text-xs text-muted mt-1">{formatDateTime(custody.action_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="text-lg font-heading font-semibold text-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/evidence-admin/evidence" className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
            <Archive size={24} className="text-primary" />
            <div>
              <p className="font-semibold text-text">View All Evidence</p>
              <p className="text-xs text-muted">Manage evidence records</p>
            </div>
          </Link>

          <Link to="/evidence-admin/custody" className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
            <Shield size={24} className="text-primary" />
            <div>
              <p className="font-semibold text-text">Chain of Custody</p>
              <p className="text-xs text-muted">Track custody history</p>
            </div>
          </Link>

          <Link to="/evidence-admin/evidence" className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
            <FileText size={24} className="text-primary" />
            <div>
              <p className="font-semibold text-text">Log New Evidence</p>
              <p className="text-xs text-muted">Create evidence record</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default EvidenceAdminDashboard
