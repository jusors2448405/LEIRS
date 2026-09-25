-- Create OTP verifications table for storing admin login OTPs
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_otp_verifications_email ON public.otp_verifications(email);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role can manage OTP verifications"
  ON public.otp_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Regular users cannot access this table directly
CREATE POLICY "Users cannot access OTP verifications"
  ON public.otp_verifications
  FOR ALL
  TO authenticated
  USING (false);

-- Function to clean up expired OTPs (optional, for maintenance)
CREATE OR REPLACE FUNCTION clean_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;
