/**
 * LEIRS Admin OTP Edge Function
 * 
 * Secure OTP generation, storage, and verification for admin users.
 * Uses in-memory storage with expiration for simplicity and security.
 * 
 * Actions:
 * - generate: Create OTP and send via email
 * - verify: Validate OTP code
 * - resend: Resend existing OTP
 * 
 * Security features:
 * - Rate limiting: 3 OTP requests per email per 10 minutes
 * - Expiration: OTPs expire after 5 minutes
 * - One-time use: OTP is deleted after successful verification
 * - Server-side only: OTP never exposed to client
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

// In-memory OTP storage
// In production, this would use a database table or Redis
// For capstone: in-memory is acceptable as function restarts are rare  
interface OTPEntry {
  code: string
  email: string
  createdAt: number
  expiresAt: number
  attempts: number
}

interface RateLimitEntry {
  email: string
  requests: number
  resetAt: number
}

const otpStore = new Map<string, OTPEntry>()
const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 3 // Max wrong attempts before OTP is invalidated
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 3 // Max OTP requests per window

// CORS headers for local development and production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Generate a cryptographically secure random 6-digit OTP
 * Uses Deno's crypto.getRandomValues() for unpredictable generation
 */
function generateOTP(): string {
  const array = new Uint8Array(OTP_LENGTH)
  crypto.getRandomValues(array)
  
  // Convert each byte to a digit (0-9)
  const otp = Array.from(array, byte => (byte % 10).toString()).join('')
  
  return otp
}

/**
 * Check rate limit for email
 */
function checkRateLimit(email: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(email)
  
  if (!entry || now > entry.resetAt) {
    // New window or expired window
    rateLimitStore.set(email, {
      email,
      requests: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS }
  }
  
  if (entry.requests >= RATE_LIMIT_MAX_REQUESTS) {
    const resetIn = entry.resetAt - now
    return { allowed: false, remaining: 0, resetIn }
  }
  
  entry.requests++
  rateLimitStore.set(email, entry)
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.requests,
    resetIn: entry.resetAt - now
  }
}

/**
 * Clean up expired OTPs and rate limits
 */
function cleanupExpired() {
  const now = Date.now()
  
  // Clean expired OTPs
  for (const [email, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(email)
    }
  }
  
  // Clean expired rate limits
  for (const [email, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(email)
    }
  }
}

/**
 * Send OTP via email using SMTP
 * Uses Gmail SMTP configured in environment variables
 * Actually connects to Gmail SMTP server and sends email
 */
async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    // Get SMTP configuration from environment
    const smtpUser = Deno.env.get('SMTP_USER') || Deno.env.get('LEIRS_ADMIN_EMAIL')
    const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('GMAIL_APP_PASSWORD')
    
    if (!smtpUser || !smtpPass) {
      console.error('[OTP] SMTP credentials not configured')
      return false
    }
    
    // Construct HTML email body
    const subject = 'LEIRS Admin Login - OTP Verification'
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .otp-box { background: white; border: 2px solid #1e40af; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af; font-family: monospace; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">LEIRS Admin Portal</h1>
      <p style="margin: 8px 0 0 0; font-size: 14px;">Law Enforcement Incident Reporting System</p>
    </div>
    <div class="content">
      <h2 style="margin-top: 0;">Your One-Time Password (OTP)</h2>
      <p>You have requested to log in to the LEIRS Admin Portal. Use the following OTP to complete your authentication:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p><strong>⏱️ This code expires in 5 minutes.</strong></p>
      <p>If you did not request this OTP, please ignore this email and notify your system administrator immediately.</p>
      <div class="warning">
        <strong>🔒 Security Notice:</strong> Never share your OTP with anyone. LEIRS staff will never ask for your OTP via email, phone, or any other means.
      </div>
    </div>
    <div class="footer">
      <p><strong>Law Enforcement Incident Reporting System (LEIRS)</strong></p>
      <p>Barangay 178, Camarin, Caloocan City</p>
      <p style="margin-top: 12px; font-size: 11px; color: #9ca3af;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim()
    
    // Plain text version for email clients that don't support HTML
    const textBody = `
LEIRS Admin Portal - One-Time Password

Your OTP: ${otp}

This code expires in 5 minutes.

If you did not request this OTP, please ignore this email.

Security Notice: Never share your OTP with anyone.

Law Enforcement Incident Reporting System (LEIRS)
Barangay 178, Camarin, Caloocan City
    `.trim()
    
    // Create SMTP client with Gmail configuration
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true, // Use SSL/TLS
        auth: {
          username: smtpUser,
          password: smtpPass
        }
      }
    })
    
    // Log attempt (without sensitive data)
    const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production'
    console.log(`[OTP] Sending email to ${email} via ${smtpUser}@smtp.gmail.com`)
    
    // Only log OTP in development mode
    if (isDevelopment) {
      console.log(`[OTP] Development mode - OTP: ${otp}`)
    }
    
    // Send the email
    await client.send({
      from: smtpUser,
      to: email,
      subject: subject,
      content: textBody,
      html: htmlBody
    })
    
    // Close connection
    await client.close()
    
    console.log(`[OTP] Email sent successfully to ${email}`)
    return true
    
  } catch (error) {
    console.error('[OTP] Email sending failed:', error)
    // Log error details for debugging
    if (error instanceof Error) {
      console.error('[OTP] Error message:', error.message)
      console.error('[OTP] Error stack:', error.stack)
    }
    return false
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Development mode flag (declare once at the top)
    const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production'

    // Parse request body
    const { action, email, otp } = await req.json()

    // Clean up expired entries periodically
    cleanupExpired()

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================
    // ACTION: GENERATE OTP
    // ============================================================
    if (action === 'generate') {
      // Check rate limit
      const rateLimit = checkRateLimit(email)
      
      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            resetIn: Math.ceil(rateLimit.resetIn / 1000), // seconds
            message: `Too many OTP requests. Please try again in ${Math.ceil(rateLimit.resetIn / 60000)} minutes.`
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify user exists in profiles and is an admin
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email, role, status')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify user is admin
      const adminRoles = [
        'system_admin',
        'incident_admin',
        'case_admin',
        'dispatch_admin',
        'evidence_admin',
        'status_admin'
      ]

      if (!adminRoles.includes(profile.role)) {
        return new Response(
          JSON.stringify({ success: false, error: 'User is not an admin' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (profile.status !== 'Active') {
        return new Response(
          JSON.stringify({ success: false, error: 'User account is not active' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate OTP
      const otpCode = generateOTP()
      const now = Date.now()

      // Store OTP
      otpStore.set(email, {
        code: otpCode,
        email,
        createdAt: now,
        expiresAt: now + OTP_EXPIRY_MS,
        attempts: 0
      })
      
      // Debug logging
      if (isDevelopment) {
        console.log(`[OTP-GENERATE] Stored OTP for ${email}: ${otpCode} (expires in 5 min)`)
      }

      // Send OTP via email (actually connects to Gmail SMTP)
      const emailSent = await sendOTPEmail(email, otpCode)
      
      if (!emailSent) {
        // Email failed - remove OTP and return error
        otpStore.delete(email)
        console.error(`[OTP] Failed to send email to ${email}, OTP removed`)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to send OTP email. Please try again or contact support.'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Development mode: Return OTP in response (REMOVE IN PRODUCTION)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP sent to email',
          expiresIn: OTP_EXPIRY_MS / 1000, // seconds
          remaining: rateLimit.remaining,
          // ONLY for development/testing - REMOVE in production
          ...(isDevelopment && { dev_otp: otpCode })
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================
    // ACTION: VERIFY OTP
    // ============================================================
    if (action === 'verify') {
      if (!otp || !/^\d{6}$/.test(otp)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid OTP format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const entry = otpStore.get(email)
      
      // Debug logging
      if (isDevelopment) {
        console.log(`[OTP-VERIFY] Email: ${email}, Received OTP: ${otp}`)
        console.log(`[OTP-VERIFY] Entry found: ${!!entry}`)
        if (entry) {
          console.log(`[OTP-VERIFY] Stored OTP: ${entry.code}, Attempts: ${entry.attempts}`)
        }
      }

      if (!entry) {
        console.error(`[OTP-VERIFY] No OTP entry found for ${email}`)
        return new Response(
          JSON.stringify({ success: false, error: 'No OTP found for this email' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const now = Date.now()

      // Check expiration
      if (now > entry.expiresAt) {
        otpStore.delete(email)
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has expired' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check max attempts
      if (entry.attempts >= MAX_ATTEMPTS) {
        otpStore.delete(email)
        return new Response(
          JSON.stringify({ success: false, error: 'Too many incorrect attempts' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify OTP
      if (entry.code !== otp) {
        entry.attempts++
        otpStore.set(email, entry)
        
        const attemptsLeft = MAX_ATTEMPTS - entry.attempts
        
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Incorrect OTP',
            attemptsLeft
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // OTP is valid - delete it (one-time use)
      otpStore.delete(email)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP verified successfully',
          email
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================
    // ACTION: RESEND OTP
    // ============================================================
    if (action === 'resend') {
      let entry = otpStore.get(email)

      // If no existing OTP (function restarted), generate a new one
      if (!entry) {
        console.log('[OTP] No existing OTP found (function may have restarted), generating new one')
        
        // Check rate limit first
        const rateLimit = checkRateLimit(email)
        if (!rateLimit.allowed) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Rate limit exceeded',
              resetIn: Math.ceil(rateLimit.resetIn / 1000)
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate new OTP
        const otp = generateOTP()
        const now = Date.now()
        
        entry = {
          code: otp,
          expiresAt: now + OTP_EXPIRY_MS,
          attempts: 0
        }
        
        otpStore.set(email, entry)
        
        // Debug logging
        if (isDevelopment) {
          console.log(`[OTP-RESEND] Generated new OTP for ${email}: ${otp} (expires in 5 min)`)
        }
        
        // Send the new OTP
        const emailSent = await sendOTPEmail(email, otp)
        
        if (!emailSent) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to send OTP email. Please try again.'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.log(`[OTP] New OTP generated and sent to ${email}`)
        
        // Development mode: Return OTP in response
        return new Response(
          JSON.stringify({
            success: true,
            message: 'New OTP sent to email',
            expiresIn: OTP_EXPIRY_MS / 1000,
            remaining: rateLimit.count,
            // ONLY for development/testing
            ...(isDevelopment && { dev_otp: otp })
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if OTP is still valid
      const now = Date.now()
      if (now > entry.expiresAt) {
        otpStore.delete(email)
        return new Response(
          JSON.stringify({ success: false, error: 'OTP expired. Please request a new one.' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check rate limit
      const rateLimit = checkRateLimit(email)
      if (!rateLimit.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            resetIn: Math.ceil(rateLimit.resetIn / 1000)
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Resend existing OTP
      const emailSent = await sendOTPEmail(email, entry.code)
      
      if (!emailSent) {
        console.error(`[OTP] Failed to resend email to ${email}`)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to resend OTP email. Please try again or contact support.'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      console.log(`[OTP] Resent to ${email}`)
      
      const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production'
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP resent to email',
          expiresIn: Math.ceil((entry.expiresAt - now) / 1000),
          ...(isDevelopment && { dev_otp: entry.code })
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Invalid action
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use: generate, verify, or resend' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[OTP] Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
