import React, { useState, useEffect } from 'react'
import { FileText, AlertCircle, CheckCircle, Clock, Send, Plus, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const IncidentAdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    underInvestigation: 0,
    highPriority: 0,
    todayCount: 0,
    forwardedToday: 0
  })
  const [recentIncidents, setRecentIncidents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    try {
      // Fetch all incidents count
      const { count: totalCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })

      // Fetch pending count
      const { count: pendingCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Pending')

      // Fetch under investigation count
      const { count: underInvestigationCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Under Investigation')

      // Fetch high priority count
      const { count: highPriorityCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .in('priority', ['High', 'Urgent'])
        .in('status', ['Pending', 'Under Investigation'])

      // Fetch today's incidents count
      const today = new Date().toISOString().split('T')[0]
      const { count: todayCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      // Fetch forwarded today count (Under Investigation means forwarded to case documentation)
      const { count: forwardedCount } = await supabase
        .from('incidents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Under Investigation')
        .gte('updated_at', today)

      // Fetch recent pending incidents
      const { data: recent } = await supabase
        .from('incidents')
        .select('id, incident_number, incident_type, incident_date, status, priority, complainant_name')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        total: totalCount || 0,
        pending: pendingCount || 0,
        underInvestigation: underInvestigationCount || 0,
        highPriority: highPriorityCount || 0,
        todayCount: todayCount || 0,
        forwardedToday: forwardedCount || 0
      })

      setRecentIncidents(recent || [])
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

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-green-600',
      'Medium': 'text-yellow-600',
      'High': 'text-orange-600',
      'Urgent': 'text-red-600'
    }
    return colors[priority] || 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Incident Reporting Administration</h1>
        <p className="text-muted">Manage incident reports, verify complainant details, and forward to case documentation</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/incident-admin/new-incident"
          className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Plus size={24} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-text">New Incident Report</p>
            <p className="text-sm text-muted">Create a new incident entry</p>
          </div>
        </Link>

        <Link
          to="/incident-admin/incidents"
          className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl hover:border-primary hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Eye size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-text">View All Incidents</p>
            <p className="text-sm text-muted">Browse and manage incidents</p>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-text">{loading ? '—' : stats.total}</p>
          <p className="text-sm text-muted mt-1">Total Incidents</p>
        </div>

        <div className="bg-white border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-yellow-600">{loading ? '—' : stats.pending}</p>
          <p className="text-sm text-muted mt-1">Pending Verification</p>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-green-600">{loading ? '—' : stats.todayCount}</p>
          <p className="text-sm text-muted mt-1">Encoded Today</p>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-red-600">{loading ? '—' : stats.highPriority}</p>
          <p className="text-sm text-muted mt-1">High Priority</p>
        </div>
      </div>

      {/* Pending Incidents Table */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-heading font-semibold text-text">Pending Incidents</h2>
            <p className="text-sm text-muted mt-0.5">Incidents awaiting verification and encoding</p>
          </div>
          <Link
            to="/incident-admin/incidents"
            className="text-sm text-primary hover:underline font-medium"
          >
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted">Loading...</div>
        ) : recentIncidents.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
            <p className="text-muted">No pending incidents</p>
            <p className="text-sm text-muted mt-1">All incidents have been processed</p>
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
                {recentIncidents.map((incident) => (
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
                        to={`/incident-admin/verify/${incident.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted hover:text-primary hover:border-primary transition-colors"
                      >
                        <Send size={13} />
                        Process
                      </Link>
                    </td>
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

export default IncidentAdminDashboard
