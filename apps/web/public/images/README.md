# 📸 Bilder-Ordner

## Struktur

```
images/
├── products/       # Shop-Produktbilder
│   ├── airpods.webp
│   ├── airforce.webp
│   ├── hoodie.webp
│   ├── cap.webp
│   └── watch.webp
│
├── drops/          # Drop-Produktbilder
│   ├── vape.webp
│   ├── bundle.webp
│   ├── mystery-box.webp
│   └── tech-gadget.webp
│
└── maintenance/    # Maintenance-Grafiken
    ├── logo.svg
    └── background.webp
```

## Verwendung

### In Produktdaten:
```typescript
// apps/web/src/data/maintenanceProducts.ts
{
  id: 'airpods',
  imageUrl: '/images/products/airpods.webp'
}
```

### Direkt in Komponenten:
```tsx
<img src="/images/products/airpods.webp" alt="AirPods" />
```

## Empfehlungen

- **Format**: WebP (beste Kompression)
- **Größe**: 800x800px (quadratisch)
- **Dateigröße**: < 200KB pro Bild
- **Benennung**: lowercase, keine Leerzeichen

## Tools zum Konvertieren

- Online: https://squoosh.app
- CLI: `sharp-cli` oder `imagemagick`


