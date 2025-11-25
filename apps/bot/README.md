# 🤖 Nebula Telegram Bot

Ein hochmoderner, production-ready Telegram Bot für das Nebula Supply System mit erweiterten Features wie Selfie-Verifizierung, Invite-System, Support-Tickets und Admin-Dashboard.

## ✨ Features

### 🎯 Core Features
- **🤳 Selfie-Verifizierung**: Handzeichen-basiertes Verifizierungssystem
- **🔑 Invite-System**: Flexible Invite-Codes mit Ablaufdatum
- **🎫 Support-Tickets**: Vollständiges Ticket-System mit Kategorien
- **⚙️ Admin Dashboard**: Umfassendes Admin-Panel mit Statistiken

### 🚀 Performance & Security
- **Rate Limiting**: Schutz vor Spam und Missbrauch
- **Session Management**: Redis-basierte Session-Speicherung
- **Error Recovery**: Automatische Retry-Logik mit Exponential Backoff
- **Health Checks**: Kontinuierliche System-Überwachung

### 📊 Analytics & Monitoring
- **User Analytics**: Tracking von User-Interaktionen
- **Command Stats**: Übersicht über häufigste Commands
- **Performance Metrics**: Memory, CPU und Connection-Monitoring
- **Error Tracking**: Detailliertes Error-Logging

### 🔐 WebApp Integration
- **JWT Authentication**: Sichere Token-basierte Authentifizierung
- **WebView Support**: Nahtlose Integration mit Telegram Mini Apps
- **User Context**: Automatische User-Status-Synchronisation

## 🛠️ Setup

### 1. Installation

\`\`\`bash
cd apps/bot
pnpm install
\`\`\`

### 2. Konfiguration

Erstelle eine `.env` Datei basierend auf `.env.example`:

\`\`\`bash
cp .env.example .env
\`\`\`

**Wichtige Umgebungsvariablen:**

\`\`\`env
# Required
BOT_TOKEN=your_bot_token_from_botfather

# Optional aber empfohlen
ADMIN_IDS=123456789,987654321
JWT_SECRET=your_secure_random_32_char_string
REDIS_URL=redis://localhost:6379

# WebApp
WEB_APP_URL=http://localhost:5173

# Production
NODE_ENV=production
USE_WEBHOOKS=true
WEBHOOK_DOMAIN=https://your-domain.com
\`\`\`

### 3. Bot-Token erhalten

1. Öffne [@BotFather](https://t.me/botfather) auf Telegram
2. Sende `/newbot` und folge den Anweisungen
3. Kopiere den Bot-Token in deine `.env` Datei
4. Optional: Sende `/setdescription` und `/setabouttext` für Bot-Info

### 4. Admin-ID finden

1. Öffne [@userinfobot](https://t.me/userinfobot) auf Telegram
2. Sende `/start`
3. Kopiere deine User-ID in `ADMIN_IDS`

### 5. Redis starten (optional)

Für Production empfohlen:

\`\`\`bash
# Docker
docker run -d -p 6379:6379 redis:alpine

# Oder lokal installieren
# Windows: https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
# Linux: sudo apt-get install redis-server
\`\`\`

## 🚀 Development

### Start Bot in Development Mode

\`\`\`bash
pnpm dev
\`\`\`

Der Bot läuft jetzt im Long-Polling-Modus und akzeptiert Updates von Telegram.

### Build für Production

\`\`\`bash
pnpm build
pnpm start
\`\`\`

### Type Checking

\`\`\`bash
pnpm typecheck
\`\`\`

### Linting

\`\`\`bash
pnpm lint
\`\`\`

## 📖 Bot Commands

### User Commands
- `/start` - Bot starten und Hauptmenü öffnen
- `/menu` - Hauptmenü anzeigen
- `/support` - Support-Ticket erstellen
- `/help` - Hilfe anzeigen

### Admin Commands
- `/admin` - Admin Dashboard öffnen
- `/createinvite <code> [uses] [hours]` - Invite-Code erstellen
- `/health` - Health-Status abrufen

## 🏗️ Architektur

### Flows
- **SimplifiedMenu**: Hauptmenü und Navigation
- **VerificationSystem**: Selfie-Verifizierung mit Handzeichen
- **InviteSystem**: Invite-Code-Management
- **AdminDashboard**: Admin-Panel mit Statistiken
- **SupportTickets**: Ticket-System mit Kategorien

### Middlewares
- **Config**: Dependency Injection der App-Config
- **Session**: Redis/Memory-basierte Session-Verwaltung
- **RateLimit**: Spam-Schutz mit Rate Limiting

### Utils
- **Analytics**: User-Tracking und Metriken
- **ErrorHandler**: Fehlerbehandlung mit Retry-Logik
- **HealthCheck**: System-Überwachung
- **WebViewAuth**: JWT-basierte WebApp-Authentifizierung

## 🔧 Production Deployment

### Environment Variables

Setze folgende Variablen für Production:

\`\`\`env
NODE_ENV=production
USE_WEBHOOKS=true
WEBHOOK_DOMAIN=https://your-domain.com
WEBHOOK_PATH=/webhook
REDIS_URL=redis://your-redis-url
JWT_SECRET=your-secure-secret-32-chars-minimum
\`\`\`

### Webhook Setup

1. Deploy Bot auf Server mit öffentlicher URL
2. Setze `USE_WEBHOOKS=true`
3. Telegram wird Updates an `https://your-domain.com/webhook` senden
4. Vorteil: Schneller, skalierbarer als Long Polling

### Docker Deployment

\`\`\`dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]
\`\`\`

### Health Checks

Der Bot bietet einen Health-Check-Endpoint:
- Command: `/health` (nur für Admins)
- Prüft: Bot-Connection, Redis, Memory-Usage

## 📊 Monitoring

### Metrics

Der Bot tracked folgende Metriken:
- Total Users
- Active Users (last 24h)
- Commands Used
- Average Response Time
- Error Rate

### Logs

Logs werden im JSON-Format ausgegeben:

\`\`\`json
{
  "timestamp": "2025-09-30T12:00:00.000Z",
  "level": "info",
  "message": "Bot started",
  "meta": {
    "botId": 123456789,
    "env": "production"
  }
}
\`\`\`

Log-Level können über `LOG_LEVEL` Environment-Variable gesteuert werden:
- `debug`: Alle Logs
- `info`: Standard (empfohlen)
- `warn`: Nur Warnungen und Fehler
- `error`: Nur Fehler

## 🔒 Security

### Best Practices
- ✅ Bot-Token in `.env` speichern, nie committen
- ✅ Admin-IDs validieren
- ✅ Rate Limiting aktivieren
- ✅ JWT-Secret verwenden (min. 32 Zeichen)
- ✅ HTTPS für Webhooks
- ✅ Redis-Connection verschlüsseln (Production)

### Rate Limiting

Standard: 30 Requests pro Minute pro User

Anpassen in `.env`:
\`\`\`env
RATE_LIMIT_WINDOW=60  # Sekunden
RATE_LIMIT_MAX=30     # Max Requests
\`\`\`

## 🐛 Troubleshooting

### Bot antwortet nicht
1. Prüfe Bot-Token in `.env`
2. Prüfe Logs: `pnpm dev`
3. Prüfe Firewall/Netzwerk
4. Teste mit `/start`

### Redis-Fehler
1. Prüfe ob Redis läuft: `redis-cli ping`
2. Prüfe `REDIS_URL` in `.env`
3. Fallback auf Memory-Store ist automatisch

### Verification-Fehler
1. Prüfe `ADMIN_IDS` in `.env`
2. Prüfe Foto-Upload (max 20MB)
3. Logs prüfen für Details

### WebApp funktioniert nicht
1. Prüfe `WEB_APP_URL` in `.env`
2. Prüfe `JWT_SECRET` (min. 32 Zeichen)
3. WebApp muss unter HTTPS laufen (Production)

## 📝 Development Guide

### Neuen Flow hinzufügen

1. Erstelle `src/flows/myNewFlow.ts`:
\`\`\`typescript
import { Telegraf } from "telegraf";
import type { NebulaContext } from "../types";

export const registerMyNewFlow = (bot: Telegraf<NebulaContext>) => {
  bot.command("mycommand", async (ctx) => {
    await ctx.reply("Hello from my flow!");
  });
};
\`\`\`

2. Registriere in `src/index.ts`:
\`\`\`typescript
import { registerMyNewFlow } from "./flows/myNewFlow";

// ...
registerMyNewFlow(bot);
\`\`\`

### Session-State erweitern

1. Aktualisiere `src/types.ts`:
\`\`\`typescript
export interface SessionState {
  // ... existing fields
  myNewField?: string;
}
\`\`\`

2. Verwende in Flows:
\`\`\`typescript
ctx.session.myNewField = "value";
\`\`\`

## 🤝 Contributing

Contributions sind willkommen! Bitte beachte:

1. TypeScript strict mode
2. Linting mit ESLint
3. Type-safe Code
4. Error Handling
5. Logging

## 📄 License

MIT License - siehe LICENSE.md

## 🔗 Links

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegraf Documentation](https://telegraf.js.org/)
- [Nebula Supply Docs](../../docs/)

---

**Made with ❤️ for Nebula Supply**



