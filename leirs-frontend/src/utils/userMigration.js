/**
 * User Migration Utility for LEIRS REVISE
 * 
 * This utility removes legacy users (admin, officer, encoder) from localStorage
 * while preserving the 6 module admin accounts and any custom users created by System Admin.
 */

import { getUsers, saveUsers, isValidRole } from '../data/mockData'

/**
 * Remove legacy users from localStorage
 * 
 * LEGACY ROLES TO REMOVE:
 * - admin
 * - officer  
 * - encoder
 * 
 * PRESERVED ROLES:
 * - system_admin
 * - incident_admin
 * - case_admin
 * - dispatch_admin
 * - evidence_admin
 * - status_admin
 */
export const removeLegacyUsers = () => {
  try {
    const users = getUsers()
    
    // Legacy emails to remove (the old default accounts)
    const legacyEmails = [
      'admin@leirs.com',
      'officer@leirs.com',
      'encoder@leirs.com'
    ]
    
    // Filter out legacy users by email or invalid roles
    const cleanedUsers = users.filter(user => {
      // Remove if email matches legacy accounts
      if (legacyEmails.includes(user.email.toLowerCase())) {
        console.log(`[Migration] Removing legacy account: ${user.email}`)
        return false
      }
      
      // Remove if role is invalid (not in ROLE_DEFINITIONS)
      if (!isValidRole(user.role)) {
        console.log(`[Migration] Removing user with invalid role: ${user.email} (${user.role})`)
        return false
      }
      
      return true
    })
    
    const removedCount = users.length - cleanedUsers.length
    
    if (removedCount > 0) {
      saveUsers(cleanedUsers)
      console.log(`[Migration] Removed ${removedCount} legacy/invalid users`)
      console.log(`[Migration] Remaining users: ${cleanedUsers.length}`)
      return { success: true, removedCount, remainingCount: cleanedUsers.length }
    } else {
      console.log('[Migration] No legacy users found. System is clean.')
      return { success: true, removedCount: 0, remainingCount: cleanedUsers.length }
    }
  } catch (error) {
    console.error('[Migration] Error removing legacy users:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if migration is needed
 */
export const needsMigration = () => {
  try {
    const users = getUsers()
    
    const legacyEmails = [
      'admin@leirs.com',
      'officer@leirs.com',
      'encoder@leirs.com'
    ]
    
    return users.some(user => 
      legacyEmails.includes(user.email.toLowerCase()) || 
      !isValidRole(user.role)
    )
  } catch (error) {
    console.error('[Migration] Error checking migration status:', error)
    return false
  }
}

/**
 * Get migration info for display
 */
export const getMigrationInfo = () => {
  try {
    const users = getUsers()
    
    const legacyEmails = [
      'admin@leirs.com',
      'officer@leirs.com',
      'encoder@leirs.com'
    ]
    
    const legacyUsers = users.filter(user => 
      legacyEmails.includes(user.email.toLowerCase())
    )
    
    const invalidRoleUsers = users.filter(user => 
      !isValidRole(user.role)
    )
    
    return {
      hasLegacyUsers: legacyUsers.length > 0,
      legacyCount: legacyUsers.length,
      legacyEmails: legacyUsers.map(u => u.email),
      hasInvalidRoles: invalidRoleUsers.length > 0,
      invalidRoleCount: invalidRoleUsers.length,
      invalidRoleUsers: invalidRoleUsers.map(u => ({ email: u.email, role: u.role }))
    }
  } catch (error) {
    console.error('[Migration] Error getting migration info:', error)
    return null
  }
}
