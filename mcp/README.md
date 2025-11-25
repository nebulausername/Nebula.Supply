# Nebula MCP Servers

Maximale MCP-Integration für das Nebula Supply Projekt mit allen verfügbaren Tools und Features.

## 🚀 Verfügbare MCP-Server

### 1. **Nebula FileSystem Server** (`nebula-fs.js`)
- **Datei- und Ordnerverwaltung**
- **Lesen/Schreiben von Dateien**
- **Verzeichnis-Listing**
- **Sichere Pfad-Validierung**

### 2. **Nebula Git Server** (`nebula-git.js`)
- **Git-Status und Commits**
- **Branch-Management**
- **Push/Pull-Operationen**
- **Commit-History**

### 3. **Nebula Shell Server** (`nebula-shell.js`)
- **Sichere Terminal-Befehle**
- **pnpm/npm Integration**
- **Build- und Test-Commands**
- **Whitelist-basierte Sicherheit**

### 4. **Nebula HTTP Server** (`nebula-http.js`)
- **API-Testing**
- **Health-Checks**
- **HTTP-Requests**
- **Service-Monitoring**

### 5. **Nebula Playwright Server** (`nebula-playwright.js`)
- **Browser-Automatisierung**
- **Screenshot-Funktionen**
- **UI-Testing**
- **Cross-Browser-Support**

## 📥 Installation

### Schritt 1: Dependencies installieren
```bash
cd mcp
npm install
```

### Schritt 2: MCP-EYES installieren (GUI-Automatisierung)
```bash
# Option 1: NPM Global
npm install -g mcp-eyes

# Option 2: GitHub Repository
git clone https://github.com/datagram1/mcp-eyes.git
cd mcp-eyes
npm install
```

### Schritt 3: Server starten
```bash
# Einzelne Server
npm run start:fs
npm run start:git
npm run start:shell
npm run start:http
npm run start:playwright

# Alle Server gleichzeitig
npm run start:all
```

## ⚙️ Konfiguration

### Cursor/Claude Desktop Konfiguration
Erstellen Sie eine MCP-Konfigurationsdatei:

**Windows:** `%APPDATA%\Cursor\User\globalStorage\cursor.mcp\config.json`
**macOS:** `~/Library/Application Support/Cursor/User/globalStorage/cursor.mcp/config.json`

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

## 🎯 Verwendung

### Beispiel-Commands für den AI-Agent:

1. **Dateien verwalten:**
   - "Lese die Datei `apps/web/src/App.tsx`"
   - "Erstelle eine neue Komponente in `apps/web/src/components/`"

2. **Git-Operationen:**
   - "Zeige den Git-Status"
   - "Commite alle Änderungen mit der Nachricht 'Feature: Neue MCP-Integration'"

3. **Build & Test:**
   - "Führe `pnpm build` aus"
   - "Starte die Tests für die Web-App"

4. **Browser-Testing:**
   - "Öffne die Nebula Web-App und mache einen Screenshot"
   - "Teste die Shop-Funktionalität"

5. **API-Testing:**
   - "Teste die API-Endpoints der Web-App"
   - "Führe einen Health-Check durch"

## 🔒 Sicherheit

- **Whitelist-basierte Befehle** - Nur erlaubte Commands werden ausgeführt
- **Pfad-Validierung** - Zugriff nur auf erlaubte Verzeichnisse
- **Git-Sicherheit** - Sichere Git-Operationen ohne gefährliche Commands
- **Audit-Logs** - Alle Operationen werden protokolliert

## 🚀 Erweiterte Features

### MCP-EYES Integration
- **GUI-Automatisierung** - Maus- und Tastatursteuerung
- **Screenshot-Funktionen** - Multi-Display-Support
- **Element-Erkennung** - Automatische UI-Tests
- **Cross-Platform** - Windows, macOS, Linux

### Automatisierte Workflows
- **Autofix-Loop** - Plan → Patch → Tests → Feedback → Iterate → Commit
- **Continuous Integration** - Automatische Tests und Builds
- **Deployment** - Automatisches Deploy nach erfolgreichen Tests

## 📊 Monitoring

- **Health-Checks** für alle Services
- **Performance-Monitoring**
- **Error-Tracking**
- **Audit-Logs**

## 🎉 Maximale Funktionalität

Mit dieser MCP-Integration haben Sie:
- ✅ **Vollständige Codebase-Kontrolle**
- ✅ **Automatisierte Tests**
- ✅ **Browser-Automatisierung**
- ✅ **Git-Integration**
- ✅ **API-Testing**
- ✅ **GUI-Automatisierung (MCP-EYES)**
- ✅ **Sichere Shell-Operationen**
- ✅ **Cross-Platform-Support**

Ihr AI-Agent hat jetzt "Augen" und kann das gesamte Nebula-Projekt vollständig verwalten und automatisieren!


