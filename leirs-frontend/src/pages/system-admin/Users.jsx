import React, { useState, useEffect } from 'react'
import { Users as UsersIcon, Search, Plus, Edit2, X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { ROLE_DEFINITIONS, getRoleLabel, getRoleDescription, getActiveRoles, isValidRole } from '../../data/mockData'
import { logActivity, ACTIVITY_ACTIONS } from '../../utils/activityLogger'

const Users = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'incident_admin', // Default to incident_admin instead of encoder
    password: ''
  })
  const [formError, setFormError] = useState('')

  // Load users and current user on mount
  useEffect(() => {
    loadUsers()
    const user = JSON.parse(localStorage.getItem('leirs_user') || '{}')
    setCurrentUser(user)
  }, [])

  // Apply filters whenever users, search, or filters change
  useEffect(() => {
    applyFilters()
  }, [users, searchQuery, roleFilter, statusFilter])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(query) ||
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      )
    }

    // Role filter
    if (roleFilter !== 'All') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleAddUser = () => {
    setFormData({
      full_name: '',
      email: '',
      role: 'incident_admin', // Default to incident_admin
      password: ''
    })
    setFormError('')
    setShowAddModal(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setFormData({
      full_name: user.full_name || user.name,
      email: user.email,
      role: user.role,
      password: '' // Don't pre-fill password
    })
    setFormError('')
    setShowEditModal(true)
  }

  const handleSubmitAdd = (e) => {
    e.preventDefault()
    setFormError('')

    // Validation
    if (!formData.full_name.trim()) {
      setFormError('Full name is required')
      return
    }
    if (!formData.email.trim()) {
      setFormError('Email is required')
      return
    }
    if (!formData.password.trim()) {
      setFormError('Password is required')
      return
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters')
      return
    }

    // Check for duplicate email
    if (users.find((u) => u.email.toLowerCase() === formData.email.toLowerCase().trim())) {
      setFormError('Email already exists')
      return
    }

    // Validate role
    if (!isValidRole(formData.role)) {
      setFormError('Invalid role selected')
      return
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
      name: formData.full_name.trim(),
      full_name: formData.full_name.trim(),
      status: 'Active',
      created_at: new Date().toISOString()
    }

    const updatedUsers = [...users, newUser]
    saveUsers(updatedUsers)
    setUsers(updatedUsers)
    setShowAddModal(false)

    // Log activity
    logActivity({
      action: ACTIVITY_ACTIONS.USER_CREATED,
      performed_by: currentUser?.email || 'system',
      target_user: newUser.email,
      description: `Created new user: ${newUser.full_name} with role ${getRoleLabel(newUser.role)}`,
      metadata: { role: newUser.role, user_id: newUser.id }
    })
  }

  const handleSubmitEdit = (e) => {
    e.preventDefault()
    setFormError('')

    // Validation
    if (!formData.full_name.trim()) {
      setFormError('Full name is required')
      return
    }

    // Check if trying to change email to an existing one
    if (
      formData.email.toLowerCase() !== selectedUser.email.toLowerCase() &&
      users.find((u) => u.email.toLowerCase() === formData.email.toLowerCase())
    ) {
      setFormError('Email already exists')
      return
    }

    // Validate role
    if (!isValidRole(formData.role)) {
      setFormError('Invalid role selected')
      return
    }

    // Prevent system_admin from changing their own role
    if (selectedUser.id === currentUser?.id && selectedUser.role === 'system_admin' && formData.role !== 'system_admin') {
      setFormError('You cannot change your own role')
      return
    }

    // Optional password validation
    if (formData.password.trim() && formData.password.length < 6) {
      setFormError('Password must be at least 6 characters')
      return
    }

    const roleChanged = selectedUser.role !== formData.role
    const passwordChanged = formData.password.trim() !== ''

    // Update user
    const updatedUsers = users.map((user) => {
      if (user.id === selectedUser.id) {
        return {
          ...user,
          full_name: formData.full_name.trim(),
          name: formData.full_name.trim(),
          role: formData.role,
          // Only update password if provided
          ...(formData.password.trim() && { password: formData.password })
        }
      }
      return user
    })

    saveUsers(updatedUsers)
    setUsers(updatedUsers)
    setShowEditModal(false)

    // Log activity
    if (roleChanged) {
      logActivity({
        action: ACTIVITY_ACTIONS.USER_ROLE_CHANGED,
        performed_by: currentUser?.email || 'system',
        target_user: selectedUser.email,
        description: `Changed role from ${getRoleLabel(selectedUser.role)} to ${getRoleLabel(formData.role)}`,
        metadata: { old_role: selectedUser.role, new_role: formData.role }
      })
    }

    if (passwordChanged) {
      logActivity({
        action: ACTIVITY_ACTIONS.USER_PASSWORD_CHANGED,
        performed_by: currentUser?.email || 'system',
        target_user: selectedUser.email,
        description: `Password changed for ${selectedUser.full_name || selectedUser.name}`,
        metadata: {}
      })
    }

    if (!roleChanged && !passwordChanged) {
      logActivity({
        action: ACTIVITY_ACTIONS.USER_UPDATED,
        performed_by: currentUser?.email || 'system',
        target_user: selectedUser.email,
        description: `Updated user information for ${formData.full_name}`,
        metadata: {}
      })
    }
  }

  const requestToggleStatus = (user) => {
    // Prevent system_admin from deactivating themselves
    if (user.id === currentUser?.id && user.status === 'Active') {
      setFormError('You cannot deactivate your own account')
      setConfirmAction({
        type: 'error',
        title: 'Cannot Deactivate Own Account',
        message: 'You cannot deactivate your own account. Please ask another System Administrator to perform this action if needed.',
        user: null,
        onConfirm: null
      })
      setShowConfirmDialog(true)
      return
    }

    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active'
    const actionVerb = newStatus === 'Active' ? 'activate' : 'deactivate'
    
    setConfirmAction({
      type: 'status',
      title: `${newStatus === 'Active' ? 'Activate' : 'Deactivate'} User`,
      message: `Are you sure you want to ${actionVerb} ${user.full_name || user.name}? ${newStatus === 'Inactive' ? 'They will not be able to log in.' : 'They will be able to log in again.'}`,
      user,
      newStatus,
      onConfirm: () => handleToggleStatus(user, newStatus)
    })
    setShowConfirmDialog(true)
  }

  const handleToggleStatus = (user, newStatus) => {
    const updatedUsers = users.map((u) =>
      u.id === user.id ? { ...u, status: newStatus } : u
    )

    saveUsers(updatedUsers)
    setUsers(updatedUsers)
    setShowConfirmDialog(false)

    // Log activity
    logActivity({
      action: newStatus === 'Active' ? ACTIVITY_ACTIONS.USER_ACTIVATED : ACTIVITY_ACTIONS.USER_DEACTIVATED,
      performed_by: currentUser?.email || 'system',
      target_user: user.email,
      description: `${newStatus === 'Active' ? 'Activated' : 'Deactivated'} user: ${user.full_name || user.name}`,
      metadata: { previous_status: user.status, new_status: newStatus }
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeColor = (role) => {
    // All LEIRS REVISE roles use primary color
    return 'bg-primary/10 text-primary border-primary/20'
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    inactive: users.filter((u) => u.status === 'Inactive').length,
    systemAdmins: users.filter((u) => u.role === 'system_admin').length,
    moduleAdmins: users.filter((u) => u.role !== 'system_admin').length
  }

  // Get all unique roles from users for filter
  const availableRoles = [...new Set(users.map(u => u.role))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text mb-1">User Management</h1>
          <p className="text-muted">Manage LEIRS staff accounts and permissions</p>
        </div>
        <button onClick={handleAddUser} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-muted mt-1">Total Users</p>
        </div>
        <div className="bg-white border border-green-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-green-600">{stats.active}</p>
          <p className="text-xs text-muted mt-1">Active</p>
        </div>
        <div className="bg-white border border-red-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-red-600">{stats.inactive}</p>
          <p className="text-xs text-muted mt-1">Inactive</p>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-blue-600">{stats.systemAdmins}</p>
          <p className="text-xs text-muted mt-1">System Admins</p>
        </div>
        <div className="bg-white border border-purple-200 rounded-xl p-4">
          <p className="text-2xl font-heading font-bold text-purple-600">{stats.moduleAdmins}</p>
          <p className="text-xs text-muted mt-1">Module Admins</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field"
          >
            <option value="All">All Roles</option>
            {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
              <option key={key} value={key}>{def.label}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background">
              <tr>
                {['Full Name', 'Email', 'Role', 'Status', 'Date Created', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3.5 text-left text-xs font-heading font-semibold text-muted uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    <UsersIcon className="mx-auto mb-2 text-muted" size={32} />
                    No users found matching your filters.
                  </td>
                </tr>
              )}
              {filteredUsers.map((user) => {
                const isCurrentUser = user.id === currentUser?.id
                return (
                  <tr key={user.id} className="hover:bg-background/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text">{user.full_name || user.name}</p>
                        {isCurrentUser && (
                          <span className="text-xs text-primary font-medium">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-muted">{user.email}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}
                          title={getRoleDescription(user.role)}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <CheckCircle size={16} />
                          <span className="text-xs font-medium">Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XCircle size={16} />
                          <span className="text-xs font-medium">Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-muted whitespace-nowrap">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => requestToggleStatus(user)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            user.status === 'Active'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                          title={user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
              <h2 className="text-xl font-heading font-bold text-text">Add User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-muted hover:text-text rounded-lg hover:bg-background transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Juan Dela Cruz"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="user@leirs.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                  required
                >
                  {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                    <option key={key} value={key}>{def.label}</option>
                  ))}
                </select>
                {ROLE_DEFINITIONS[formData.role]?.description && (
                  <p className="text-xs text-muted mt-1 flex items-start gap-1">
                    <Info size={12} className="mt-0.5 flex-shrink-0" />
                    {ROLE_DEFINITIONS[formData.role].description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="Enter initial password"
                  required
                />
                <p className="text-xs text-muted mt-1">Minimum 6 characters</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-text hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
              <h2 className="text-xl font-heading font-bold text-text">Edit User</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-muted hover:text-text rounded-lg hover:bg-background transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Juan Dela Cruz"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  className="input-field bg-gray-50"
                  disabled
                />
                <p className="text-xs text-muted mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                  disabled={selectedUser.id === currentUser?.id && selectedUser.role === 'system_admin'}
                  required
                >
                  {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                    <option key={key} value={key}>{def.label}</option>
                  ))}
                </select>
                {selectedUser.id === currentUser?.id && selectedUser.role === 'system_admin' ? (
                  <p className="text-xs text-orange-600 mt-1">You cannot change your own role</p>
                ) : ROLE_DEFINITIONS[formData.role]?.description ? (
                  <p className="text-xs text-muted mt-1 flex items-start gap-1">
                    <Info size={12} className="mt-0.5 flex-shrink-0" />
                    {ROLE_DEFINITIONS[formData.role].description}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  New Password (optional)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="Leave blank to keep current password"
                />
                <p className="text-xs text-muted mt-1">
                  Only fill this if you want to change the password. Minimum 6 characters.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-text hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-heading font-bold text-text">{confirmAction.title}</h2>
            </div>
            <div className="p-6">
              <p className="text-muted">{confirmAction.message}</p>
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium text-text hover:bg-background transition-colors"
              >
                Cancel
              </button>
              {confirmAction.onConfirm && (
                <button
                  onClick={confirmAction.onConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors ${
                    confirmAction.type === 'status' && confirmAction.newStatus === 'Inactive'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'btn-primary'
                  }`}
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
