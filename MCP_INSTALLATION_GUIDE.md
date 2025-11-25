# 🚀 MAXIMALE MCP-INSTALLATION FÜR NEBULA SUPPLY

## 📋 Übersicht

Diese Anleitung führt Sie durch die **manuelle Installation** aller MCP-Tools für maximale Funktionalität Ihres Nebula Supply Projekts. Ihr AI-Agent bekommt damit "Augen" und kann das gesamte Projekt vollständig automatisieren.

## 🎯 Was Sie bekommen

- ✅ **MCP-EYES** - GUI-Automatisierung mit Screenshot-Funktionen
- ✅ **5 Custom MCP-Server** - Speziell für Ihr Nebula-Projekt
- ✅ **Vollständige Codebase-Kontrolle**
- ✅ **Automatisierte Tests und Builds**
- ✅ **Browser-Automatisierung**
- ✅ **Git-Integration**
- ✅ **API-Testing**

---

## 📥 SCHRITT 1: MCP-EYES INSTALLATION (GUI-Automatisierung)

### Download-Links:
- **GitHub Repository:** https://github.com/datagram1/mcp-eyes
- **LobeHub MCP-EYES:** https://lobehub.com/mcp/datagram1-mcp-eyes
- **NPM Package:** https://www.npmjs.com/package/mcp-eyes

### Manuelle Installation:

#### Option A: NPM Global Installation
```bash
# 1. Öffnen Sie PowerShell als Administrator
# 2. Installieren Sie MCP-EYES global
npm install -g mcp-eyes

# 3. Testen Sie die Installation
mcp-eyes --version
```

#### Option B: GitHub Repository (Empfohlen)
```bash
# 1. Navigieren Sie zu Ihrem Desktop
cd C:\Users\issab\Desktop

# 2. Klonen Sie das Repository
git clone https://github.com/datagram1/mcp-eyes.git

# 3. Wechseln Sie in das Verzeichnis
cd mcp-eyes

# 4. Installieren Sie Dependencies
npm install

# 5. Testen Sie die Installation
npm run mcp-eyes
```

---

## 📥 SCHRITT 2: MCP SDK INSTALLATION

### Download-Links:
- **MCP SDK:** https://github.com/modelcontextprotocol/sdk
- **MCP Servers:** https://github.com/modelcontextprotocol/servers

### Installation:
```bash
# 1. Navigieren Sie zu Ihrem Projekt
cd C:\Users\issab\Desktop\TETETTE

# 2. Installieren Sie MCP SDK
npm install @modelcontextprotocol/sdk

# 3. Installieren Sie Playwright für Browser-Automatisierung
npm install playwright

# 4. Installieren Sie Playwright Browser
npx playwright install
```

---

## 📥 SCHRITT 3: NEBULA MCP-SERVER SETUP

Die MCP-Server sind bereits in Ihrem Projekt erstellt! Sie finden sie in:
- `mcp/servers/nebula-fs.js` - Dateisystem-Server
- `mcp/servers/nebula-git.js` - Git-Server
- `mcp/servers/nebula-shell.js` - Shell-Server
- `mcp/servers/nebula-http.js` - HTTP-Server
- `mcp/servers/nebula-playwright.js` - Playwright-Server

### Installation der Dependencies:
```bash
# 1. Wechseln Sie in den MCP-Ordner
cd C:\Users\issab\Desktop\TETETTE\mcp

# 2. Installieren Sie alle Dependencies
npm install

# 3. Testen Sie die Server
npm run start:fs
```

---

## ⚙️ SCHRITT 4: CURSOR/CLAUDE DESKTOP KONFIGURATION

### Konfigurationsdatei erstellen:

**Windows-Pfad:** `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\config.json`

Erstellen Sie diese Datei mit folgendem Inhalt:

```json
{
  "mcpServers": {
    "nebula-fs": {
      "command": "node",
      "args": ["C:\\Users\\issab\\Desktop\\TETETTE\\mcp\\servers\\nebula-fs.js"],
      "env": {
        "ALLOW": ".apps,.packages,.tests"
      }
    },
    "nebula-git": {
      "command": "node",
      "args": ["C:\\Users\\issab\\Desktop\\TETETTE\\mcp\\servers\\nebula-git.js"],
      "env": {
        "GIT_SAFE": "1"
      }
    },
    "nebula-shell": {
      "command": "node",
      "args": ["C:\\Users\\issab\\Desktop\\TETETTE\\mcp\\servers\\nebula-shell.js"],
      "env": {
        "ALLOW_CMDS": "pnpm,git,drizzle-kit,tsc,eslint,vitest,playwright"
      }
    },
    "nebula-http": {
      "command": "node",
      "args": ["C:\\Users\\issab\\Desktop\\TETETTE\\mcp\\servers\\nebula-http.js"]
    },
    "nebula-playwright": {
      "command": "node",
      "args": ["C:\\Users\\issab\\Desktop\\TETETTE\\mcp\\servers\\nebula-playwright.js"]
    },
    "mcp-eyes": {
      "command": "mcp-eyes",
      "args": ["mcp"]
    }
  }
}
```

---

## 🧪 SCHRITT 5: TESTING & VERIFICATION

### Test 1: MCP-Server starten
```bash
cd C:\Users\issab\Desktop\TETETTE\mcp
npm run start:all
```

### Test 2: MCP-EYES testen
```bash
# In einem neuen Terminal
mcp-eyes mcp
```

### Test 3: Cursor/Claude Desktop neu starten
1. Schließen Sie Cursor/Claude Desktop
2. Starten Sie es neu
3. Die MCP-Server sollten automatisch verbunden werden

---

## 🎯 VERWENDUNG - BEISPIELE

### Beispiel 1: Dateien verwalten
```
"Lese die Datei apps/web/src/App.tsx und zeige mir den Inhalt"
```

### Beispiel 2: Git-Operationen
```
"Zeige mir den Git-Status und commite alle Änderungen mit der Nachricht 'MCP Integration'"
```

### Beispiel 3: Build & Test
```
"Führe pnpm build aus und starte dann die Tests"
```

### Beispiel 4: Browser-Testing
```
"Öffne die Nebula Web-App auf localhost:5173 und mache einen Screenshot"
```

### Beispiel 5: API-Testing
```
"Teste alle API-Endpoints der Web-App und führe einen Health-Check durch"
```

### Beispiel 6: GUI-Automatisierung (MCP-EYES)
```
"Mache einen Screenshot des gesamten Bildschirms und klicke auf das Nebula-Logo"
```

---

## 🔧 TROUBLESHOOTING

### Problem: MCP-Server startet nicht
**Lösung:**
```bash
# Dependencies neu installieren
cd C:\Users\issab\Desktop\TETETTE\mcp
npm install --force
```

### Problem: MCP-EYES funktioniert nicht
**Lösung:**
```bash
# MCP-EYES neu installieren
npm uninstall -g mcp-eyes
npm install -g mcp-eyes
```

### Problem: Cursor erkennt MCP-Server nicht
**Lösung:**
1. Überprüfen Sie die Konfigurationsdatei
2. Starten Sie Cursor neu
3. Überprüfen Sie die Pfade in der Konfiguration

---

## 🚀 MAXIMALE FUNKTIONALITÄT

Mit dieser Installation haben Sie:

### ✅ Vollständige Codebase-Kontrolle
- Lesen/Schreiben von Dateien
- Verzeichnis-Management
- Projekt-Struktur-Analyse

### ✅ Automatisierte Entwicklung
- Git-Operationen
- Build & Test-Automatisierung
- Code-Generierung

### ✅ Browser-Automatisierung
- Screenshot-Funktionen
- UI-Testing
- Cross-Browser-Support

### ✅ API-Testing
- HTTP-Requests
- Health-Checks
- Service-Monitoring

### ✅ GUI-Automatisierung (MCP-EYES)
- Maus- und Tastatursteuerung
- Multi-Display-Support
- Element-Erkennung

### ✅ Sichere Operationen
- Whitelist-basierte Befehle
- Pfad-Validierung
- Audit-Logs

---

## 🎉 FERTIG!

Ihr AI-Agent hat jetzt **"Augen"** und kann:
- Das gesamte Nebula-Projekt vollständig verwalten
- Automatisch Code schreiben und testen
- Browser-Interaktionen durchführen
- GUI-Elemente erkennen und steuern
- APIs testen und überwachen
- Git-Operationen durchführen
- Builds und Deployments automatisieren

**Willkommen in der Zukunft der KI-gestützten Entwicklung!** 🚀


