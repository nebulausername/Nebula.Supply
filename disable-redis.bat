@echo off
echo 🔧 Disabling Redis and configuring memory store fallback...

REM Create API server .env if it doesn't exist
if not exist "apps\api-server\.env" (
    echo Creating API server .env file...
    echo # Server Configuration > apps\api-server\.env
    echo PORT=3001 >> apps\api-server\.env
    echo NODE_ENV=development >> apps\api-server\.env
    echo CLIENT_URL=http://localhost:5173 >> apps\api-server\.env
    echo. >> apps\api-server\.env
    echo # Database Configuration >> apps\api-server\.env
    echo DB_HOST=localhost >> apps\api-server\.env
    echo DB_PORT=5432 >> apps\api-server\.env
    echo DB_NAME=nebula_db >> apps\api-server\.env
    echo DB_USER=nebula_user >> apps\api-server\.env
    echo DB_PASSWORD=nebula_password >> apps\api-server\.env
    echo. >> apps\api-server\.env
    echo # Redis Configuration - DISABLED >> apps\api-server\.env
    echo REDIS_DISABLED=true >> apps\api-server\.env
    echo. >> apps\api-server\.env
    echo # Bot Integration >> apps\api-server\.env
    echo BOT_API_URL=http://localhost:3001/api >> apps\api-server\.env
    echo BOT_SECRET_KEY=nebula-bot-integration-key-2025 >> apps\api-server\.env
    echo. >> apps\api-server\.env
    echo # JWT Configuration >> apps\api-server\.env
    echo JWT_SECRET=your_secure_jwt_secret_32_chars_minimum >> apps\api-server\.env
    echo JWT_EXPIRES_IN=24h >> apps\api-server\.env
    echo. >> apps\api-server\.env
    echo # Rate Limiting >> apps\api-server\.env
    echo RATE_LIMIT_WINDOW=15 >> apps\api-server\.env
    echo RATE_LIMIT_MAX=100 >> apps\api-server\.env
    echo ✅ API server .env created
) else (
    echo API server .env already exists
)

REM Create Bot .env if it doesn't exist
if not exist "apps\bot\.env" (
    echo Creating Bot .env file...
    echo # Bot Configuration > apps\bot\.env
    echo BOT_TOKEN=your_telegram_bot_token_here >> apps\bot\.env
    echo BOT_NAME=NebulaOrderBot >> apps\bot\.env
    echo LOG_LEVEL=info >> apps\bot\.env
    echo. >> apps\bot\.env
    echo # Admin Configuration >> apps\bot\.env
    echo ADMIN_IDS=123456789,987654321 >> apps\bot\.env
    echo. >> apps\bot\.env
    echo # API Integration >> apps\bot\.env
    echo API_BASE_URL=http://localhost:3001/api >> apps\bot\.env
    echo IDENTITY_BASE_URL=http://localhost:3001/api >> apps\bot\.env
    echo PAYMENTS_BASE_URL=http://localhost:3001/api >> apps\bot\.env
    echo TICKETS_BASE_URL=http://localhost:3001/api >> apps\bot\.env
    echo WEB_APP_URL=http://localhost:5173 >> apps\bot\.env
    echo. >> apps\bot\.env
    echo # Redis Configuration - DISABLED (using memory store) >> apps\bot\.env
    echo # REDIS_URL= >> apps\bot\.env
    echo. >> apps\bot\.env
    echo # Environment >> apps\bot\.env
    echo NODE_ENV=development >> apps\bot\.env
    echo. >> apps\bot\.env
    echo # Security >> apps\bot\.env
    echo JWT_SECRET=your_secure_jwt_secret_32_chars_minimum >> apps\bot\.env
    echo SESSION_TTL=86400 >> apps\bot\.env
    echo. >> apps\bot\.env
    echo # Feature Flags >> apps\bot\.env
    echo ENABLE_VERIFICATION=true >> apps\bot\.env
    echo ENABLE_INVITE_SYSTEM=true >> apps\bot\.env
    echo ENABLE_SUPPORT_TICKETS=true >> apps\bot\.env
    echo ENABLE_ADMIN_DASHBOARD=true >> apps\bot\.env
    echo ✅ Bot .env created
) else (
    echo Bot .env already exists
)

echo.
echo ✅ Redis disabled successfully!
echo 📝 The system will now use memory store instead of Redis
echo 🚀 You can now start the application without Redis errors
echo.
echo 📋 Next steps:
echo 1. Update BOT_TOKEN in apps\bot\.env with your actual bot token
echo 2. Update ADMIN_IDS in apps\bot\.env with your Telegram user ID
echo 3. Run: npm run dev
echo.
pause








































































































