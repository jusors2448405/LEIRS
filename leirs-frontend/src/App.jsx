import React, { useState, useEffect } from 'react'
import AppRoutes from './routes/AppRoutes'
import { supabase } from './lib/supabase'
import { removeLegacyUsers, needsMigration } from './utils/userMigration'
import { logActivity, ACTIVITY_ACTIONS } from './utils/activityLogger'
import { initializeTheme } from './utils/theme'
import useIdleTimer from './hooks/useIdleTimer'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Handle idle timeout - log out user after 20 minutes of inactivity
  const handleIdleTimeout = async () => {
    if (user) {
      console.log('[LEIRS Security] User idle for 20 minutes - logging out')
      
      // Log idle timeout activity
      await logActivity({
        action: ACTIVITY_ACTIONS.USER_LOGOUT,
        performed_by: user.email,
        target_user: user.email,
        description: `${user.full_name} logged out due to inactivity`,
        metadata: { 
          role: user.role,
          reason: 'idle_timeout',
          idle_duration_minutes: 20
        }
      })

      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local state
      setUser(null)
      
      // Show notification to user
      alert('You have been logged out due to 20 minutes of inactivity.')
    }
  }

  // Initialize idle timer (only active when user is logged in)
  // 20-minute inactivity timeout
  useIdleTimer(handleIdleTimeout, 20 * 60 * 1000, !!user)

  useEffect(() => {
    // Initialize theme on app startup
    initializeTheme()

    // Run migration on app startup to remove legacy users
    if (needsMigration()) {
      console.log('[LEIRS REVISE] Detecting legacy users - running migration...')
      const result = removeLegacyUsers()
      if (result.success && result.removedCount > 0) {
        console.log(`[LEIRS REVISE] Migration complete: Removed ${result.removedCount} legacy users`)
      }
    }

    // Check for existing Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (error) {
              console.error('[App] Failed to fetch profile:', error)
              supabase.auth.signOut()
              setLoading(false)
              return
            }
            
            if (profile && profile.status === 'Active') {
              console.log('[App] Restored session for:', profile.email)
              setUser(profile)
            } else {
              console.warn('[App] Profile not active or not found')
              supabase.auth.signOut()
            }
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[App] Auth state changed:', event)
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User signed in - fetch profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error || !profile) {
          console.error('[App] Failed to fetch profile on sign in:', error)
          await supabase.auth.signOut()
          setUser(null)
          return
        }

        if (profile.status === 'Active') {
          setUser(profile)
        } else {
          console.warn('[App] User profile is not active')
          await supabase.auth.signOut()
          setUser(null)
        }
      } else if (event === 'SIGNED_OUT') {
        // User signed out
        setUser(null)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[App] Auth token refreshed')
      }
    })

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogin = (profile) => {
    console.log('[App] User logged in:', profile.email)
    setUser(profile)
  }

  const handleLogout = async () => {
    // Log logout activity before clearing session
    if (user) {
      await logActivity({
        action: ACTIVITY_ACTIONS.USER_LOGOUT,
        performed_by: user.email,
        target_user: user.email,
        description: `${user.full_name} logged out`,
        metadata: { 
          role: user.role,
          reason: 'manual_logout'
        }
      })
    }
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear local state
    setUser(null)
  }

  // Show loading state while checking session
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '10px' 
          }}>LEIRS</div>
          <div style={{ color: '#666' }}>Loading...</div>
        </div>
      </div>
    )
  }

  return <AppRoutes user={user} onLogin={handleLogin} onLogout={handleLogout} />
}

export default App

