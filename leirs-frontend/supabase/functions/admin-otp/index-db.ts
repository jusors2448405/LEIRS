/**
 * LEIRS Admin OTP Edge Function (Database Version)
 * 
 * Secure OTP generation, storage, and verification for admin users.
 * Uses Supabase database table for persistent storage.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

// Configuration
const OTP_LENGTH = 6
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes
const MAX_ATTEMPTS = 3

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Generate a cryptographically secure random 6-digit OTP
 */
function generateOTP(): string {
  const array = new Uint8Array(OTP_LENGTH)
  crypto.getRandomValues(array)
  const otp = Array.from(array, byte => (byte % 10).toString()).join('')
  return otp
}

/**
 * Send OTP via email using Gmail SMTP
 */
async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const smtpUser = Deno.env.get('SMTP_USER') || Deno.env.get('LEIRS_ADMIN_EMAIL')
    const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('GMAIL_APP_PASSWORD')
    
    if (!smtpUser || !smtpPass) {
      console.error('[OTP] SMTP credentials not configured')
      return false
    }
    
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
    </div>
  </div>
</body>
</html>
    `.trim()
    
    const textBody = `
LEIRS Admin Portal - One-Time Password

Your OTP: ${otp}

This code expires in 5 minutes.

If you did not request this OTP, please ignore this email.

Security Notice: Never share your OTP with anyone.

Law Enforcement Incident Reporting System (LEIRS)
Barangay 178, Camarin, Caloocan City
    `.trim()
    
    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass
        }
      }
    })
    
    console.log(`[OTP] Sending email to ${email}`)
    
    await client.send({
      from: smtpUser,
      to: email,
      subject: subject,
      content: textBody,
      html: htmlBody
    })
    
    await client.close()
    console.log(`[OTP] Email sent successfully to ${email}`)
    return true
    
  } catch (error) {
    console.error('[OTP] Email sending failed:', error)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production'
    const { action, email, otp } = await req.json()

    // Validate email
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
      // Verify user is system_admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, role, status')
        .eq('email', email)
        .single()

      if (!profile || profile.role !== 'system_admin' || profile.status !== 'Active') {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate OTP
      const otpCode = generateOTP()
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString()

      // Delete any existing OTP for this email
      await supabaseAdmin
        .from('otp_verifications')
        .delete()
        .eq('email', email)

      // Store new OTP in database
      const { error: insertError } = await supabaseAdmin
        .from('otp_verifications')
        .insert({
          email,
          otp_code: otpCode,
          expires_at: expiresAt,
          attempts: 0
        })

      if (insertError) {
        console.error('[OTP] Database insert error:', insertError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to store OTP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (isDevelopment) {
        console.log(`[OTP-GENERATE] Stored OTP for ${email}: ${otpCode}`)
      }

      // Send email
      const emailSent = await sendOTPEmail(email, otpCode)
      
      if (!emailSent) {
        await supabaseAdmin.from('otp_verifications').delete().eq('email', email)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to send email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP sent to email',
          expiresIn: OTP_EXPIRY_MS / 1000,
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

      // Get OTP from database
      const { data: otpEntry, error: fetchError } = await supabaseAdmin
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .single()

      if (fetchError || !otpEntry) {
        if (isDevelopment) console.log(`[OTP-VERIFY] No OTP found for ${email}`)
        return new Response(
          JSON.stringify({ success: false, error: 'No OTP found for this email' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (isDevelopment) {
        console.log(`[OTP-VERIFY] Email: ${email}, Received: ${otp}, Stored: ${otpEntry.otp_code}`)
      }

      // Check expiration
      if (new Date() > new Date(otpEntry.expires_at)) {
        await supabaseAdmin.from('otp_verifications').delete().eq('email', email)
        return new Response(
          JSON.stringify({ success: false, error: 'OTP has expired' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check max attempts
      if (otpEntry.attempts >= MAX_ATTEMPTS) {
        await supabaseAdmin.from('otp_verifications').delete().eq('email', email)
        return new Response(
          JSON.stringify({ success: false, error: 'Too many incorrect attempts' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify OTP
      if (otpEntry.otp_code !== otp) {
        const newAttempts = otpEntry.attempts + 1
        await supabaseAdmin
          .from('otp_verifications')
          .update({ attempts: newAttempts })
          .eq('email', email)
        
        const attemptsLeft = MAX_ATTEMPTS - newAttempts
        
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
      await supabaseAdmin.from('otp_verifications').delete().eq('email', email)

      return new Response(
        JSON.stringify({ success: true, message: 'OTP verified successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================
    // ACTION: RESEND OTP
    // ============================================================
    if (action === 'resend') {
      // Check if OTP exists
      const { data: existingOtp } = await supabaseAdmin
        .from('otp_verifications')
        .select('otp_code')
        .eq('email', email)
        .single()

      if (existingOtp) {
        // Resend existing OTP
        const emailSent = await sendOTPEmail(email, existingOtp.otp_code)
        if (!emailSent) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to resend email' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'OTP resent to email',
            expiresIn: OTP_EXPIRY_MS / 1000,
            ...(isDevelopment && { dev_otp: existingOtp.otp_code })
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // No existing OTP - generate new one
        return new Response(
          JSON.stringify({ success: false, error: 'No OTP to resend. Please generate a new one.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
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
