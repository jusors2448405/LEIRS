# Quick Deploy: Email Notification Service

## Prerequisites Check

Before running deployment commands, ensure:

1. ✅ Supabase CLI installed: `supabase --version`
2. ✅ Logged into Supabase: `supabase login`
3. ✅ Project linked: `supabase projects list`
4. ✅ Resend API key ready

## Step-by-Step Deployment

### 1. Navigate to Backend Directory

```powershell
cd leirs-backend
```

### 2. Link Supabase Project (if not already linked)

```powershell
# Find your project reference ID from Supabase Dashboard > Settings > General
supabase link --project-ref YOUR_PROJECT_REF
```

Example:
```powershell
supabase link --project-ref xyzabc123456
```

### 3. Set Environment Secrets

```powershell
# Set Resend API key (get from https://resend.com/api-keys)
supabase secrets set RESEND_API_KEY=re_your_resend_api_key_here

# Set from email - use test domain for MVP
supabase secrets set FROM_EMAIL="LEIRS System <onboarding@resend.dev>"
```

**For Production:**
```powershell
# After verifying your domain in Resend
supabase secrets set FROM_EMAIL="LEIRS System <noreply@yourbarangay.gov.ph>"
```

### 4. Deploy the Function

```powershell
supabase functions deploy send-email --no-verify-jwt
```

Expected output:
```
Deploying Function send-email (Node.js 18.x)
✓ Function deployed successfully
Function URL: https://xyzabc123456.supabase.co/functions/v1/send-email
```

**IMPORTANT:** Copy the Function URL from the output!

### 5. Update Frontend Configuration

Edit `leirs-frontend/.env` and add:

```env
VITE_EMAIL_API_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email
```

Replace `YOUR_PROJECT_REF` with your actual project reference.

### 6. Test the Function

Test via PowerShell:

```powershell
$testEmail = @{
    to = "your-email@example.com"
    subject = "LEIRS Email Test"
    body = "This is a test email from LEIRS notification system. If you receive this, the setup is successful!"
} | ConvertTo-Json

$functionUrl = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email"

Invoke-RestMethod -Uri $functionUrl -Method POST -ContentType "application/json" -Body $testEmail
```

Expected response:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "id": "abc123-def456-ghi789"
}
```

### 7. Restart Frontend Dev Server

```powershell
cd ..\leirs-frontend
npm run dev
```

The email functionality is now active!

## Verification Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Project successfully linked
- [ ] Secrets set (RESEND_API_KEY, FROM_EMAIL)
- [ ] Function deployed without errors
- [ ] Function URL copied
- [ ] Frontend .env updated with function URL
- [ ] Test email sent successfully
- [ ] Test email received in inbox (check spam folder)
- [ ] Frontend dev server restarted

## Common Issues

### Issue: "Project not linked"

**Solution:**
```powershell
supabase projects list  # Find your project reference
supabase link --project-ref YOUR_PROJECT_REF
```

### Issue: "Secrets not found"

**Solution:**
```powershell
# Verify secrets are set
supabase secrets list

# If missing, set them
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set FROM_EMAIL="LEIRS System <onboarding@resend.dev>"
```

### Issue: "Email not delivered"

**Checklist:**
1. Check spam/junk folder
2. View function logs: `supabase functions logs send-email`
3. Check Resend dashboard: https://resend.com/emails
4. Verify FROM_EMAIL is correct (use `onboarding@resend.dev` for testing)

### Issue: "CORS error in browser"

**Solution:** Already handled in the Edge Function. If persists, check browser console for actual error.

## Next Steps After Deployment

1. **Test all email templates** using the frontend hooks
2. **Monitor function logs** for any errors
3. **Check Resend analytics** for delivery rates
4. **Plan domain verification** for production (replace `onboarding@resend.dev`)
5. **Consider rate limiting** if expecting high volume

## Total Time Estimate

- First-time setup: **15-20 minutes**
- Subsequent deployments: **2-3 minutes**

## Support Resources

- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Resend Documentation: https://resend.com/docs
- LEIRS Email Hook: `leirs-frontend/src/hooks/useComplainantEmail.js`
