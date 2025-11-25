import type { Product } from "../types";

export const products: Product[] = [
  {
    id: "prod-galaxy-runner",
    name: "Galaxy Runner V2",
    categoryId: "cat-shoes",
    sku: "SHOE-GALAXY-RUNNER-V2",
    description: "Leichter Sneaker mit Nebula Glow Sohle und austauschbaren Patches.",
    price: 159,
    pricingTiers: [
      { minQuantity: 2, price: 149 },
      { minQuantity: 4, price: 139 }
    ],
    currency: "EUR",
    leadTime: "2_days",
    inventory: 0,
    interest: 128,
    variants: [
      {
        type: "color",
        name: "Farbe",
        options: [
          { id: "col-aurora", label: "Aurora", value: "aurora", swatch: "#5EE7DF" },
          { id: "col-midnight", label: "Midnight", value: "midnight", swatch: "#111827" },
          { id: "col-crimson", label: "Crimson", value: "crimson", swatch: "#EF4444" }
        ]
      },
      {
        type: "size",
        name: "Größe",
        options: [
          { id: "size-40", label: "40", value: "40" },
          { id: "size-41", label: "41", value: "41" },
          { id: "size-42", label: "42", value: "42" },
          { id: "size-43", label: "43", value: "43" },
          { id: "size-44", label: "44", value: "44" }
        ]
      }
    ],
    media: [
      { id: "img-aurora", url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop&crop=center", color: "aurora", alt: "Galaxy Runner Aurora" },
      { id: "img-midnight", url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop&crop=center&sat=-50&brightness=0.3", color: "midnight", alt: "Galaxy Runner Midnight" },
      { id: "img-crimson", url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop&crop=center&sat=50&hue=0", color: "crimson", alt: "Galaxy Runner Crimson" }
    ],
    badges: ["Neu", "Limitierte Edition"],
    popularity: 0.92,
    isNew: true,
    shippingOptions: [
      { id: "ship-de", region: "DE", label: "Deutschland", leadTime: "2-4 Tage", priceAdjustment: 20, price: 9.9, currency: "EUR" },
      { id: "ship-eu", region: "EU", label: "Europa", leadTime: "3-7 Tage", priceAdjustment: 10, price: 11.9, currency: "EUR" },
      { id: "ship-cn", region: "CN", label: "China", leadTime: "8-15 Tage", priceAdjustment: -20, price: 12.5, currency: "EUR" }
    ],
    deliveryEstimates: {
      DE: "2-3 Tage",
      EU: "3-6 Tage"
    },
    rating: {
      average: 4.8,
      count: 212,
      breakdown: { 5: 180, 4: 24, 3: 6, 2: 2 },
      featuredReviewId: "rev-galaxy-runner-1"
    },
    reviewsPreview: [
      {
        id: "rev-galaxy-runner-1",
        author: "Lena K.",
        rating: 5,
        headline: "Glow Effekt ist insane",
        body: "Super leicht und die Sohle leuchtet bei jedem Schritt.",
        createdAt: "2025-09-10T18:45:00.000Z",
        locale: "DE",
        verified: true
      },
      {
        id: "rev-galaxy-runner-2",
        author: "Murat S.",
        rating: 4,
        headline: "Mega bequem",
        body: "Fallen etwas kleiner aus, aber Komfort top.",
        createdAt: "2025-09-14T09:20:00.000Z",
        locale: "DE",
        verified: true
      }
    ],
    socialProof: {
      interestDelta24h: 37,
      purchases24h: 18,
      viewersLive: 26,
      badges: ["Verifiziertes Material", "Gratis Rückversand"],
      lastPurchaseAgo: "vor 12 Minuten"
    },
    referralCampaign: {
      id: "ref-galaxy-runner",
      title: "Glow Squad Bonus",
      description: "Überzeuge deine Crew und kassiere Rewards.",
      missions: [
        {
          id: "ref-galaxy-1",
          required: 1,
          rewardLabel: "-20 € Sofort-Rabatt",
          rewardValue: 20,
          description: "1 Freund bestellt den Galaxy Runner"
        },
        {
          id: "ref-galaxy-2",
          required: 2,
          rewardLabel: "-50% auf deinen Paar",
          rewardValue: 50,
          description: "2 Freunde kaufen innerhalb von 48h"
        },
        {
          id: "ref-galaxy-3",
          required: 3,
          rewardLabel: "AirPods Nebula Edition gratis",
          description: "3 Freunde sichern sich den Drop – du bekommst unsere AirPods Edition"
        }
      ],
      expiresAt: "2025-10-01T21:59:59.000Z",
      termsUrl: "/legal/referral"
    },
    limitedUntil: "2025-09-30T21:00:00.000Z",
    onRequest: true
  },
  {
    id: "prod-hyper-tee",
    name: "Hyperwave Tee",
    categoryId: "cat-tshirt",
    sku: "TSHIRT-HYPERWAVE",
    description: "Oversized Shirt mit Glow-in-the-Dark Print und weicher Bamboo Cotton Mischung.",
    price: 59,
    currency: "EUR",
    leadTime: "same_day",
    inventory: 0,
    interest: 64,
    variants: [
      {
        type: "color",
        name: "Farbe",
        options: [
          { id: "col-black", label: "Black", value: "black", swatch: "#0F172A" },
          { id: "col-mint", label: "Mint", value: "mint", swatch: "#10B981" }
        ]
      },
      {
        type: "size",
        name: "Größe",
        options: [
          { id: "size-s", label: "S", value: "S" },
          { id: "size-m", label: "M", value: "M" },
          { id: "size-l", label: "L", value: "L" },
          { id: "size-xl", label: "XL", value: "XL" }
        ]
      }
    ],
    media: [
      { id: "img-black", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop&crop=center", color: "black", alt: "Hyperwave Tee Schwarz" },
      { id: "img-mint", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=600&fit=crop&crop=center&sat=50&hue=120", color: "mint", alt: "Hyperwave Tee Mint" }
    ],
    badges: ["Coins +50"],
    popularity: 0.78,
    shippingOptions: [
      { id: "ship-de", region: "DE", label: "Deutschland", leadTime: "1-3 Tage", priceAdjustment: 20, price: 5.9, currency: "EUR" },
      { id: "ship-eu", region: "EU", label: "Europa", leadTime: "3-6 Tage", priceAdjustment: 10, price: 7.9, currency: "EUR" }
    ],
    onRequest: true
  },
  {
    id: "prod-shadow-pants",
    name: "Shadow Cargo Pants",
    categoryId: "cat-pants",
    sku: "PANTS-SHADOW",
    description: "Techwear Cargo mit wasserabweisendem Finish, Magnetverschluss und versteckten Taschen.",
    price: 129,
    currency: "EUR",
    leadTime: "1_week",
    inventory: 0,
    interest: 48,
    variants: [
      {
        type: "color",
        name: "Farbe",
        options: [
          { id: "col-graphite", label: "Graphite", value: "graphite", swatch: "#4B5563" },
          { id: "col-olive", label: "Olive", value: "olive", swatch: "#6B8E23" }
        ]
      },
      {
        type: "size",
        name: "Bundweite",
        options: [
          { id: "size-30", label: "30", value: "30" },
          { id: "size-32", label: "32", value: "32" },
          { id: "size-34", label: "34", value: "34" },
          { id: "size-36", label: "36", value: "36" }
        ]
      }
    ],
    media: [
      { id: "img-graphite", url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop&crop=center", color: "graphite", alt: "Shadow Cargo Graphite" },
      { id: "img-olive", url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop&crop=center&sat=50&hue=60", color: "olive", alt: "Shadow Cargo Olive" }
    ],
    badges: ["Restock"],
    popularity: 0.66,
    shippingOptions: [
      { id: "ship-de", region: "DE", label: "Deutschland", leadTime: "2-4 Tage", priceAdjustment: 20, price: 8.9, currency: "EUR" },
      { id: "ship-cn", region: "CN", label: "China", leadTime: "10-16 Tage", priceAdjustment: -20, price: 11.9, currency: "EUR" }
    ],
    onRequest: true
  },
  {
    id: "prod-aurora-short",
    name: "Aurora Shorts",
    categoryId: "cat-shorts",
    sku: "SHORT-AURORA",
    description: "Kurze Hose mit reflektierenden Panels, Mesh-Inlay und Magnetverschluss.",
    price: 79,
    currency: "EUR",
    leadTime: "2_days",
    inventory: 0,
    interest: 51,
    variants: [
      {
        type: "color",
        name: "Farbe",
        options: [
          { id: "col-neon", label: "Neon", value: "neon", swatch: "#14B8A6" },
          { id: "col-void", label: "Void", value: "void", swatch: "#0F172A" }
        ]
      },
      {
        type: "size",
        name: "Größe",
        options: [
          { id: "size-s", label: "S", value: "S" },
          { id: "size-m", label: "M", value: "M" },
          { id: "size-l", label: "L", value: "L" },
          { id: "size-xl", label: "XL", value: "XL" }
        ]
      }
    ],
    media: [
      { id: "img-neon", url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop&crop=center&sat=50&hue=120", color: "neon", alt: "Aurora Short Neon" },
      { id: "img-void", url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=600&fit=crop&crop=center&sat=-50&brightness=0.3", color: "void", alt: "Aurora Short Void" }
    ],
    popularity: 0.74,
    shippingOptions: [
      { id: "ship-de", region: "DE", label: "Deutschland", leadTime: "2-4 Tage", priceAdjustment: 20, price: 6.9, currency: "EUR" },
      { id: "ship-eu", region: "EU", label: "Europa", leadTime: "4-7 Tage", priceAdjustment: 10, price: 8.9, currency: "EUR" }
    ],
    onRequest: true
  },
  {
    id: "prod-quantum-cap",
    name: "Quantum Cap",
    categoryId: "cat-caps",
    sku: "CAP-QUANTUM",
    description: "Schwarze Cap mit nebula reflektierendem Logo und verstecktem NFC-Tag.",
    price: 39,
    currency: "EUR",
    leadTime: "same_day",
    inventory: 0,
    interest: 33,
    variants: [
      {
        type: "color",
        name: "Farbe",
        options: [
          { id: "col-black", label: "Black", value: "black", swatch: "#0F172A" },
          { id: "col-white", label: "White", value: "white", swatch: "#E5E7EB" }
        ]
      }
    ],
    media: [
      { id: "img-black", url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=600&fit=crop&crop=center", color: "black", alt: "Quantum Cap Schwarz" },
      { id: "img-white", url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=600&fit=crop&crop=center&sat=-20&brightness=1.2", color: "white", alt: "Quantum Cap Weiß" }
    ],
    badges: ["Coins +25"],
    popularity: 0.58,
    shippingOptions: [
      { id: "ship-de", region: "DE", label: "Deutschland", leadTime: "1-2 Tage", priceAdjustment: 20, price: 4.5, currency: "EUR" },
      { id: "ship-eu", region: "EU", label: "Europa", leadTime: "3-6 Tage", priceAdjustment: 10, price: 6.5, currency: "EUR" }
    ],
    onRequest: true
  },
  {
    id: "prod-orbit-watch",
    name: "Orbit Chrono",
    categoryId: "cat-watch",
    sku: "WATCH-ORBIT",
    description: "Nebula Chronograph mit Saphirglas, Quick-Release Armband und NFC Wallet Funktion.",
    price: 349,
    currency: "EUR",
    leadTime: "preorder",
    inventory: 0,
    interest: 72,
    variants: [
      {
        type: "color",
        name: "Armband",
        options: [
          { id: "col-steel", label: "Steel", value: "steel", swatch: "#9CA3AF" },
          { id: "col-midnight", label: "Midnight", value: "midnight", swatch: "#111827" }
        ]
      }
    ],
    media: [
      { id: "img-steel", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop&crop=center", color: "steel", alt: "Orbit Chrono Steel" },
      { id: "img-midnight", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop&crop=center&sat=-30&brightness=0.4", color: "midnight", alt: "Orbit Chrono Midnight" }
    ],
    badges: ["VIP"],
    popularity: 0.83,
    shippingOptions: [
      { id: "ship-eu", region: "EU", label: "Europa", leadTime: "3-7 Tage", priceAdjustment: 10, price: 14.9, currency: "EUR" },
      { id: "ship-cn", region: "CN", label: "China", leadTime: "10-18 Tage", priceAdjustment: -20, price: 16.9, currency: "EUR" }
    ],
    onRequest: true
  },
  {
    id: "prod-starter-bundle",
    name: "Starter Bundle",
    categoryId: "cat-bundle",
    sku: "BUNDLE-STARTER",
    description: "Bundle aus Hyperwave Tee, Aurora Shorts und Quantum Cap inklusive +150 Coins.",
    price: 229,
    currency: "EUR",
    leadTime: "2_days",
    inventory: 0,
    interest: 40,
    media: [
      { id: "img-bundle", url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center", alt: "Nebula Starter Bundle" }
    ],
    badges: ["Coins +150", "Bundle"],
    popularity: 0.71,
    shippingOptions: [
      { id: "ship-de", region: "DE", label: "Deutschland", leadTime: "2-5 Tage", priceAdjustment: 20, price: 9.9, currency: "EUR" },
      { id: "ship-eu", region: "EU", label: "Europa", leadTime: "4-8 Tage", priceAdjustment: 10, price: 11.9, currency: "EUR" }
    ],
    onRequest: true
  }
];

