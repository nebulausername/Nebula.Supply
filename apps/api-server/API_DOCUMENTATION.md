# Nebula API Documentation

## Telegram Authentication

### POST /api/auth/telegram/verify

Verifiziert Telegram Login Widget Daten und gibt JWT zurück.

**Request:**
```json
{
  "initData": "user=%7B%22id%22%3A123456...&auth_date=1234567890&hash=abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "telegramId": 123456789,
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User"
    }
  }
}
```

**Error Codes:**
- `400` - initData fehlt oder ungültig
- `401` - Ungültige HMAC-Signatur
- `500` - Server-Fehler

**Security:**
- HMAC-SHA256 Verifikation mit `BOT_TOKEN`
- JWT mit 12h Gültigkeit
- Automatische User-Erstellung/Update

---

## Daily Rewards

### GET /api/rewards/status

Holt aktuellen Daily Reward Status.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `timezone` (optional): IANA timezone string, default: "UTC"

**Response:**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "lastClaimAt": "2025-10-24T10:30:00.000Z",
    "lastClaimDayKey": "2025-10-24",
    "streak": 5,
    "totalCoins": 250,
    "nextEligibleAt": null,
    "todayDayKey": "2025-10-25"
  },
  "cached": false
}
```

**Error Codes:**
- `401` - Nicht authentifiziert oder ungültiger Token
- `404` - User nicht gefunden
- `429` - Rate Limit überschritten (max 10 req/min)

**Caching:**
- Cache TTL: 30 Sekunden
- Cache Key: `reward:status:{telegramId}:{dayKey}`

---

### POST /api/rewards/claim

Beansprucht die tägliche Belohnung.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request:**
```json
{
  "timezone": "Europe/Berlin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coins": 35,
    "streak": 6,
    "totalCoins": 285,
    "nextEligibleAt": "2025-10-26T00:00:00.000Z"
  },
  "message": "35 Coins erhalten! Streak: 6 Tage 🔥"
}
```

**Error Codes:**
- `400` - Heute bereits beansprucht
- `401` - Nicht authentifiziert
- `404` - User nicht gefunden
- `429` - Rate Limit überschritten
- `500` - Fehler beim Speichern

**Reward Calculation:**
- Base: 10 Coins
- Bonus: +5 Coins pro Streak-Tag (max +50)
- Max Reward: 60 Coins (10 + 50)

**Streak Logic:**
- Consecutive days: Streak +1
- Missed day: Streak reset to 1
- First claim ever: Streak = 1

**Side Effects:**
- Invalidates status cache
- Broadcasts WebSocket event to homepage
- Logs claim event

---

## Rate Limiting

Alle Rewards-Endpoints haben Rate Limiting:
- **Window:** 60 Sekunden
- **Max Requests:** 10 pro User
- **Error:** 429 Too Many Requests

---

## WebSocket Events

### Homepage Events

**Event: `homepage:activity`**
```json
{
  "type": "homepage:activity",
  "data": {
    "userId": "bot-user-123",
    "userHandle": "@testuser",
    "action": "achievement",
    "resource": "daily-reward",
    "message": "hat 35 Coins beansprucht! 🎉 (Streak: 6)",
    "timestamp": "2025-10-25T10:30:00.000Z"
  }
}
```

---

## Error Response Format

Alle Errors folgen diesem Format:

```json
{
  "success": false,
  "error": "Fehlermeldung",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

---

## Environment Variables

**Required:**
```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
JWT_SECRET=your_secure_random_key_min_32_chars
```

**Optional:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nebula
DB_USER=nebula
DB_PASSWORD=nebula

# Redis (optional, falls back to memory)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DISABLED=false

# Server
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-domain.com
```

---

## Testing

### Run Tests
```bash
cd apps/api-server
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Specific Test Suite
```bash
npm test -- rewards.test.ts
npm test -- auth.telegram.test.ts
```

---

## Performance Metrics

**Target Response Times:**
- `/api/auth/telegram/verify`: < 500ms
- `/api/rewards/status`: < 200ms (cached), < 500ms (uncached)
- `/api/rewards/claim`: < 500ms

**Caching Strategy:**
- Status queries: 30s TTL
- In-memory rate limiting
- Redis fallback for production

**Database:**
- PostgreSQL with indexes on telegram_id, user_id
- Connection pooling (max 20 connections)
- In-memory fallback for tests

---

## Security Best Practices

1. **HMAC Verification:** Alle Telegram-Daten werden mit HMAC-SHA256 validiert
2. **JWT Tokens:** Kurze TTL (12h), signiert mit starkem Secret
3. **Rate Limiting:** Verhindert Spam und Missbrauch
4. **Input Validation:** Alle Inputs werden validiert
5. **Error Messages:** Keine sensiblen Informationen in Errors
6. **HTTPS Only:** In Production nur HTTPS verwenden
7. **CORS:** Konfiguriert für spezifische Origins

---

## Migration Guide

### From localStorage to Server-Side Rewards

**Old (Client-Only):**
```javascript
// localStorage.getItem('lastDailyClaim')
// Unsicher, kann manipuliert werden
```

**New (Server-Side):**
```javascript
// GET /api/rewards/status
// Server ist source of truth
```

**Benefits:**
- ✅ Geräteübergreifend synchronisiert
- ✅ Manipulationssicher
- ✅ Zuverlässig auf Mobile
- ✅ Echtzeit-Updates via WebSocket


