# 🚀 Homepage Starten - Quick Start

## 🎯 Sofort loslegen

### 1. Development Server starten

```bash
cd NebulaCodex/apps/web
pnpm dev
```

**Dann öffne**: `http://localhost:5173`

---

## ✨ Was du sehen wirst

### Beim ersten Laden:

1. **⏳ Loading Screen** (1.5s)
   - Skeleton Loading Animation

2. **🎁 Daily Reward Popup** (nach 1s)
   - "Tägliche Belohnung!"
   - Klicke "X Coins abholen"
   - Popup verschwindet nach 1.5s
   - Toast erscheint

3. **🚀 Hero Section**
   - "Willkommen bei Nebula Supply"
   - Parallax beim Scrollen
   - Animierter Gradient Background
   - 2 CTAs: "Drops entdecken" & "VIP werden"

4. **📊 Stats Cards** (scrolle runter)
   - 4 Cards mit AnimatedCounters
   - Hover für 3D Effect
   - Icon rotiert bei Hover

5. **📊 Live Activity Feed** (nach 2s)
   - **Desktop**: Floating Card rechts oben
   - **Mobile**: Kompakter Banner oben
   - Neue Activity alle 10-20s

6. **🔥 Hot Drops Section**
   - 3 Featured Drops
   - Klickbar → navigiert zu /drops
   - Progress Bars animiert

7. **🎯 Für dich empfohlen** (nur Returning Users)
   - Erscheint nur wenn du schon Produkte angesehen hast
   - Smart Recommendations

8. **📱 Mobile Quick Actions** (nur Mobile)
   - FAB rechts unten (⚡ Icon)
   - Klick öffnet Bottom Sheet
   - 3 Quick Links

---

## 🎮 Interactive Features

### Daily Reward

**So testest du den Streak**:

```javascript
// Tag 1: First Login
localStorage.clear();
location.reload();
// → Popup: "Serie: Tag 1", "10 Coins abholen"

// Tag 2: Simuliere morgen
localStorage.setItem('dailyStreak', JSON.stringify({
  count: 1,
  lastDate: new Date(Date.now() - 86400000).toDateString()
}));
localStorage.removeItem('lastDailyClaim');
location.reload();
// → Popup: "Serie: Tag 2", "15 Coins abholen" (+5 Bonus)

// Tag 10: Max Bonus
localStorage.setItem('dailyStreak', JSON.stringify({
  count: 9,
  lastDate: new Date(Date.now() - 86400000).toDateString()
}));
localStorage.removeItem('lastDailyClaim');
location.reload();
// → Popup: "Serie: Tag 10", "55 Coins abholen" (+45 Bonus)
```

### Personalisierung

**So testest du Empfehlungen**:

```javascript
// Simuliere viewed products
localStorage.setItem('nebula_user_preferences', JSON.stringify({
  favoriteCategories: [],
  viewedProducts: [
    { id: 'product-sneaker-airmax', timestamp: Date.now() },
    { id: 'product-tshirt-basic', timestamp: Date.now() - 1000 }
  ],
  clickedDrops: [],
  lastVisit: Date.now() - 86400000
}));
location.reload();
// → "Für dich empfohlen" Section erscheint
```

---

## 🐛 Troubleshooting

### Daily Reward erscheint nicht?

**Lösung**: LocalStorage leeren

```javascript
localStorage.removeItem('lastDailyClaim');
location.reload();
```

### Live Activity Feed nicht sichtbar?

**Prüfe**:
- Warte 2 Sekunden nach Page Load
- Desktop: Rechts oben
- Mobile: Top Banner unter Header

### Buttons nicht klickbar?

**Prüfe**:
- Browser Console auf Errors
- React DevTools für Component State
- Network Tab für Failed Requests

### Animationen ruckeln?

**Lösung**:
```javascript
// Aktiviere Reduced Motion in Browser Settings
// Oder setze in DevTools Console:
document.documentElement.classList.add('reduce-motion');
```

---

## 📱 Mobile Testen

### Beste Methode:

1. **Browser DevTools**:
   ```
   F12 → Toggle Device Toolbar (Ctrl+Shift+M)
   Wähle: iPhone 12 Pro oder Samsung Galaxy S20
   ```

2. **Echtes Gerät**:
   ```bash
   pnpm dev --host
   # Dann auf Mobile: http://[YOUR_IP]:5173
   ```

### Mobile Features:
- ✅ Quick Actions FAB (rechts unten)
- ✅ Live Activity (Top Banner)
- ✅ Touch-Optimized Buttons
- ✅ Bottom Navigation
- ✅ Pull-to-Refresh

---

## ⚡ Performance Testen

### Lighthouse Audit:

```bash
# 1. Production Build
pnpm build
pnpm preview

# 2. Öffne in Chrome
http://localhost:4173

# 3. DevTools → Lighthouse Tab
# 4. Klick "Analyze page load"
```

**Erwartete Scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

## 🎉 Alles Klar?

**Die Homepage sollte jetzt perfekt laufen!**

Bei Problemen:
1. Console Errors checken
2. BUGFIX_REPORT.md lesen
3. Tests ausführen: `pnpm test`

**Viel Spaß! 🚀**


