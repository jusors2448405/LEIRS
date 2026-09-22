/**
 * Activity Logger for System Administration
 * 
 * Stores activity logs in localStorage for tracking administrative actions.
 * Each log entry contains information about what action was performed,
 * who performed it, and when it occurred.
 * 
 * Storage Key: 'leirs_activity_logs'
 * 
 * Log Entry Structure:
 * {
 *   id: string (timestamp-based unique ID),
 *   action: string (e.g., 'USER_CREATED', 'USER_UPDATED'),
 *   performed_by: string (email of admin who performed action),
 *   target_user: string (email of user affected by action),
 *   description: string (human-readable description),
 *   timestamp: string (ISO 8601 format),
 *   metadata: object (optional additional data)
 * }
 */

const ACTIVITY_LOG_KEY = 'leirs_activity_logs'
const MAX_LOGS = 500 // Keep last 500 logs to prevent localStorage bloat

/**
 * Action types for activity logging
 */
export const ACTIVITY_ACTIONS = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  PREFERENCES_UPDATED: 'PREFERENCES_UPDATED',
  ACTIVITY_LOGS_CLEARED: 'ACTIVITY_LOGS_CLEARED',
  SYSTEM_PREFERENCES_RESET: 'SYSTEM_PREFERENCES_RESET',
}

/**
 * Get all activity logs from localStorage
 * @returns {Array} Array of log entries
 */
export const getActivityLogs = () => {
  try {
    const logs = localStorage.getItem(ACTIVITY_LOG_KEY)
    return logs ? JSON.parse(logs) : []
  } catch (error) {
    console.error('Failed to retrieve activity logs:', error)
    return []
  }
}

/**
 * Save activity logs to localStorage
 * @param {Array} logs - Array of log entries
 */
const saveActivityLogs = (logs) => {
  try {
    // Keep only the most recent MAX_LOGS entries
    const trimmedLogs = logs.slice(-MAX_LOGS)
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(trimmedLogs))
  } catch (error) {
    console.error('Failed to save activity logs:', error)
  }
}

/**
 * Log an activity
 * @param {Object} params - Log parameters
 * @param {string} params.action - Action type from ACTIVITY_ACTIONS
 * @param {string} params.performed_by - Email of user performing action
 * @param {string} params.target_user - Email of user affected by action
 * @param {string} params.description - Human-readable description
 * @param {Object} params.metadata - Optional additional data
 * @returns {Object} The created log entry
 */
export const logActivity = ({ action, performed_by, target_user, description, metadata = {} }) => {
  const logEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    action,
    performed_by,
    target_user,
    description,
    timestamp: new Date().toISOString(),
    metadata
  }

  const logs = getActivityLogs()
  logs.push(logEntry)
  saveActivityLogs(logs)

  return logEntry
}

/**
 * Clear all activity logs (use with caution)
 */
export const clearActivityLogs = () => {
  try {
    localStorage.removeItem(ACTIVITY_LOG_KEY)
  } catch (error) {
    console.error('Failed to clear activity logs:', error)
  }
}

/**
 * Get recent activity logs (limited count)
 * @param {number} limit - Number of recent logs to retrieve
 * @returns {Array} Array of recent log entries
 */
export const getRecentActivityLogs = (limit = 10) => {
  const logs = getActivityLogs()
  return logs.slice(-limit).reverse() // Most recent first
}

/**
 * Filter activity logs by action type
 * @param {string} action - Action type to filter by
 * @returns {Array} Filtered log entries
 */
export const getLogsByAction = (action) => {
  const logs = getActivityLogs()
  return logs.filter(log => log.action === action)
}

/**
 * Filter activity logs by user (performed by)
 * @param {string} email - Email of user who performed actions
 * @returns {Array} Filtered log entries
 */
export const getLogsByPerformer = (email) => {
  const logs = getActivityLogs()
  return logs.filter(log => log.performed_by === email)
}

/**
 * Filter activity logs by target user
 * @param {string} email - Email of target user
 * @returns {Array} Filtered log entries
 */
export const getLogsByTargetUser = (email) => {
  const logs = getActivityLogs()
  return logs.filter(log => log.target_user === email)
}

/**
 * Get activity logs within a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Array} Filtered log entries
 */
export const getLogsByDateRange = (startDate, endDate) => {
  const logs = getActivityLogs()
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()

  return logs.filter(log => {
    const logTime = new Date(log.timestamp).getTime()
    return logTime >= start && logTime <= end
  })
}

/**
 * Format action type for display
 * @param {string} action - Action type
 * @returns {string} Formatted action string
 */
export const formatActionType = (action) => {
  const actionMap = {
    USER_CREATED: 'User Created',
    USER_UPDATED: 'User Updated',
    USER_ACTIVATED: 'User Activated',
    USER_DEACTIVATED: 'User Deactivated',
    USER_ROLE_CHANGED: 'Role Changed',
    USER_PASSWORD_CHANGED: 'Password Changed',
    USER_LOGIN: 'User Login',
    USER_LOGOUT: 'User Logout',
    PREFERENCES_UPDATED: 'Preferences Updated',
    ACTIVITY_LOGS_CLEARED: 'Activity Logs Cleared',
    SYSTEM_PREFERENCES_RESET: 'System Preferences Reset',
  }
  return actionMap[action] || action
}

/**
 * Get action color for UI display
 * @param {string} action - Action type
 * @returns {string} Tailwind color class
 */
export const getActionColor = (action) => {
  const colorMap = {
    USER_CREATED: 'text-green-600 bg-green-50 border-green-200',
    USER_UPDATED: 'text-blue-600 bg-blue-50 border-blue-200',
    USER_ACTIVATED: 'text-green-600 bg-green-50 border-green-200',
    USER_DEACTIVATED: 'text-red-600 bg-red-50 border-red-200',
    USER_ROLE_CHANGED: 'text-purple-600 bg-purple-50 border-purple-200',
    USER_PASSWORD_CHANGED: 'text-orange-600 bg-orange-50 border-orange-200',
    USER_LOGIN: 'text-blue-600 bg-blue-50 border-blue-200',
    USER_LOGOUT: 'text-gray-600 bg-gray-50 border-gray-200',
    PREFERENCES_UPDATED: 'text-purple-600 bg-purple-50 border-purple-200',
    ACTIVITY_LOGS_CLEARED: 'text-red-600 bg-red-50 border-red-200',
    SYSTEM_PREFERENCES_RESET: 'text-orange-600 bg-orange-50 border-orange-200',
  }
  return colorMap[action] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export default {
  getActivityLogs,
  logActivity,
  clearActivityLogs,
  getRecentActivityLogs,
  getLogsByAction,
  getLogsByPerformer,
  getLogsByTargetUser,
  getLogsByDateRange,
  formatActionType,
  getActionColor,
  ACTIVITY_ACTIONS
}
