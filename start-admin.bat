@echo off
REM Nebula Admin Dashboard - Quick Start Script
REM Startet automatisch API Server + Admin Dashboard

echo.
echo ========================================
echo   Nebula Admin Dashboard - Quick Start
echo ========================================
echo.

REM Prüfe ob .env.local existiert
if not exist "apps\admin\.env.local" (
    echo [!] .env.local nicht gefunden - erstelle...
    powershell -ExecutionPolicy Bypass -File setup-admin-env.ps1
    echo.
)

echo [+] Starte API Server und Admin Dashboard...
echo.
echo     API Server:    http://localhost:3001
echo     Admin Panel:   http://localhost:5273
echo.
echo     Login:         admin@nebula.local / admin123
echo.
echo ========================================
echo.

REM Starte beide Server gleichzeitig
pnpm dev:admin:full

