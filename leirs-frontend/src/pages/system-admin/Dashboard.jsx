import React, { useState, useEffect } from 'react'
import { Shield, Users as UsersIcon, Activity, UserCheck, UserX, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ROLE_DEFINITIONS } from '../../data/mockData'

const SystemAdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
    moduleAdmins: 0,
    systemAdmins: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      calculateStats(users || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (users) => {
    const byRole = {}
    let systemAdmins = 0
    let moduleAdmins = 0

    users.forEach(user => {
      // Count by role
      byRole[user.role] = (byRole[user.role] || 0) + 1
      
      // Count system admins vs other module admins
      if (user.role === 'system_admin') {
        systemAdmins++
      } else {
        moduleAdmins++
      }
    })

    setStats({
      total: users.length,
      active: users.filter(u => u.status === 'Active').length,
      inactive: users.filter(u => u.status === 'Inactive').length,
      byRole,
      moduleAdmins,
      systemAdmins
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">System Administration</h1>
        <p className="text-muted">User management and system configuration</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <UsersIcon size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-text">{stats.total}</p>
          <p className="text-sm text-muted mt-1">Total Users</p>
        </div>

        <div className="bg-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck size={24} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-muted mt-1">Active Users</p>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX size={24} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-red-600">{stats.inactive}</p>
          <p className="text-sm text-muted mt-1">Inactive Users</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-heading font-bold text-blue-600">{stats.moduleAdmins}</p>
          <p className="text-sm text-muted mt-1">Module Admins</p>
        </div>
      </div>

      {/* Role Breakdown */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="text-lg font-heading font-semibold text-text mb-4">User Distribution by Role</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.byRole).map(([role, count]) => {
            const roleInfo = ROLE_DEFINITIONS[role]
            return (
              <div key={role} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-text text-sm truncate">
                    {roleInfo?.label || role}
                  </p>
                  <p className="text-xs text-muted">{count} {count === 1 ? 'user' : 'users'}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="text-lg font-heading font-semibold text-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/system-admin/users"
            className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <UsersIcon size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-medium text-text">Manage Users</p>
              <p className="text-sm text-muted">Add, edit, or deactivate users</p>
            </div>
          </Link>

          <Link
            to="/system-admin/users"
            className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Plus size={24} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-text">Add New User</p>
              <p className="text-sm text-muted">Create a new staff account</p>
            </div>
          </Link>

          <Link
            to="/system-admin/activities"
            className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-text">View Activity Log</p>
              <p className="text-sm text-muted">Review system activity and audit records</p>
            </div>
          </Link>
        </div>
      </div>

      
      
    </div>
  )
}

export default SystemAdminDashboard
