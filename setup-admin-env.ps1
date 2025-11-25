# Nebula Admin Dashboard - Environment Setup Script
# Dieses Script erstellt automatisch die .env.local Datei

$envContent = @"
# Nebula Admin Dashboard - Local Environment Configuration

# API Server URL
VITE_API_URL=http://localhost:3001

# WebSocket Server URL (usually same as API)
VITE_WS_URL=http://localhost:3001

# Enable debug logging
VITE_DEBUG=true

# Environment
VITE_ENV=development
"@

$targetPath = "apps\admin\.env.local"

# Erstelle die Datei
Write-Host "📝 Erstelle .env.local für Admin Dashboard..." -ForegroundColor Cyan
New-Item -Path $targetPath -ItemType File -Force -Value $envContent | Out-Null

if (Test-Path $targetPath) {
    Write-Host "✅ .env.local erfolgreich erstellt in: $targetPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Inhalt:" -ForegroundColor Yellow
    Get-Content $targetPath
    Write-Host ""
    Write-Host "🚀 Du kannst jetzt das Admin Dashboard starten mit:" -ForegroundColor Cyan
    Write-Host "   pnpm dev:admin:full" -ForegroundColor White
} else {
    Write-Host "❌ Fehler beim Erstellen der .env.local Datei" -ForegroundColor Red
}

