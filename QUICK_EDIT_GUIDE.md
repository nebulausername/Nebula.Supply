# ⚡ Quick Edit Guide - Wartungsmodus

## 🎯 Die 3 wichtigsten Dateien

### 1️⃣ Produkte ändern
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
// Shop-Produkte
export const shopProducts = [
  {
    id: 'airpods',
    category: 'audio',
    hint: 'Premium Audio',           // ← Text auf Badge
    priceRange: { min: 45, max: 60 }, // ← Preis
    minQuantity: 1,                   // ← Min. Anzahl
    deliveryTime: '1-5 Werktage',    // ← Lieferzeit
    description: 'AirPods Gen 1-4'   // ← Beschreibung
  },
  // Weitere hinzufügen...
];

// Drop-Produkte
export const dropProducts = [
  {
    id: 'waspe-100k',
    category: 'vape',
    hint: 'Waspe 100K',
    priceRange: 15,
    minQuantity: 2,
    deliveryTime: '9-15 Tage',
    description: '4 Sorten in einem Drop'
  },
  // Weitere hinzufügen...
];
```

### 2️⃣ Farben & Icons ändern
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
export const categoryMetadata = {
  audio: {
    icon: '🎧',                              // ← Emoji hier
    gradient: 'from-blue-500 to-cyan-500',  // ← Farben hier
    label: 'Audio'
  },
  // Weitere Kategorien...
};
```

### 3️⃣ Text & Layout ändern
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 96-98 - Haupttitel:
{status.title || 'Wartungsarbeiten'}  // ← Fallback ändern

// Zeile 100-102 - Untertitel:
{status.message || 'Wir arbeiten gerade an Verbesserungen...'}

// Zeile 161-162 - Shop-Titel:
<h3>Shop</h3>
<p>Premium Produkte</p>

// Zeile 192-193 - Drops-Titel:
<h3>Drops</h3>
<p>Limitierte Releases</p>
```

---

## 📸 Bilder einfügen

### Schritt 1: Ordner erstellen (falls nicht vorhanden)
```
apps/web/public/images/
├── products/    ← Shop-Bilder hier
├── drops/       ← Drop-Bilder hier
└── maintenance/ ← Sonstige Bilder
```

### Schritt 2: Bilder hochladen
Kopiere deine Bilder in die Ordner:
- `apps/web/public/images/products/airpods.webp`
- `apps/web/public/images/products/airforce.webp`
- etc.

### Schritt 3: In Produkten verwenden
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
export const shopProducts = [
  {
    id: 'airpods',
    category: 'audio',
    hint: 'Premium Audio',
    priceRange: { min: 45, max: 60 },
    minQuantity: 1,
    imageUrl: '/images/products/airpods.webp'  // ← NEU
  },
];
```

### Schritt 4: Card anpassen (Bild statt Fragezeichen)
**Datei**: `apps/web/src/components/maintenance/EnhancedMysteryCard.tsx`

Ersetze Zeile 52-80 mit:
```typescript
<div className="aspect-square relative overflow-hidden">
  {product.imageUrl ? (
    <img 
      src={product.imageUrl} 
      alt={product.hint}
      className="w-full h-full object-cover opacity-30 blur-sm"
    />
  ) : (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#1E293B] to-[#111827]">
      <HelpCircle className="w-20 h-20 text-[#0BF7BC]" />
    </div>
  )}
</div>
```

---

## 🎨 Schnelle Design-Änderungen

### Neon-Farbe ändern
**Datei**: `apps/web/src/components/maintenance/EnhancedMysteryCard.tsx`

```typescript
// Zeile 60 - Border-Farbe:
border-[#0BF7BC]  // Ion Mint (Standard)
border-[#FF5EDB]  // Stellar Pink
border-[#A78BFA]  // Purple
border-[#FBBF24]  // Amber
```

### Grid-Größe ändern
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 167:
grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5

// Größer (weniger Spalten):
grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

// Kleiner (mehr Spalten):
grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
```

### Hintergrund ändern
**Datei**: `apps/web/src/pages/MaintenancePage.tsx`

```typescript
// Zeile 72:
bg-[#0A0A0A]  // Schwarz (Standard)
bg-gradient-to-br from-[#0A0A0A] via-[#1a1a2e] to-[#16213e]  // Gradient
bg-black  // Komplett schwarz
```

---

## ➕ Neues Produkt hinzufügen

### Beispiel: Jordan Sneakers

**Schritt 1**: Bild hochladen
```
apps/web/public/images/products/jordans.webp
```

**Schritt 2**: Produkt hinzufügen
**Datei**: `apps/web/src/data/maintenanceProducts.ts`

```typescript
export const shopProducts = [
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

**Fertig!** Produkt erscheint automatisch.

---

## 🔧 Admin-Interface nutzen

### Wartungsmodus aktivieren:
1. Öffne: `http://localhost:5273`
2. Sidebar → "Maintenance Mode"
3. Toggle aktivieren
4. Titel: "Wartungsarbeiten"
5. Nachricht: "Wir arbeiten gerade an Verbesserungen..."
6. Optional: Zeit & Fortschritt
7. "Status speichern" klicken

### Status-Updates hinzufügen:
1. Im Admin-Interface nach unten scrollen
2. "Neues Update..." eingeben
3. Typ wählen (Info/Warnung/Erfolg)
4. "Hinzufügen" klicken

---

## 📍 Datei-Locations (Übersicht)

```
NebulaCodex-main/
├── apps/
│   └── web/
│       ├── public/
│       │   └── images/              ← BILDER HIER
│       │       ├── products/
│       │       ├── drops/
│       │       └── maintenance/
│       └── src/
│           ├── data/
│           │   └── maintenanceProducts.ts  ← PRODUKTE HIER
│           ├── pages/
│           │   └── MaintenancePage.tsx     ← LAYOUT HIER
│           └── components/maintenance/
│               └── EnhancedMysteryCard.tsx ← CARD-DESIGN HIER
│
└── docs/
    └── MAINTENANCE_CUSTOMIZATION_GUIDE.md  ← VOLLSTÄNDIGE ANLEITUNG
```

---

## ✅ Checkliste

- [ ] Produkte in `maintenanceProducts.ts` angepasst
- [ ] Bilder in `public/images/` hochgeladen
- [ ] Farben/Icons in `categoryMetadata` geändert
- [ ] Text in `MaintenancePage.tsx` angepasst
- [ ] Vorschau getestet: `http://localhost:5173/maintenance`
- [ ] Admin-Interface getestet: `http://localhost:5273`

---

## 🆘 Hilfe

**Vollständige Anleitung**: `docs/MAINTENANCE_CUSTOMIZATION_GUIDE.md`

**Probleme?**
- Bilder werden nicht angezeigt → Pfad prüfen (beginnt mit `/`)
- Änderungen nicht sichtbar → Browser neu laden (Ctrl+F5)
- Fehler in Console → Datei-Syntax prüfen (Kommas, Klammern)

---

**Los geht's!** 🚀


