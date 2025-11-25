# PowerShell Script für MCP-EYES Installation
# Maximale MCP-Integration für Nebula Supply

Write-Host "🚀 MCP-EYES Installation für Nebula Supply" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Schritt 1: Node.js und npm prüfen
Write-Host "📋 Schritt 1: Node.js und npm prüfen..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js Version: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js oder npm nicht gefunden. Bitte installieren Sie Node.js von https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Schritt 2: MCP-EYES global installieren
Write-Host "📋 Schritt 2: MCP-EYES global installieren..." -ForegroundColor Yellow
try {
    npm install -g mcp-eyes
    Write-Host "✅ MCP-EYES erfolgreich installiert" -ForegroundColor Green
} catch {
    Write-Host "❌ Fehler bei der MCP-EYES Installation" -ForegroundColor Red
    Write-Host "Versuche alternative Installation..." -ForegroundColor Yellow
    
    # Alternative: GitHub Repository
    Write-Host "📋 Alternative: GitHub Repository klonen..." -ForegroundColor Yellow
    git clone https://github.com/datagram1/mcp-eyes.git C:\Users\issab\Desktop\mcp-eyes
    cd C:\Users\issab\Desktop\mcp-eyes
    npm install
    Write-Host "✅ MCP-EYES aus GitHub installiert" -ForegroundColor Green
}

# Schritt 3: MCP SDK installieren
Write-Host "📋 Schritt 3: MCP SDK installieren..." -ForegroundColor Yellow
cd C:\Users\issab\Desktop\TETETTE
npm install @modelcontextprotocol/sdk playwright

# Schritt 4: Playwright Browser installieren
Write-Host "📋 Schritt 4: Playwright Browser installieren..." -ForegroundColor Yellow
npx playwright install

# Schritt 5: Nebula MCP-Server Dependencies installieren
Write-Host "📋 Schritt 5: Nebula MCP-Server Dependencies installieren..." -ForegroundColor Yellow
cd mcp
npm install

# Schritt 6: Screenshot-Ordner erstellen
Write-Host "📋 Schritt 6: Screenshot-Ordner erstellen..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\Users\issab\Desktop\TETETTE\screenshots"

# Schritt 7: Konfigurationsdateien kopieren
Write-Host "📋 Schritt 7: Konfigurationsdateien kopieren..." -ForegroundColor Yellow

# Cursor Konfiguration
$cursorConfigPath = "$env:APPDATA\Cursor\User\globalStorage\cursor.mcp\config.json"
$cursorConfigDir = Split-Path $cursorConfigPath -Parent

if (!(Test-Path $cursorConfigDir)) {
    New-Item -ItemType Directory -Force -Path $cursorConfigDir
}

Copy-Item "config\cursor-mcp-config.json" $cursorConfigPath -Force
Write-Host "✅ Cursor MCP-Konfiguration kopiert" -ForegroundColor Green

# Claude Desktop Konfiguration
$claudeConfigPath = "$env:APPDATA\Claude\User\globalStorage\claude.mcp\config.json"
$claudeConfigDir = Split-Path $claudeConfigPath -Parent

if (!(Test-Path $claudeConfigDir)) {
    New-Item -ItemType Directory -Force -Path $claudeConfigDir
}

Copy-Item "config\claude-desktop-config.json" $claudeConfigPath -Force
Write-Host "✅ Claude Desktop MCP-Konfiguration kopiert" -ForegroundColor Green

# Schritt 8: Test der Installation
Write-Host "📋 Schritt 8: Installation testen..." -ForegroundColor Yellow

# MCP-EYES Test
try {
    mcp-eyes --version
    Write-Host "✅ MCP-EYES funktioniert" -ForegroundColor Green
} catch {
    Write-Host "⚠️ MCP-EYES Test fehlgeschlagen, aber Installation möglicherweise erfolgreich" -ForegroundColor Yellow
}

# Nebula MCP-Server Test
try {
    node servers\nebula-fs.js --help
    Write-Host "✅ Nebula MCP-Server funktionieren" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Nebula MCP-Server Test fehlgeschlagen" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 MCP-Installation abgeschlossen!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Nächste Schritte:" -ForegroundColor Yellow
Write-Host "1. Starten Sie Cursor/Claude Desktop neu" -ForegroundColor White
Write-Host "2. Die MCP-Server sollten automatisch verbunden werden" -ForegroundColor White
Write-Host "3. Testen Sie mit: 'Lese die Datei apps/web/src/App.tsx'" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ihr AI-Agent hat jetzt 'Augen' und kann das gesamte Nebula-Projekt verwalten!" -ForegroundColor Green


