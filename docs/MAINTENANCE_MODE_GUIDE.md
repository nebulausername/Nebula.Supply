# Maintenance Mode System - Dokumentation

## Übersicht

Das Maintenance Mode System ermöglicht es, Nebula während Wartungsarbeiten, Updates oder Notfällen in einen speziellen Modus zu versetzen. Benutzer sehen eine professionelle Wartungsseite mit Teaser-Produkten und Status-Updates.

## Features

- **Automatische Umleitung**: Benutzer werden automatisch zur Wartungsseite weitergeleitet
- **Status-Updates**: Live-Updates über den Fortschritt der Wartung
- **Produkt-Teaser**: 4-5 anonymisierte Produktkarten für Shop und Drops
- **Progress Tracking**: Optionaler Fortschrittsbalken mit ETA
- **Welcome Back Modal**: Begrüßungsnachricht nach Re-Launch
- **Responsive Design**: Optimiert für Mobile und Desktop

## API Endpoints

### GET `/api/status/status`

Gibt den aktuellen Wartungsstatus zurück.

**Response:**
```json
{
  "isActive": true,
  "mode": "maintenance" | "update" | "emergency" | "none",
  "title": "Wartungsarbeiten",
  "message": "Wir arbeiten gerade an Verbesserungen...",
  "estimatedEndTime": "2024-01-15T14:30:00Z",
  "progress": 75,
  "updates": [
    {
      "id": "update-1",
      "timestamp": "2024-01-15T14:00:00Z",
      "message": "Datenbank-Migration läuft...",
      "type": "info" | "warning" | "success"
    }
  ]
}
```

### POST `/api/status/status`

Aktualisiert den Wartungsstatus (Admin-only in Production).

**Request Body:**
```json
{
  "isActive": true,
  "mode": "maintenance",
  "title": "Wartungsarbeiten",
  "message": "Wir arbeiten gerade an Verbesserungen...",
  "estimatedEndTime": "2024-01-15T14:30:00Z",
  "progress": 75,
  "updates": [...]
}
```

## Verwendung

### Wartungsmodus aktivieren

```bash
# Via API (curl Beispiel)
curl -X POST http://localhost:3001/api/status/status \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true,
    "mode": "maintenance",
    "title": "Wartungsarbeiten",
    "message": "Wir arbeiten gerade an Verbesserungen. Bitte habe etwas Geduld.",
    "estimatedEndTime": "2024-01-15T14:30:00Z",
    "progress": 0,
    "updates": []
  }'
```

### Status-Updates hinzufügen

```bash
curl -X POST http://localhost:3001/api/status/status \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true,
    "mode": "maintenance",
    "updates": [
      {
        "id": "update-1",
        "timestamp": "2024-01-15T14:00:00Z",
        "message": "Datenbank-Migration läuft...",
        "type": "info"
      },
      {
        "id": "update-2",
        "timestamp": "2024-01-15T14:15:00Z",
        "message": "Server-Updates werden installiert...",
        "type": "warning"
      }
    ]
  }'
```

### Wartungsmodus deaktivieren

```bash
curl -X POST http://localhost:3001/api/status/status \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false,
    "mode": "none"
  }'
```

## Komponenten

### MaintenancePage

Hauptseite für den Wartungsmodus. Zeigt:
- Status-Badge
- Titel und Nachricht
- ETA und Progress (optional)
- Status-Updates
- Produkt-Teaser (Shop & Drops)

### MysteryProductCard

Anonymisierte Produktkarte mit:
- Fragezeichen-Icon
- "Coming Soon" Badge
- Subtile Animationen
- Nebula Design-System

### StatusBadge

Zeigt den aktuellen Modus:
- `maintenance`: Wartung (Ion Mint)
- `update`: Update (Amber)
- `emergency`: Notfall (Red)
- `none`: Online (Green)

### UpdateCard

Zeigt einzelne Status-Updates mit:
- Icon basierend auf Typ
- Zeitstempel
- Nachricht

### ProgressOrbit

Kreisförmiger Fortschrittsbalken mit:
- Gradient-Animation
- Prozentanzeige
- Responsive Größen

### WelcomeBackModal

Modal, das nach Re-Launch angezeigt wird:
- Begrüßungsnachricht
- CTA zum Shop
- Smooth Animationen

## Routing

Die Maintenance-Seite ist außerhalb des `AppLayout` geroutet, sodass keine Navigation angezeigt wird:

```tsx
<Route path="/maintenance" element={<MaintenancePage />} />
```

## Automatische Umleitung

Der `useMaintenanceMode` Hook:
- Prüft alle 30 Sekunden den Status
- Leitet automatisch zur Wartungsseite um, wenn aktiv
- Leitet zurück zur Homepage, wenn deaktiviert
- Zeigt Welcome-Back-Modal nach Re-Launch

## Design-System

Folgt dem Nebula Design Playbook:
- **Farben**: Ion Mint (#0BF7BC), Stellar Pink (#FF5EDB), Galaxy Black (#0A0A0A)
- **Typografie**: Space Grotesk (Headlines), Inter (Body)
- **Animationen**: Framer Motion mit Spring-Physics
- **Responsive**: Mobile-first, Breakpoints bei 480px, 768px, 1024px

## Best Practices

1. **Vor geplanten Wartungen**:
   - Status frühzeitig aktivieren
   - Klare Nachricht mit ETA
   - Regelmäßige Updates posten

2. **Während der Wartung**:
   - Progress-Werte aktualisieren
   - Updates bei wichtigen Meilensteinen
   - ETA bei Bedarf anpassen

3. **Nach der Wartung**:
   - Status deaktivieren
   - Welcome-Back-Modal wird automatisch angezeigt
   - Vollständiger Shop ist wieder verfügbar

## Production Considerations

- **Auth Middleware**: POST-Endpoint sollte in Production mit Admin-Auth geschützt werden
- **Persistenz**: Status sollte in Datenbank gespeichert werden (aktuell in-memory)
- **Monitoring**: Webhook-Integration für Slack/Email-Benachrichtigungen
- **Fallback**: Bei API-Fehlern wird normaler Flow erlaubt (keine Blockade)

## Erweiterungen

Mögliche zukünftige Features:
- Admin-Dashboard-Integration für Status-Management
- WebSocket-Updates für Live-Status
- Mehrsprachigkeit (DE/EN)
- Custom Branding pro Wartungstyp
- Analytics für Wartungszeiten

