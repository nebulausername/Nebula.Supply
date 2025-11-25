# ⚡ Nebula Quick Start

**Schnellstart für das komplette Nebula Supply System!**

## 🚀 In 3 Schritten loslegen

### 1. Installation
```bash
# Im Root-Verzeichnis
pnpm install
```

### 2. Bot konfigurieren
```bash
# Bot-Token setzen
cd apps/bot
# Bearbeite .env und füge deinen BOT_TOKEN hinzu
```

### 3. Alles starten
```bash
# Zurück ins Root
cd ../..
pnpm dev
```

**Das war's! 🎉**

## 🌐 URLs

- **Web App**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5273  
- **Bot**: Suche in Telegram nach deinem Bot

## 🎯 Was passiert?

1. **Web App** startet auf Port 5173
2. **Bot** startet und verbindet sich mit Telegram
3. **Hot Reload** ist aktiv für alle Services
4. **Logs** werden in der Konsole angezeigt

## 🔧 Bot testen

1. Öffne Telegram
2. Suche nach deinem Bot
3. Sende `/start`
4. Teste die Features!

## 🛠️ Development Commands

```bash
pnpm dev          # Alles starten
pnpm dev:web      # Nur Web App
pnpm dev:bot      # Nur Bot
pnpm dev:admin    # Nur Admin
pnpm build        # Alles bauen
pnpm test         # Tests ausführen
```

## 🆘 Probleme?

### Bot antwortet nicht
- Prüfe BOT_TOKEN in `apps/bot/.env`
- Prüfe Logs in der Konsole

### Web App lädt nicht
- Prüfe Port 5173
- Prüfe Browser Console

### Build-Fehler
- `pnpm install` erneut ausführen
- Node.js Version prüfen (20+)

## 📚 Mehr Infos

- **DEVELOPMENT.md** - Detaillierte Entwicklung
- **apps/bot/README.md** - Bot-Dokumentation
- **apps/web/README.md** - Web App Dokumentation

---

**Ready to build! 🚀**



