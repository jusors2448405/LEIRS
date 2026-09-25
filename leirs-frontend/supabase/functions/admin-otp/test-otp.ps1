# PowerShell test script for admin-otp Edge Function

$FUNCTION_URL = "http://localhost:54321/functions/v1/admin-otp"
$EMAIL = "leirs.admin@gmail.com"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "LEIRS Admin OTP Function Tests" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Generate OTP
Write-Host "Test 1: Generate OTP" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Yellow
$generateBody = @{
    action = "generate"
    email = $EMAIL
} | ConvertTo-Json

$generateResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $generateBody -ContentType "application/json"
$generateResponse | ConvertTo-Json -Depth 10
$OTP = $generateResponse.dev_otp
Write-Host ""
Write-Host "Generated OTP: $OTP" -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 2

# Test 2: Verify with wrong OTP
Write-Host "Test 2: Verify with WRONG OTP" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow
$verifyWrongBody = @{
    action = "verify"
    email = $EMAIL
    otp = "999999"
} | ConvertTo-Json

try {
    $verifyWrongResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $verifyWrongBody -ContentType "application/json"
    $verifyWrongResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Verify with correct OTP
Write-Host "Test 3: Verify with CORRECT OTP" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow
$verifyCorrectBody = @{
    action = "verify"
    email = $EMAIL
    otp = $OTP
} | ConvertTo-Json

$verifyCorrectResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $verifyCorrectBody -ContentType "application/json"
$verifyCorrectResponse | ConvertTo-Json -Depth 10
Write-Host ""

# Test 4: Try to verify again (should fail)
Write-Host "Test 4: Try to verify again (should fail)" -ForegroundColor Yellow
Write-Host "-----------------------------------------" -ForegroundColor Yellow
try {
    $verifyAgainResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $verifyCorrectBody -ContentType "application/json"
    $verifyAgainResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Generate new OTP for resend test
Write-Host "Test 5: Generate OTP for resend test" -ForegroundColor Yellow
Write-Host "------------------------------------" -ForegroundColor Yellow
$generateResponse2 = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $generateBody -ContentType "application/json"
$generateResponse2 | ConvertTo-Json -Depth 10
Write-Host ""

# Test 6: Resend OTP
Write-Host "Test 6: Resend OTP" -ForegroundColor Yellow
Write-Host "-----------------" -ForegroundColor Yellow
$resendBody = @{
    action = "resend"
    email = $EMAIL
} | ConvertTo-Json

$resendResponse = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Body $resendBody -ContentType "application/json"
$resendResponse | ConvertTo-Json -Depth 10
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Tests Complete" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
