# 🚀 Ticket System - Quick Start Guide

## 🎯 Übersicht

Das NEBULA Support Ticket System ist jetzt einsatzbereit! Hier ist alles, was du wissen musst:

---

## ⚡ Schnellstart

### **1. Bot starten**

```bash
cd apps/bot
pnpm dev
```

Der Telegram Bot ist jetzt aktiv und hört auf `/support` Commands!

### **2. Web-App starten**

```bash
cd apps/web
pnpm dev
```

Die Support-Seite ist verfügbar unter: `http://localhost:5173/support`

---

## 💻 Web-Interface Nutzen

### **Ticket erstellen (3 Schritte)**

1. **Gehe zu** → `http://localhost:5173/support`
2. **Klicke auf** → "Neues Ticket" 
3. **Wähle Kategorie** → Bestellung, Zahlung, Versand, etc.
4. **Fülle aus**:
   - Name (optional)
   - E-Mail (optional)
   - Betreff (Pflicht)
   - Beschreibung (Pflicht)
5. **Klicke** → "Ticket erstellen"

✅ **Fertig!** Dein Ticket ist erstellt und wird automatisch gespeichert.

### **Nachrichten senden**

1. Öffne ein Ticket aus der Liste
2. Scrolle zum Chat-Bereich
3. Schreibe deine Nachricht
4. Drücke Enter oder klicke auf "Senden"

🎉 Du bekommst nach 2-4 Sekunden eine simulierte Support-Antwort!

### **Tickets suchen & filtern**

- **Suchleiste**: Suche nach Ticket-ID oder Betreff
- **Filter-Dropdown**: Filtere nach Status
  - Alle
  - Offen
  - In Bearbeitung
  - Wartet
  - Erledigt

---

## 📱 Telegram Bot Nutzen

### **Support-Menü öffnen**

Sende einfach:
```
/support
```

### **Ticket erstellen (3 Klicks)**

1. Klicke auf **"🆕 Neues Ticket erstellen"**
2. Wähle eine **Kategorie**:
   - 🛒 Bestellung
   - 💳 Zahlung
   - 📦 Versand
   - 🔄 Rückgabe
   - 🐛 Technisch
   - 💬 Sonstiges
3. Schreibe deine **Beschreibung**

✅ **Fertig!** Der Bot bestätigt dein Ticket mit der Ticket-ID.

### **Tickets ansehen**

1. Klicke auf **"📋 Meine Tickets"**
2. Wähle ein Ticket aus der Liste
3. Siehe Details, Status und Nachrichten

### **Nachricht senden**

1. Öffne ein Ticket
2. Klicke **"💬 Nachricht senden"**
3. Schreibe deine Nachricht
4. Der Bot bestätigt den Versand

### **Ticket schließen**

1. Öffne ein Ticket
2. Klicke **"✅ Als erledigt markieren"**

### **FAQ durchsuchen**

1. Klicke auf **"❓ FAQ"**
2. Wähle ein Thema:
   - 📦 Versandzeiten
   - 💳 Zahlungsmethoden
   - 🔄 Rückgaberecht
   - 📏 Größentabelle

---

## 🎨 Design Features

### **Web-Interface**

✨ **Modern & Animated**
- Glassmorphismus-Design
- Smooth Framer Motion Animationen
- Gradient-Buttons mit Hover-Effekten
- Responsive für Mobile & Desktop

🌈 **Farb-kodierte Kategorien**
- Jede Kategorie hat eigene Gradient-Farben
- Visuell unterscheidbare Tickets
- Status-Badges mit Icons

💬 **Chat-Interface**
- Messenger-ähnliches Design
- User-Nachrichten rechts (lila-blau Gradient)
- Support-Nachrichten links (grün Gradient)
- Avatare für User & Support
- Timestamps bei jeder Nachricht

### **Telegram Bot**

🎯 **Übersichtliche Buttons**
- Intuitive Emojis für Kategorien
- Status-Emojis (🟢 🟡 🟠 ✅)
- Inline-Keyboards für schnelle Navigation

📊 **Ticket-Details**
- Alle Infos auf einen Blick
- Nachrichten-Historie
- Prioritäts-Anzeige

---

## 🔒 Anonymität & Datenschutz

### **Wie funktioniert die Anonymität?**

1. **Keine Registrierung**: Sofort loslegen ohne Account
2. **Auto-Session-ID**: Automatisch beim ersten Besuch erstellt
3. **Lokale Speicherung**: Alle Daten nur im Browser
4. **Optional: Name/Email**: Du entscheidest, was du teilst
5. **Telegram**: Deine Telegram-ID bleibt privat

### **Was wird gespeichert?**

**Im Browser (localStorage):**
```
nebula_support_session: "anon_1234567890_abc123"
nebula_tickets_anon_1234567890_abc123: [...tickets]
nebula_user_name: "Max" (optional)
nebula_user_email: "max@email.com" (optional)
```

**Telegram:**
- Tickets sind mit deiner Telegram-User-ID verknüpft
- Nachrichten im Bot-Memory (oder Redis in Production)

---

## 🎯 Use Cases

### **Beispiel 1: Bestellproblem**

**Web:**
```
1. Neues Ticket → Kategorie "Bestellung"
2. Betreff: "Artikel fehlt in Lieferung"
3. Beschreibung: "Ich habe Bestellung #12345 erhalten, 
   aber das T-Shirt fehlt."
4. Ticket erstellt → TK-1234567890-ABC123
5. Support antwortet innerhalb von 2-4 Sekunden (simuliert)
```

**Telegram:**
```
/support
→ Neues Ticket
→ 🛒 Bestellung
→ "Artikel fehlt in Lieferung..."
→ Ticket TK-1234567890-ABC123 erstellt!
```

### **Beispiel 2: Zahlungsfrage**

**Web:**
```
1. Neues Ticket → Kategorie "Zahlung"
2. Betreff: "Kryptowährung als Zahlungsmethode?"
3. Support: "Ja! Wir akzeptieren BTC, ETH, USDT..."
```

### **Beispiel 3: FAQ-Nutzung**

**Telegram:**
```
/support
→ ❓ FAQ
→ 📦 Versandzeiten
→ "Deutschland: 2-3 Werktage..."
→ Bei Bedarf: Ticket erstellen
```

---

## 🔧 Troubleshooting

### **Problem: Bot antwortet nicht**

**Lösung:**
```bash
# Check Bot Token
echo $BOT_TOKEN

# Restart Bot
cd apps/bot
pnpm dev
```

### **Problem: Tickets werden nicht gespeichert**

**Lösung:**
1. Browser-Cache leeren
2. localStorage prüfen:
   ```javascript
   // In Browser Console:
   console.log(localStorage.getItem('nebula_support_session'));
   console.log(Object.keys(localStorage));
   ```
3. Inkognito-Modus testen

### **Problem: Support-Seite lädt nicht**

**Lösung:**
```bash
# Check if web app is running
cd apps/web
pnpm dev

# Clear cache & rebuild
rm -rf node_modules/.vite
pnpm dev
```

---

## 📊 Demo-Daten

### **Test-Tickets erstellen**

**Schnell-Test:**
1. Gehe zu `/support`
2. Erstelle 3 Tickets in verschiedenen Kategorien
3. Sende Nachrichten in jedem Ticket
4. Markiere eins als "Erledigt"
5. Teste Such- und Filterfunktionen

**Test-Szenarien:**
```
Ticket 1: Bestellung - "Wo ist meine Bestellung?"
Ticket 2: Zahlung - "Rechnung anfordern"
Ticket 3: Versand - "Lieferadresse ändern"
Ticket 4: Technisch - "App stürzt ab"
```

---

## 🎉 Profi-Tipps

### **Für User:**

💡 **Tipp 1**: Speichere deinen Namen, damit Support dich persönlich anspricht
💡 **Tipp 2**: Nutze aussagekräftige Betreffzeilen
💡 **Tipp 3**: Screenshots können via Text-Beschreibung beschrieben werden
💡 **Tipp 4**: FAQ checken vor Ticket-Erstellung

### **Für Entwickler:**

🚀 **Tipp 1**: Tickets in localStorage für Debugging:
```javascript
// Browser Console
console.log(JSON.parse(localStorage.getItem('nebula_tickets_' + localStorage.getItem('nebula_support_session'))));
```

🚀 **Tipp 2**: Simulierte Antwortzeit ändern:
```typescript
// In SupportPage.tsx, Zeile ~88
setTimeout(() => { ... }, 2000 + Math.random() * 2000);
                          ↑ Ändere diese Werte
```

🚀 **Tipp 3**: Neue Kategorien hinzufügen:
```typescript
// In components/support/types.ts
export const categories: Category[] = [
  // ... existing
  { id: 'vip', name: 'VIP Support', icon: '👑', color: 'from-yellow-500 to-orange-500' }
];
```

---

## 📈 Nächste Schritte

### **Sofort nutzbar:**
- ✅ Web-Interface komplett funktional
- ✅ Telegram Bot einsatzbereit
- ✅ Anonyme Sessions
- ✅ Lokale Speicherung

### **Nächste Updates:**
- 🔄 Datenbank-Integration (PostgreSQL/MongoDB)
- 🔄 Echtzeit-Sync zwischen Web & Telegram
- 🔄 Admin-Dashboard
- 🔄 Push-Benachrichtigungen
- 🔄 Datei-Uploads

---

## 💬 Support & Feedback

Fragen oder Probleme? Erstelle ein Ticket! 😄

**Built with 💜 by the NEBULA Team**

---

## 📚 Weitere Dokumentation

- [TICKET_SYSTEM.md](./TICKET_SYSTEM.md) - Vollständige technische Dokumentation
- [BOT_TODO.md](./BOT_TODO.md) - Bot Entwicklungs-Roadmap
- [developer-setup.md](./developer-setup.md) - Entwickler-Setup Guide
