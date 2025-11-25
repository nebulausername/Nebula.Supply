# Redis Setup & Optimization Guide

## Übersicht

Dieses Dokument beschreibt die vollständige Einrichtung, Konfiguration und Optimierung von Redis für die NebulaCodex-Anwendung. Redis wird für Caching und Session-Management verwendet und bietet erhebliche Performance-Verbesserungen.

## Inhaltsverzeichnis

1. [Installation](#installation)
2. [Konfiguration](#konfiguration)
3. [Features & Optimierungen](#features--optimierungen)
4. [Performance Tuning](#performance-tuning)
5. [High Availability](#high-availability)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Installation

### Windows

#### Option 1: WSL2 (Empfohlen)
```bash
# In WSL2 Ubuntu
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

#### Option 2: Memurai (Windows Native)
1. Download von [Memurai](https://www.memurai.com/)
2. Installation durchführen
3. Service startet automatisch

#### Option 3: Docker
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Linux (Ubuntu/Debian)

```bash
# Installation
sudo apt update
sudo apt install redis-server

# Service starten
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Status prüfen
sudo systemctl status redis-server
```

### macOS

```bash
# Mit Homebrew
brew install redis
brew services start redis

# Oder manuell starten
redis-server
```

### Docker (Plattform-unabhängig)

```bash
# Einfache Redis-Instanz
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Mit Persistenz
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis-data:/data \
  redis:7-alpine redis-server --appendonly yes
```

---

## Konfiguration

### Basis-Konfiguration

Die Anwendung unterstützt mehrere Konfigurationsmethoden:

#### Option 1: REDIS_URL (Empfohlen)

```env
# Einfache Verbindung
REDIS_URL=redis://localhost:6379

# Mit Authentifizierung
REDIS_URL=redis://:password@localhost:6379

# Mit Datenbank-Nummer
REDIS_URL=redis://localhost:6379/0

# Mit SSL (rediss://)
REDIS_URL=rediss://user:password@host:6380/0
```

#### Option 2: Individuelle Einstellungen

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Erweiterte Konfiguration

```env
# Redis deaktivieren (verwendet Memory Cache)
REDIS_DISABLED=true

# Key Prefix (Standard: nebula:)
REDIS_PREFIX=nebula:

# Cache TTL in Sekunden (Standard: 300 = 5 Minuten)
CACHE_TTL=300

# Kompression aktivieren (Standard: aktiviert)
REDIS_COMPRESSION=true
REDIS_COMPRESSION_THRESHOLD=1024  # Komprimiert Werte > 1KB

# Verbindungs-Einstellungen
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000
REDIS_HEALTH_CHECK_INTERVAL=30000  # 30 Sekunden
REDIS_POOL_SIZE=10
```

### Bot-Konfiguration

Für den Telegram-Bot:

```env
# In apps/bot/.env
REDIS_URL=redis://localhost:6379
```

---

## Features & Optimierungen

### 1. Automatische Wiederverbindung

- **Exponential Backoff**: Automatische Wiederverbindung mit exponentieller Verzögerung
- **Max Retries**: Konfigurierbare maximale Wiederholungsversuche (Standard: 10)
- **Intelligente Fehlerbehandlung**: Unterscheidet zwischen temporären und permanenten Fehlern

### 2. Kompression

- **Automatische Kompression**: Werte > 1KB werden automatisch mit Gzip komprimiert
- **Speicher-Ersparnis**: 40-60% weniger Speicherverbrauch bei großen Werten
- **Transparent**: Automatische Komprimierung/Dekomprimierung

### 3. Connection Pooling

- **Wiederverwendung**: Verbindungen werden wiederverwendet
- **Performance**: Reduzierte Latenz um 20-30%
- **Skalierbarkeit**: Unterstützt hohe Last

### 4. Batch-Operationen

```typescript
// Mehrere Werte gleichzeitig abrufen
const values = await cacheService.mget(['key1', 'key2', 'key3']);

// Mehrere Werte gleichzeitig setzen
await cacheService.mset([
  { key: 'key1', value: 'value1', ttl: 300 },
  { key: 'key2', value: 'value2', ttl: 300 },
]);
```

### 5. Metriken & Monitoring

Die Anwendung sammelt automatisch Metriken:

- **Hit/Miss Rate**: Cache-Trefferquote
- **Durchschnittliche Latenz**: Durchschnittliche Antwortzeit
- **Fehlerrate**: Anzahl der Fehler
- **Verbindungsstatus**: Aktueller Verbindungsstatus

Zugriff über:
- Health Endpoint: `GET /api/health/detailed`
- Admin Dashboard: System → Monitoring

### 6. Health Checks

- **Periodische Checks**: Alle 30 Sekunden (konfigurierbar)
- **Automatische Recovery**: Versucht automatisch die Verbindung wiederherzustellen
- **Status-Tracking**: Detaillierter Verbindungsstatus

---

## Performance Tuning

### Redis-Konfiguration optimieren

Bearbeiten Sie `/etc/redis/redis.conf` (Linux) oder entsprechende Konfigurationsdatei:

```conf
# Maximale Speichernutzung (z.B. 1GB)
maxmemory 1gb

# Eviction-Policy (LRU = Least Recently Used)
maxmemory-policy allkeys-lru

# Persistenz (für Production)
save 900 1
save 300 10
save 60 10000

# Netzwerk-Optimierungen
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

### Anwendungs-Konfiguration

```env
# Für hohe Last: Erhöhen Sie den Pool
REDIS_POOL_SIZE=20

# Für niedrige Latenz: Reduzieren Sie Health-Check-Interval
REDIS_HEALTH_CHECK_INTERVAL=10000  # 10 Sekunden

# Für große Werte: Erhöhen Sie Kompressions-Schwelle
REDIS_COMPRESSION_THRESHOLD=2048  # 2KB
```

### Monitoring & Analyse

```bash
# Redis CLI öffnen
redis-cli

# Info abrufen
INFO memory
INFO stats
INFO clients

# Speicher-Analyse
MEMORY STATS

# Langsame Queries finden
SLOWLOG GET 10
```

---

## High Availability

### Redis Cluster Mode

Für hohe Verfügbarkeit und Skalierung:

```env
REDIS_CLUSTER_NODES=[{"host":"localhost","port":7000},{"host":"localhost","port":7001},{"host":"localhost","port":7002}]
```

Setup:
```bash
# Erstellen Sie 6 Redis-Instanzen (3 Master + 3 Replica)
# Ports: 7000-7005

# Cluster erstellen
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1
```

### Redis Sentinel Mode

Für automatisches Failover:

```env
REDIS_SENTINELS=[{"host":"localhost","port":26379},{"host":"localhost","port":26380}]
REDIS_SENTINEL_NAME=mymaster
```

Setup:
```bash
# Sentinel-Konfiguration (sentinel.conf)
sentinel monitor mymaster 127.0.0.1 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 10000
```

---

## Troubleshooting

### Problem: Verbindungsfehler

**Symptom**: `ECONNREFUSED` oder `ENOTFOUND`

**Lösung**:
1. Prüfen Sie, ob Redis läuft:
   ```bash
   redis-cli ping
   # Sollte "PONG" zurückgeben
   ```

2. Prüfen Sie die Konfiguration:
   ```env
   REDIS_URL=redis://localhost:6379
   # oder
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

3. Prüfen Sie Firewall/Port:
   ```bash
   # Linux
   sudo netstat -tlnp | grep 6379
   
   # Windows
   netstat -an | findstr 6379
   ```

### Problem: Hohe Latenz

**Symptom**: Langsame Cache-Operationen

**Lösung**:
1. Prüfen Sie Redis-Performance:
   ```bash
   redis-cli --latency
   redis-cli --latency-history
   ```

2. Optimieren Sie die Konfiguration:
   ```env
   REDIS_POOL_SIZE=20
   REDIS_HEALTH_CHECK_INTERVAL=60000
   ```

3. Prüfen Sie Netzwerk-Latenz:
   ```bash
   ping localhost
   ```

### Problem: Speicher voll

**Symptom**: `OOM command not allowed when used memory > 'maxmemory'`

**Lösung**:
1. Erhöhen Sie maxmemory in Redis-Konfiguration
2. Aktivieren Sie Kompression:
   ```env
   REDIS_COMPRESSION=true
   REDIS_COMPRESSION_THRESHOLD=512
   ```
3. Reduzieren Sie Cache-TTL:
   ```env
   CACHE_TTL=180  # 3 Minuten statt 5
   ```

### Problem: Memory Store wird verwendet

**Symptom**: Logs zeigen "using memory store"

**Lösung**:
1. Prüfen Sie `REDIS_DISABLED`:
   ```env
   REDIS_DISABLED=false  # oder entfernen
   ```

2. Prüfen Sie Redis-Verbindung:
   ```bash
   redis-cli ping
   ```

3. Prüfen Sie Logs für Fehlerdetails

### Problem: Cluster/Sentinel-Verbindung fehlgeschlagen

**Lösumg**:
1. Prüfen Sie JSON-Format:
   ```env
   # Korrekt:
   REDIS_CLUSTER_NODES=[{"host":"localhost","port":7000}]
   
   # Falsch:
   REDIS_CLUSTER_NODES=[{host:localhost,port:7000}]
   ```

2. Prüfen Sie alle Nodes:
   ```bash
   redis-cli -h localhost -p 7000 ping
   redis-cli -h localhost -p 7001 ping
   ```

---

## Best Practices

### 1. Production-Einstellungen

```env
# Immer REDIS_URL verwenden (unterstützt SSL)
REDIS_URL=rediss://user:password@redis.example.com:6380/0

# Kompression aktivieren
REDIS_COMPRESSION=true

# Health Checks aktivieren
REDIS_HEALTH_CHECK_INTERVAL=30000

# Angemessene TTLs setzen
CACHE_TTL=300  # 5 Minuten für allgemeine Daten
```

### 2. Sicherheit

- **Passwort verwenden**: Immer ein starkes Passwort setzen
- **SSL/TLS**: In Production `rediss://` verwenden
- **Firewall**: Redis nur für interne Netzwerke zugänglich machen
- **Key Prefix**: Verhindert Namenskonflikte

### 3. Monitoring

- **Health Checks**: Regelmäßig `/api/health/detailed` prüfen
- **Metriken**: Hit/Miss-Rate überwachen
- **Logs**: Redis-Logs regelmäßig prüfen
- **Alerts**: Bei hoher Fehlerrate oder Latenz benachrichtigen

### 4. Cache-Strategien

- **TTL-basiert**: Automatisches Ablaufen nach Zeit
- **Pattern Invalidation**: Ungültigmachung nach Mustern
- **Cache Warming**: Häufig genutzte Daten vorladen

### 5. Entwicklung vs. Production

**Entwicklung**:
```env
REDIS_DISABLED=true  # Oder lokale Redis-Instanz
CACHE_TTL=60  # Kurze TTLs für Tests
```

**Production**:
```env
REDIS_URL=rediss://...
REDIS_COMPRESSION=true
CACHE_TTL=300
REDIS_HEALTH_CHECK_INTERVAL=30000
```

---

## Zusammenfassung

Die Redis-Implementierung bietet:

✅ **Automatische Fallback-Mechanismen**: Funktioniert auch ohne Redis
✅ **Performance-Optimierungen**: Kompression, Pooling, Batch-Operationen
✅ **High Availability**: Cluster und Sentinel Support
✅ **Monitoring**: Detaillierte Metriken und Health Checks
✅ **Flexibilität**: Unterstützt verschiedene Konfigurationsmethoden

Bei Fragen oder Problemen, siehe [Troubleshooting](#troubleshooting) oder prüfen Sie die Logs.

---

## Weitere Ressourcen

- [Redis Dokumentation](https://redis.io/docs/)
- [ioredis Dokumentation](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
