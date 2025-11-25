# 🚀 Admin Dashboard - Quick Start Guide

## ⚡ Super Schnellstart (1 Befehl!)

### Windows:
```cmd
.\start-admin.bat
```

### Linux/Mac:
```bash
chmod +x start-admin.sh
./start-admin.sh
```

Das war's! Das Script:
- ✅ Erstellt automatisch `.env.local`
- ✅ Startet API Server (Port 3001)
- ✅ Startet Admin Dashboard (Port 5273)
- ✅ Zeigt alle wichtigen Infos

---

## 🎯 Manuelle Methode

### 1. Environment Setup (einmalig)

#### Automatisch:
```bash
# Windows
.\setup-admin-env.ps1

# Linux/Mac
bash setup-admin-env.sh
```

#### Manuell:
Erstelle `apps/admin/.env.local`:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_DEBUG=true
VITE_ENV=development
```

### 2. Server starten

**Option A: Beide Server zusammen** (Empfohlen!)
```bash
pnpm dev:admin:full
```

**Option B: Einzeln**
```bash
# Terminal 1: API Server
pnpm dev:api

# Terminal 2: Admin Dashboard
pnpm dev:admin
```

**Option C: Alles** (API + Web + Admin + Bot)
```bash
pnpm dev:full
```

---

## 🌐 URLs & Login

Nach dem Start erreichbar unter:

- **Admin Dashboard**: http://localhost:5273
- **API Server**: http://localhost:3001
- **Web App**: http://localhost:5173

**Login-Daten:**
```
Email:    admin@nebula.local
Password: admin123
```

---

## ✅ Erfolgs-Check

Nach Login solltest du sehen:
- ✅ Dashboard mit KPI-Karten
- ✅ Grünes "🟢 LIVE" Badge (WebSocket verbunden)
- ✅ Sidebar mit allen Menüpunkten

### Features testen:

1. **Bot Management** (Sidebar → "Bot"):
   - Live Bot Stats
   - Verification Queue
   - Invite Code Manager

2. **E-Commerce** (Sidebar → "Drops"):
   - Drop Management
   - Real-time Stock Updates
   - Analytics

3. **Overview** (Standard):
   - KPI Dashboard
   - Ticket Management
   - Activity Feed

---

## 🛠️ Verfügbare Scripts

### Admin-spezifisch:
```bash
pnpm dev:admin:full    # API + Admin zusammen (EMPFOHLEN!)
pnpm dev:admin         # Nur Admin Dashboard
pnpm dev:api           # Nur API Server
```

### Alle Services:
```bash
pnpm dev:full          # API + Web + Admin + Bot
pnpm dev               # Web + Admin + Bot (ohne API)
pnpm dev:web           # Nur Web App
pnpm dev:bot           # Nur Telegram Bot
```

---

## 🐛 Troubleshooting

### Problem: "Failed to fetch"
**Lösung:** API Server läuft nicht
```bash
pnpm dev:api
```

### Problem: White Screen
**Lösung:** 
1. Browser Console öffnen (F12)
2. Prüfe `.env.local` existiert
3. Beide Server laufen?

### Problem: "useWebSocket is not defined"
**Lösung:** Dependencies installieren
```bash
cd apps/admin
npm install
```

---

## 📊 Development-Tipps

### Hot Reload
Beide Server haben Hot Reload - Änderungen werden automatisch geladen!

### Debug-Modus
```javascript
// In Browser Console:
localStorage.setItem('debug', 'nebula:*')
```

### WebSocket-Status prüfen
Schau nach dem 🟢 LIVE Badge in den Komponenten!

### React Query DevTools
In `apps/admin/src/App.tsx` einkommentieren für Debugging.

---

## 🎉 Fertig!

Wenn alles läuft:
- ✅ Dashboard ist erreichbar
- ✅ Login funktioniert
- ✅ WebSocket zeigt "🟢 LIVE"
- ✅ Alle Features funktionieren

**Du bist ready! 🚀**

Für mehr Details siehe:
- `ADMIN_IMPLEMENTATION_SUMMARY.md` - Vollständige Feature-Liste
- `apps/admin/ADMIN_DASHBOARD_SETUP.md` - Detaillierte Dokumentation

