# 🚀 Wartungsmodus - Schnellstart

## So aktivierst du den Wartungsmodus:

### Option 1: Über die Admin-Seite (Einfachste Methode)

1. Öffne im Browser: `http://localhost:5173/admin/maintenance` (oder deine Domain)
2. Aktiviere den Toggle "Wartungsmodus"
3. Wähle den Modus (Wartung/Update/Notfall)
4. Fülle Titel und Nachricht aus
5. Optional: Geschätzte Zeit und Fortschritt eintragen
6. Klicke auf "Status speichern"

**Fertig!** Alle Benutzer werden automatisch zur Wartungsseite weitergeleitet.

### Option 2: Über die API (curl)

```bash
# Wartungsmodus AKTIVIEREN
curl -X POST http://localhost:3001/api/status/status \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true,
    "mode": "maintenance",
    "title": "Wartungsarbeiten",
    "message": "Wir arbeiten gerade an Verbesserungen. Bitte habe etwas Geduld.",
    "estimatedEndTime": "2024-01-15T14:30:00Z",
    "progress": 0
  }'

# Wartungsmodus DEAKTIVIEREN
curl -X POST http://localhost:3001/api/status/status \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "mode": "none"
  }'
```

### Option 3: Über JavaScript (Browser Console)

```javascript
// Wartungsmodus aktivieren
fetch('http://localhost:3001/api/status/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isActive: true,
    mode: 'maintenance',
    title: 'Wartungsarbeiten',
    message: 'Wir arbeiten gerade an Verbesserungen...'
  })
});

// Wartungsmodus deaktivieren
fetch('http://localhost:3001/api/status/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    isActive: false,
    mode: 'none'
  })
});
```

## 📍 Wichtige URLs

- **Admin-Interface**: `/admin/maintenance`
- **Wartungsseite (Vorschau)**: `/maintenance`
- **API Endpoint**: `/api/status/status`

## 🎨 Was passiert?

1. **Aktivierung**: Alle Benutzer werden automatisch zur Wartungsseite umgeleitet
2. **Wartungsseite zeigt**:
   - Status-Badge (Wartung/Update/Notfall)
   - Titel und Nachricht
   - Geschätzte Zeit (falls gesetzt)
   - Fortschrittsbalken (falls gesetzt)
   - Status-Updates (falls vorhanden)
   - 4-5 anonymisierte Produkt-Teaser (Shop & Drops)

3. **Deaktivierung**: Benutzer werden zurück zur Homepage geleitet und sehen ein "Willkommen zurück!" Modal

## 💡 Tipps

- **Status-Updates hinzufügen**: In der Admin-Seite kannst du Live-Updates posten
- **Fortschritt aktualisieren**: Während der Wartung den Fortschritt regelmäßig aktualisieren
- **Vorschau**: Klicke auf "Vorschau öffnen" um die Wartungsseite zu sehen

## 🔧 Troubleshooting

- **API nicht erreichbar?** Prüfe ob der API-Server läuft (`http://localhost:3001`)
- **Umleitung funktioniert nicht?** Warte 30 Sekunden (Polling-Intervall) oder lade die Seite neu
- **Status wird nicht gespeichert?** Prüfe die Browser-Konsole auf Fehler

