# 🧪 Homepage Test Guide - Alle Funktionen testen

**Version:** 1.0  
**Datum:** 1. Oktober 2025  
**Status:** ✅ Production-Ready

---

## 🎯 Überblick

Dieser Guide führt dich durch **alle** interaktiven Elemente der Homepage und zeigt dir, wie du jede Funktion testest.

---

## 📱 Vor dem Test

### Desktop Testing
1. Öffne Chrome DevTools (F12)
2. Öffne Browser: `http://localhost:5173`
3. Console sollte keine Errors zeigen

### Mobile Testing
1. DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Wähle "iPhone 12 Pro" oder "Samsung Galaxy S20"
3. Refresh die Seite

---

## ✅ Test Checkliste

### 1. Hero Section (Oben auf der Homepage)

#### **Button 1: "Drops entdecken"**
- [x] **Action:** Klicke den grünen "Drops entdecken" Button
- [x] **Erwartung:** Navigiert zu `/drops` (ohne Page Reload!)
- [x] **Hover:** Button wird größer (scale 1.05) + Glow-Effekt
- [x] **Test Bestanden:** ✅ / ❌

#### **Button 2: "VIP werden"**
- [x] **Action:** Klicke den "VIP werden" Button
- [x] **Erwartung:** Navigiert zu `/vip` (ohne Page Reload!)
- [x] **Hover:** Button wird größer
- [x] **Test Bestanden:** ✅ / ❌

#### **Parallax Scrolling**
- [x] **Action:** Scrolle langsam nach unten
- [x] **Erwartung:** Hero Section scrollt langsamer als Page (Parallax)
- [x] **Bonus:** Gradient animiert sich im Hintergrund
- [x] **Test Bestanden:** ✅ / ❌

---

### 2. Daily Reward Popup

#### **Beim ersten Besuch:**
- [x] **Action:** Öffne die Seite in Incognito/Private Mode
- [x] **Erwartung:** Popup erscheint nach 1 Sekunde
- [x] **Anzeige:** "Tägliche Belohnung!", "Serie: Tag 1", "10 Coins abholen"
- [x] **Test Bestanden:** ✅ / ❌

#### **Coins Claim:**
- [x] **Action:** Klicke "10 Coins abholen"
- [x] **Erwartung:** 
  - Popup zeigt "Erhalten!" für 1.5s
  - Popup schließt automatisch
  - Toast erscheint: "🎉 10 Coins erhalten! Serie: 1 Tag"
  - Coins Balance erhöht sich (sieh oben im Header)
- [x] **Test Bestanden:** ✅ / ❌

#### **Streak System:**
```javascript
// In Browser Console:
// Simuliere Day 2:
localStorage.setItem('dailyStreak', JSON.stringify({
  count: 1,
  lastDate: new Date(Date.now() - 86400000).toDateString()
}));
localStorage.removeItem('lastDailyClaim');
location.reload();
// Erwartung: "Serie: Tag 2", "15 Coins abholen"
```
- [x] **Test Bestanden:** ✅ / ❌

#### **Bereits geclaimt heute:**
- [x] **Action:** Refresh die Seite (F5)
- [x] **Erwartung:** Popup erscheint NICHT
- [x] **Test Bestanden:** ✅ / ❌

---

### 3. Live Activity Feed

#### **Desktop Version:**
- [x] **Action:** Warte 2 Sekunden nach Page Load
- [x] **Erwartung:** Floating Card erscheint rechts oben
- [x] **Inhalt:** "Live Activity" Header + Activities
- [x] **Animation:** Slide In von rechts
- [x] **Test Bestanden:** ✅ / ❌

#### **Mobile Version:**
- [x] **Action:** Wechsle zu Mobile View (<768px)
- [x] **Erwartung:** Kompakter Banner oben (unter Header)
- [x] **Inhalt:** Nur aktuelle Activity sichtbar
- [x] **Test Bestanden:** ✅ / ❌

#### **Neue Activities:**
- [x] **Action:** Warte 10-20 Sekunden
- [x] **Erwartung:** Neue Activity erscheint mit Animation
- [x] **Formate:** "@neo hat einen Drop gekauft 🎯", etc.
- [x] **Zeit:** "gerade eben", "vor 2m", "vor 1h"
- [x] **Test Bestanden:** ✅ / ❌

#### **Close Button:**
- [x] **Action:** Klicke das X rechts oben
- [x] **Erwartung:** Feed schließt sich mit Animation
- [x] **Test Bestanden:** ✅ / ❌

---

### 4. MegaInviteSystem (Invite Section)

#### **Tab Navigation:**
- [x] **Action:** Klicke jeden der 6 Tabs:
  1. Übersicht
  2. Quests
  3. Streaks
  4. Rangliste
  5. Social
  6. Premium
- [x] **Erwartung:** Content ändert sich, aktiver Tab ist grün
- [x] **Test Bestanden:** ✅ / ❌

#### **Quick Action Button 1: "Invite teilen"**
- [x] **Action:** Klicke grünen "Invite teilen" Button
- [x] **Erwartung:** 
  - Browser Share Dialog öffnet sich (wenn verfügbar)
  - Oder: Invite Code wird kopiert + Toast
- [x] **Test Bestanden:** ✅ / ❌

#### **Quick Action Button 2: "Belohnungen"**
- [x] **Action:** Klicke lila "Belohnungen" Button
- [x] **Erwartung:** Wechselt zu "Premium" Tab
- [x] **Test Bestanden:** ✅ / ❌

#### **Quick Action Button 3: "Team"**
- [x] **Action:** Klicke blauen "Team" Button
- [x] **Erwartung:** Wechselt zu "Social" Tab
- [x] **Test Bestanden:** ✅ / ❌

#### **Quick Action Button 4: "Challenges"**
- [x] **Action:** Klicke grünen "Challenges" Button
- [x] **Erwartung:** Wechselt zu "Quests" Tab
- [x] **Test Bestanden:** ✅ / ❌

#### **Copy Invite Code:**
- [x] **Action:** Klicke auf Invite Code (im Overview Tab)
- [x] **Erwartung:** 
  - Toast: "Invite Code kopiert!"
  - Code ist in Clipboard
- [x] **Test (Paste):** Ctrl+V irgendwo → Code erscheint
- [x] **Test Bestanden:** ✅ / ❌

---

### 5. Stats Cards (4 animierte Karten)

#### **AnimatedCounter:**
- [x] **Action:** Scrolle zu Stats Section
- [x] **Erwartung:** Counter animieren von 0 zum Zielwert
- [x] **Werte:** Aktive Drops, VIP Members, Products, Erfolgsrate
- [x] **Test Bestanden:** ✅ / ❌

#### **Hover Effekte:**
- [x] **Action:** Hover über jede Card
- [x] **Erwartung:** 
  - Card wird größer (scale 1.05)
  - 3D Tilt (rotateY: 5deg)
  - Icon rotiert 360°
  - Glow-Effekt erscheint
- [x] **Test Bestanden:** ✅ / ❌

#### **Staggered Animation:**
- [x] **Action:** Refresh + scrolle zu Stats
- [x] **Erwartung:** Cards erscheinen nacheinander (nicht alle gleichzeitig)
- [x] **Test Bestanden:** ✅ / ❌

---

### 6. Limited Time Offers (3 bunte Cards)

#### **Cards Rendering:**
- [x] **Action:** Scrolle zu "Limited Time Offers"
- [x] **Erwartung:** 3 Cards sichtbar:
  1. Flash Sale (rot/orange)
  2. VIP Early Access (lila/pink)
  3. Bundle Deal (gelb/orange)
- [x] **Test Bestanden:** ✅ / ❌

#### **Hover 3D Effects:**
- [x] **Action:** Hover über jede Card
- [x] **Erwartung:** 
  - 3D Tilt (rotateX + rotateY)
  - Scale 1.05
  - Shadow intensiviert
- [x] **Test Bestanden:** ✅ / ❌

#### **Badge Animation:**
- [x] **Action:** Beobachte die Badges ("Live", "VIP", "Hot")
- [x] **Erwartung:** Pulse Animation (animate-pulse)
- [x] **Test Bestanden:** ✅ / ❌

---

### 7. Featured Drops Section (🔥 Hot Drops)

#### **Drops angezeigt:**
- [x] **Action:** Scrolle zu "Hot Drops"
- [x] **Erwartung:** 3 Featured Drops sichtbar
- [x] **Inhalt:** Name, Beschreibung, Preis, Progress Bar
- [x] **Test Bestanden:** ✅ / ❌

#### **Drop Click Navigation:**
- [x] **Action:** Klicke eine der 3 Drop Cards
- [x] **Erwartung:** 
  - Navigiert zu `/drops` (ohne Reload!)
  - trackDropClick() wird aufgerufen
- [x] **Test (Console):** `localStorage.getItem('nebula_user_preferences')` → viewedProducts sollte ID enthalten
- [x] **Test Bestanden:** ✅ / ❌

#### **Progress Bar:**
- [x] **Action:** Beobachte die Progress Bars
- [x] **Erwartung:** 
  - Zeigt Fortschritt in %
  - Grüner Gradient (accent → emerald)
  - Smooth Width Animation
- [x] **Test Bestanden:** ✅ / ❌

#### **EnhancedDropsButton:**
- [x] **Action:** Klicke "Drops" Button rechts oben in Section
- [x] **Erwartung:** 
  - Navigiert zu `/drops`
  - Live Indicator zeigt "LIVE" Badge
  - Drop Count Badge zeigt Anzahl
- [x] **Test Bestanden:** ✅ / ❌

---

### 8. Personalisierte Empfehlungen (🎯 Für dich empfohlen)

#### **Returning User Detection:**
- [x] **Action:** Simuliere Returning User:
```javascript
// Browser Console:
localStorage.setItem('nebula_user_preferences', JSON.stringify({
  favoriteCategories: [],
  viewedProducts: [
    { id: 'product-1', timestamp: Date.now() }
  ],
  clickedDrops: [],
  lastVisit: Date.now() - 86400000
}));
location.reload();
```
- [x] **Erwartung:** "Für dich empfohlen" Section erscheint
- [x] **Test Bestanden:** ✅ / ❌

#### **Product Click:**
- [x] **Action:** Klicke ein empfohlenes Produkt
- [x] **Erwartung:** 
  - Navigiert zu `/shop`
  - trackProductView() wird aufgerufen
- [x] **Test Bestanden:** ✅ / ❌

#### **Nicht sichtbar für New Users:**
- [x] **Action:** Clear LocalStorage + Refresh
- [x] **Erwartung:** Section erscheint NICHT
- [x] **Test Bestanden:** ✅ / ❌

---

### 9. Mobile Quick Actions FAB

#### **FAB sichtbar:**
- [x] **Action:** Wechsle zu Mobile View (<768px)
- [x] **Erwartung:** 
  - Floating Button rechts unten (grüner Kreis mit ⚡)
  - Fixed Position, über Bottom Navigation
- [x] **Test Bestanden:** ✅ / ❌

#### **BottomSheet öffnen:**
- [x] **Action:** Klicke den FAB
- [x] **Erwartung:** 
  - BottomSheet slide up Animation
  - Header: "⚡ Quick Actions"
  - 3 Buttons sichtbar
- [x] **Test Bestanden:** ✅ / ❌

#### **Quick Action 1: "Neue Drops checken"**
- [x] **Action:** Klicke Button
- [x] **Erwartung:** 
  - Navigiert zu `/drops`
  - BottomSheet schließt sich
- [x] **Test Bestanden:** ✅ / ❌

#### **Quick Action 2: "Shop durchstöbern"**
- [x] **Action:** Klicke Button
- [x] **Erwartung:** Navigiert zu `/shop`
- [x] **Test Bestanden:** ✅ / ❌

#### **Quick Action 3: "Mein Profil"**
- [x] **Action:** Klicke Button
- [x] **Erwartung:** Navigiert zu `/profile`
- [x] **Test Bestanden:** ✅ / ❌

#### **BottomSheet schließen:**
- [x] **Action:** Klicke außerhalb BottomSheet (Backdrop)
- [x] **Erwartung:** Sheet schließt mit Animation
- [x] **Test Bestanden:** ✅ / ❌

---

### 10. Bottom CTA Section (Bereit für deinen ersten Drop?)

#### **Button 1: "Drops entdecken"**
- [x] **Action:** Klicke grünen Button
- [x] **Erwartung:** Navigiert zu `/drops`
- [x] **Hover:** Glow Effekt + Scale 1.05
- [x] **Test Bestanden:** ✅ / ❌

#### **Button 2: "VIP Lounge"**
- [x] **Action:** Klicke lila Button
- [x] **Erwartung:** Navigiert zu `/vip`
- [x] **Hover:** Scale 1.05
- [x] **Test Bestanden:** ✅ / ❌

---

### 11. Global Navigation

#### **Desktop - TabBar (Oben):**
Teste jeden Link:
- [x] **Home** → `/` ✅ / ❌
- [x] **Drops** → `/drops` (Featured Badge) ✅ / ❌
- [x] **Shop** → `/shop` ✅ / ❌
- [x] **Cookies** → `/cookie-clicker` (Featured Badge) ✅ / ❌
- [x] **VIP** → `/vip` ✅ / ❌
- [x] **Profil** → `/profile` ✅ / ❌
- [x] **Cart** → `/cart` (Badge zeigt Anzahl) ✅ / ❌
- [x] **Tickets** → `/support` ✅ / ❌

#### **Mobile - Bottom Navigation:**
Teste jeden Tab:
- [x] **Home** → `/` ✅ / ❌
- [x] **Shop** → `/shop` ✅ / ❌
- [x] **Drops** → `/drops` ✅ / ❌
- [x] **Game** → `/cookie-clicker` ✅ / ❌
- [x] **Profile** → `/profile` ✅ / ❌

**Wichtig:** Navigation sollte **OHNE Page Reload** funktionieren!

---

## 🎨 Animation Tests

### Reduced Motion Support:
```javascript
// Browser DevTools → Console:
// Aktiviere Reduced Motion
document.documentElement.classList.add('reduce-motion');
// Erwartung: Keine Animationen mehr
```
- [x] **Test Bestanden:** ✅ / ❌

### Performance (60 FPS):
- [x] **Action:** DevTools → Performance Tab → Record während Scroll
- [x] **Erwartung:** Keine Frame Drops, smooth 60 FPS
- [x] **Test Bestanden:** ✅ / ❌

---

## 🔧 LocalStorage Funktionen

### User Preferences:
```javascript
// Check LocalStorage:
JSON.parse(localStorage.getItem('nebula_user_preferences'))
// Sollte enthalten:
// - viewedProducts: []
// - clickedDrops: []
// - favoriteCategories: []
// - lastVisit: timestamp
```
- [x] **Test Bestanden:** ✅ / ❌

### Daily Streak:
```javascript
JSON.parse(localStorage.getItem('dailyStreak'))
// Sollte enthalten:
// - count: number
// - lastDate: string
```
- [x] **Test Bestanden:** ✅ / ❌

### Last Daily Claim:
```javascript
localStorage.getItem('lastDailyClaim')
// Sollte sein: Date String
```
- [x] **Test Bestanden:** ✅ / ❌

---

## 🐛 Edge Cases & Error Handling

### 1. Offline Modus:
- [x] **Action:** DevTools → Network Tab → Offline
- [x] **Erwartung:** App funktioniert (cached), Graceful Fallback
- [x] **Test Bestanden:** ✅ / ❌

### 2. Console Errors:
- [x] **Action:** Öffne Console (F12)
- [x] **Erwartung:** Keine Errors während Navigation
- [x] **Test Bestanden:** ✅ / ❌

### 3. Lange Namen/Texte:
- [x] **Action:** Ändere Invite Code zu sehr langem String
- [x] **Erwartung:** Text truncated, kein Layout Break
- [x] **Test Bestanden:** ✅ / ❌

---

## 📊 Performance Checklist

### Lighthouse Audit:
```bash
# 1. Production Build
pnpm build
pnpm preview

# 2. Öffne http://localhost:4173

# 3. DevTools → Lighthouse Tab → Analyze page load
```

**Erwartete Scores:**
- [x] Performance: **90+** ✅ / ❌
- [x] Accessibility: **95+** ✅ / ❌
- [x] Best Practices: **95+** ✅ / ❌
- [x] SEO: **90+** ✅ / ❌

### Bundle Size:
```bash
# Check build output
pnpm build
# Haupt-Bundle sollte < 250KB sein
```
- [x] **Test Bestanden:** ✅ / ❌

### Load Time:
- [x] **First Contentful Paint:** < 1.5s ✅ / ❌
- [x] **Time to Interactive:** < 3s ✅ / ❌
- [x] **Total Load Time:** < 5s ✅ / ❌

---

## 📱 Mobile-Specific Tests

### Touch Targets:
- [x] **Action:** Check alle Buttons auf Mobile
- [x] **Erwartung:** Mindestens 44x44px touch-target
- [x] **Test Bestanden:** ✅ / ❌

### Pull-to-Refresh:
- [x] **Action:** Swipe down von oben
- [x] **Erwartung:** Page reloaded
- [x] **Test Bestanden:** ✅ / ❌

### Safe Area (iPhone):
- [x] **Action:** Teste auf iPhone mit Notch
- [x] **Erwartung:** Content nicht unter Notch/Home Indicator
- [x] **Test Bestanden:** ✅ / ❌

### Orientation Change:
- [x] **Action:** Rotiere Device (Portrait ↔ Landscape)
- [x] **Erwartung:** Layout passt sich an
- [x] **Test Bestanden:** ✅ / ❌

---

## ✅ Final Checklist

### Kritische Funktionen:
- [ ] Alle Navigation Buttons funktionieren ohne Reload
- [ ] Daily Reward erscheint & Coins werden gutgeschrieben
- [ ] Live Activity Feed zeigt neue Activities
- [ ] MegaInvite Quick Actions navigieren richtig
- [ ] Stats Counter animieren korrekt
- [ ] Featured Drops sind klickbar
- [ ] Mobile FAB öffnet BottomSheet
- [ ] Personalisierung funktioniert für Returning Users

### UX & Performance:
- [ ] Alle Hover-Effekte funktionieren
- [ ] Animationen sind smooth (60 FPS)
- [ ] Reduced Motion wird respektiert
- [ ] Mobile Touch Targets ≥ 44px
- [ ] Keine Console Errors
- [ ] Lighthouse Score ≥ 90

### Cross-Browser:
- [ ] Chrome (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Edge (Desktop)

---

## 🎉 Alles getestet?

**Wenn alle Tests ✅ sind:**
- Homepage ist **Production-Ready**! 🚀
- Alle Buttons und Funktionen arbeiten perfekt
- Mobile & Desktop optimiert
- Performance auf höchstem Niveau

**Bei ❌ Tests:**
- Checke Console für Errors
- Lese `BUGFIX_REPORT.md`
- Führe `pnpm test` aus

---

**Happy Testing! 🧪✨**

