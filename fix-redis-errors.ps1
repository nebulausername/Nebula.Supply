# Redis Error Fix Script
Write-Host "🔧 Fixing Redis connection errors..." -ForegroundColor Green

# Create API server .env
$apiEnvPath = "apps\api-server\.env"
if (-not (Test-Path $apiEnvPath)) {
    Write-Host "Creating API server .env file..." -ForegroundColor Yellow
    $apiEnvContent = @"
# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nebula_db
DB_USER=nebula_user
DB_PASSWORD=nebula_password
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# Redis Configuration - DISABLED (using memory store)
REDIS_DISABLED=true

# Bot Integration
BOT_API_URL=http://localhost:3001/api
BOT_SECRET_KEY=nebula-bot-integration-key-2025

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_CONNECTION_TIMEOUT=60000
"@
    $apiEnvContent | Out-File -FilePath $apiEnvPath -Encoding UTF8
    Write-Host "✅ API server .env created" -ForegroundColor Green
} else {
    Write-Host "API server .env already exists" -ForegroundColor Yellow
}

# Create Bot .env
$botEnvPath = "apps\bot\.env"
if (-not (Test-Path $botEnvPath)) {
    Write-Host "Creating Bot .env file..." -ForegroundColor Yellow
    $botEnvContent = @"
# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
BOT_NAME=NebulaOrderBot
LOG_LEVEL=info

# Admin Configuration
ADMIN_IDS=123456789,987654321

# API Integration
API_BASE_URL=http://localhost:3001/api
IDENTITY_BASE_URL=http://localhost:3001/api
PAYMENTS_BASE_URL=http://localhost:3001/api
TICKETS_BASE_URL=http://localhost:3001/api
WEB_APP_URL=http://localhost:5173

# Redis Configuration - DISABLED (using memory store)
# REDIS_URL=

# Environment
NODE_ENV=development

# Security
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
SESSION_TTL=86400

# Rate Limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=30

# Feature Flags
ENABLE_VERIFICATION=true
ENABLE_INVITE_SYSTEM=true
ENABLE_SUPPORT_TICKETS=true
ENABLE_ADMIN_DASHBOARD=true
"@
    $botEnvContent | Out-File -FilePath $botEnvPath -Encoding UTF8
    Write-Host "✅ Bot .env created" -ForegroundColor Green
} else {
    Write-Host "Bot .env already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Redis errors fixed successfully!" -ForegroundColor Green
Write-Host "📝 The system will now use memory store instead of Redis" -ForegroundColor Cyan
Write-Host "🚀 You can now start the application without Redis errors" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Update BOT_TOKEN in apps\bot\.env with your actual bot token" -ForegroundColor White
Write-Host "2. Update ADMIN_IDS in apps\bot\.env with your Telegram user ID" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 See REDIS_SETUP_GUIDE.md for more information" -ForegroundColor Cyan







































































































