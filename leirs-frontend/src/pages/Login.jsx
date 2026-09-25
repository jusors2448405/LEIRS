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
  
  // OTP-related state
  const [otpRequired, setOtpRequired] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [authenticatedProfile, setAuthenticatedProfile] = useState(null)
  const [otpExpiry, setOtpExpiry] = useState(null)
  const [attemptsLeft, setAttemptsLeft] = useState(3)

  // Admin roles that require OTP
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

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setOtpError('')

    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter a 6-digit code')
      return
    }

    try {
      setOtpLoading(true)

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()

      // Verify OTP via Edge Function
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('admin-otp', {
        body: {
          action: 'verify',
          email: authenticatedProfile.email,
          otp: otpCode
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      })

      setOtpLoading(false)

      // Check if there's a network/connection error
      if (verifyError) {
        console.error('[Login] OTP verification error:', verifyError)
        setOtpError('Verification failed. Please try again.')
        return
      }

      // Check if verification was successful
      if (!verifyData?.success) {
        // Handle specific error cases
        if (verifyData?.error === 'Incorrect OTP') {
          const remaining = verifyData.attemptsLeft || 0
          setAttemptsLeft(remaining)
          
          // If no attempts left, sign out
          if (remaining === 0) {
            await supabase.auth.signOut()
            setOtpRequired(false)
            setError('Too many incorrect attempts. Please login again.')
            return
          }
          
          setOtpError(`Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`)
        } else if (verifyData?.error === 'OTP has expired') {
          setOtpError('Verification code has expired. Please click "Resend Code".')
        } else if (verifyData?.error === 'No OTP found for this email') {
          setOtpError('No verification code found. Please click "Resend Code".')
        } else if (verifyData?.error === 'Too many incorrect attempts') {
          await supabase.auth.signOut()
          setOtpRequired(false)
          setError('Too many incorrect attempts. Please login again.')
          return
        } else {
          setOtpError(verifyData?.error || 'Verification failed')
        }
        return
      }

      console.log('[Login] OTP verified successfully')
      
      // Complete login for admin user
      await completeLogin(authenticatedProfile)

    } catch (err) {
      setOtpLoading(false)
      console.error('[Login] OTP verification error:', err)
      setOtpError('An unexpected error occurred. Please try again.')
    }
  }

  const handleResendOtp = async () => {
    setOtpError('')
    setOtpLoading(true)

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data: otpData, error: otpResendError } = await supabase.functions.invoke('admin-otp', {
        body: {
          action: 'resend',
          email: authenticatedProfile.email
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      })

      setOtpLoading(false)

      if (otpResendError || !otpData?.success) {
        console.error('[Login] OTP resend failed:', otpResendError || otpData)
        // Don't show error - just use generate instead
        const { data: genData, error: genError } = await supabase.functions.invoke('admin-otp', {
          body: {
            action: 'generate',
            email: authenticatedProfile.email
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        })
        
        if (genError || !genData?.success) {
          setOtpError('Unable to resend code. Please try again.')
          return
        }
      }

      console.log('[Login] OTP resent successfully')
      
      setOtpError('')
      setOtpCode('')
      setAttemptsLeft(3)
      
    } catch (err) {
      setOtpLoading(false)
      console.error('[Login] OTP resend error:', err)
      setOtpError('Failed to resend code. Please try again.')
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

  const handleCancelOtp = async () => {
    // Sign out and reset state
    await supabase.auth.signOut()
    setOtpRequired(false)
    setOtpCode('')
    setOtpError('')
    setAuthenticatedProfile(null)
    setOtpExpiry(null)
    setAttemptsLeft(3)
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

        {/* OTP Verification Modal */}
        {otpRequired && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-xl">
                <Shield className="text-primary" size={28} />
              </div>
            </div>
            
            <h2 className="font-heading font-semibold text-xl text-center mb-2">Email Verification</h2>
            <p className="text-sm text-center text-muted mb-6">
              We've sent a 6-digit verification code to<br />
              <span className="font-medium text-text">{authenticatedProfile?.email}</span>
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Verification Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                  disabled={otpLoading}
                  required
                />
                <p className="text-xs text-muted mt-2 text-center">
                  Code expires in 5 minutes • {attemptsLeft} attempts remaining
                </p>
              </div>

              {otpError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {otpError}
                </div>
              )}

              <div className="space-y-3">
                <button 
                  type="submit" 
                  className="btn-primary w-full"
                  disabled={otpLoading || otpCode.length !== 6}
                >
                  {otpLoading ? 'Verifying...' : 'Verify Code'}
                </button>

                <button 
                  type="button"
                  onClick={handleResendOtp}
                  className="btn-outline w-full"
                  disabled={otpLoading}
                >
                  <Mail size={18} />
                  Resend Code
                </button>

                <button 
                  type="button"
                  onClick={handleCancelOtp}
                  className="btn-outline w-full"
                  disabled={otpLoading}
                >
                  Cancel & Sign Out
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  This is an additional security measure for admin accounts. 
                  Never share your verification code with anyone.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Regular Login Form */}
        {!otpRequired && (
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

              <button type="submit" className="btn-primary w-full mt-2" disabled={otpLoading}>
                {otpLoading ? 'Sending verification code...' : 'Login to Dashboard'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted">
                Access is restricted to authorized LEIRS personnel only.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login
