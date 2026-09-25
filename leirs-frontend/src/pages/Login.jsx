// LEIRS Login Page - Defense Version - NO OTP - Build 6c62b8a
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldAlert, ArrowLeft, Mail, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { logActivity, ACTIVITY_ACTIONS } from '../utils/activityLogger'

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Admin roles - OTP feature temporarily disabled for defense
  const ADMIN_ROLES = [
    'system_admin',
    'incident_admin',
    'case_admin',
    'dispatch_admin',
    'evidence_admin',
    'status_admin'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      // Step 1: Authenticate with Supabase Auth
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('[Login] Auth error:', signInError)
        setError('Invalid email or password')
        return
      }

      if (!authUser) {
        setError('Authentication failed. Please try again.')
        return
      }

      // Wait for session to be set (important for RLS policies)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Step 2: Fetch user profile from public.profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.error('[Login] Profile fetch error:', profileError)
        await supabase.auth.signOut()
        setError('Unable to load user profile. Please contact system administrator.')
        return
      }

      if (!profile) {
        console.error('[Login] No profile found for user:', authUser.id)
        await supabase.auth.signOut()
        setError('User profile not found. Please contact system administrator.')
        return
      }

      // Step 3: Check if user is active
      if (profile.status !== 'Active') {
        await supabase.auth.signOut()
        setError('This account has been deactivated. Please contact an administrator.')
        return
      }

      // Step 4: OTP check TEMPORARILY DISABLED for defense - FORCE REBUILD v2
      // System admin can login directly without OTP verification
      console.log('[Login] OTP disabled - proceeding with direct login for defense')

      // Step 5: Non-admin user - proceed with regular login
      await completeLogin(profile)

    } catch (err) {
      console.error('[Login] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    }
  }

  const completeLogin = async (profile) => {
    try {
      // Update last login timestamp
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', profile.id)

      if (updateError) {
        console.warn('[Login] Failed to update last_login_at:', updateError)
        // Don't block login if timestamp update fails
      }

      // Log login activity
      logActivity({
        action: ACTIVITY_ACTIONS.USER_LOGIN,
        performed_by: profile.email,
        target_user: profile.email,
        description: `${profile.full_name} logged in`,
        metadata: { role: profile.role }
      })

      // Pass profile to parent (App.jsx will store in state)
      onLogin(profile)

      // Route based on role - each role gets its own dashboard
      switch (profile.role) {
        case 'system_admin':
          navigate('/system-admin')
          break
        case 'incident_admin':
          navigate('/incident-admin')
          break
        case 'case_admin':
          navigate('/case-admin')
          break
        case 'dispatch_admin':
          navigate('/dispatch-admin')
          break
        case 'evidence_admin':
          navigate('/evidence-admin')
          break
        case 'status_admin':
          navigate('/status-admin')
          break
        default:
          // Invalid role - user account may have legacy role or corrupted data
          await supabase.auth.signOut()
          setError('Invalid user role. Please contact system administrator.')
          return
      }
    } catch (err) {
      console.error('[Login] Complete login error:', err)
      setError('An error occurred during login. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 text-muted hover:text-primary transition-colors mb-8">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <ShieldAlert className="text-white" size={36} />
          </div>
          <h1 className="font-heading font-bold text-3xl mb-2">LEIRS</h1>
          <p className="text-lg text-muted">Law Enforcement and Incident Reporting System</p>
          <p className="text-sm text-muted mt-1">Barangay 178, Camarin, North Caloocan City</p>
        </div>

        {/* Regular Login Form */}
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            <h2 className="font-heading font-semibold text-xl text-center mb-6">Staff Portal Login</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full mt-2">
                Login to Dashboard
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted">
                Access is restricted to authorized LEIRS personnel only.
              </p>
            </div>
          </div>
        </div>
      </div>

  )
}

export default Login
