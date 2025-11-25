# 🤖 NEBULA Bot Setup Guide

## 🚨 Bot Token Error beheben

Der 401 Unauthorized Error bedeutet, dass der Bot Token nicht korrekt konfiguriert ist.

### **Schritt 1: Bot Token erstellen**

1. **Gehe zu** [@BotFather](https://t.me/BotFather) auf Telegram
2. **Sende** `/newbot`
3. **Gib einen Namen ein**: `Nebula Support Bot`
4. **Gib einen Username ein**: `nebula_support_bot` (muss mit _bot enden)
5. **Kopiere den Token** (Format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### **Schritt 2: Environment konfigurieren**

Erstelle eine `.env` Datei im `apps/bot/` Verzeichnis:

```bash
# NEBULA Bot Configuration
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
BOT_NAME=NebulaSupportBot
LOG_LEVEL=info

# Admin Configuration (Optional)
ADMIN_IDS=123456789,987654321

# API Endpoints (Optional)
TICKETS_BASE_URL=http://localhost:5173
WEB_APP_URL=http://localhost:5173

# Environment
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=30

# Feature Flags
ENABLE_VERIFICATION=true
ENABLE_INVITE_SYSTEM=true
ENABLE_SUPPORT_TICKETS=true
ENABLE_ADMIN_DASHBOARD=true
```

### **Schritt 3: Bot starten**

```bash
cd apps/bot
pnpm dev
```

### **Schritt 4: Bot testen**

Sende `/start` an deinen Bot auf Telegram.

---

## 🔧 Weitere Optimierungen

### **1. Bot Commands konfigurieren**

Gehe zu [@BotFather](https://t.me/BotFather) und sende:

```
/setcommands
```

Wähle deinen Bot und sende:

```
start - Bot starten
support - Support-Menü öffnen
help - Hilfe anzeigen
health - Bot-Status prüfen
```

### **2. Bot Beschreibung setzen**

```
/setdescription
```

```
🎫 NEBULA Support Bot

Anonymer Support für alle deine Fragen:
• Ticket erstellen und verwalten
• Echtzeit-Chat mit Support-Team
• FAQ und schnelle Hilfe
• 100% anonym und sicher

Verwende /support um zu beginnen!
```

### **3. Bot About Text setzen**

```
/setabouttext
```

```
NEBULA Support System
Anonymer Support mit Telegram Integration
```

---

## 🚀 Production Setup

### **Environment Variables für Production**

```bash
# Production Configuration
NODE_ENV=production
USE_WEBHOOKS=true
WEBHOOK_DOMAIN=https://yourdomain.com
WEBHOOK_PATH=/webhook

# Security
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# Redis (für Production)
REDIS_URL=redis://your-redis-server:6379

# Analytics
ANALYTICS_ENABLED=true
MIXPANEL_TOKEN=your_mixpanel_token
SENTRY_DSN=your_sentry_dsn
```

### **Webhook Setup (Production)**

```bash
# Webhook setzen
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/webhook"}'
```

---

## 🐛 Troubleshooting

### **Problem: 401 Unauthorized**
- **Lösung**: Bot Token prüfen und korrekt in `.env` setzen
- **Test**: `curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe`

### **Problem: Bot antwortet nicht**
- **Lösung**: Bot Token und Commands prüfen
- **Test**: `/start` Command senden

### **Problem: Rate Limit Errors**
- **Lösung**: Rate Limit in `.env` anpassen
- **Standard**: 30 Requests pro Minute

### **Problem: Memory Issues**
- **Lösung**: Redis für Session Storage verwenden
- **Config**: `REDIS_URL=redis://localhost:6379`

---

## 📊 Monitoring & Analytics

### **Health Check**

```
/health
```

Zeigt:
- Bot Status
- Uptime
- Memory Usage
- Feature Status

### **Analytics (Optional)**

```bash
# Mixpanel Integration
MIXPANEL_TOKEN=your_mixpanel_token
ANALYTICS_ENABLED=true
```

### **Error Tracking (Optional)**

```bash
# Sentry Integration
SENTRY_DSN=your_sentry_dsn
```

---

## 🎯 Best Practices

### **Security**
- Bot Token nie in Code committen
- JWT Secret mindestens 32 Zeichen
- Rate Limiting aktiviert
- Admin IDs korrekt konfiguriert

### **Performance**
- Redis für Session Storage
- Webhooks für Production
- Memory Monitoring aktiviert
- Error Handling implementiert

### **Development**
- Separate .env für Dev/Prod
- Feature Flags für Gradual Rollouts
- Comprehensive Logging
- Health Checks implementiert

---

## 🚀 Deployment

### **Docker (Optional)**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

### **PM2 (Production)**

```bash
npm install -g pm2
pm2 start apps/bot/src/index.ts --name "nebula-bot"
pm2 save
pm2 startup
```

---

**Das Bot-System ist jetzt vollständig konfiguriert und einsatzbereit!** 🎉

