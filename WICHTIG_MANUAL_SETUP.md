# ⚠️ WICHTIG: Manuelle Setup-Schritte

## 📝 Diese Schritte MUSST du manuell durchführen!

### 1. Environment-Datei erstellen

**Datei**: `apps/admin/.env.local`

**Erstelle diese Datei MANUELL** (konnte nicht automatisch erstellt werden):

```env
# Nebula Admin Dashboard - Local Environment Configuration

# API Server URL
VITE_API_URL=http://localhost:3001

# WebSocket Server URL (usually same as API)
VITE_WS_URL=http://localhost:3001

# Enable debug logging
VITE_DEBUG=true

# Environment
VITE_ENV=development
```

**So geht's:**

#### Windows PowerShell:
```powershell
cd apps\admin
New-Item -Path . -Name ".env.local" -ItemType "file"
# Dann den Inhalt oben in die Datei kopieren
```

#### Windows CMD:
```cmd
cd apps\admin
type nul > .env.local
# Dann den Inhalt oben in die Datei kopieren
```

#### Linux/Mac:
```bash
cd apps/admin
cat > .env.local << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
VITE_DEBUG=true
VITE_ENV=development
EOF
```

---

### 2. Verify Installation

**Stelle sicher, dass alle Dependencies installiert sind:**

```bash
# Im root directory
pnpm install

# ODER in apps/admin
cd apps/admin
npm install
```

---

### 3. Starten (in dieser Reihenfolge!)

#### Schritt 1: API Server starten

```bash
cd apps/api-server
npm run dev
```

✅ **Erwartete Ausgabe:**
```
🚀 Nebula API Server läuft auf Port 3001
📡 WebSocket Server bereit
🔗 Client URL: http://localhost:5173
```

#### Schritt 2: Admin Dashboard starten (in neuem Terminal)

```bash
cd apps/admin
npm run dev
```

✅ **Erwartete Ausgabe:**
```
VITE vX.X.X ready in XXX ms

➜  Local:   http://localhost:5273/
➜  Network: use --host to expose
```

---

### 4. Login & Test

1. **Browser öffnen**: http://localhost:5273

2. **Login-Daten**:
   - Email: `admin@nebula.local`
   - Password: `admin123`

3. **Nach Login solltest du sehen**:
   - ✅ Dashboard mit KPI-Karten
   - ✅ Grüner "🟢 LIVE" Badge (WebSocket verbunden)
   - ✅ Sidebar mit allen Menüpunkten

4. **Teste Bot Management**:
   - Klicke auf "Bot" in der Sidebar
   - Du solltest sehen:
     - Live Bot Stats
     - Verification Queue
     - Invite Code Manager

5. **Teste E-Commerce**:
   - Klicke auf "Drops" in der Sidebar
   - Du solltest sehen:
     - Drop Management Dashboard
     - WebSocket Connection Status

---

## ✅ Erfolgs-Checkliste

Prüfe ob:

- [ ] `.env.local` Datei existiert in `apps/admin/`
- [ ] API Server läuft auf Port 3001
- [ ] Admin Dashboard läuft auf Port 5273
- [ ] Login funktioniert
- [ ] Dashboard zeigt "🟢 LIVE" Status
- [ ] Bot Management View funktioniert
- [ ] Drop Management View funktioniert
- [ ] Keine Fehler in Browser Console

---

## 🐛 Falls etwas nicht funktioniert

### White Screen nach Login?

1. **Browser Console öffnen** (F12)
2. **Suche nach Fehler-Meldungen**
3. **Häufigste Fehler**:

   **Fehler: "Failed to fetch"**
   - ✅ Lösung: API Server ist nicht gestartet
   - Starte: `cd apps/api-server && npm run dev`

   **Fehler: "WebSocket connection failed"**
   - ✅ Lösung: VITE_WS_URL falsch oder API Server läuft nicht
   - Prüfe `.env.local` und API Server

   **Fehler: "useWebSocket is not defined"**
   - ✅ Lösung: Dependencies nicht installiert
   - Führe aus: `cd apps/admin && npm install`

---

## 🔍 Debug-Modus

Aktiviere detaillierte Logs in der Browser Console:

```javascript
// In Browser Console eingeben:
localStorage.setItem('debug', 'nebula:*')
```

Dann Seite neu laden (F5).

---

## 📞 Nächste Schritte

1. ✅ `.env.local` erstellen
2. ✅ Dependencies installieren
3. ✅ API Server starten
4. ✅ Admin Dashboard starten
5. ✅ Login testen
6. ✅ Features testen

**Danach**: Siehe `ADMIN_IMPLEMENTATION_SUMMARY.md` für vollständige Feature-Liste!

---

## 💡 Pro-Tipps

### Für Development:

1. **Hot Reload**: Beide Server (API + Admin) haben Hot Reload
2. **React Query DevTools**: In `App.tsx` einkommentieren
3. **Browser DevTools**: Network-Tab zum Debuggen von API-Calls
4. **WebSocket Inspector**: Browser Extensions für Socket.IO

### Performance:

- Dashboard lädt Daten mit React Query
- WebSocket-Events aktualisieren UI in Echtzeit
- Optimistic Updates für sofortiges Feedback

---

## 🎉 Fertig!

Wenn alles funktioniert:
- ✅ Dashboard läuft
- ✅ WebSocket verbunden (🟢 LIVE)
- ✅ Alle Features funktionieren

**Dann bist du ready to go! 🚀**

Viel Erfolg! 💪

11