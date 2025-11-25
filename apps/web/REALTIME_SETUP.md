# Echtzeit-Features Aktivierung

## Übersicht

Die Profil-Seite unterstützt optionale Echtzeit-Features über WebSocket. Diese sind standardmäßig **deaktiviert** und funktionieren graceful als Fallback ohne WebSocket-Server.

## Schnellstart

### 1. WebSocket-Server starten

```bash
cd apps/api-server
npm run dev
```

Der WebSocket-Server läuft auf `ws://localhost:3001`

### 2. Echtzeit-Features aktivieren

Öffne `apps/web/src/config/realtime.ts` und setze:

```typescript
export const REALTIME_CONFIG = {
  ENABLE_REALTIME: true,  // ✅ Auf true setzen
  WEBSOCKET_URL: 'ws://localhost:3001',
  // ...
};
```

### 3. Web-App neu laden

Die Profil-Seite verbindet sich jetzt automatisch mit dem WebSocket-Server.

## Features

Mit aktiviertem Realtime-Modus erhältst du:

- ✅ **Live Coin-Updates** - Animierte Übergänge bei Coin-Änderungen
- ✅ **Live Invite-Zähler** - Echtzeit-Updates bei neuen Invites
- ✅ **Activity Feed** - Live-Stream von Benutzer-Aktivitäten
- ✅ **Achievement Notifications** - Sofortige Benachrichtigungen
- ✅ **Connection Status** - Grüner Indikator bei aktiver Verbindung

## Ohne WebSocket

Die App funktioniert vollständig ohne WebSocket:

- ❌ Keine Verbindungsfehler
- ✅ Normale Datenaktualisierung beim Laden
- ✅ Alle Features verfügbar (nur nicht in Echtzeit)
- ✅ Perfekt für Entwicklung und Testing

## Konfiguration

In `apps/web/src/config/realtime.ts`:

```typescript
export const REALTIME_CONFIG = {
  // Aktiviere Echtzeit (benötigt WebSocket-Server)
  ENABLE_REALTIME: false,
  
  // WebSocket Server URL
  WEBSOCKET_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  
  // Auto-Refresh Intervall (Fallback ohne WebSocket)
  AUTO_REFRESH_INTERVAL: 30000, // 30 Sekunden
  
  // Aktiviere Auto-Refresh
  ENABLE_AUTO_REFRESH: false,
  
  // Debug-Modus
  DEBUG: import.meta.env.DEV,
};
```

## Umgebungsvariablen

Alternativ über `.env`:

```bash
VITE_WS_URL=ws://localhost:3001
```

## Troubleshooting

### Verbindungsfehler angezeigt

**Lösung:** Setze `ENABLE_REALTIME: false` in `realtime.ts`

### WebSocket verbindet nicht

1. Prüfe ob api-server läuft: `curl http://localhost:3001`
2. Prüfe WebSocket-URL in Config
3. Prüfe Browser-Console für Fehler

### Performance-Probleme

Deaktiviere Auto-Refresh:
```typescript
ENABLE_AUTO_REFRESH: false
```

## API Events

Der WebSocket-Server sollte folgende Events senden:

```typescript
// Coin-Update
{
  type: 'profile:coins_updated',
  data: { amount: 1500, delta: 100 }
}

// Invite-Update
{
  type: 'profile:invite_activated',
  data: { count: 5, newInvite: true, inviteName: 'User123' }
}

// Achievement
{
  type: 'profile:achievement_unlocked',
  data: { achievementId: '123', name: 'First Win' }
}

// Stats
{
  type: 'profile:stats_update',
  data: { totalDrops: 10, wonDrops: 3, rank: 47, streak: 5 }
}
```

## Entwicklung

Für die Entwicklung ohne WebSocket-Server einfach alles so lassen wie es ist. Die App funktioniert perfekt ohne Echtzeit-Features.

## Production

Für Production:

1. WebSocket-Server deployen
2. `VITE_WS_URL` auf Production-URL setzen
3. `ENABLE_REALTIME: true` in Config
4. Deploy und teste Verbindung

---

**Status:** ✅ Vollständig implementiert mit graceful degradation




