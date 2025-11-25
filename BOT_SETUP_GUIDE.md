# 🤖 Bot Setup Guide - Schritt für Schritt

## 🚨 **WICHTIG: Bot-Token Problem beheben**

Der Bot zeigt "401: Unauthorized" - das bedeutet der Bot-Token ist ungültig oder abgelaufen.

## 📋 **Schritt-für-Schritt Anleitung**

### 1. **Neuen Bot erstellen** 🤖

1. **Öffne Telegram** auf deinem Handy/Computer
2. **Suche nach @BotFather** 
3. **Sende `/newbot`**
4. **Gib einen Namen ein**: `Nebula Supply Bot`
5. **Gib einen Username ein**: `nebula_supply_bot` (muss mit `_bot` enden)
6. **Kopiere den Token** (sieht so aus: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. **Bot konfigurieren** ⚙️

Sende diese Commands an @BotFather:

```
/setdescription
Nebula Supply - Premium Drops & Tickets
Verifizierung, Invite-System, Support-Tickets
```

```
/setabouttext
🌟 Nebula Supply Bot
Premium Drops, Tickets & Support
Verifizierung erforderlich
```

```
/setuserpic
[Lade ein Logo hoch]
```

### 3. **Token in .env setzen** 🔧

1. **Öffne** `apps/bot/.env`
2. **Ersetze** `your_bot_token_here` mit deinem echten Token
3. **Speichere** die Datei

```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### 4. **Admin-ID finden** 👤

1. **Suche nach @userinfobot** in Telegram
2. **Sende `/start`**
3. **Kopiere deine User-ID** (z.B. `123456789`)
4. **Füge sie in .env hinzu**:

```env
ADMIN_IDS=123456789
```

### 5. **Bot starten** 🚀

```bash
# Im Root-Verzeichnis
pnpm dev
```

### 6. **Bot testen** ✅

1. **Suche nach deinem Bot** in Telegram
2. **Sende `/start`**
3. **Teste die Features**:
   - `/menu` - Hauptmenü
   - `/admin` - Admin Dashboard (nur für Admins)
   - `/support` - Support-Ticket erstellen

## 🔧 **Troubleshooting**

### Bot antwortet nicht
- ✅ Prüfe BOT_TOKEN in `.env`
- ✅ Prüfe Internet-Verbindung
- ✅ Prüfe Logs: `pnpm dev`

### 401 Unauthorized
- ✅ Token ist ungültig → Neuen Bot erstellen
- ✅ Token falsch kopiert → Nochmal von @BotFather kopieren
- ✅ Bot wurde gelöscht → Neuen Bot erstellen

### Bot startet nicht
- ✅ Dependencies installieren: `pnpm install`
- ✅ .env-Datei prüfen
- ✅ Port 3000 frei?

## 🎯 **Features testen**

### User-Features
- `/start` - Bot starten
- `/menu` - Hauptmenü
- `/support` - Support-Ticket

### Admin-Features (nur für Admins)
- `/admin` - Admin Dashboard
- `/createinvite VIP123456` - Invite-Code erstellen
- `/health` - Health Check

## 📱 **WebApp Integration**

1. **Bot läuft** ✅
2. **Web App startet** auf http://localhost:5173
3. **Bot öffnet WebApp** über Buttons
4. **Nahtlose Integration** zwischen Bot und WebApp

## 🚀 **Production Deployment**

Für Production:
1. **Webhook-Modus** aktivieren
2. **Domain** konfigurieren
3. **SSL-Zertifikat** installieren
4. **Redis** für Sessions

Siehe `DEPLOYMENT.md` für Details.

## 🆘 **Support**

Bei Problemen:
1. **Logs prüfen** in der Konsole
2. **README.md** lesen
3. **GitHub Issues** erstellen

---

**Nach diesem Setup läuft dein Bot perfekt! 🎉**


