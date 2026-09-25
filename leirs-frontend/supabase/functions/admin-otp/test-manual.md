# MANUAL TESTING INSTRUCTIONS

## ⚠️ ISSUE DETECTED

PowerShell execution policy is set to **Restricted**, which blocks running npm/npx commands.

---

## 🔧 SOLUTION OPTIONS

### Option 1: Enable PowerShell Scripts (Recommended)

Run PowerShell **as Administrator** and execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then you can run:
```powershell
cd "c:\Users\jodie\OneDrive\Desktop\LEIRS - REVISE\leirs-frontend"
npx supabase functions serve admin-otp --env-file supabase/functions/.env.local
```

---

### Option 2: Use Node.js Directly

Instead of using Supabase CLI, we can create a Node.js test script that calls the Edge Function directly.

However, **Supabase Edge Functions run on Deno**, not Node.js, so we need the Supabase CLI to run them locally.

---

### Option 3: Install Supabase CLI Globally

Download from: https://supabase.com/docs/guides/cli/getting-started

Or use npm:
```powershell
npm install -g supabase
```

---

## 📋 RECOMMENDED STEPS

1. **Open PowerShell as Administrator:**
   - Press `Windows Key`
   - Type "PowerShell"
   - Right-click "Windows PowerShell"
   - Click "Run as administrator"

2. **Run this command:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   - Type `Y` when prompted

3. **Close admin PowerShell**

4. **Open normal PowerShell and run:**
   ```powershell
   cd "c:\Users\jodie\OneDrive\Desktop\LEIRS - REVISE\leirs-frontend"
   npx supabase functions serve admin-otp --env-file supabase/functions/.env.local
   ```

5. **In another PowerShell window, run:**
   ```powershell
   cd "c:\Users\jodie\OneDrive\Desktop\LEIRS - REVISE\leirs-frontend"
   .\supabase\functions\admin-otp\test-local.ps1
   ```

---

## 🧪 ALTERNATIVE: Manual API Testing with curl

If you have `curl` installed, you can test manually:

### 1. Start the function (after fixing execution policy):
```powershell
cd leirs-frontend
npx supabase functions serve admin-otp --env-file supabase/functions/.env.local
```

### 2. In another terminal:

**Generate OTP:**
```powershell
curl -X POST http://localhost:54321/functions/v1/admin-otp -H "Content-Type: application/json" -d '{\"action\":\"generate\",\"email\":\"leirs.admin@gmail.com\"}'
```

**Verify OTP:**
```powershell
curl -X POST http://localhost:54321/functions/v1/admin-otp -H "Content-Type: application/json" -d '{\"action\":\"verify\",\"email\":\"leirs.admin@gmail.com\",\"otp\":\"123456\"}'
```

---

## ❓ WHAT DO YOU WANT TO DO?

1. **Fix PowerShell execution policy** (recommended) - then I can run automated tests
2. **Install Supabase CLI globally** - then I can run automated tests
3. **Skip local testing for now** - proceed directly to Step 2 (Login.jsx integration) with assumption that Edge Function works
4. **Test manually yourself** - I'll provide detailed manual testing steps

Let me know which option you prefer!

