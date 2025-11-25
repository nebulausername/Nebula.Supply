import type {
  Drop,
  DropVariant,
  DropShippingOption,
  VariantOriginOption
} from "@nebula/shared";

const buildPrice = (value: number) => Math.round(value * 100) / 100;

const mintShipping: DropShippingOption[] = [
  {
    id: "probe-mint-ship-de",
    label: "Deutschland (kostenlos)",
    regions: ["DE"],
    leadTime: "1-2 Tage",
    eta: "1-2 Tage",
    price: buildPrice(0),
    currency: "EUR",
    badge: "Kostenlos",
    description: "Gratis Sample Versand inkl. Tracking",
    tracking: true
  },
  {
    id: "probe-mint-ship-eu",
    label: "EU Versand",
    regions: ["EU"],
    leadTime: "3-5 Tage",
    eta: "3-5 Tage",
    price: buildPrice(3.5),
    currency: "EUR",
    description: "Subventionierter Versand fuer Crew Drops"
  },
  {
    id: "probe-mint-ship-express",
    label: "Express + Cold-Pack",
    regions: ["DE", "EU"],
    leadTime: "24h",
    eta: "24h",
    price: buildPrice(8.9),
    currency: "EUR",
    badge: "Neu",
    tracking: true
  }
];

const mintOriginOptions: VariantOriginOption[] = [
  {
    id: "mint-origin-de",
    label: "Fulfillment DE",
    eta: "Auslieferung 24h",
    priceDelta: 0,
    currency: "EUR",
    badge: "Standard",
    isDefault: true
  },
  {
    id: "mint-origin-cn",
    label: "Fulfillment CN",
    eta: "8-10 Tage",
    priceDelta: -2,
    currency: "EUR",
    description: "Direkt ab Werk, limitiertes Kontingent"
  }
];

const mintVariants: DropVariant[] = [
  {
    id: "mint-classic",
    label: "Probe Mint Classic",
    flavor: "Mint",
    description: "Kostenloser Einstieg in die Nebula Drops mit klassischem Mint Profil.",
    badges: ["Gratis"],
    minQuantity: 1,
    maxQuantity: 2,
    stock: 1500,
    basePrice: 0,
    currency: "EUR",
    shippingOptionIds: ["probe-mint-ship-de", "probe-mint-ship-eu", "probe-mint-ship-express"],
    defaultShippingOptionId: "probe-mint-ship-de",
    originOptions: mintOriginOptions,
    media: [
      {
        id: "mint-classic-hero",
        url: "https://images.unsplash.com/photo-1610736097825-61ddb084c268?w=800&h=600&fit=crop&q=80",
        alt: "Probe Mint Classic Packshot",
        dominantColor: "#0BF7BC"
      },
      {
        id: "mint-classic-open",
        url: "https://images.unsplash.com/photo-1610736097825-61ddb084c268?w=800&h=600&fit=crop&q=80",
        alt: "Probe Mint Classic geoeffnet"
      }
    ],
    quickQuantityOptions: [1, 2]
  },
  {
    id: "mint-hyper-freeze",
    label: "Hyper Freeze Sample",
    flavor: "Mint + Menthol",
    description: "Maximierter Cooling-Boost mit mentholisiertem Finish.",
    badges: ["Limited"],
    minQuantity: 2,
    maxQuantity: 4,
    stock: 420,
    basePrice: 2.9,
    priceCompareAt: 6.9,
    currency: "EUR",
    inviteRequired: true,
    shippingOptionIds: ["probe-mint-ship-eu", "probe-mint-ship-express"],
    defaultShippingOptionId: "probe-mint-ship-express",
    originOptions: [
      {
        id: "mint-origin-exp",
        label: "Cryo Lab EU",
        eta: "1-2 Tage",
        priceDelta: 1.5,
        currency: "EUR",
        badge: "Cold Ship"
      }
    ],
    media: [
      {
        id: "mint-hyper-hero",
        url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&q=80",
        alt: "Probe Mint Hyper Freeze",
        dominantColor: "#00D4FF"
      },
      {
        id: "mint-hyper-detail",
        url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&q=80",
        alt: "Hyper Freeze Detail",
        dominantColor: "#00D4FF"
      }
    ],
    gate: {
      mode: "invite_only",
      message: "Invite-Code erforderlich fuer Hyper Freeze Sample"
    },
    highlight: "limited",
    quickQuantityOptions: [2, 3, 4]
  }
];

const peachShipping: DropShippingOption[] = [
  {
    id: "peach-ship-de",
    label: "DE Priority",
    regions: ["DE"],
    leadTime: "2-3 Tage",
        eta: "2-3 Tage",
    price: buildPrice(4.9),
    currency: "EUR",
    description: "inkl. Climate Cold-Pack"
  },
  {
    id: "peach-ship-eu",
    label: "EU Climate Neutral",
    regions: ["EU"],
    leadTime: "3-6 Tage",
    eta: "3-6 Tage",
    price: buildPrice(6.9),
    currency: "EUR",
    description: "Kompensierter Versand"
  },
  {
    id: "peach-ship-premium",
    label: "Premium Express",
    regions: ["DE", "EU"],
    leadTime: "24h",
    eta: "24h",
    price: buildPrice(14.9),
    currency: "EUR",
    badge: "Limitierte Slots",
    tracking: true
  }
];

const peachVariants: DropVariant[] = [
  {
    id: "peach-core",
    label: "Peach Ice Core",
    flavor: "Peach",
    description: "Signature Peach Ice mit slow-release Cooling.",
    badges: ["Best Seller"],
    minQuantity: 2,
    maxQuantity: 6,
    stock: 920,
    basePrice: 9.5,
    priceCompareAt: 12.5,
    currency: "EUR",
    shippingOptionIds: ["peach-ship-de", "peach-ship-eu"],
    defaultShippingOptionId: "peach-ship-de",
    originOptions: [
      {
        id: "peach-origin-de",
        label: "Batch DE",
        leadTime: "2-3 Tage",
        eta: "2-3 Tage",
        priceDelta: 0,
        currency: "EUR",
        badge: "Fresh"
      },
      {
        id: "peach-origin-cn",
        label: "Batch CN",
        eta: "7-9 Tage",
        priceDelta: -1.5,
        currency: "EUR",
        description: "Direkt vom Lab"
      }
    ],
    media: [
      { id: "peach-core-hero", url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&h=600&fit=crop&q=80", alt: "Peach Ice Core", dominantColor: "#FFB347" },
      { id: "peach-core-detail", url: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&h=600&fit=crop&q=80", alt: "Peach Ice Detail", dominantColor: "#FFB347" }
    ],
    quickQuantityOptions: [2, 4, 6]
  },
  {
    id: "peach-chill",
    label: "Peach Chill Booster",
    flavor: "Peach",
    description: "Mit Cooling Booster und 15% mehr Aroma.",
    badges: ["Neu"],
    minQuantity: 3,
    maxQuantity: 8,
    stock: 480,
    basePrice: 11.5,
    priceCompareAt: 14.5,
    currency: "EUR",
    inviteRequired: true,
    shippingOptionIds: ["peach-ship-eu", "peach-ship-premium"],
    defaultShippingOptionId: "peach-ship-eu",
    originOptions: [
      {
        id: "peach-origin-lab",
        label: "Nebula Lab CN",
        eta: "6-8 Tage",
        priceDelta: -2,
        currency: "EUR",
        description: "Direkt ab Misch-Linie"
      }
    ],
    media: [
      { id: "peach-chill-hero", url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop&q=80", alt: "Peach Chill Booster", dominantColor: "#FFB347" },
      { id: "peach-chill-lifestyle", url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&h=600&fit=crop&q=80", alt: "Peach Chill Lifestyle", dominantColor: "#FFB347" }
    ],
    gate: {
      mode: "invite_only",
      message: "Invite Zugang fuer Booster aktivieren"
    },
    quickQuantityOptions: [3, 4, 6, 8]
  },
  {
    id: "peach-vip",
    label: "Peach Ice VIP Batch",
    flavor: "Peach",
    description: "Limitierter Batch mit Cryo-Kristallen und individuell nummeriert.",
    badges: ["VIP", "Limit"],
    minQuantity: 2,
    maxQuantity: 4,
    stock: 120,
    basePrice: 19.5,
    priceCompareAt: 24,
    currency: "EUR",
    inviteRequired: true,
    shippingOptionIds: ["peach-ship-premium"],
    defaultShippingOptionId: "peach-ship-premium",
    originOptions: [
      {
        id: "peach-origin-vip",
        label: "Cryo Vault",
        leadTime: "48h",
        eta: "48h",
        priceDelta: 4.5,
        currency: "EUR",
        badge: "VIP",
        description: "Hand-verpackt und nummeriert"
      }
    ],
    media: [
      { id: "peach-vip-hero", url: "https://images.unsplash.com/photo-1629385981513-07eed072c2bf?w=800&h=600&fit=crop&q=80", alt: "Peach Ice VIP", dominantColor: "#FF69B4" },
      { id: "peach-vip-detail", url: "https://images.unsplash.com/photo-1629385981513-07eed072c2bf?w=800&h=600&fit=crop&q=80", alt: "Peach Ice VIP Detail", dominantColor: "#FF69B4" }
    ],
    gate: {
      mode: "vip",
      message: "Nur fuer VIP Tier Comet+",
      minTier: "Comet+"
    },
    highlight: "hot",
    quickQuantityOptions: [2, 3, 4]
  }
];

const galaxyShipping: DropShippingOption[] = [
  {
    id: "galaxy-ship-vip",
    label: "VIP Air",
    regions: ["DE", "EU"],
    leadTime: "48h",
        eta: "48h",
    price: buildPrice(24.9),
    currency: "EUR",
    badge: "VIP",
    description: "Spezialverpackung mit Temperaturkontrolle"
  },
  {
    id: "galaxy-ship-priority",
    label: "Priority",
    regions: ["EU"],
    leadTime: "72h",
        eta: "72h",
    price: buildPrice(14.5),
    currency: "EUR"
  }
];

const galaxyVariants: DropVariant[] = [
  {
    id: "galaxy-berry-core",
    label: "Galaxy Berry Core",
    flavor: "Berry",
    description: "VIP-only Galaxy Berry mit Aurora Kristallisierung.",
    badges: ["VIP"],
    minQuantity: 3,
    maxQuantity: 6,
    stock: 80,
    basePrice: 24.9,
    priceCompareAt: 29.9,
    currency: "EUR",
    inviteRequired: true,
    shippingOptionIds: ["galaxy-ship-vip", "galaxy-ship-priority"],
    defaultShippingOptionId: "galaxy-ship-vip",
    originOptions: [
      {
        id: "galaxy-origin-lab",
        label: "Nebula Vault",
        leadTime: "48h",
        eta: "48h",
        priceDelta: 6,
        currency: "EUR",
        badge: "VIP",
        description: "Handverlesene Kristalle"
      }
    ],
    media: [
      { id: "galaxy-core-hero", url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80", alt: "Galaxy Berry Core", dominantColor: "#8A2BE2" },
      { id: "galaxy-core-detail", url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80", alt: "Galaxy Berry Detail", dominantColor: "#8A2BE2" }
    ],
    gate: {
      mode: "vip",
      message: "VIP Zugang (Nebula Rank Nova)",
      minTier: "Nova"
    },
    quickQuantityOptions: [3, 4, 6]
  },
  {
    id: "galaxy-berry-experimental",
    label: "Galaxy Berry Experimental",
    flavor: "Berry",
    description: "Beta-Formel mit adaptiver Geschmacksspur. Feedback erwuenscht.",
    badges: ["Experimental"],
    minQuantity: 1,
    maxQuantity: 2,
    stock: 35,
    basePrice: 0,
    currency: "EUR",
    shippingOptionIds: ["galaxy-ship-vip"],
    defaultShippingOptionId: "galaxy-ship-vip",
    originOptions: [
      {
        id: "galaxy-origin-lab-beta",
        label: "Test Lab",
        leadTime: "72h",
        eta: "72h",
        priceDelta: 0,
        currency: "EUR",
        description: "Feedback Pflicht"
      }
    ],
    media: [
      { id: "galaxy-exp-hero", url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&h=600&fit=crop&q=80", alt: "Galaxy Berry Experimental", dominantColor: "#FF00FF" }
    ],
    gate: {
      mode: "waitlist",
      message: "Beta Slot via Waitlist sichern"
    },
    highlight: "limited",
    quickQuantityOptions: [1, 2]
  }
];

const nebulatoShipping: DropShippingOption[] = [
  {
    id: "nebulato-ship-de",
    label: "DE Standard",
    regions: ["DE"],
    leadTime: "2-4 Tage",
        eta: "2-4 Tage",
    price: buildPrice(4.5),
    currency: "EUR"
  },
  {
    id: "nebulato-ship-eu",
    label: "EU Standard",
    regions: ["EU"],
    leadTime: "4-7 Tage",
    eta: "4-7 Tage",
    price: buildPrice(7.5),
    currency: "EUR"
  },
  {
    id: "nebulato-ship-pickup",
    label: "Studio Pickup Berlin",
    regions: ["DE"],
    leadTime: "Same Day",
        eta: "Same Day",
    price: buildPrice(0),
    currency: "EUR",
    badge: "Pickup",
    description: "Nur Samstag"
  }
];

const nebulatoVariants: DropVariant[] = [
  {
    id: "nebulato-classic",
    label: "Nebulato Classic",
    flavor: "Cola Lime",
    description: "Standard Drop mit doppeltem Lime Kick.",
    badges: ["Standard"],
    minQuantity: 1,
    maxQuantity: 10,
    stock: 2200,
    basePrice: 7.9,
    priceCompareAt: 9.9,
    currency: "EUR",
    shippingOptionIds: ["nebulato-ship-de", "nebulato-ship-eu", "nebulato-ship-pickup"],
    defaultShippingOptionId: "nebulato-ship-de",
    originOptions: [
      {
        id: "nebulato-origin-de",
        label: "Batch Berlin",
        leadTime: "2-4 Tage",
        eta: "2-4 Tage",
        priceDelta: 0,
        currency: "EUR",
        isDefault: true
      }
    ],
    media: [
      { id: "nebulato-classic-hero", url: "https://images.unsplash.com/photo-1629385981513-07eed072c2bf?w=800&h=600&fit=crop&q=80", alt: "Nebulato Classic", dominantColor: "#FFD700" },
      { id: "nebulato-classic-pour", url: "https://images.unsplash.com/photo-1629385981513-07eed072c2bf?w=800&h=600&fit=crop&q=80", alt: "Nebulato Classic Glas", dominantColor: "#FFD700" }
    ],
    quickQuantityOptions: [1, 3, 5, 10]
  },
  {
    id: "nebulato-night",
    label: "Nebulato Night Shift",
    flavor: "Cola Lime",
    description: "Night Shift Edition mit adaptiven Koffeinbeads.",
    badges: ["Night"],
    minQuantity: 2,
    maxQuantity: 6,
    stock: 640,
    basePrice: 9.9,
    priceCompareAt: 11.9,
    currency: "EUR",
    inviteRequired: true,
    shippingOptionIds: ["nebulato-ship-eu", "nebulato-ship-pickup"],
    defaultShippingOptionId: "nebulato-ship-pickup",
    originOptions: [
      {
        id: "nebulato-origin-night",
        label: "Night Shift Lab",
        leadTime: "Same Day",
        eta: "Same Day",
        priceDelta: 2,
        currency: "EUR",
        badge: "Night"
      }
    ],
    media: [
      { id: "nebulato-night-hero", url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop&q=80", alt: "Nebulato Night Shift", dominantColor: "#1a1a2e" },
      { id: "nebulato-night-detail", url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop&q=80", alt: "Nebulato Night Shift Detail", dominantColor: "#1a1a2e" }
    ],
    gate: {
      mode: "invite_only",
      message: "Invite notwendig fuer Night Shift"
    },
    highlight: "new",
    quickQuantityOptions: [2, 4, 6]
  }
];

const waspeShipping: DropShippingOption[] = [
  {
    id: "waspe-ship-de",
    label: "DE Standard",
    regions: ["DE"],
    leadTime: "2-4 Tage",
    eta: "2-4 Tage",
    price: buildPrice(5.9),
    currency: "EUR",
    description: "Schneller Versand innerhalb Deutschland"
  },
  {
    id: "waspe-ship-eu",
    label: "EU Standard",
    regions: ["EU"],
    leadTime: "4-7 Tage",
    eta: "4-7 Tage",
    price: buildPrice(8.9),
    currency: "EUR",
    description: "Versand in alle EU-Länder"
  },
  {
    id: "waspe-ship-express",
    label: "Express 24h",
    regions: ["DE", "EU"],
    leadTime: "24h",
    eta: "24h",
    price: buildPrice(14.9),
    currency: "EUR",
    badge: "Express",
    tracking: true,
    description: "Blitzschnelle Lieferung"
  }
];

const waspeOriginOptions: VariantOriginOption[] = [
  {
    id: "waspe-origin-eu",
    label: "Fulfillment EU",
    eta: "2-4 Tage",
    priceDelta: 0,
    currency: "EUR",
    badge: "Standard",
    isDefault: true
  },
  {
    id: "waspe-origin-direct",
    label: "Direkt vom Hersteller",
    eta: "7-10 Tage",
    priceDelta: -1.5,
    currency: "EUR",
    description: "Direkt ab Werk, besserer Preis"
  }
];

const waspeVariants: DropVariant[] = [
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
    media: [
      { id: "waspe-strawberry-hero", url: "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Strawberry Mix", dominantColor: "#FF4757" }
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
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
    priceCompareAt: 9.80,
    currency: "EUR",
    shippingOptionIds: ["waspe-ship-de", "waspe-ship-eu", "waspe-ship-express"],
    defaultShippingOptionId: "waspe-ship-de",
    originOptions: waspeOriginOptions,
    media: [
      { id: "waspe-lemonade-hero", url: "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f0d?w=800&h=600&fit=crop&q=80", alt: "Waspe 100K Lemonade Mix", dominantColor: "#87CEEB" }
    ],
    quickQuantityOptions: [1, 2, 5, 10]
  }
];

export const drops: Drop[] = [
  {
    id: "probe-mint",
    name: "PROBE MINT",
    badge: "Kostenlos",
    flavorTag: "Mint",
    minQuantity: mintVariants[0].minQuantity,
    price: mintVariants[0].basePrice,
    currency: "EUR",
    progress: 0.42,
    locale: "DE",
    status: "available",
    access: "free",
    inviteRequired: true,
    interestCount: 132,
    defaultVariantId: "mint-classic",
    variants: mintVariants,
    shippingOptions: mintShipping,
    quantityPacks: [
      { id: "mint-pack-solo", label: "Solo Sample", quantity: 1, description: "1x gratis" },
      { id: "mint-pack-duo", label: "Duo Drop", quantity: 2, description: "Fuer dich + Crew", highlight: "accent" }
    ],
    maxPerUser: 4,
    heroImageUrl: "https://images.unsplash.com/photo-1610736097825-61ddb084c268?w=800&h=600&fit=crop&q=80",
    shortDescription: "Kostenloser Zugang - invite noetig."
  },
  {
    id: "peach-ice",
    name: "PEACH ICE",
    badge: "Limitiert",
    flavorTag: "Peach",
    minQuantity: peachVariants[0].minQuantity,
    price: peachVariants[0].basePrice,
    currency: "EUR",
    progress: 0.73,
    locale: "CN",
    status: "available",
    access: "limited",
    inviteRequired: true,
    interestCount: 98,
    defaultVariantId: "peach-core",
    variants: peachVariants,
    shippingOptions: peachShipping,
    quantityPacks: [
      { id: "peach-pack-core", label: "Core Bundle (2)", quantity: 2, description: "Beste Entry Option" },
      { id: "peach-pack-squad", label: "Squad Pack (4)", quantity: 4, description: "Crew ready", highlight: "accent" }
    ],
    maxPerUser: 8,
    heroImageUrl: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=800&h=600&fit=crop&q=80",
    shortDescription: "Limitierter Batch - Timer laeuft."
  },
  {
    id: "galaxy-berry",
    name: "GALAXY BERRY",
    badge: "VIP",
    flavorTag: "Berry",
    minQuantity: galaxyVariants[0].minQuantity,
    price: galaxyVariants[0].basePrice,
    currency: "EUR",
    progress: 0.92,
    locale: "EN",
    status: "locked",
    access: "vip",
    inviteRequired: true,
    interestCount: 76,
    defaultVariantId: "galaxy-berry-core",
    variants: galaxyVariants,
    shippingOptions: galaxyShipping,
    quantityPacks: [
      { id: "galaxy-pack-vip", label: "VIP Vault (3)", quantity: 3, description: "Nur VIP Slots", highlight: "accent" }
    ],
    maxPerUser: 6,
    heroImageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80",
    shortDescription: "VIP Only Release"
  },
  {
    id: "nebulato",
    name: "NEBULATO",
    badge: "Drop",
    flavorTag: "Cola Lime",
    minQuantity: nebulatoVariants[0].minQuantity,
    price: nebulatoVariants[0].basePrice,
    currency: "EUR",
    progress: 0.18,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 54,
    defaultVariantId: "nebulato-classic",
    variants: nebulatoVariants,
    shippingOptions: nebulatoShipping,
    quantityPacks: [
      { id: "nebulato-pack-3", label: "Trio", quantity: 3, description: "Spar 5%" },
      { id: "nebulato-pack-6", label: "Crew 6", quantity: 6, description: "Spar 8%", highlight: "accent" }
    ],
    maxPerUser: 10,
    heroImageUrl: "https://images.unsplash.com/photo-1629385981513-07eed072c2bf?w=800&h=600&fit=crop&q=80",
    shortDescription: "Standard Drop - sofort verfuegbar."
  },
  {
    id: "waspe-100k",
    name: "WASPE 100K 6 IN 1",
    badge: "Neu",
    flavorTag: "Multi",
    minQuantity: waspeVariants[0].minQuantity,
    price: waspeVariants[0].basePrice,
    currency: "EUR",
    progress: 0.35,
    locale: "DE",
    status: "available",
    access: "standard",
    inviteRequired: false,
    interestCount: 245,
    defaultVariantId: "waspe-watermelon-mix",
    variants: waspeVariants,
    shippingOptions: waspeShipping,
    quantityPacks: [
      { id: "waspe-pack-1", label: "Single", quantity: 1, description: "Einzelprobe" },
      { id: "waspe-pack-2", label: "Duo", quantity: 2, description: "Spar 5%" },
      { id: "waspe-pack-5", label: "5er Pack", quantity: 5, description: "Spar 10%", highlight: "accent" },
      { id: "waspe-pack-10", label: "10er Box", quantity: 10, description: "Beste Ersparnis - 15%", highlight: "accent" }
    ],
    maxPerUser: 20,
    heroImageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784720?w=800&h=600&fit=crop&q=80",
    shortDescription: "Premium 4-in-1 Disposable Vape mit 12 einzigartigen Geschmackskombinationen - 100K Puffs!"
  }
];
