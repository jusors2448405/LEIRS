# Install Leaflet Packages for LEIRS Dispatch Module
# Run this script if the batch file doesn't work

Write-Host "Installing Leaflet packages for LEIRS Dispatch Module..." -ForegroundColor Cyan
Write-Host ""

$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $currentDir

Write-Host "Current directory: $currentDir" -ForegroundColor Yellow
Write-Host ""

try {
    # Try to run npm using cmd.exe to bypass execution policy
    Write-Host "Running: npm install leaflet react-leaflet" -ForegroundColor Green
    Write-Host ""
    
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm", "install", "leaflet", "react-leaflet" -Wait -NoNewWindow -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "SUCCESS: Leaflet packages installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now start the development server with: npm run dev" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "ERROR: Failed to install packages. Exit code: $($process.ExitCode)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please try running this command manually in Command Prompt:" -ForegroundColor Yellow
        Write-Host "npm install leaflet react-leaflet" -ForegroundColor White
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: An exception occurred: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try running this command manually in Command Prompt:" -ForegroundColor Yellow
    Write-Host "npm install leaflet react-leaflet" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
