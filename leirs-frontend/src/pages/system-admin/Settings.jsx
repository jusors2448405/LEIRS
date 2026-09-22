import React, { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Settings as SettingsIcon, Shield, Key, Palette, Calendar,
  Bell, AlertTriangle, Trash2, RotateCcw, Save, X, Check,
  Info, Eye, EyeOff
} from 'lucide-react'
import { logActivity, clearActivityLogs, ACTIVITY_ACTIONS } from '../../utils/activityLogger'
import { supabase } from '../../lib/supabase'
import { getTheme, setTheme } from '../../utils/theme'

const Settings = () => {
  const { user } = useOutletContext()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Preferences State
  const [preferences, setPreferences] = useState({
    theme: 'light',
    dateFormat: 'MM/DD/YYYY',
    notifications: true
  })

  // Confirmation Modals
  const [showClearLogsModal, setShowClearLogsModal] = useState(false)
  const [showResetDataModal, setShowResetDataModal] = useState(false)

  useEffect(() => {
    // Load theme separately
    const currentTheme = getTheme()
    
    // Load other preferences
    const savedPrefs = localStorage.getItem('leirs_preferences')
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      setPreferences({
        theme: currentTheme, // Use theme from leirs_theme
        dateFormat: prefs.dateFormat || 'MM/DD/YYYY',
        notifications: prefs.notifications !== undefined ? prefs.notifications : true
      })
    } else {
      setPreferences({
        theme: currentTheme,
        dateFormat: 'MM/DD/YYYY',
        notifications: true
      })
    }
  }, [])

  // Save preferences
  const handleSavePreferences = () => {
    // Save theme separately using centralized theme utility
    setTheme(preferences.theme)
    
    // Save other preferences
    const prefsToSave = {
      dateFormat: preferences.dateFormat,
      notifications: preferences.notifications
    }
    localStorage.setItem('leirs_preferences', JSON.stringify(prefsToSave))

    setMessage({ type: 'success', text: 'Preferences saved successfully' })
    
    // Log activity
    if (user) {
      logActivity({
        action: 'PREFERENCES_UPDATED',
        performed_by: user.email,
        target_user: user.email,
        description: `${user.full_name || user.name} updated system preferences`,
        metadata: preferences
      })
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Change Password
  const handleChangePassword = () => {
    setMessage({ type: '', text: '' })

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required' })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match' })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long' })
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from current password' })
      return
    }

    setLoading(true)

    // Password change via Supabase Auth (not localStorage)
    setMessage({ 
      type: 'error', 
      text: 'Password change via UI is temporarily disabled. Passwords are managed through Supabase Auth.' 
    })
    setLoading(false)
    return

    // TODO: Implement Supabase Auth password change
    // await supabase.auth.updateUser({ password: passwordForm.newPassword })

    // Log activity
    logActivity({
      action: ACTIVITY_ACTIONS.USER_PASSWORD_CHANGED,
      performed_by: user.email,
      target_user: user.email,
      description: `${user.full_name || user.name} changed their password`,
      metadata: { self_change: true }
    })

    setMessage({ type: 'success', text: 'Password changed successfully' })
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setLoading(false)

    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Clear Activity Logs
  const handleClearLogs = () => {
    clearActivityLogs()
    
    // Log this action (will be the only log after clearing)
    if (user) {
      logActivity({
        action: 'ACTIVITY_LOGS_CLEARED',
        performed_by: user.email,
        target_user: user.email,
        description: `${user.full_name || user.name} cleared all activity logs`,
        metadata: { timestamp: new Date().toISOString() }
      })
    }

    setMessage({ type: 'success', text: 'Activity logs cleared successfully' })
    setShowClearLogsModal(false)
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Reset Demo Data
  const handleResetData = () => {
    // Reset theme to light
    setTheme('light')
    
    // Reset other preferences
    localStorage.removeItem('leirs_preferences')
    setPreferences({
      theme: 'light',
      dateFormat: 'MM/DD/YYYY',
      notifications: true
    })

    setMessage({ type: 'success', text: 'Preferences reset to defaults' })
    setShowResetDataModal(false)
    
    if (user) {
      logActivity({
        action: 'SYSTEM_PREFERENCES_RESET',
        performed_by: user.email,
        target_user: user.email,
        description: `${user.full_name || user.name} reset system preferences to defaults`,
        metadata: { timestamp: new Date().toISOString() }
      })
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-text mb-1">System Settings</h1>
        <p className="text-muted">Configure system preferences and security options</p>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <Check size={20} className="flex-shrink-0" />
            ) : (
              <AlertTriangle size={20} className="flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Info size={20} className="text-primary" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-text">System Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted mb-1">System Name</p>
            <p className="font-medium text-text">LEIRS</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Full Name</p>
            <p className="font-medium text-text">Law Enforcement and Incident Reporting System</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Location</p>
            <p className="font-medium text-text">Barangay 178, Camarin, North Caloocan City</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Version</p>
            <p className="font-medium text-text">2.0.0 (REVISE)</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Environment</p>
            <p className="font-medium text-text">Production</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Current User</p>
            <p className="font-medium text-text">{user.full_name || user.name} ({user.email})</p>
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Key size={20} className="text-orange-600" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-text">Account Security</h2>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input-field pr-10"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="input-field pr-10"
                placeholder="Enter new password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="input-field pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Key size={18} />
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <SettingsIcon size={20} className="text-purple-600" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-text">System Preferences</h2>
        </div>

        <div className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              <div className="flex items-center gap-2">
                <Palette size={16} />
                Theme
              </div>
            </label>
            <select
              value={preferences.theme}
              onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
              className="input-field"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <p className="text-xs text-muted mt-1">Choose your preferred color scheme</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                Date Format
              </div>
            </label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
              className="input-field"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
            </select>
            <p className="text-xs text-muted mt-1">How dates will be displayed throughout the system</p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.notifications}
                onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-muted" />
                <span className="text-sm font-medium text-text">Enable Notifications</span>
              </div>
            </label>
            <p className="text-xs text-muted mt-1 ml-7">Receive system notifications and alerts</p>
          </div>

          <button
            onClick={handleSavePreferences}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            Save Preferences
          </button>
        </div>
      </div>

      {/* Maintenance */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield size={20} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-text">Maintenance</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background rounded-lg">
            <div>
              <p className="font-medium text-text">Clear Activity Logs</p>
              <p className="text-sm text-muted">Remove all activity log entries from the system</p>
            </div>
            <button
              onClick={() => setShowClearLogsModal(true)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-gray-50 transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <h2 className="text-lg font-heading font-semibold text-red-800">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <div>
              <p className="font-medium text-red-800">Reset System Preferences</p>
              <p className="text-sm text-red-600">Reset all preferences to default values</p>
            </div>
            <button
              onClick={() => setShowResetDataModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Reset Preferences
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-xs text-red-800">
            <strong>Note:</strong> Resetting preferences will restore default settings but will NOT affect user accounts, 
            incidents, cases, dispatch records, evidence, or any other operational data stored in the database.
          </p>
        </div>
      </div>

      {/* Clear Logs Confirmation Modal */}
      {showClearLogsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-text">Clear Activity Logs</h3>
            </div>
            <p className="text-muted mb-6">
              Are you sure you want to clear all activity logs? This action cannot be undone. 
              All historical activity records will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearLogsModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearLogs}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Data Confirmation Modal */}
      {showResetDataModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <RotateCcw size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-text">Reset System Preferences</h3>
            </div>
            <p className="text-muted mb-6">
              This will reset all system preferences (theme, date format, notifications) to their default values. 
              Your user account and all operational data will remain unchanged.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetDataModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-text hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Reset Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
