# 🚀 Nebula Bot - Production Deployment Guide

Komplette Anleitung für das Deployment des Nebula Telegram Bots in Production.

## 📋 Pre-Deployment Checklist

- [ ] Bot-Token von @BotFather erhalten
- [ ] Admin User-IDs gesammelt
- [ ] JWT Secret generiert (min. 32 Zeichen)
- [ ] Redis Server aufgesetzt
- [ ] Domain/Server vorbereitet
- [ ] SSL-Zertifikat installiert (für Webhooks)
- [ ] Environment Variables konfiguriert

## 🔧 Environment Setup

### 1. Server Requirements

**Minimum:**
- CPU: 1 vCore
- RAM: 512 MB
- Storage: 10 GB
- OS: Linux (Ubuntu 22.04 empfohlen)

**Recommended:**
- CPU: 2 vCores
- RAM: 2 GB
- Storage: 20 GB
- OS: Ubuntu 22.04 LTS

### 2. Install Dependencies

\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install PM2 (Process Manager)
npm install -g pm2
\`\`\`

### 3. Setup Bot Application

\`\`\`bash
# Clone repository
git clone <your-repo-url>
cd NebulaCodex/apps/bot

# Install dependencies
pnpm install

# Build application
pnpm build
\`\`\`

## 🌍 Environment Configuration

### Production .env File

Erstelle `.env.production`:

\`\`\`env
# Bot Configuration
BOT_TOKEN=7871687283:AAGm-fkvG2lRvv2AaJTqABKYu4NXFgaOXVc
BOT_NAME=NebulaOrderBot
LOG_LEVEL=info

# Admin Configuration
ADMIN_IDS=123456789,987654321

# Production Mode
NODE_ENV=production
USE_WEBHOOKS=true
WEBHOOK_DOMAIN=https://bot.nebula-supply.com
WEBHOOK_PATH=/webhook

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=nebula:bot:

# Security
JWT_SECRET=your_secure_random_32_character_secret_key_here
SESSION_TTL=86400

# Rate Limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=30

# Analytics (optional)
ANALYTICS_ENABLED=true
MIXPANEL_TOKEN=your_mixpanel_token
SENTRY_DSN=https://your-sentry-dsn

# WebApp
WEB_APP_URL=https://app.nebula-supply.com

# API Endpoints
API_BASE_URL=https://api.nebula-supply.com
IDENTITY_BASE_URL=https://identity.nebula-supply.com
PAYMENTS_BASE_URL=https://payments.nebula-supply.com
TICKETS_BASE_URL=https://tickets.nebula-supply.com

# Feature Flags
ENABLE_VERIFICATION=true
ENABLE_INVITE_SYSTEM=true
ENABLE_SUPPORT_TICKETS=true
ENABLE_ADMIN_DASHBOARD=true
\`\`\`

### Generate Strong JWT Secret

\`\`\`bash
# Generate 64-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

## 🐳 Docker Deployment

### Dockerfile

\`\`\`dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port (for webhooks)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run bot
CMD ["node", "dist/index.js"]
\`\`\`

### docker-compose.yml

\`\`\`yaml
version: '3.8'

services:
  bot:
    build: .
    container_name: nebula-bot
    restart: unless-stopped
    env_file:
      - .env.production
    ports:
      - "3000:3000"
    depends_on:
      - redis
    networks:
      - nebula-network
    volumes:
      - ./logs:/app/logs

  redis:
    image: redis:7-alpine
    container_name: nebula-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - nebula-network
    command: redis-server --appendonly yes --requirepass your_redis_password

volumes:
  redis-data:

networks:
  nebula-network:
    driver: bridge
\`\`\`

### Deploy with Docker

\`\`\`bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
\`\`\`

## 🔄 PM2 Deployment (Alternative)

### PM2 Ecosystem File

Erstelle `ecosystem.config.js`:

\`\`\`javascript
module.exports = {
  apps: [{
    name: 'nebula-bot',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    merge_logs: true
  }]
};
\`\`\`

### Deploy with PM2

\`\`\`bash
# Start bot
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs nebula-bot

# Restart
pm2 restart nebula-bot

# Stop
pm2 stop nebula-bot

# Delete
pm2 delete nebula-bot

# Save PM2 config for auto-restart on reboot
pm2 save
pm2 startup
\`\`\`

## 🌐 Nginx Reverse Proxy (for Webhooks)

### Nginx Configuration

\`\`\`nginx
server {
    listen 80;
    server_name bot.nebula-supply.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bot.nebula-supply.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/bot.nebula-supply.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bot.nebula-supply.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Webhook endpoint
    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
\`\`\`

### SSL Certificate (Let's Encrypt)

\`\`\`bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d bot.nebula-supply.com

# Auto-renewal is enabled by default
sudo certbot renew --dry-run
\`\`\`

## 🔐 Security Best Practices

### 1. Firewall Setup

\`\`\`bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
\`\`\`

### 2. Redis Security

\`\`\`bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Add password
requirepass your_strong_redis_password

# Bind to localhost only (if bot and redis on same server)
bind 127.0.0.1

# Restart Redis
sudo systemctl restart redis-server
\`\`\`

### 3. Environment Variables Security

\`\`\`bash
# Secure .env file
chmod 600 .env.production

# Never commit .env to git
echo ".env*" >> .gitignore
\`\`\`

## 📊 Monitoring & Logging

### 1. PM2 Monitoring

\`\`\`bash
# Install PM2 Plus (optional)
pm2 plus

# Real-time monitoring
pm2 monit
\`\`\`

### 2. Log Rotation

\`\`\`bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
\`\`\`

### 3. Health Monitoring Script

Erstelle `health-check.sh`:

\`\`\`bash
#!/bin/bash

WEBHOOK_URL="https://bot.nebula-supply.com/health"
ADMIN_EMAIL="admin@nebula-supply.com"

response=$(curl -s -o /dev/null -w "%{http_code}" $WEBHOOK_URL)

if [ $response -ne 200 ]; then
    echo "Bot health check failed: HTTP $response" | mail -s "Nebula Bot Alert" $ADMIN_EMAIL
    pm2 restart nebula-bot
fi
\`\`\`

### 4. Cron Job for Health Checks

\`\`\`bash
# Edit crontab
crontab -e

# Add health check every 5 minutes
*/5 * * * * /path/to/health-check.sh
\`\`\`

## 🔄 Updates & Maintenance

### Update Bot

\`\`\`bash
# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Build
pnpm build

# Restart (PM2)
pm2 restart nebula-bot

# Or restart (Docker)
docker-compose up -d --build
\`\`\`

### Database Backup (Redis)

\`\`\`bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
redis-cli SAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# Keep only last 7 days
find $BACKUP_DIR -name "dump_*.rdb" -mtime +7 -delete
\`\`\`

## 🚨 Troubleshooting

### Bot nicht erreichbar

\`\`\`bash
# Check bot process
pm2 status
# or
docker ps

# Check logs
pm2 logs nebula-bot
# or
docker logs nebula-bot

# Check port
netstat -tulpn | grep 3000
\`\`\`

### Webhook-Probleme

\`\`\`bash
# Test webhook manually
curl -X POST https://bot.nebula-supply.com/webhook

# Check Telegram webhook info
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Delete webhook and restart
curl https://api.telegram.org/bot<TOKEN>/deleteWebhook
pm2 restart nebula-bot
\`\`\`

### Redis-Verbindungsprobleme

\`\`\`bash
# Test Redis connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log

# Restart Redis
sudo systemctl restart redis-server
\`\`\`

## 📞 Support

Bei Problemen:
1. Logs prüfen
2. Health-Check ausführen
3. README.md Troubleshooting-Sektion
4. GitHub Issues erstellen

---

**Deployment Status**: ✅ Ready  
**Estimated Setup Time**: 30-60 minutes  
**Difficulty**: Intermediate



