import type {
  Drop,
  DropVariant,
  DropShippingOption,
  VariantOriginOption
} from "@nebula/shared";

const buildPrice = (value: number) => Math.round(value * 100) / 100;

// 🎯 Revolutionary Shipping Options
const revolutionaryShipping: DropShippingOption[] = [
  {
    id: "free-shipping-de",
    label: "Deutschland (kostenlos)",
    regions: ["DE"],
    leadTime: "1-2 Tage",
    eta: "1-2 Tage",
    price: buildPrice(0),
    currency: "EUR",
    badge: "Kostenlos",
    description: "Gratis Versand inkl. Tracking",
    tracking: true
  },
  {
    id: "eu-shipping",
    label: "EU Versand",
    regions: ["EU"],
    leadTime: "3-5 Tage",
    eta: "3-5 Tage",
    price: buildPrice(4.9),
    currency: "EUR",
    description: "Subventionierter EU-Versand"
  },
  {
    id: "express-shipping",
    label: "Express + Cold-Pack",
    regions: ["DE", "EU"],
    leadTime: "24h",
    eta: "24h",
    price: buildPrice(9.9),
    currency: "EUR",
    badge: "Express",
    tracking: true
  }
];

// 🎯 Origin Options
const originOptions: VariantOriginOption[] = [
  {
    id: "origin-de",
    label: "Fulfillment DE",
    eta: "Auslieferung 24h",
    leadTime: "24h",
    priceDelta: buildPrice(0),
    currency: "EUR"
  },
  {
    id: "origin-eu",
    label: "Fulfillment EU",
    eta: "Auslieferung 3-5 Tage",
    leadTime: "3-5 Tage",
    priceDelta: buildPrice(2.9),
    currency: "EUR"
  }
];

// 🎯 Unique Variant Generator - Einzigartige Sorten pro Drop
const generateUniqueVariants = (baseName: string, baseFlavor: string, priceRange: [number, number]): DropVariant[] => {
  const [minPrice, maxPrice] = priceRange;
  
  // Einzigartige Sorten-Namen für jeden Drop
  const uniqueVariants = {
    'Probe Mint': ['Mint Fresh', 'Mint Cool', 'Mint Smooth', 'Mint Extra', 'Mint Strong', 'Mint Premium', 'Mint Organic', 'Mint Fusion', 'Mint Ultimate', 'Mint Classic'],
    'Tropical Mix': ['Tropical Core', 'Tropical Premium', 'Tropical Fresh', 'Tropical Cool', 'Tropical Smooth', 'Tropical Fusion', 'Tropical Organic', 'Tropical Extra', 'Tropical Strong', 'Tropical Ultimate'],
    'Apfel Crisp': ['Apfel Classic', 'Apfel Premium', 'Apfel Fresh', 'Apfel Cool', 'Apfel Smooth', 'Apfel Fusion', 'Apfel Organic', 'Apfel Extra', 'Apfel Strong', 'Apfel Ultimate'],
    'Kiwi Fresh': ['Kiwi Classic', 'Kiwi Premium', 'Kiwi Fresh', 'Kiwi Cool', 'Kiwi Smooth', 'Kiwi Fusion', 'Kiwi Organic', 'Kiwi Extra', 'Kiwi Strong', 'Kiwi Ultimate'],
    'Berry Blast': ['Berry Classic', 'Berry Premium', 'Berry Fresh', 'Berry Cool', 'Berry Smooth', 'Berry Fusion', 'Berry Organic', 'Berry Extra', 'Berry Strong', 'Berry Ultimate'],
    'Citrus Zest': ['Citrus Classic', 'Citrus Premium', 'Citrus Fresh', 'Citrus Cool', 'Citrus Smooth', 'Citrus Fusion', 'Citrus Organic', 'Citrus Extra', 'Citrus Strong', 'Citrus Ultimate'],
    'Mint Cool': ['Mint Classic', 'Mint Premium', 'Mint Fresh', 'Mint Cool', 'Mint Smooth', 'Mint Fusion', 'Mint Organic', 'Mint Extra', 'Mint Strong', 'Mint Ultimate'],
    'Peach Ice': ['Peach Classic', 'Peach Premium', 'Peach Fresh', 'Peach Cool', 'Peach Smooth', 'Peach Fusion', 'Peach Organic', 'Peach Extra', 'Peach Strong', 'Peach Ultimate'],
    'Grape Burst': ['Grape Classic', 'Grape Premium', 'Grape Fresh', 'Grape Cool', 'Grape Smooth', 'Grape Fusion', 'Grape Organic', 'Grape Extra', 'Grape Strong', 'Grape Ultimate'],
    'Orange Crush': ['Orange Classic', 'Orange Premium', 'Orange Fresh', 'Orange Cool', 'Orange Smooth', 'Orange Fusion', 'Orange Organic', 'Orange Extra', 'Orange Strong', 'Orange Ultimate'],
    'Lemon Drop': ['Lemon Classic', 'Lemon Premium', 'Lemon Fresh', 'Lemon Cool', 'Lemon Smooth', 'Lemon Fusion', 'Lemon Organic', 'Lemon Extra', 'Lemon Strong', 'Lemon Ultimate'],
    'Strawberry Swirl': ['Strawberry Classic', 'Strawberry Premium', 'Strawberry Fresh', 'Strawberry Cool', 'Strawberry Smooth', 'Strawberry Fusion', 'Strawberry Organic', 'Strawberry Extra', 'Strawberry Strong', 'Strawberry Ultimate'],
    'Mango Tango': ['Mango Classic', 'Mango Premium', 'Mango Fresh', 'Mango Cool', 'Mango Smooth', 'Mango Fusion', 'Mango Organic', 'Mango Extra', 'Mango Strong', 'Mango Ultimate'],
    'Pineapple Punch': ['Pineapple Classic', 'Pineapple Premium', 'Pineapple Fresh', 'Pineapple Cool', 'Pineapple Smooth', 'Pineapple Fusion', 'Pineapple Organic', 'Pineapple Extra', 'Pineapple Strong', 'Pineapple Ultimate'],
    'Watermelon Wave': ['Watermelon Classic', 'Watermelon Premium', 'Watermelon Fresh', 'Watermelon Cool', 'Watermelon Smooth', 'Watermelon Fusion', 'Watermelon Organic', 'Watermelon Extra', 'Watermelon Strong', 'Watermelon Ultimate'],
    'Cherry Pop': ['Cherry Classic', 'Cherry Premium', 'Cherry Fresh', 'Cherry Cool', 'Cherry Smooth', 'Cherry Fusion', 'Cherry Organic', 'Cherry Extra', 'Cherry Strong', 'Cherry Ultimate']
  };

  const variantNames = uniqueVariants[baseName as keyof typeof uniqueVariants] || uniqueVariants['Tropical Mix'];
  
  const variants: DropVariant[] = variantNames.map((variantName, index) => {
    const priceStep = (maxPrice - minPrice) / 9;
    const variantPrice = buildPrice(minPrice + (priceStep * index));
    
    // Einzigartige Beschreibungen
    const descriptions = [
      `Premium ${baseFlavor}-Geschmack mit intensivem Aroma.`,
      `Exklusive ${baseFlavor}-Kreation mit besonderen Zutaten.`,
      `Frischer ${baseFlavor}-Geschmack für den täglichen Genuss.`,
      `Erfrischender ${baseFlavor}-Geschmack mit kühlendem Effekt.`,
      `Sanfter ${baseFlavor}-Geschmack für einen entspannten Genuss.`,
      `Kreative ${baseFlavor}-Kombination mit exotischen Noten.`,
      `100% biologische ${baseFlavor}-Sorte aus nachhaltigem Anbau.`,
      `Extra starke ${baseFlavor}-Formel für den intensivsten Geschmack.`,
      `Starker ${baseFlavor}-Geschmack für erfahrene Genießer.`,
      `Die ultimative ${baseFlavor}-Erfahrung mit allen Geschmacksnoten.`
    ];

    return {
      id: `${baseName.toLowerCase().replace(/\s+/g, '-')}-${variantName.toLowerCase().replace(/\s+/g, '-')}`,
      label: variantName,
      flavor: baseFlavor,
      description: descriptions[index] || descriptions[0],
      basePrice: variantPrice,
      stock: Math.floor(Math.random() * 200) + 50,
      minQuantity: 1,
      maxQuantity: index < 3 ? 4 : index < 6 ? 3 : 2, // Verschiedene Max-Mengen
      media: [
        {
          id: `${baseName.toLowerCase().replace(/\s+/g, '-')}-${variantName.toLowerCase().replace(/\s+/g, '-')}-1`,
          url: getFlavorImage(baseFlavor),
          alt: variantName,
          dominantColor: getFlavorColor(baseFlavor)
        }
      ],
      gate: {
        mode: "invite_only",
        message: index < 2 ? "Standard Zugang" : index < 5 ? "Premium Zugang" : "Ultimate Zugang"
      },
      shippingOptionIds: revolutionaryShipping.map(s => s.id),
      originOptions: originOptions
    };
  });

  return variants;
};

// 🎯 Flavor Color Mapping
const getFlavorColor = (flavor: string): string => {
  const colorMap: Record<string, string> = {
    'Mint': '#0BF7BC',
    'Tropical': '#FF6B35',
    'Apfel': '#8FBC8F',
    'Kiwi': '#9ACD32',
    'Berry': '#FF1493',
    'Citrus': '#FFA500',
    'Peach': '#FFB6C1',
    'Grape': '#9370DB',
    'Orange': '#FF8C00',
    'Lemon': '#FFFF00',
    'Strawberry': '#FF69B4',
    'Mango': '#FFA500',
    'Pineapple': '#FFD700',
    'Watermelon': '#FF6347',
    'Cherry': '#DC143C'
  };
  return colorMap[flavor] || '#00D4FF';
};

// 🎯 Flavor Image Mapping - unterschiedliche Bilder für jede Geschmacksrichtung
const getFlavorImage = (flavor: string): string => {
  const imageMap: Record<string, string> = {
    'Mint': 'https://images.unsplash.com/photo-1610736097825-61ddb084c268?w=800&h=600&fit=crop&q=80',
    'Tropical': 'https://images.unsplash.com/photo-1587411768328-930d11b2ea51?w=800&h=600&fit=crop&q=80',
    'Apfel': 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&h=600&fit=crop&q=80',
    'Kiwi': 'https://images.unsplash.com/photo-1585059895524-72359e9d5ebc?w=800&h=600&fit=crop&q=80',
    'Berry': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80',
    'Citrus': 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=800&h=600&fit=crop&q=80',
    'Peach': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&h=600&fit=crop&q=80',
    'Grape': 'https://images.unsplash.com/photo-1599819177338-1e95a1355753?w=800&h=600&fit=crop&q=80',
    'Orange': 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800&h=600&fit=crop&q=80',
    'Lemon': 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=800&h=600&fit=crop&q=80',
    'Strawberry': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop&q=80',
    'Mango': 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&h=600&fit=crop&q=80',
    'Pineapple': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=800&h=600&fit=crop&q=80',
    'Cherry': 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&h=600&fit=crop&q=80',
    'Watermelon': 'https://images.unsplash.com/photo-1587049352846-4a222e784720?w=800&h=600&fit=crop&q=80'
  };
  return imageMap[flavor] || 'https://images.unsplash.com/photo-1610736097825-61ddb084c268?w=800&h=600&fit=crop&q=80';
};

// 🎯 Revolutionary Drops with 15 Flavors
export const revolutionaryDrops: Drop[] = [
  {
    id: "probe-mint",
    name: "Probe Mint",
    badge: "Kostenlos",
    flavorTag: "Mint",
    minQuantity: 1,
    price: 0,
    currency: "EUR",
    progress: 0.75,
    locale: "DE",
    status: "available",
    access: "free",
    inviteRequired: true,
    interestCount: 143,
    defaultVariantId: "probe-mint-classic",
    variants: generateUniqueVariants("Probe Mint", "Mint", [0, 0]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Kostenloser Einstieg in die Nebula Drops",
    maxPerUser: 2
  },
  {
    id: "tropical-mix",
    name: "Tropical Mix",
    badge: "Drop",
    flavorTag: "Tropical",
    minQuantity: 1,
    price: 4.9,
    currency: "EUR",
    progress: 0.45,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 89,
    defaultVariantId: "tropical-mix-core",
    variants: generateUniqueVariants("Tropical Mix", "Tropical", [4.9, 7.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Exotische Tropen-Kreation für den Sommer",
    maxPerUser: 5
  },
  {
    id: "apfel-crisp",
    name: "Apfel Crisp",
    badge: "Drop",
    flavorTag: "Apfel",
    minQuantity: 1,
    price: 3.9,
    currency: "EUR",
    progress: 0.67,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 156,
    defaultVariantId: "apfel-crisp-core",
    variants: generateUniqueVariants("Apfel Crisp", "Apfel", [3.9, 5.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Knackiger Apfel-Geschmack für den Alltag",
    maxPerUser: 6
  },
  {
    id: "kiwi-fresh",
    name: "Kiwi Fresh",
    badge: "Drop",
    flavorTag: "Kiwi",
    minQuantity: 1,
    price: 6.9,
    currency: "EUR",
    progress: 0.23,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 67,
    defaultVariantId: "kiwi-fresh-core",
    variants: generateUniqueVariants("Kiwi Fresh", "Kiwi", [6.9, 8.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Erfrischende Kiwi-Note mit tropischem Touch",
    maxPerUser: 4
  },
  {
    id: "berry-blast",
    name: "Berry Blast",
    badge: "Drop",
    flavorTag: "Berry",
    minQuantity: 1,
    price: 5.9,
    currency: "EUR",
    progress: 0.92,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 234,
    defaultVariantId: "berry-blast-core",
    variants: generateUniqueVariants("Berry Blast", "Berry", [5.9, 7.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Explosive Beeren-Mischung mit intensivem Geschmack",
    maxPerUser: 5
  },
  {
    id: "citrus-zest",
    name: "Citrus Zest",
    badge: "VIP",
    flavorTag: "Citrus",
    minQuantity: 1,
    price: 12.9,
    currency: "EUR",
    progress: 0.34,
    locale: "DE",
    status: "available",
    access: "vip",
    inviteRequired: true,
    interestCount: 45,
    defaultVariantId: "citrus-zest-core",
    variants: generateUniqueVariants("Citrus Zest", "Citrus", [12.9, 15.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Premium Zitrus-Erlebnis für VIP-Mitglieder",
    maxPerUser: 3
  },
  {
    id: "peach-ice",
    name: "Peach Ice",
    badge: "Limitiert",
    flavorTag: "Peach",
    minQuantity: 1,
    price: 9.5,
    currency: "EUR",
    progress: 1.0,
    locale: "DE",
    status: "available",
    access: "limited",
    inviteRequired: false,
    interestCount: 102,
    defaultVariantId: "peach-ice-core",
    variants: generateUniqueVariants("Peach Ice", "Peach", [9.5, 11.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Erfrischende Pfirsich-Kreation mit Ice-Effekt",
    maxPerUser: 4
  },
  {
    id: "grape-burst",
    name: "Grape Burst",
    badge: "Drop",
    flavorTag: "Grape",
    minQuantity: 1,
    price: 6.5,
    currency: "EUR",
    progress: 0.58,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 78,
    defaultVariantId: "grape-burst-core",
    variants: generateUniqueVariants("Grape Burst", "Grape", [6.5, 8.5]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Trauben-Explosion mit intensivem Geschmack",
    maxPerUser: 4
  },
  {
    id: "orange-crush",
    name: "Orange Crush",
    badge: "Drop",
    flavorTag: "Orange",
    minQuantity: 1,
    price: 4.5,
    currency: "EUR",
    progress: 0.41,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 112,
    defaultVariantId: "orange-crush-core",
    variants: generateUniqueVariants("Orange Crush", "Orange", [4.5, 6.5]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Orangen-Kraft mit erfrischendem Geschmack",
    maxPerUser: 5
  },
  {
    id: "lemon-drop",
    name: "Lemon Drop",
    badge: "Drop",
    flavorTag: "Lemon",
    minQuantity: 1,
    price: 5.5,
    currency: "EUR",
    progress: 0.73,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 95,
    defaultVariantId: "lemon-drop-core",
    variants: generateUniqueVariants("Lemon Drop", "Lemon", [5.5, 7.5]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Zitronen-Süße mit saurem Kick",
    maxPerUser: 4
  },
  {
    id: "strawberry-swirl",
    name: "Strawberry Swirl",
    badge: "Drop",
    flavorTag: "Strawberry",
    minQuantity: 1,
    price: 7.9,
    currency: "EUR",
    progress: 0.29,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 134,
    defaultVariantId: "strawberry-swirl-core",
    variants: generateUniqueVariants("Strawberry Swirl", "Strawberry", [7.9, 9.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Erdbeer-Wirbel mit cremiger Note",
    maxPerUser: 3
  },
  {
    id: "mango-tango",
    name: "Mango Tango",
    badge: "Drop",
    flavorTag: "Mango",
    minQuantity: 1,
    price: 8.9,
    currency: "EUR",
    progress: 0.56,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 87,
    defaultVariantId: "mango-tango-core",
    variants: generateUniqueVariants("Mango Tango", "Mango", [8.9, 11.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Mango-Tanz mit tropischem Rhythmus",
    maxPerUser: 3
  },
  {
    id: "pineapple-punch",
    name: "Pineapple Punch",
    badge: "Drop",
    flavorTag: "Pineapple",
    minQuantity: 1,
    price: 6.9,
    currency: "EUR",
    progress: 0.82,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 156,
    defaultVariantId: "pineapple-punch-core",
    variants: generateUniqueVariants("Pineapple Punch", "Pineapple", [6.9, 8.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Ananas-Power mit tropischem Kick",
    maxPerUser: 4
  },
  {
    id: "watermelon-wave",
    name: "Watermelon Wave",
    badge: "Drop",
    flavorTag: "Watermelon",
    minQuantity: 1,
    price: 5.9,
    currency: "EUR",
    progress: 0.47,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 98,
    defaultVariantId: "watermelon-wave-core",
    variants: generateUniqueVariants("Watermelon Wave", "Watermelon", [5.9, 7.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Wassermelonen-Welle mit erfrischendem Geschmack",
    maxPerUser: 5
  },
  {
    id: "cherry-pop",
    name: "Cherry Pop",
    badge: "Limitiert",
    flavorTag: "Cherry",
    minQuantity: 1,
    price: 11.9,
    currency: "EUR",
    progress: 0.18,
    locale: "DE",
    status: "available",
    access: "limited",
    inviteRequired: false,
    interestCount: 67,
    defaultVariantId: "cherry-pop-core",
    variants: generateUniqueVariants("Cherry Pop", "Cherry", [11.9, 14.9]),
    shippingOptions: revolutionaryShipping,
    shortDescription: "Kirsch-Pop mit explosivem Geschmack",
    maxPerUser: 2
  },
  {
    id: "waspe-100k",
    name: "WASPE 100K 6 IN 1",
    badge: "Neu",
    flavorTag: "Multi",
    minQuantity: 1,
    price: 7.29,
    currency: "EUR",
    progress: 0.35,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 245,
    defaultVariantId: "waspe-watermelon-mix",
    variants: [
      {
        id: "waspe-watermelon-mix",
        label: "Watermelon Ice Mix",
        flavor: "Watermelon Ice & Strawberry Kiwi & Raspberry Watermelon & Lemon Lime",
        description: "4-in-1 Waspe mit erfrischenden Wassermelonen-Variationen und fruchtigen Kombinationen.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 500,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-watermelon-hero", url: "https://images.unsplash.com/photo-1587049352846-4a222e784720?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Watermelon Mix", dominantColor: "#FF6B9D" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-strawberry-mix",
        label: "Strawberry Watermelon Mix",
        flavor: "Strawberry Watermelon & Mr.Blue & Grape Ice & Rainbow Candy",
        description: "4-in-1 Waspe mit süßen Erdbeer-Kombinationen und bunten Candy-Flavors.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 450,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-strawberry-hero", url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Strawberry Mix", dominantColor: "#FF4757" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-tropical-mix",
        label: "Tropical Ice Mix",
        flavor: "Red Bull Ice & Banana Ice & Pineapple Coconut Ice & Triple Mango Ice",
        description: "4-in-1 Waspe mit exotischen tropischen Geschmäckern und eiskaltem Finish.",
        badges: ["4in1", "Tropical"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 420,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-tropical-hero", url: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Tropical Mix", dominantColor: "#FFA502" }
        ],
        highlight: "new",
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-cherry-mix",
        label: "Cherry Ice Mix",
        flavor: "Strawberry Raspberry Cherry & Crazy Cherry Ice & Blue Cherry Ice & Cola Ice",
        description: "4-in-1 Waspe mit intensiven Kirsch-Variationen und erfrischendem Cola Ice.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 380,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-cherry-hero", url: "https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Cherry Mix", dominantColor: "#DC143C" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-berry-banana-mix",
        label: "Berry Banana Mix",
        flavor: "Strawberry Banana & Strawberry Red Bull & Strawberry Mango & Pink Lemonade",
        description: "4-in-1 Waspe mit cremigen Bananen-Beeren-Kombinationen und pinker Limonade.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 460,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-berry-banana-hero", url: "https://images.unsplash.com/photo-1481391032119-d89fee407e44?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Berry Banana Mix", dominantColor: "#FFB6C1" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-blueberry-mix",
        label: "Blueberry Ice Mix",
        flavor: "Blueberry Ice & Black Knight & Strawberry Ice & Strawberry Watermelon",
        description: "4-in-1 Waspe mit intensiven Blaubeer-Geschmäckern und mystischem Black Knight.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 400,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-blueberry-hero", url: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Blueberry Mix", dominantColor: "#4169E1" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-cola-mix",
        label: "Cola Ice Mix",
        flavor: "Cherry Cola Ice & Strawberry Cherry Ice & Strawberry Cola Ice & Strawberry Watermelon Bubblegum",
        description: "4-in-1 Waspe mit klassischen Cola-Variationen und süßem Bubblegum.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 440,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-cola-hero", url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Cola Mix", dominantColor: "#8B4513" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-peach-mix",
        label: "Peach Berry Mix",
        flavor: "Juicy Peach Ice & Tropical Fruit & Fruit Blast & Peach Berry",
        description: "4-in-1 Waspe mit saftigen Pfirsich-Kombinationen und tropischem Fruchtmix.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 430,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-peach-hero", url: "https://images.unsplash.com/photo-1629385981513-07eed072c2bf?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Peach Mix", dominantColor: "#FFDAB9" }
        ],
        highlight: "hot",
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-grape-mix",
        label: "Grape Ice Mix",
        flavor: "Grape Ice & Strawberry Kiwi & Strawberry Raspberry Cherry & Black Knight",
        description: "4-in-1 Waspe mit kühlem Trauben-Geschmack und dunklem Black Knight.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 410,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-grape-hero", url: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Grape Mix", dominantColor: "#6A0DAD" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-apple-mix",
        label: "Mixed Berries & Apple Mix",
        flavor: "Mixed Berries & Double Apple Ice & Blueberry Raspberry & Blueberry Honey",
        description: "4-in-1 Waspe mit gemischten Beeren und doppeltem Apfel-Geschmack.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 390,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-apple-hero", url: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Apple Mix", dominantColor: "#90EE90" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-energy-mix",
        label: "Energy Mix",
        flavor: "Strawberry Red Bull & Strawberry Watermelon Bubblegum & Red Bull Ice & Cherry Cola Ice",
        description: "4-in-1 Waspe mit energiegeladenen Red Bull Variationen und Cola Ice.",
        badges: ["4in1", "Energy"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 470,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-energy-hero", url: "https://images.unsplash.com/photo-1622543925917-763c34f6a8a8?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Energy Mix", dominantColor: "#FFD700" }
        ],
        highlight: "hot",
        quickQuantityOptions: [1, 2, 5, 10]
      },
      {
        id: "waspe-lemonade-mix",
        label: "Lemonade Berry Mix",
        flavor: "Blueberry Raspberry & Blueberry Lemonade & Mixed Berries & Grape",
        description: "4-in-1 Waspe mit erfrischenden Limonaden-Kombinationen und Beeren-Mix.",
        badges: ["4in1"],
        minQuantity: 1,
        maxQuantity: 10,
        stock: 450,
        basePrice: 7.29,
        currency: "EUR",
        shippingOptionIds: ["free-shipping-de", "eu-shipping", "express-shipping"],
        media: [
          { id: "waspe-lemonade-hero", url: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f0d?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Lemonade Mix", dominantColor: "#87CEEB" }
        ],
        quickQuantityOptions: [1, 2, 5, 10]
      }
    ],
    shippingOptions: revolutionaryShipping,
    heroImageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784720?w=800&h=600&fit=crop&q=80",
    shortDescription: "Premium 4-in-1 Disposable Vape mit 12 einzigartigen Geschmackskombinationen - 100K Puffs!",
    maxPerUser: 20
  }
];
