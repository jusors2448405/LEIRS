/**
 * LEIRS Role Definitions
 * 
 * Defines the 6 administrative roles in the LEIRS system.
 * Used for UI labels, descriptions, and role validation.
 * 
 * Note: Authentication is handled by Supabase Auth.
 * User accounts and passwords are stored in auth.users table (hashed).
 */

// Role definitions with display labels
// LEIRS REVISE: 6 Module-Specific Admin Roles Only
export const ROLE_DEFINITIONS = {
  system_admin: {
    key: 'system_admin',
    label: 'System Administrator',
    description: 'User management and system configuration',
    module: 'System Administration'
  },
  incident_admin: {
    key: 'incident_admin',
    label: 'Incident Reporting Admin',
    description: 'Incident reporting and encoding',
    module: 'Incident Reporting and Encoding'
  },
  case_admin: {
    key: 'case_admin',
    label: 'Case Documentation Admin',
    description: 'Case documentation and tracking',
    module: 'Case Documentation and Tracking'
  },
  dispatch_admin: {
    key: 'dispatch_admin',
    label: 'Dispatch Admin',
    description: 'Law enforcement dispatch',
    module: 'Law Enforcement Dispatch'
  },
  evidence_admin: {
    key: 'evidence_admin',
    label: 'Evidence Management Admin',
    description: 'Evidence logging and management',
    module: 'Evidence Logging and Management'
  },
  status_admin: {
    key: 'status_admin',
    label: 'Case Status Admin',
    description: 'Case status monitoring',
    module: 'Case Status Monitoring'
  }
}

// Helper function to get role label
export const getRoleLabel = (roleKey) => {
  return ROLE_DEFINITIONS[roleKey]?.label || roleKey
}

// Helper function to get role description
export const getRoleDescription = (roleKey) => {
  return ROLE_DEFINITIONS[roleKey]?.description || ''
}

// Helper function to get all active roles (for System Admin UI)
export const getActiveRoles = () => {
  return Object.keys(ROLE_DEFINITIONS)
}

// Helper function to check if a role is valid
export const isValidRole = (roleKey) => {
  return ROLE_DEFINITIONS.hasOwnProperty(roleKey)
}

// ============================================================================
// LEGACY FUNCTIONS - For backwards compatibility with System Admin pages
// ============================================================================
// These are deprecated and should be replaced with Supabase queries
// Kept temporarily to prevent errors during migration
// ============================================================================

// Deprecated: Use supabase.from('profiles').select('*') instead
export const getUsers = () => {
  console.warn('[mockData] getUsers() is deprecated. Use Supabase queries instead.')
  return []
}

// Deprecated: Use supabase.from('profiles').update() instead
export const saveUsers = (users) => {
  console.warn('[mockData] saveUsers() is deprecated. Use Supabase queries instead.')
}

// Deprecated: No longer needed with Supabase Auth
export const initializeUsers = () => {
  console.warn('[mockData] initializeUsers() is deprecated. Users are in Supabase Auth.')
}