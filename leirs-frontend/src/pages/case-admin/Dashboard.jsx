import React, { useState, useEffect } from 'react'
import { Folder, Clock, CheckCircle, Send, Plus, Eye, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const CaseAdminDashboard = () => {
  const [stats, setStats] = useState({
    forwardedIncidents: 0,
    casesInDocumentation: 0,
    recentlyCases: 0,
    readyForDispatch: 0,
    totalCases: 0
  })
  const [forwardedIncidents, setForwardedIncidents] = useState([])
  const [recentCases, setRecentCases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    try {
      // Fetch forwarded incidents (status = Under Investigation, no case doc yet)
      const { data: incidents, error: incErr } = await supabase
        .from('incidents')
        .select('id, incident_number, incident_type, incident_date, status, priority, complainant_name')
        .eq('status', 'Under Investigation')
        .order('updated_at', { ascending: false })

      if (incErr) throw incErr

      // Check which incidents already have case docs
      const incidentIds = incidents?.map(inc => inc.id) || []
      let forwardedWithoutCase = []
      
      if (incidentIds.length > 0) {
        const { data: existingCases, error: caseErr } = await supabase
          .from('case_documentations')
          .select('incident_id')
          .in('incident_id', incidentIds)

        if (caseErr) throw caseErr

        const caseIncidentIds = new Set(existingCases?.map(c => c.incident_id) || [])
        forwardedWithoutCase = incidents.filter(inc => !caseIncidentIds.has(inc.id))
      }

      // Fetch all cases count
      const { count: totalCases } = await supabase
        .from('case_documentations')
        .select('*', { count: 'exact', head: true })

      // Fetch cases in documentation (not resolved/closed)
      const { count: inDocCount } = await supabase
        .from('case_documentations')
        .select('*', { count: 'exact', head: true })
        .in('case_status', ['Pending', 'Under Investigation', 'For Mediation'])

      // Fetch recently created cases (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { count: recentCount } = await supabase
        .from('case_documentations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

      // Fetch cases ready for dispatch (For Mediation status = Ready for Dispatch)
      const { count: readyCount } = await supabase
        .from('case_documentations')
        .select('*', { count: 'exact', head: true })
        .eq('case_status', 'For Mediation')

      // Fetch recent case documentation records
      const { data: cases, error: casesErr } = await supabase
        .from('case_documentations')
        .select(`
          id, 
          case_number, 
          case_status, 
          assigned_officer,
          created_at,
          incident_id
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (casesErr) throw casesErr

      // Fetch incident info for recent cases
      if (cases && cases.length > 0) {
        const { data: incidentInfo, error: incInfoErr } = await supabase
          .from('incidents')
          .select('id, incident_number, incident_type')
          .in('id', cases.map(c => c.incident_id))

        if (!incInfoErr) {
          const incidentMap = {}
          incidentInfo.forEach(inc => {
            incidentMap[inc.id] = inc
          })
          cases.forEach(c => {
            c.incident = incidentMap[c.incident_id]
          })
        }
      }

      setStats({
        forwardedIncidents: forwardedWithoutCase.length,
        casesInDocumentation: inDocCount || 0,
        recentlyCases: recentCount || 0,
        readyForDispatch: readyCount || 0,
        totalCases: totalCases || 0
      })

      setForwardedIncidents(forwardedWithoutCase.slice(0, 5))
      setRecentCases(cases || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '—'
    return new Date(isoStr).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-green-600',
      'Medium': 'text-yellow-600',
      'High': 'text-orange-600',
      'Urgent': 'text-red-600'
    }
    return colors[priority] || 'text-gray-600'
  }

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-700',
      'Under Investigation': 'bg-blue-100 text-blue-700',
      'For Mediation': 'bg-purple-100 text-purple-700',
      'Resolved': 'bg-green-100 text-green-700',
      'Closed': 'bg-gray-100 text-gray-600'
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  const getStatusDisplay = (status) => {
    return status === 'For Mediation' ? 'Ready for Dispatch' : status
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Case Documentation Administration</h1>
        <p className="text-muted">Review forwarded incidents, create cases, and prepare documentation for dispatch</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/case-admin/cases"
          className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Folder size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-text">Manage Cases</p>
            <p className="text-sm text-muted">View and document all cases</p>
          </div>
        </Link>

        <Link
          to="/case-admin/forwarded"
          className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Eye size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-text">Forwarded Incidents</p>
            <p className="text-sm text-muted">Review pending incidents</p>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-yellow-600">{loading ? '—' : stats.forwardedIncidents}</p>
          <p className="text-sm text-muted mt-1">Awaiting Case Creation</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-blue-600">{loading ? '—' : stats.casesInDocumentation}</p>
          <p className="text-sm text-muted mt-1">In Documentation</p>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-green-600">{loading ? '—' : stats.recentlyCases}</p>
          <p className="text-sm text-muted mt-1">Created This Week</p>
        </div>

        <div className="bg-white border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Send size={24} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-purple-600">{loading ? '—' : stats.readyForDispatch}</p>
          <p className="text-sm text-muted mt-1">Ready for Dispatch</p>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Folder size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-text">{loading ? '—' : stats.totalCases}</p>
          <p className="text-sm text-muted mt-1">Total Cases</p>
        </div>
      </div>

      {/* Forwarded Incidents Table */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-text">Forwarded Incidents</h2>
            <p className="text-sm text-muted mt-0.5">Incidents awaiting case documentation creation</p>
          </div>
          <Link
            to="/case-admin/forwarded"
            className="text-sm text-primary hover:underline font-medium"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted">Loading...</div>
        ) : forwardedIncidents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
            <p className="text-muted">No forwarded incidents pending</p>
            <p className="text-sm text-muted mt-1">All forwarded incidents have case documentation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Incident No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {forwardedIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-background/50">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{incident.incident_number}</td>
                    <td className="px-4 py-3 text-text">{incident.incident_type}</td>
                    <td className="px-4 py-3 text-text">{formatDate(incident.incident_date)}</td>
                    <td className="px-4 py-3 text-text">{incident.complainant_name}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${getPriorityColor(incident.priority)}`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/case-admin/cases?incident=${incident.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-colors"
                      >
                        <Plus size={13} />
                        Create Case
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Cases Table */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-text">Recent Case Documentation</h2>
            <p className="text-sm text-muted mt-0.5">Recently created or updated cases</p>
          </div>
          <Link
            to="/case-admin/cases"
            className="text-sm text-primary hover:underline font-medium"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted">Loading...</div>
        ) : recentCases.length === 0 ? (
          <div className="text-center py-8">
            <Folder size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-muted">No cases created yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Case No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Incident No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Assigned Officer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentCases.map((caseDoc) => (
                  <tr key={caseDoc.id} className="hover:bg-background/50">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{caseDoc.case_number}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{caseDoc.incident?.incident_number || '—'}</td>
                    <td className="px-4 py-3 text-text">{caseDoc.incident?.incident_type || '—'}</td>
                    <td className="px-4 py-3 text-text">{caseDoc.assigned_officer || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(caseDoc.case_status)}`}>
                        {getStatusDisplay(caseDoc.case_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{formatDateTime(caseDoc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

export default CaseAdminDashboard
