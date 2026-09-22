@echo off
echo Installing Leaflet packages for LEIRS Dispatch Module...
echo.
cd /d "%~dp0"
npm install leaflet react-leaflet
echo.
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Leaflet packages installed successfully!
    echo.
    echo You can now start the development server with: npm run dev
) else (
    echo ERROR: Failed to install packages. Error code: %ERRORLEVEL%
    echo.
    echo Please try running this command manually:
    echo npm install leaflet react-leaflet
)
echo.
pause
