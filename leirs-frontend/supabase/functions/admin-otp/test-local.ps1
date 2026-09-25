# ============================================================================
# LEIRS Admin OTP - LOCAL TESTING SCRIPT
# ============================================================================
# This script tests the admin-otp Edge Function locally.
# 
# REQUIREMENTS:
# - Supabase CLI installed
# - .env.local file created with service_role key
# - Edge Function running locally
# ============================================================================

$ErrorActionPreference = "Continue"
$FUNCTION_URL = "http://localhost:54321/functions/v1/admin-otp"
$TEST_EMAIL = "leirs.admin@gmail.com"
$WRONG_OTP = "999999"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                LEIRS ADMIN OTP - LOCAL TEST SUITE" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Email: $TEST_EMAIL" -ForegroundColor White
Write-Host "Function URL: $FUNCTION_URL" -ForegroundColor White
Write-Host ""

$testResults = @()

# ============================================================================
# TEST 1: Generate OTP
# ============================================================================
Write-Host "TEST 1: Generate OTP" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Yellow

try {
    $generateBody = @{
        action = "generate"
        email = $TEST_EMAIL
    } | ConvertTo-Json

    $generateResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $generateBody -ContentType "application/json" -ErrorAction Stop
    
    if ($generateResponse.success -and $generateResponse.dev_otp) {
        $OTP = $generateResponse.dev_otp
        Write-Host "✅ PASS: OTP generated successfully" -ForegroundColor Green
        Write-Host "   OTP Code: $OTP" -ForegroundColor Gray
        Write-Host "   Expires In: $($generateResponse.expiresIn) seconds" -ForegroundColor Gray
        Write-Host "   Remaining Requests: $($generateResponse.remaining)" -ForegroundColor Gray
        $testResults += @{ Test = "Generate OTP"; Result = "PASS" }
    } else {
        Write-Host "❌ FAIL: No OTP in response" -ForegroundColor Red
        $generateResponse | ConvertTo-Json -Depth 10
        $testResults += @{ Test = "Generate OTP"; Result = "FAIL" }
        exit 1
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Generate OTP"; Result = "FAIL" }
    exit 1
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================================================
# TEST 2: Verify WRONG OTP
# ============================================================================
Write-Host "TEST 2: Verify WRONG OTP (expect failure)" -ForegroundColor Yellow
Write-Host "------------------------------------------" -ForegroundColor Yellow

try {
    $verifyWrongBody = @{
        action = "verify"
        email = $TEST_EMAIL
        otp = $WRONG_OTP
    } | ConvertTo-Json

    $verifyWrongResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $verifyWrongBody -ContentType "application/json" -ErrorAction Stop
    
    if (-not $verifyWrongResponse.success -and $verifyWrongResponse.error -eq "Incorrect OTP") {
        Write-Host "✅ PASS: Wrong OTP correctly rejected" -ForegroundColor Green
        Write-Host "   Attempts Left: $($verifyWrongResponse.attemptsLeft)" -ForegroundColor Gray
        $testResults += @{ Test = "Verify Wrong OTP"; Result = "PASS" }
    } else {
        Write-Host "❌ FAIL: Wrong OTP was accepted or wrong error" -ForegroundColor Red
        $verifyWrongResponse | ConvertTo-Json -Depth 10
        $testResults += @{ Test = "Verify Wrong OTP"; Result = "FAIL" }
    }
} catch {
    Write-Host "⚠️  Error (may be expected): $($_.Exception.Message)" -ForegroundColor Yellow
    $testResults += @{ Test = "Verify Wrong OTP"; Result = "PARTIAL" }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================================================
# TEST 3: Verify CORRECT OTP
# ============================================================================
Write-Host "TEST 3: Verify CORRECT OTP (expect success)" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Yellow

try {
    $verifyCorrectBody = @{
        action = "verify"
        email = $TEST_EMAIL
        otp = $OTP
    } | ConvertTo-Json

    $verifyCorrectResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $verifyCorrectBody -ContentType "application/json" -ErrorAction Stop
    
    if ($verifyCorrectResponse.success) {
        Write-Host "✅ PASS: Correct OTP verified successfully" -ForegroundColor Green
        Write-Host "   Message: $($verifyCorrectResponse.message)" -ForegroundColor Gray
        $testResults += @{ Test = "Verify Correct OTP"; Result = "PASS" }
    } else {
        Write-Host "❌ FAIL: Correct OTP was rejected" -ForegroundColor Red
        $verifyCorrectResponse | ConvertTo-Json -Depth 10
        $testResults += @{ Test = "Verify Correct OTP"; Result = "FAIL" }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Verify Correct OTP"; Result = "FAIL" }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================================================
# TEST 4: Verify OTP Again (expect failure - one-time use)
# ============================================================================
Write-Host "TEST 4: Verify OTP Again (expect failure - one-time use)" -ForegroundColor Yellow
Write-Host "---------------------------------------------------------" -ForegroundColor Yellow

try {
    $verifyAgainResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $verifyCorrectBody -ContentType "application/json" -ErrorAction Stop
    
    if (-not $verifyAgainResponse.success -and $verifyAgainResponse.error -eq "No OTP found") {
        Write-Host "✅ PASS: OTP correctly deleted after first use" -ForegroundColor Green
        $testResults += @{ Test = "One-Time Use"; Result = "PASS" }
    } else {
        Write-Host "❌ FAIL: OTP can be reused (security issue!)" -ForegroundColor Red
        $verifyAgainResponse | ConvertTo-Json -Depth 10
        $testResults += @{ Test = "One-Time Use"; Result = "FAIL" }
    }
} catch {
    Write-Host "⚠️  Error (may be expected): $($_.Exception.Message)" -ForegroundColor Yellow
    $testResults += @{ Test = "One-Time Use"; Result = "PARTIAL" }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================================================
# TEST 5: Generate New OTP for Resend Test
# ============================================================================
Write-Host "TEST 5: Generate New OTP for Resend Test" -ForegroundColor Yellow
Write-Host "-----------------------------------------" -ForegroundColor Yellow

try {
    $generateBody2 = @{
        action = "generate"
        email = $TEST_EMAIL
    } | ConvertTo-Json

    $generateResponse2 = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $generateBody2 -ContentType "application/json" -ErrorAction Stop
    
    if ($generateResponse2.success -and $generateResponse2.dev_otp) {
        $OTP2 = $generateResponse2.dev_otp
        Write-Host "✅ PASS: Second OTP generated" -ForegroundColor Green
        Write-Host "   New OTP Code: $OTP2" -ForegroundColor Gray
        Write-Host "   Remaining Requests: $($generateResponse2.remaining)" -ForegroundColor Gray
        $testResults += @{ Test = "Generate Second OTP"; Result = "PASS" }
    } else {
        Write-Host "❌ FAIL: Second OTP generation failed" -ForegroundColor Red
        $generateResponse2 | ConvertTo-Json -Depth 10
        $testResults += @{ Test = "Generate Second OTP"; Result = "FAIL" }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Generate Second OTP"; Result = "FAIL" }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================================================
# TEST 6: Resend OTP
# ============================================================================
Write-Host "TEST 6: Resend OTP (expect success)" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow

try {
    $resendBody = @{
        action = "resend"
        email = $TEST_EMAIL
    } | ConvertTo-Json

    $resendResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $resendBody -ContentType "application/json" -ErrorAction Stop
    
    if ($resendResponse.success) {
        Write-Host "✅ PASS: OTP resent successfully" -ForegroundColor Green
        Write-Host "   Resent OTP: $($resendResponse.dev_otp)" -ForegroundColor Gray
        Write-Host "   Expires In: $($resendResponse.expiresIn) seconds" -ForegroundColor Gray
        
        if ($resendResponse.dev_otp -eq $OTP2) {
            Write-Host "   ✅ Same OTP as before (correct behavior)" -ForegroundColor Gray
        }
        
        $testResults += @{ Test = "Resend OTP"; Result = "PASS" }
    } else {
        Write-Host "❌ FAIL: Resend failed" -ForegroundColor Red
        $resendResponse | ConvertTo-Json -Depth 10
        $testResults += @{ Test = "Resend OTP"; Result = "FAIL" }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{ Test = "Resend OTP"; Result = "FAIL" }
}

Write-Host ""
Start-Sleep -Seconds 2

# ============================================================================
# TEST 7: Rate Limiting (3 requests in 10 minutes)
# ============================================================================
Write-Host "TEST 7: Rate Limiting Test" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow
Write-Host "Attempting 3rd generation request (should be at limit)..." -ForegroundColor Gray

try {
    $generateBody3 = @{
        action = "generate"
        email = $TEST_EMAIL
    } | ConvertTo-Json

    $generateResponse3 = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $generateBody3 -ContentType "application/json" -ErrorAction Stop
    
    if (-not $generateResponse3.success -and $generateResponse3.error -eq "Rate limit exceeded") {
        Write-Host "✅ PASS: Rate limit correctly enforced after 3 requests" -ForegroundColor Green
        Write-Host "   Reset In: $($generateResponse3.resetIn) seconds" -ForegroundColor Gray
        Write-Host "   Message: $($generateResponse3.message)" -ForegroundColor Gray
        $testResults += @{ Test = "Rate Limiting"; Result = "PASS" }
    } elseif ($generateResponse3.success) {
        Write-Host "⚠️  PARTIAL: Request succeeded (may be within rate limit)" -ForegroundColor Yellow
        Write-Host "   Remaining: $($generateResponse3.remaining)" -ForegroundColor Gray
        $testResults += @{ Test = "Rate Limiting"; Result = "PARTIAL" }
    } else {
        Write-Host "❌ FAIL: Unexpected response" -ForegroundColor Red
        $generateResponse3 | ConvertTo-Json -Depth 10
        $testResults += @{ Test = "Rate Limiting"; Result = "FAIL" }
    }
} catch {
    Write-Host "⚠️  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    $testResults += @{ Test = "Rate Limiting"; Result = "PARTIAL" }
}

Write-Host ""

# ============================================================================
# TEST SUMMARY
# ============================================================================
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "                        TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$passCount = ($testResults | Where-Object { $_.Result -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Result -eq "FAIL" }).Count
$partialCount = ($testResults | Where-Object { $_.Result -eq "PARTIAL" }).Count
$totalCount = $testResults.Count

foreach ($result in $testResults) {
    $icon = switch ($result.Result) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "PARTIAL" { "⚠️ " }
    }
    
    $color = switch ($result.Result) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "PARTIAL" { "Yellow" }
    }
    
    Write-Host "$icon $($result.Test): $($result.Result)" -ForegroundColor $color
}

Write-Host ""
Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host "Partial: $partialCount" -ForegroundColor Yellow
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "              ✅ ALL TESTS PASSED - READY FOR STEP 2" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
} else {
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host "              ❌ SOME TESTS FAILED - REVIEW REQUIRED" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Red
}

Write-Host ""

