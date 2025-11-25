# 🎨 Maintenance Mode - Anpassungs-Guide

## 📍 Wo finde ich was?

### 1. Produkte ändern
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
// Shop-Produkte bearbeiten
export const shopProducts: MaintenanceProduct[] = [
  {
    id: 'airpods',                    // Eindeutige ID
    category: 'audio',                // Kategorie (siehe unten)
    hint: 'Premium Audio',            // Text auf Badge
    priceRange: { min: 45, max: 60 }, // Preis oder Preis-Range
    minQuantity: 1,                   // Mindestbestellmenge
    deliveryTime: '1-5 Werktage',    // Lieferzeit
    description: 'AirPods Gen 1-4'   // Beschreibung
  },
  // Weitere Produkte...
];

// Drop-Produkte bearbeiten
export const dropProducts: MaintenanceProduct[] = [
  {
    id: 'waspe-100k',
    category: 'vape',
    hint: 'Waspe 100K',
    priceRange: 15,                   // Einzelpreis
    minQuantity: 2,
    deliveryTime: '9-15 Tage',
    description: '4 Sorten in einem Drop'
  },
  // Weitere Drops...
];
```

### 2. Kategorien & Farben ändern
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
export const categoryMetadata: Record<ProductCategory, {
  icon: string;      // Emoji
  gradient: string;  // Tailwind Gradient
  label: string;     // Label
}> = {
  audio: {
    icon: '🎧',      // ← Emoji hier ändern
    gradient: 'from-blue-500 to-cyan-500',  // ← Farben hier ändern
    label: 'Audio'
  },
  sneakers: {
    icon: '👟',
    gradient: 'from-orange-500 to-red-500',
    label: 'Sneakers'
  },
  // Weitere Kategorien...
};
```

### 3. Bilder einfügen (statt Fragezeichen)

#### Option A: Echte Produktbilder (Empfohlen)
**Datei**: `apps/web/src/components/maintenance/EnhancedMysteryCard.tsx`

```typescript
// Zeile 52-60 ersetzen:
<div className="aspect-square relative bg-gradient-to-br from-[#1E293B] to-[#111827] flex items-center justify-center">
  {/* Produktbild statt Fragezeichen */}
  {product.imageUrl ? (
    <img 
      src={product.imageUrl} 
      alt={product.hint}
      className="w-full h-full object-cover opacity-30 blur-sm"
    />
  ) : (
    <>
      {/* Neon Border */}
      <motion.div
        variants={glowVariants}
        initial="initial"
        animate="animate"
        className="absolute inset-4 border-2 border-[#0BF7BC] rounded-xl"
        style={{
          boxShadow: '0 0 20px rgba(11, 247, 188, 0.5)'
        }}
      />
      
      {/* Fragezeichen */}
      <motion.div
        variants={questionMarkVariants}
        animate="animate"
        className="relative z-10"
      >
        <HelpCircle className="w-20 h-20 text-[#0BF7BC]" />
        <span className="text-4xl">{category.icon}</span>
      </motion.div>
    </>
  )}
</div>
```

#### Option B: Bilder in Datenstruktur
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
export interface MaintenanceProduct {
  id: string;
  category: ProductCategory;
  hint: string;
  priceRange: { min: number; max: number } | number;
  minQuantity: number;
  deliveryTime?: string;
  description?: string;
  imageUrl?: string;  // ← NEU: Bild-URL hinzufügen
}

// Dann in Produkten verwenden:
export const shopProducts: MaintenanceProduct[] = [
  {
    id: 'airpods',
    category: 'audio',
    hint: 'Premium Audio',
    priceRange: { min: 45, max: 60 },
    minQuantity: 1,
    deliveryTime: '1-5 Werktage',
    description: 'AirPods Gen 1-4',
    imageUrl: '/images/products/airpods.webp'  // ← Bild hier
  },
];
```

### 4. Bilder hochladen

#### Ordner-Struktur:
```
apps/web/public/
└── images/
    ├── products/          # Produktbilder
    │   ├── airpods.webp
    │   ├── airforce.webp
    │   ├── hoodie.webp
    │   └── ...
    ├── drops/             # Drop-Bilder
    │   ├── vape.webp
    │   ├── bundle.webp
    │   └── ...
    └── maintenance/       # Maintenance-Grafiken
        ├── logo.svg
        └── background.webp
```

#### Bilder optimieren:
```bash
# WebP konvertieren (beste Performance)
# Online: https://squoosh.app
# Oder mit Tool:
npm install -g sharp-cli
sharp input.jpg -o output.webp
```

### 5. Wartungsseite Design ändern

#### Hintergrund-Farbe
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 72-75:
<div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
  {/* Ändern zu: */}
  <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1a1a2e] to-[#16213e] text-white relative overflow-hidden">
```

#### Glow-Effekte
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 76-79:
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(11,247,188,0.15),transparent_70%)] blur-3xl" />

// Farbe ändern:
bg-[radial-gradient(circle,rgba(255,94,219,0.15),transparent_70%)]  // Pink
bg-[radial-gradient(circle,rgba(139,92,246,0.15),transparent_70%)]  // Purple
```

### 6. Card-Design anpassen

#### Neon-Farbe ändern
**Datei**: `apps/web/src/components/maintenance/EnhancedMysteryCard.tsx`

```typescript
// Zeile 55-60:
border-[#0BF7BC]  // ← Ion Mint (Standard)

// Ändern zu:
border-[#FF5EDB]  // Stellar Pink
border-[#A78BFA]  // Purple
border-[#FBBF24]  // Amber
```

#### Card-Größe
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 165-168:
<div className={cn(
  "grid gap-4 md:gap-6",
  isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
)}>

// Größer machen:
isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

// Kleiner machen:
isMobile ? "grid-cols-3" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
```

### 7. Animationen anpassen

#### Geschwindigkeit
**Datei**: `apps/web/src/components/maintenance/EnhancedMysteryCard.tsx`

```typescript
// Zeile 24-34 - Card Entrance:
transition: {
  delay: i * 0.1,      // ← Verzögerung zwischen Cards
  duration: 0.4,       // ← Animations-Dauer
  ease: [0.16, 1, 0.3, 1]
}

// Zeile 38-46 - Glow Pulse:
transition: {
  duration: 2,         // ← Pulse-Geschwindigkeit
  repeat: Infinity,
  ease: "easeInOut"
}
```

#### Hover-Effekt
**Datei**: `apps/web/src/components/maintenance/EnhancedMysteryCard.tsx`

```typescript
// Zeile 58:
whileHover={{ y: -8, scale: 1.02 }}

// Stärker:
whileHover={{ y: -12, scale: 1.05 }}

// Schwächer:
whileHover={{ y: -4, scale: 1.01 }}
```

### 8. Text & Nachrichten ändern

#### Haupttitel
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 96-98:
<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#0BF7BC] via-white to-[#FF5EDB] bg-clip-text text-transparent">
  {status.title || 'Wartungsarbeiten'}  // ← Fallback hier ändern
</h1>
```

#### Untertitel
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 100-102:
<p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
  {status.message || 'Wir arbeiten gerade an Verbesserungen. Bitte habe etwas Geduld.'}
</p>
```

#### Section-Titel
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 161-162:
<h3 className="text-lg md:text-xl font-semibold">Shop</h3>
<p className="text-xs md:text-sm text-white/60">Premium Produkte</p>

// Ändern zu:
<h3 className="text-lg md:text-xl font-semibold">Unser Shop</h3>
<p className="text-xs md:text-sm text-white/60">Exklusive Produkte bald verfügbar</p>
```

---

## 🎨 Komplettes Beispiel: Neues Produkt hinzufügen

### Schritt 1: Bild vorbereiten
```bash
# Bild in Ordner kopieren:
apps/web/public/images/products/jordans.webp
```

### Schritt 2: Produkt hinzufügen
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
export const shopProducts: MaintenanceProduct[] = [
  // ... bestehende Produkte
  {
    id: 'jordans',
    category: 'sneakers',
    hint: 'Jordan Classics',
    priceRange: { min: 80, max: 120 },
    minQuantity: 1,
    deliveryTime: '7-14 Werktage',
    description: 'Air Jordan 1-4',
    imageUrl: '/images/products/jordans.webp'
  }
];
```

### Schritt 3: Fertig!
Produkt erscheint automatisch auf der Wartungsseite.

---

## 🎯 Quick-Änderungen

### Mehr Produkte anzeigen
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

Einfach weitere Objekte zum Array hinzufügen:
```typescript
export const shopProducts: MaintenanceProduct[] = [
  { /* Produkt 1 */ },
  { /* Produkt 2 */ },
  { /* Produkt 3 */ },
  { /* Produkt 4 */ },
  { /* Produkt 5 */ },
  { /* Produkt 6 */ },  // ← NEU
  { /* Produkt 7 */ },  // ← NEU
];
```

### Weniger Produkte anzeigen
Einfach Produkte aus dem Array entfernen oder auskommentieren:
```typescript
export const shopProducts: MaintenanceProduct[] = [
  { /* Produkt 1 */ },
  { /* Produkt 2 */ },
  // { /* Produkt 3 */ },  // ← Auskommentiert
];
```

### Reihenfolge ändern
Einfach die Objekte im Array verschieben:
```typescript
export const shopProducts: MaintenanceProduct[] = [
  { id: 'watches', /* ... */ },  // ← Jetzt zuerst
  { id: 'airpods', /* ... */ },
  { id: 'airforce', /* ... */ },
];
```

---

## 📂 Datei-Übersicht

### Wichtigste Dateien:

```
apps/web/src/
├── data/
│   └── maintenanceProducts.ts          ← PRODUKTE HIER ÄNDERN
├── pages/
│   └── MaintenancePage.tsx             ← LAYOUT & TEXT HIER
├── components/maintenance/
│   ├── EnhancedMysteryCard.tsx         ← CARD-DESIGN HIER
│   ├── StatusBadge.tsx                 ← Status-Badge
│   ├── UpdateCard.tsx                  ← Update-Karten
│   └── ProgressOrbit.tsx               ← Fortschrittsbalken
└── public/
    └── images/
        ├── products/                    ← PRODUKTBILDER HIER
        └── drops/                       ← DROP-BILDER HIER
```

---

## 🎨 Design-Vorlagen

### Vorlage 1: Minimalistisch
```typescript
// EnhancedMysteryCard.tsx
// Entferne: Glow-Effekte, Animationen
// Behalte: Einfache Border, Statisches Icon
```

### Vorlage 2: Maximal Glow
```typescript
// EnhancedMysteryCard.tsx - Zeile 64:
<div className="absolute inset-0 bg-gradient-to-br from-[#0BF7BC]/40 to-[#FF5EDB]/40 blur-2xl opacity-100" />
```

### Vorlage 3: Dunkler Modus
```typescript
// MaintenancePage.tsx - Zeile 72:
<div className="min-h-screen bg-black text-white">
```

### Vorlage 4: Heller Modus
```typescript
// MaintenancePage.tsx - Zeile 72:
<div className="min-h-screen bg-white text-black">
// Dann alle text-white zu text-black ändern
```

---

## 🚀 Erweiterte Anpassungen

### Eigene Kategorie hinzufügen
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
// 1. Type erweitern:
export type ProductCategory = 'audio' | 'sneakers' | 'fashion' | 'accessories' | 'tech' | 'vape' | 'bundle' | 'mystery' | 'jewelry';  // ← jewelry hinzugefügt

// 2. Metadata hinzufügen:
export const categoryMetadata = {
  // ... bestehende Kategorien
  jewelry: {
    icon: '💎',
    gradient: 'from-yellow-400 to-amber-600',
    label: 'Schmuck'
  }
};

// 3. In Produkt verwenden:
{
  id: 'gold-chain',
  category: 'jewelry',  // ← Neue Kategorie
  hint: 'Gold Chain',
  priceRange: 150,
  minQuantity: 1
}
```

### Custom Animation hinzufügen
**Datei**: `apps/web/src/components/maintenance/EnhancedMysteryCard.tsx`

```typescript
// Nach Zeile 50 hinzufügen:
const customVariants = {
  animate: {
    rotate: [0, 360],
    scale: [1, 1.1, 1],
    transition: {
      duration: 5,
      repeat: Infinity
    }
  }
};

// Dann verwenden:
<motion.div variants={customVariants} animate="animate">
  {/* Dein Content */}
</motion.div>
```

---

## 💡 Tipps & Tricks

### Performance
- Bilder als WebP speichern (kleinere Dateigröße)
- Bilder komprimieren (max 200KB pro Bild)
- Lazy Loading nutzen (bereits implementiert)

### Design
- Maximal 3 Farben pro Card
- Konsistente Spacing verwenden
- Hover-Effekte subtil halten

### UX
- Mindestens 44px Touch-Targets (Mobile)
- Kontrast-Ratio > 4.5:1 beachten
- Loading-States nicht vergessen

---

## 🆘 Häufige Probleme

### Bilder werden nicht angezeigt
```typescript
// Prüfen:
1. Liegt Bild in apps/web/public/images/?
2. Pfad korrekt? (beginnt mit /)
3. Dateiname korrekt? (case-sensitive!)
```

### Animationen ruckeln
```typescript
// Lösung: GPU-Beschleunigung
.card {
  will-change: transform;
  transform: translateZ(0);
}
```

### Farben passen nicht
```typescript
// Tailwind Farben anpassen in:
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'neon-mint': '#0BF7BC',
      'stellar-pink': '#FF5EDB'
    }
  }
}
```

---

## ✅ Checkliste nach Änderungen

- [ ] Produkte aktualisiert
- [ ] Bilder hochgeladen
- [ ] Farben angepasst
- [ ] Text geändert
- [ ] Mobile getestet
- [ ] Desktop getestet
- [ ] Performance geprüft
- [ ] Vorschau angeschaut

---

**Viel Spaß beim Anpassen!** 🎨


