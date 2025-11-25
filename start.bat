@echo off
echo 🚀 Starting Nebula Supply System...
echo.

echo 📦 Installing dependencies...
call npx --yes pnpm@10.18.3 install
if %errorlevel% neq 0 (
    echo ❌ Installation failed!
    pause
    exit /b 1
)

echo.
echo 🚀 Starting all services...
echo.
echo 🌐 Web App: http://localhost:5173
echo 🤖 Bot: Skipped if no BOT_TOKEN in apps/bot/.env
echo 📊 Admin: http://localhost:5273
echo.

call npx --yes pnpm@10.18.3 dev

pause



