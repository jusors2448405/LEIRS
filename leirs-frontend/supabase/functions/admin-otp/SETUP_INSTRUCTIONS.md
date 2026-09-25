# LOCAL TESTING SETUP INSTRUCTIONS

## ✅ Security Verification Complete

All security checks have passed. See `SECURITY_VERIFICATION.md` for details.

---

## 📋 MANUAL STEPS YOU NEED TO PERFORM

### Step 1: Get Your Service Role Key

1. Open your browser and go to: **https://supabase.com/dashboard**
2. Click on your **LEIRS project**
3. In the left sidebar, click **Settings** (gear icon)
4. Click **API** in the settings menu
5. Scroll down to find the **service_role** key (it's the SECRET key at the bottom)
6. Click the **Copy** button to copy it to your clipboard

⚠️ **Important:** 
- Do NOT copy the `anon` key (that's the public key at the top)
- The `service_role` key is SECRET and should never be shared or committed to Git
- It starts with `eyJ...` and is very long

---

### Step 2: Create the .env.local File

1. Open your text editor or VS Code
2. Navigate to: `leirs-frontend/supabase/functions/`
3. Create a new file named exactly: `.env.local`
4. Paste this content into the file:

```
SUPABASE_URL=https://kyvhyhmqwcxbloiliojw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=paste-your-actual-service-role-key-here
ENVIRONMENT=development
```

5. Replace `paste-your-actual-service-role-key-here` with the key you copied in Step 1
6. **Save the file**

**Final file should look like:**
```
SUPABASE_URL=https://kyvhyhmqwcxbloiliojw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi....(very long)
ENVIRONMENT=development
```

✅ This file is already gitignored and cannot be committed by accident.

---

### Step 3: Verify (Optional but Recommended)

Open PowerShell in the main LEIRS folder and run:

```powershell
cd "c:\Users\jodie\OneDrive\Desktop\LEIRS - REVISE"
git status
```

**Expected result:** You should NOT see `.env.local` in the list of files.

If you see `.env.local` in the output, **STOP** and notify me immediately.

---

## 🧪 TESTING PROCESS (I WILL DO THIS)

Once you've created the `.env.local` file and confirmed it has your service_role key:

1. **Tell me you're ready** by saying: "Ready for testing"
2. I will start the Supabase Edge Function locally
3. I will run the comprehensive test suite
4. I will report PASS/FAIL for each test:
   - ✅ Generate OTP
   - ✅ Verify wrong OTP
   - ✅ Verify correct OTP
   - ✅ One-time use verification
   - ✅ Resend OTP
   - ✅ Rate limiting

---

## ⚠️ IMPORTANT REMINDERS

**What I WILL do after you confirm:**
- ✅ Start the Edge Function locally
- ✅ Run automated tests
- ✅ Report results

**What I will NOT do:**
- ❌ Deploy to production
- ❌ Modify Login.jsx
- ❌ Modify database
- ❌ Change existing authentication
- ❌ Commit sensitive files

---

## 🚫 IF SOMETHING GOES WRONG

If you see `.env.local` in `git status`:
1. **DO NOT commit**
2. Run: `git reset HEAD .env.local`
3. Verify it's in `.gitignore`

If you accidentally committed it:
1. **DO NOT push to GitHub**
2. Contact me immediately for cleanup instructions

---

## ✅ READY?

After completing Steps 1 and 2 above, simply reply:

**"Ready for testing"**

And I will proceed with the local test suite.

