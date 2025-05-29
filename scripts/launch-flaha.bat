REM filepath: C:\Users\rafat\repo\Flaha\FlahaSoil\scripts\launch-flaha.bat

@echo off
echo FlahaSoil Application Launcher
echo ==============================

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo PowerShell is required but not found!
    echo Please install PowerShell to use this launcher.
    pause
    exit /b 1
)

REM Run PowerShell script with parameters
powershell -ExecutionPolicy Bypass -File "%~dp0launch-flaha.ps1" %*