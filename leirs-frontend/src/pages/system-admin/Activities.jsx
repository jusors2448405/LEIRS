import React, { useState, useEffect } from 'react'
import { Activity, Search, Calendar, User, Shield, Filter, X, Clock } from 'lucide-react'
import { 
  getActivityLogs, 
  formatActionType, 
  getActionColor, 
  ACTIVITY_ACTIONS 
} from '../../utils/activityLogger'
import { supabase } from '../../lib/supabase'
import { getRoleLabel } from '../../data/mockData'

const Activities = () => {
  const [activities, setActivities] = useState([])
  const [filteredActivities, setFilteredActivities] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [userFilter, setUserFilter] = useState('All')
  const [actionFilter, setActionFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])

  useEffect(() => {
    loadUsers()
    loadActivities()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [activities, searchQuery, userFilter, actionFilter, dateFilter])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadActivities = async () => {
    try {
      const logs = getActivityLogs()
      // Sort by timestamp descending (newest first)
      const sorted = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setActivities(sorted)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...activities]

    // Search filter (description, performed_by, target_user)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.description?.toLowerCase().includes(query) ||
          log.performed_by?.toLowerCase().includes(query) ||
          log.target_user?.toLowerCase().includes(query)
      )
    }

    // User filter (performed by)
    if (userFilter !== 'All') {
      filtered = filtered.filter((log) => log.performed_by === userFilter)
    }

    // Action filter
    if (actionFilter !== 'All') {
      filtered = filtered.filter((log) => log.action === actionFilter)
    }

    // Date filter
    if (dateFilter !== 'All') {
      const now = new Date()
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.timestamp)
        switch (dateFilter) {
          case 'Today':
            return logDate.toDateString() === now.toDateString()
          case 'This Week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            return logDate >= weekAgo
          case 'This Month':
            return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear()
          default:
            return true
        }
      })
    }

    setFilteredActivities(filtered)
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserName = (email) => {
    const user = users.find((u) => u.email === email)
    return user ? user.full_name || user.name : email
  }

  const getUserRole = (email) => {
    const user = users.find((u) => u.email === email)
    return user ? getRoleLabel(user.role) : '—'
  }

  // Get unique users and actions for filters
  const uniqueUsers = [...new Set(activities.map((a) => a.performed_by))].filter(Boolean)
  const actionTypes = Object.values(ACTIVITY_ACTIONS)

  const stats = {
    total: activities.length,
    today: activities.filter(
      (a) => new Date(a.timestamp).toDateString() === new Date().toDateString()
    ).length,
    thisWeek: activities.filter(
      (a) => new Date(a.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
    thisMonth: activities.filter((a) => {
      const logDate = new Date(a.timestamp)
      const now = new Date()
      return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear()
    }).length
  }

  const clearFilters = () => {
    setSearchQuery('')
    setUserFilter('All')
    setActionFilter('All')
    setDateFilter('All')
  }

  const hasActiveFilters = searchQuery || userFilter !== 'All' || actionFilter !== 'All' || dateFilter !== 'All'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">Activity Log</h1>
        <p className="text-muted">View and monitor all administrative actions in the system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-muted mt-1">Total Activities</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-green-600">{stats.today}</p>
          <p className="text-xs text-muted mt-1">Today</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-blue-600">{stats.thisWeek}</p>
          <p className="text-xs text-muted mt-1">This Week</p>
        </div>
        <div className="bg-white border border-purple-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-purple-600">{stats.thisMonth}</p>
          <p className="text-xs text-muted mt-1">This Month</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* User Filter */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="input-field pl-10"
            >
              <option value="All">All Users</option>
              {uniqueUsers.map((email) => (
                <option key={email} value={email}>
                  {getUserName(email)}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="input-field pl-10"
            >
              <option value="All">All Actions</option>
              {actionTypes.map((action) => (
                <option key={action} value={action}>
                  {formatActionType(action)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field pl-10"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted">
              Showing {filteredActivities.length} of {activities.length} activities
            </p>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors"
            >
              <X size={16} />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="mx-auto mb-4 text-muted" size={48} />
            <h3 className="text-lg font-heading font-semibold text-text mb-2">
              {activities.length === 0 ? 'No Activities Yet' : 'No Activities Found'}
            </h3>
            <p className="text-muted text-sm">
              {activities.length === 0
                ? 'Administrative actions will appear here when they occur.'
                : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredActivities.map((log) => (
              <div key={log.id} className="p-4 hover:bg-background/60 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Activity size={20} className="text-primary" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Action Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getActionColor(
                          log.action
                        )}`}
                      >
                        {formatActionType(log.action)}
                      </span>
                      <span className="text-xs text-muted flex items-center gap-1">
                        <Clock size={12} />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-text mb-2">{log.description}</p>

                    {/* User Info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>
                          <strong>Performed by:</strong> {getUserName(log.performed_by)} ({getUserRole(log.performed_by)})
                        </span>
                      </div>
                      {log.target_user && (
                        <div className="flex items-center gap-1">
                          <Shield size={12} />
                          <span>
                            <strong>Target:</strong> {getUserName(log.target_user)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata (if exists) */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-background rounded-lg">
                        <p className="text-xs text-muted font-medium mb-1">Additional Details:</p>
                        <div className="text-xs text-muted space-y-0.5">
                          {log.metadata.old_role && log.metadata.new_role && (
                            <p>
                              Role: <span className="text-text">{log.metadata.old_role}</span> →{' '}
                              <span className="text-text">{log.metadata.new_role}</span>
                            </p>
                          )}
                          {log.metadata.previous_status && log.metadata.new_status && (
                            <p>
                              Status: <span className="text-text">{log.metadata.previous_status}</span> →{' '}
                              <span className="text-text">{log.metadata.new_status}</span>
                            </p>
                          )}
                          {log.metadata.user_id && (
                            <p>
                              User ID: <span className="text-text">{log.metadata.user_id}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
    </div>
  )
}

export default Activities
