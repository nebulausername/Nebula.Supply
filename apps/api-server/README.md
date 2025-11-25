# Nebula API Server

Hochmoderner Real-time API Server für das Nebula Admin Dashboard.

## Features

- 🚀 **Real-time WebSocket** für Live-Updates
- 🔐 **JWT-basierte Authentifizierung** mit Refresh-Tokens
- 📊 **Caching Layer** mit Redis für optimale Performance
- 🛡️ **Rate Limiting** und Security-Middleware
- 📈 **Strukturierte Logging** mit Winston
- ❤️ **Health Checks** für Monitoring
- 🎯 **TypeScript** für Typsicherheit

## Architektur

```
┌─────────────────┐    HTTP/REST    ┌──────────────────┐
│   Admin Client  │◄──────────────► │   API Server     │
│                 │                 │                  │
│ - React Query   │    WebSocket    │ - Express        │
│ - Real-time UI  │◄──────────────► │ - Socket.IO      │
└─────────────────┘                 │ - JWT Auth       │
                                    │ - Redis Cache    │
┌─────────────────┐                 │ - Rate Limiting  │
│   Bot System    │◄──────────────► │ - Health Checks  │
│                 │    Events       │                  │
│ - Ticket Events │                 └──────────────────┘
│ - User Actions  │
└─────────────────┘
```

## API Endpunkte

### Authentication
- `POST /api/auth/login` - Benutzer anmelden
- `POST /api/auth/refresh` - Token erneuern
- `POST /api/auth/logout` - Abmelden
- `GET /api/auth/me` - Aktuelle Benutzer-Info

### Dashboard
- `GET /api/dashboard/overview` - Dashboard-Übersicht
- `GET /api/dashboard/kpis` - Live KPI-Daten
- `GET /api/dashboard/trends` - Zeitreihen-Daten
- `GET /api/dashboard/activity` - Aktivitäts-Feed
- `GET /api/dashboard/alerts` - Aktive Alerts

### Tickets
- `GET /api/tickets` - Ticket-Liste mit Filtering
- `GET /api/tickets/:id` - Einzelnes Ticket
- `POST /api/tickets` - Neues Ticket erstellen
- `PUT /api/tickets/:id` - Ticket aktualisieren
- `POST /api/tickets/:id/status` - Ticket-Status ändern
- `GET /api/tickets/stats/overview` - Ticket-Statistiken

### Health & Monitoring
- `GET /health` - Grundlegender Health Check
- `GET /health/detailed` - Detaillierter Health Check
- `GET /health/ready` - Kubernetes Readiness Probe
- `GET /health/live` - Kubernetes Liveness Probe

## WebSocket Events

### Client -> Server
- `register` - Client registrieren
- `subscribe:dashboard` - Dashboard-Updates abonnieren
- `subscribe:tickets` - Ticket-Updates abonnieren
- `heartbeat` - Heartbeat senden

### Server -> Client
- `dashboard:kpi_update` - KPI-Daten aktualisiert
- `dashboard:ticket_update` - Ticket aktualisiert
- `dashboard:trend_update` - Trend-Daten aktualisiert
- `ticket:created` - Neues Ticket erstellt
- `ticket:updated` - Ticket aktualisiert
- `ticket:status_changed` - Ticket-Status geändert
- `system:alert` - System-Alert
- `system:health_check` - System-Health-Update

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklung starten
npm run dev

# Build erstellen
npm run build

# Produktion starten
npm start
```

## Umgebungsvariablen

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Client Configuration
CLIENT_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging
LOG_LEVEL=info
CACHE_TTL=300

# Database (PostgreSQL) – optional, sonst Fallback auf Memory
# Entweder eine vollständige URL ODER Einzelwerte angeben
# DATABASE_URL=postgres://user:pass@host:5432/dbname

# Einzelwerte (werden ignoriert, wenn DATABASE_URL gesetzt ist)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nebula
DB_USER=nebula
DB_PASSWORD=nebula
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# SSL (für gehostete DBs wie Neon/Render)
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true

# Verbindung-Retry und Fallback
DB_RETRY_ATTEMPTS=5
DB_RETRY_DELAY_MS=1000

# Forciere Memory-DB (z.B. lokale Entwicklung ohne PostgreSQL)
# DB_TYPE=memory
```

## Development

### Lokale Entwicklung
```bash
# Mit auto-reload
npm run dev

# Tests ausführen
npm test

# Linting prüfen
npm run lint
```

### Testing
```bash
# Unit Tests
npm run test

# Test Coverage
npm run test:coverage

# E2E Tests (mit Playwright)
npm run test:e2e
```

## Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3001
CMD ["npm", "start"]
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nebula-api-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nebula-api-server
  template:
    metadata:
      labels:
        app: nebula-api-server
    spec:
      containers:
      - name: nebula-api-server
        image: nebula/api-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
```

## Monitoring

### Health Checks
- **Liveness**: `/health/live` - Prüft ob Server läuft
- **Readiness**: `/health/ready` - Prüft ob Server bereit ist
- **Detailed Health**: `/health/detailed` - Vollständiger System-Check

### Logging
Strukturierte Logs mit folgenden Levels:
- `error` - Fehler
- `warn` - Warnungen
- `info` - Allgemeine Informationen
- `debug` - Debug-Informationen

### Metrics
Prometheus-kompatible Metriken verfügbar unter `/health/metrics`.

## Sicherheit

- JWT-basierte Authentifizierung
- Rate Limiting (1000 Requests/15min)
- Helmet Security Headers
- CORS-Konfiguration
- Eingabe-Validierung
- SQL Injection Prevention
- XSS Protection

## Performance

- Redis-Caching für häufige Queries
- Kompression für API-Responses
- Optimierte Datenbank-Queries
- Connection Pooling
- Graceful Shutdown

## Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch
3. Implementiere deine Änderungen
4. Füge Tests hinzu
5. Erstelle einen Pull Request

## Lizenz

MIT License - siehe LICENSE-Datei für Details.
