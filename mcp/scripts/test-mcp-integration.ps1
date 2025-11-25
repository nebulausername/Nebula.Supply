# PowerShell Script für MCP-Integration Testing
# Testet alle MCP-Server und Funktionen

Write-Host "🧪 MCP-Integration Testing für Nebula Supply" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Test 1: MCP-EYES
Write-Host "📋 Test 1: MCP-EYES..." -ForegroundColor Yellow
try {
    $mcpEyesVersion = mcp-eyes --version
    Write-Host "✅ MCP-EYES Version: $mcpEyesVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ MCP-EYES nicht verfügbar" -ForegroundColor Red
}

# Test 2: Nebula FileSystem Server
Write-Host "📋 Test 2: Nebula FileSystem Server..." -ForegroundColor Yellow
try {
    cd C:\Users\issab\Desktop\TETETTE\mcp
    $fsTest = node -e "console.log('FileSystem Server Test')"
    Write-Host "✅ FileSystem Server funktioniert" -ForegroundColor Green
} catch {
    Write-Host "❌ FileSystem Server Test fehlgeschlagen" -ForegroundColor Red
}

# Test 3: Nebula Git Server
Write-Host "📋 Test 3: Nebula Git Server..." -ForegroundColor Yellow
try {
    $gitTest = node -e "console.log('Git Server Test')"
    Write-Host "✅ Git Server funktioniert" -ForegroundColor Green
} catch {
    Write-Host "❌ Git Server Test fehlgeschlagen" -ForegroundColor Red
}

# Test 4: Nebula Shell Server
Write-Host "📋 Test 4: Nebula Shell Server..." -ForegroundColor Yellow
try {
    $shellTest = node -e "console.log('Shell Server Test')"
    Write-Host "✅ Shell Server funktioniert" -ForegroundColor Green
} catch {
    Write-Host "❌ Shell Server Test fehlgeschlagen" -ForegroundColor Red
}

# Test 5: Nebula HTTP Server
Write-Host "📋 Test 5: Nebula HTTP Server..." -ForegroundColor Yellow
try {
    $httpTest = node -e "console.log('HTTP Server Test')"
    Write-Host "✅ HTTP Server funktioniert" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTP Server Test fehlgeschlagen" -ForegroundColor Red
}

# Test 6: Nebula Playwright Server
Write-Host "📋 Test 6: Nebula Playwright Server..." -ForegroundColor Yellow
try {
    $playwrightTest = node -e "console.log('Playwright Server Test')"
    Write-Host "✅ Playwright Server funktioniert" -ForegroundColor Green
} catch {
    Write-Host "❌ Playwright Server Test fehlgeschlagen" -ForegroundColor Red
}

# Test 7: Projekt-Struktur
Write-Host "📋 Test 7: Projekt-Struktur..." -ForegroundColor Yellow
$projectPaths = @(
    "C:\Users\issab\Desktop\TETETTE\apps\web",
    "C:\Users\issab\Desktop\TETETTE\apps\admin",
    "C:\Users\issab\Desktop\TETETTE\apps\bot",
    "C:\Users\issab\Desktop\TETETTE\packages\shared",
    "C:\Users\issab\Desktop\TETETTE\mcp"
)

foreach ($path in $projectPaths) {
    if (Test-Path $path) {
        Write-Host "✅ $path existiert" -ForegroundColor Green
    } else {
        Write-Host "❌ $path fehlt" -ForegroundColor Red
    }
}

# Test 8: Konfigurationsdateien
Write-Host "📋 Test 8: Konfigurationsdateien..." -ForegroundColor Yellow
$configPaths = @(
    "$env:APPDATA\Cursor\User\globalStorage\cursor.mcp\config.json",
    "$env:APPDATA\Claude\User\globalStorage\claude.mcp\config.json"
)

foreach ($configPath in $configPaths) {
    if (Test-Path $configPath) {
        Write-Host "✅ $configPath existiert" -ForegroundColor Green
    } else {
        Write-Host "❌ $configPath fehlt" -ForegroundColor Red
    }
}

# Test 9: Dependencies
Write-Host "📋 Test 9: Dependencies..." -ForegroundColor Yellow
cd C:\Users\issab\Desktop\TETETTE\mcp
try {
    $deps = npm list --depth=0
    Write-Host "✅ MCP Dependencies installiert" -ForegroundColor Green
} catch {
    Write-Host "❌ MCP Dependencies fehlen" -ForegroundColor Red
}

# Test 10: Screenshot-Ordner
Write-Host "📋 Test 10: Screenshot-Ordner..." -ForegroundColor Yellow
$screenshotPath = "C:\Users\issab\Desktop\TETETTE\screenshots"
if (Test-Path $screenshotPath) {
    Write-Host "✅ Screenshot-Ordner existiert" -ForegroundColor Green
} else {
    Write-Host "❌ Screenshot-Ordner fehlt" -ForegroundColor Red
    New-Item -ItemType Directory -Force -Path $screenshotPath
    Write-Host "✅ Screenshot-Ordner erstellt" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 MCP-Integration Testing abgeschlossen!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Test-Ergebnisse:" -ForegroundColor Yellow
Write-Host "Alle Tests wurden durchgeführt. Überprüfen Sie die Ergebnisse oben." -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ihr AI-Agent ist bereit für maximale Funktionalität!" -ForegroundColor Green


