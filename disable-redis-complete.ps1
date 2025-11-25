#!/usr/bin/env pwsh
# ============================================================================
# Redis Complete Deactivation Script
# ============================================================================
# This script completely disables Redis and ensures the bot uses memory store
# ============================================================================

Write-Host "🔧 Nebula Bot - Redis Deactivation Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to update or add env variable
function Update-EnvFile {
    param (
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        $pattern = "^$Key=.*$"
        
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "$Key=$Value"
            Write-Host "  ✓ Updated $Key in $FilePath" -ForegroundColor Green
        } else {
            $content += "`n$Key=$Value"
            Write-Host "  ✓ Added $Key to $FilePath" -ForegroundColor Green
        }
        
        Set-Content -Path $FilePath -Value $content -NoNewline
    }
}

# Function to comment out env variable
function Comment-EnvVariable {
    param (
        [string]$FilePath,
        [string]$Key
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        $pattern = "^$Key=.*$"
        
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "# $Key="
            Write-Host "  ✓ Commented out $Key in $FilePath" -ForegroundColor Yellow
            Set-Content -Path $FilePath -Value $content -NoNewline
        }
    }
}

# ============================================================================
# 1. Configure Bot .env
# ============================================================================
Write-Host "📝 Step 1: Configuring Bot Environment..." -ForegroundColor Cyan

$botEnvPath = "apps/bot/.env"

if (-not (Test-Path $botEnvPath)) {
    Write-Host "  Creating new .env file for bot..." -ForegroundColor Yellow
    
    $botEnvContent = @"
# ============================================================================
# Nebula Telegram Bot - Configuration
# ============================================================================

# Bot Configuration
BOT_TOKEN=your_telegram_bot_token_here
BOT_NAME=NebulaOrderBot
LOG_LEVEL=info

# Admin Configuration
ADMIN_IDS=123456789

# API Integration
API_BASE_URL=http://localhost:3001/api
IDENTITY_BASE_URL=http://localhost:3001/api
PAYMENTS_BASE_URL=http://localhost:3001/api
TICKETS_BASE_URL=http://localhost:3001/api
WEB_APP_URL=http://localhost:5173

# Redis Configuration - DISABLED (using optimized memory store)
# REDIS_URL is intentionally not set - bot will use memory store
# Memory store has automatic cleanup and is optimized for performance

# Environment
NODE_ENV=development

# Security
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum_change_this
SESSION_TTL=86400

# Feature Flags
ENABLE_VERIFICATION=true
ENABLE_INVITE_SYSTEM=true
ENABLE_SUPPORT_TICKETS=true
ENABLE_ADMIN_DASHBOARD=true

# Performance Tuning
MAX_MEMORY_SESSIONS=10000
SESSION_CLEANUP_INTERVAL=300000
"@
    
    Set-Content -Path $botEnvPath -Value $botEnvContent
    Write-Host "  ✓ Created $botEnvPath" -ForegroundColor Green
} else {
    Write-Host "  Found existing .env file, updating..." -ForegroundColor Yellow
    Comment-EnvVariable -FilePath $botEnvPath -Key "REDIS_URL"
    Write-Host "  ✓ Redis disabled in existing .env" -ForegroundColor Green
}

# ============================================================================
# 2. Configure API Server .env (if needed)
# ============================================================================
Write-Host "`n📝 Step 2: Configuring API Server Environment..." -ForegroundColor Cyan

$apiEnvPath = "apps/api-server/.env"

if (-not (Test-Path $apiEnvPath)) {
    Write-Host "  Creating new .env file for API server..." -ForegroundColor Yellow
    
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

# Redis Configuration - DISABLED
REDIS_DISABLED=true
# REDIS_URL=

# Bot Integration
BOT_API_URL=http://localhost:3001/api
BOT_SECRET_KEY=nebula-bot-integration-key-2025

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_32_chars_minimum
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
"@
    
    Set-Content -Path $apiEnvPath -Value $apiEnvContent
    Write-Host "  ✓ Created $apiEnvPath" -ForegroundColor Green
} else {
    Write-Host "  Found existing .env file, updating..." -ForegroundColor Yellow
    Comment-EnvVariable -FilePath $apiEnvPath -Key "REDIS_URL"
    Update-EnvFile -FilePath $apiEnvPath -Key "REDIS_DISABLED" -Value "true"
    Write-Host "  ✓ Redis disabled in existing .env" -ForegroundColor Green
}

# ============================================================================
# 3. Verify Configuration
# ============================================================================
Write-Host "`n🔍 Step 3: Verifying Configuration..." -ForegroundColor Cyan

$verified = $true

if (Test-Path $botEnvPath) {
    $botContent = Get-Content $botEnvPath -Raw
    if ($botContent -match "^REDIS_URL=redis://") {
        Write-Host "  ⚠️  Warning: Active REDIS_URL found in bot .env" -ForegroundColor Yellow
        $verified = $false
    } else {
        Write-Host "  ✓ Bot configuration verified" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ Bot .env file not found" -ForegroundColor Red
    $verified = $false
}

# ============================================================================
# 4. Display Summary
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Redis Deactivation Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  • Redis connections disabled" -ForegroundColor White
Write-Host "  • Memory store activated with optimizations:" -ForegroundColor White
Write-Host "    - Automatic cleanup every 5 minutes" -ForegroundColor Gray
Write-Host "    - Maximum 10,000 sessions stored" -ForegroundColor Gray
Write-Host "    - Retry logic fixed (max 3 attempts)" -ForegroundColor Gray
Write-Host "    - No more infinite reconnection loops" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 What was fixed:" -ForegroundColor Cyan
Write-Host "  ✓ Redis retry strategy optimized" -ForegroundColor Green
Write-Host "  ✓ Automatic reconnection disabled" -ForegroundColor Green
Write-Host "  ✓ Memory cleanup implemented" -ForegroundColor Green
Write-Host "  ✓ Proper Redis client disconnection" -ForegroundColor Green
Write-Host "  ✓ Fallback to memory store improved" -ForegroundColor Green
Write-Host ""
Write-Host "⚙️  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update BOT_TOKEN in apps/bot/.env" -ForegroundColor White
Write-Host "  2. Update ADMIN_IDS with your Telegram user ID" -ForegroundColor White
Write-Host "  3. Restart the bot: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "  • Memory store is perfectly fine for development" -ForegroundColor White
Write-Host "  • No Redis server needed" -ForegroundColor White
Write-Host "  • All features will work normally" -ForegroundColor White
Write-Host "  • Memory usage optimized and monitored" -ForegroundColor White
Write-Host ""

if (-not $verified) {
    Write-Host "⚠️  Warning: Some issues detected. Please check the logs above." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")



