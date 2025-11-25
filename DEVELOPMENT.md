# 🚀 Nebula Development Guide

Komplette Anleitung für die Entwicklung des Nebula Supply Systems.

## 📁 Projektstruktur

```
NebulaCodex/
├── apps/
│   ├── web/          # React Web App (Port 5173)
│   ├── admin/        # Admin Dashboard (Port 5273)
│   └── bot/          # Telegram Bot
├── packages/
│   └── shared/       # Shared Components & Types
├── configs/          # Shared Configurations
├── docs/            # Documentation
└── tools/           # Development Tools
```

## 🛠️ Setup

### 1. Installation

```bash
# Im Root-Verzeichnis
pnpm install
```

### 2. Bot Setup

```bash
# Bot-Token konfigurieren
cd apps/bot
cp .env.example .env
# Bearbeite .env und füge deinen BOT_TOKEN hinzu
```

### 3. Development starten

```bash
# Alle Services gleichzeitig
pnpm dev:all

# Oder einzeln:
pnpm dev:web      # Web App (Port 5173)
pnpm dev:admin    # Admin Dashboard (Port 5273)
pnpm dev:bot      # Telegram Bot
```

## 🎯 Development Commands

### Web App
```bash
pnpm dev:web          # Start Web App
pnpm --filter @nebula/web build    # Build Web App
pnpm --filter @nebula/web test     # Test Web App
```

### Admin Dashboard
```bash
pnpm dev:admin        # Start Admin Dashboard
pnpm --filter @nebula/admin build  # Build Admin
```

### Telegram Bot
```bash
pnpm dev:bot          # Start Bot (Development)
pnpm start:bot        # Start Bot (Production)
pnpm build:bot        # Build Bot
pnpm health           # Bot Health Check
```

### Testing
```bash
pnpm test             # Alle Tests
pnpm test:e2e         # End-to-End Tests
pnpm test:ci          # CI Tests (Lint + TypeCheck + Test)
```

### Utilities
```bash
pnpm lint             # Lint alle Apps
pnpm typecheck        # TypeScript Check
pnpm clean            # Clean Build Files
pnpm setup            # Setup & Build Bot
```

## 🔧 Bot Development

### Bot Commands
- `/start` - Bot starten
- `/menu` - Hauptmenü
- `/admin` - Admin Dashboard (nur für Admins)
- `/health` - Health Check (nur für Admins)
- `/support` - Support-Ticket erstellen

### Bot Features
- 🤳 **Selfie-Verifizierung**: Handzeichen-basiert
- 🔑 **Invite-System**: Flexible Codes
- 🎫 **Support-Tickets**: Vollständiges System
- ⚙️ **Admin-Dashboard**: Statistiken & Management

### Bot Configuration

```env
# Required
BOT_TOKEN=your_bot_token_here
BOT_NAME=NebulaOrderBot

# Optional
ADMIN_IDS=123456789,987654321
WEB_APP_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secure_secret_32_chars_minimum
```

## 🌐 Web App Development

### Features
- 🏠 **Home**: Landing Page mit Drops
- 🛍️ **Shop**: Produktkatalog
- 🎯 **Drops**: Exklusive Drops
- 👑 **VIP**: Premium Features
- 👤 **Profile**: User Management
- 🛒 **Cart**: Shopping Cart
- 💳 **Checkout**: Payment Flow
- 📦 **Orders**: Order Tracking
- 🎮 **Cookie Clicker**: Mini Game
- 🆘 **Support**: Support System

### Tech Stack
- **React 18** mit TypeScript
- **Vite** für Build
- **Tailwind CSS** für Styling
- **Zustand** für State Management
- **React Router** für Navigation

## 📊 Admin Dashboard

### Features
- 📈 **KPIs**: Key Performance Indicators
- 👥 **User Management**: User-Übersicht
- 🎫 **Ticket Management**: Support-Tickets
- 📊 **Analytics**: Detaillierte Statistiken
- ⚙️ **Settings**: System-Konfiguration

## 🔄 Development Workflow

### 1. Feature Development
```bash
# 1. Branch erstellen
git checkout -b feature/my-feature

# 2. Development starten
pnpm dev:all

# 3. Änderungen machen
# - Web App: apps/web/src/
# - Bot: apps/bot/src/
# - Shared: packages/shared/src/

# 4. Tests ausführen
pnpm test

# 5. Build testen
pnpm build
```

### 2. Bot Development
```bash
# Bot im Development-Modus
pnpm dev:bot

# Bot-Logs anzeigen
# Logs erscheinen in der Konsole

# Bot testen
# 1. Öffne Telegram
# 2. Suche nach deinem Bot
# 3. Sende /start
# 4. Teste Features
```

### 3. Web App Development
```bash
# Web App starten
pnpm dev:web

# Öffne http://localhost:5173
# Hot Reload ist aktiv
```

## 🐛 Debugging

### Bot Debugging
```bash
# Bot-Logs anzeigen
pnpm dev:bot

# Health Check
pnpm health

# Bot-Status prüfen
# Sende /health an den Bot (als Admin)
```

### Web App Debugging
```bash
# Browser DevTools öffnen
# Console für Logs
# Network Tab für API-Calls
```

### Common Issues

#### Bot antwortet nicht
1. Prüfe BOT_TOKEN in `.env`
2. Prüfe Logs: `pnpm dev:bot`
3. Prüfe Internet-Verbindung

#### Web App lädt nicht
1. Prüfe Port 5173
2. Prüfe Dependencies: `pnpm install`
3. Prüfe Browser Console

#### Build-Fehler
1. TypeScript-Fehler: `pnpm typecheck`
2. Lint-Fehler: `pnpm lint`
3. Dependencies: `pnpm install`

## 📦 Production Build

### Bot Production
```bash
# Bot bauen
pnpm build:bot

# Bot starten (Production)
pnpm start:bot
```

### Web App Production
```bash
# Web App bauen
pnpm --filter @nebula/web build

# Preview
pnpm --filter @nebula/web preview
```

## 🚀 Deployment

### Bot Deployment
```bash
# Docker
docker-compose up -d

# PM2
pm2 start ecosystem.config.js
```

### Web App Deployment
```bash
# Build
pnpm --filter @nebula/web build

# Deploy dist/ Ordner
```

## 📚 Documentation

- **README.md**: Setup & Usage
- **CHANGELOG.md**: Änderungen
- **DEPLOYMENT.md**: Production Guide
- **DEVELOPMENT.md**: Diese Datei

## 🔗 Links

- **Web App**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5273
- **Bot**: Suche in Telegram nach deinem Bot

## 🆘 Support

Bei Problemen:
1. Logs prüfen
2. README.md lesen
3. GitHub Issues erstellen
4. Discord/Telegram Support

---

**Happy Coding! 🚀**



