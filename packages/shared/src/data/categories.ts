import type { Category } from "../types";
import { createSlug } from "../utils/slugUtils";

export const categories: Category[] = [
  {
    id: "cat-shoes",
    slug: "shoes",
    name: "Sneaker",
    description: "Limitierte Sneaker-Drops, Collectibles und Daily Essentials.",
    icon: "👟",
    order: 1,
    featured: true,
    subItems: [
      {
        id: "sub-nike",
        name: "NIKE",
        slug: createSlug("NIKE"),
        brands: [
          {
            id: "brand-nike",
            name: "NIKE",
            slug: createSlug("NIKE"),
            series: [
              { id: "series-airmax-95", name: "AIRMAX 95", slug: createSlug("AIRMAX 95") },
              { id: "series-airmax-dn", name: "AIRMAX DN", slug: createSlug("AIRMAX DN") },
              { id: "series-shox-tl", name: "SHOX TL", slug: createSlug("SHOX TL") },
              { id: "series-air-force", name: "AIR FORCE", slug: createSlug("AIR FORCE") },
              { id: "series-dunk-sb", name: "DUNK SB", slug: createSlug("DUNK SB") }
            ]
          }
        ]
      },
      {
        id: "sub-air-jordan",
        name: "AIR JORDAN",
        slug: createSlug("AIR JORDAN"),
        brands: [
          {
            id: "brand-air-jordan",
            name: "AIR JORDAN",
            slug: createSlug("AIR JORDAN"),
            series: [
              { id: "series-jordan-1-high", name: "AIR JORDAN 1 HIGH", slug: createSlug("AIR JORDAN 1 HIGH") },
              { id: "series-jordan-1-low", name: "AIR JORDAN 1 LOW", slug: createSlug("AIR JORDAN 1 LOW") },
              { id: "series-jordan-3", name: "AIR JORDAN 3", slug: createSlug("AIR JORDAN 3") },
              { id: "series-jordan-4", name: "AIR JORDAN 4", slug: createSlug("AIR JORDAN 4") },
              { id: "series-jordan-5", name: "AIR JORDAN 5", slug: createSlug("AIR JORDAN 5") },
              { id: "series-jordan-6", name: "AIR JORDAN 6", slug: createSlug("AIR JORDAN 6") },
              { id: "series-jordan-11", name: "AIR JORDAN 11", slug: createSlug("AIR JORDAN 11") }
            ]
          }
        ]
      },
      {
        id: "sub-nocta",
        name: "NOCTA",
        slug: createSlug("NOCTA"),
        brands: [
          {
            id: "brand-nocta",
            name: "NOCTA",
            slug: createSlug("NOCTA"),
            series: [
              { id: "series-glide", name: "GLIDE", slug: createSlug("GLIDE") },
              { id: "series-hot-step", name: "HOT STEP", slug: createSlug("HOT STEP") },
              { id: "series-hot-step-2", name: "HOT STEP 2", slug: createSlug("HOT STEP 2") }
            ]
          }
        ]
      },
      {
        id: "sub-maison-margiela",
        name: "MAISON MARGIELA",
        slug: createSlug("MAISON MARGIELA"),
        brands: [
          {
            id: "brand-maison-margiela",
            name: "MAISON MARGIELA",
            slug: createSlug("MAISON MARGIELA"),
            series: [
              { id: "series-gats", name: "GATS", slug: createSlug("GATS") }
            ]
          }
        ]
      },
      {
        id: "sub-chanel",
        name: "CHANEL",
        slug: createSlug("CHANEL"),
        brands: [
          {
            id: "brand-chanel",
            name: "CHANEL",
            slug: createSlug("CHANEL"),
            series: [
              { id: "series-runner", name: "RUNNER", slug: createSlug("RUNNER") }
            ]
          }
        ]
      },
      {
        id: "sub-lv",
        name: "LV",
        slug: createSlug("LV"),
        brands: [
          {
            id: "brand-lv",
            name: "LV",
            slug: createSlug("LV"),
            series: [
              { id: "series-skate", name: "SKATE", slug: createSlug("SKATE") },
              { id: "series-trainer", name: "TRAINER", slug: createSlug("TRAINER") }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "cat-clothing",
    slug: "clothing",
    name: "Kleidung",
    description: "Premium Kleidung von Top-Marken und Streetwear Labels.",
    icon: "👔",
    order: 2,
    subItems: [
      {
        id: "sub-tshirts",
        name: "T-SHIRTS",
        slug: createSlug("T-SHIRTS"),
        brands: [
          {
            id: "brand-dior-tshirts",
            name: "DIOR",
            slug: createSlug("DIOR")
          },
          {
            id: "brand-nike-tshirts",
            name: "NIKE",
            slug: createSlug("NIKE")
          },
          {
            id: "brand-gucci-tshirts",
            name: "GUCCI",
            slug: createSlug("GUCCI")
          },
          {
            id: "brand-prada-tshirts",
            name: "PRADA",
            slug: createSlug("PRADA")
          },
          {
            id: "brand-balenciaga-tshirts",
            name: "BALENCIAGA",
            slug: createSlug("BALENCIAGA")
          }
        ]
      },
      {
        id: "sub-hoodies",
        name: "HOODIES",
        slug: createSlug("HOODIES"),
        brands: [
          {
            id: "brand-nike-hoodies",
            name: "NIKE",
            slug: createSlug("NIKE")
          },
          {
            id: "brand-gucci-hoodies",
            name: "GUCCI",
            slug: createSlug("GUCCI")
          },
          {
            id: "brand-stussy-hoodies",
            name: "STÜSSY",
            slug: createSlug("STÜSSY")
          },
          {
            id: "brand-corteiz-hoodies",
            name: "CORTEIZ",
            slug: createSlug("CORTEIZ")
          },
          {
            id: "brand-balenciaga-hoodies",
            name: "BALENCIAGA",
            slug: createSlug("BALENCIAGA")
          }
        ]
      },
      {
        id: "sub-pants",
        name: "HOSEN",
        slug: createSlug("HOSEN"),
        brands: [
          {
            id: "brand-nike-pants",
            name: "NIKE",
            slug: createSlug("NIKE")
          },
          {
            id: "brand-gucci-pants",
            name: "GUCCI",
            slug: createSlug("GUCCI")
          },
          {
            id: "brand-cp-company-pants",
            name: "C.P. COMPANY",
            slug: createSlug("C.P. COMPANY")
          },
          {
            id: "brand-stussy-pants",
            name: "STÜSSY",
            slug: createSlug("STÜSSY")
          }
        ]
      },
      {
        id: "sub-shorts",
        name: "SHORTS",
        slug: createSlug("SHORTS"),
        brands: [
          {
            id: "brand-nike-shorts",
            name: "NIKE",
            slug: createSlug("NIKE")
          },
          {
            id: "brand-gucci-shorts",
            name: "GUCCI",
            slug: createSlug("GUCCI")
          },
          {
            id: "brand-stussy-shorts",
            name: "STÜSSY",
            slug: createSlug("STÜSSY")
          }
        ]
      },
      {
        id: "sub-winter-jacken",
        name: "WINTER JACKEN",
        slug: createSlug("WINTER JACKEN"),
        brands: [
          {
            id: "brand-canada-goose",
            name: "CANADA GOOSE",
            slug: createSlug("CANADA GOOSE")
          },
          {
            id: "brand-moncler-herren",
            name: "MONCLER HERREN",
            slug: createSlug("MONCLER HERREN")
          },
          {
            id: "brand-moncler-damen",
            name: "MONCLER DAMEN",
            slug: createSlug("MONCLER DAMEN")
          },
          {
            id: "brand-polo-ralph-lauren",
            name: "POLO RALPH LAUREN",
            slug: createSlug("POLO RALPH LAUREN")
          },
          {
            id: "brand-stussy",
            name: "STÜSSY",
            slug: createSlug("STÜSSY")
          },
          {
            id: "brand-corteiz",
            name: "CORTEIZ",
            slug: createSlug("CORTEIZ")
          },
          {
            id: "brand-cp-company",
            name: "C.P. COMPANY",
            slug: createSlug("C.P. COMPANY")
          },
          {
            id: "brand-bbr",
            name: "BBR",
            slug: createSlug("BBR")
          }
        ]
      },
      {
        id: "sub-cardigans",
        name: "CARDIGANS",
        slug: createSlug("CARDIGANS"),
        brands: [
          {
            id: "brand-moncler",
            name: "MONCLER",
            slug: createSlug("MONCLER")
          }
        ]
      },
      {
        id: "sub-tracksuits",
        name: "TRACKSUITS",
        slug: createSlug("TRACKSUITS"),
        brands: [
          {
            id: "brand-nocta-jackets",
            name: "NOCTA",
            slug: createSlug("NOCTA")
          }
        ]
      }
    ]
  },
  {
    id: "cat-accessories",
    slug: "accessories",
    name: "Accessoires",
    description: "Rucksäcke, Taschen, Gürtel und Lifestyle Items.",
    icon: "🎒",
    order: 4,
    subItems: [
      {
        id: "sub-muetzen-caps",
        name: "MÜTZEN & CAPS",
        slug: createSlug("MÜTZEN & CAPS"),
        brands: [
          {
            id: "brand-gucci-caps",
            name: "GUCCI",
            slug: createSlug("GUCCI")
          },
          {
            id: "brand-lv-caps",
            name: "LV",
            slug: createSlug("LV")
          },
          {
            id: "brand-nike-caps",
            name: "NIKE",
            slug: createSlug("NIKE")
          },
          {
            id: "brand-stussy-caps",
            name: "STÜSSY",
            slug: createSlug("STÜSSY")
          },
          {
            id: "brand-new-era-caps",
            name: "NEW ERA",
            slug: createSlug("NEW ERA")
          }
        ]
      },
      {
        id: "sub-uhren",
        name: "UHREN",
        slug: createSlug("UHREN"),
        brands: [
          {
            id: "brand-rolex",
            name: "ROLEX",
            slug: createSlug("ROLEX")
          },
          {
            id: "brand-ap",
            name: "AUDEMARS PIGUET",
            slug: createSlug("AUDEMARS PIGUET")
          },
          {
            id: "brand-patek",
            name: "PATEK PHILIPPE",
            slug: createSlug("PATEK PHILIPPE")
          },
          {
            id: "brand-richard-mille",
            name: "RICHARD MILLE",
            slug: createSlug("RICHARD MILLE")
          },
          {
            id: "brand-cartier",
            name: "CARTIER",
            slug: createSlug("CARTIER")
          }
        ]
      },
      {
        id: "sub-geldboersen",
        name: "GELDBÖRSEN",
        slug: createSlug("GELDBÖRSEN"),
        brands: [
          {
            id: "brand-goyard",
            name: "GOYARD",
            slug: createSlug("GOYARD")
          },
          {
            id: "brand-lv-wallets",
            name: "LV",
            slug: createSlug("LV")
          },
          {
            id: "brand-gucci-wallets",
            name: "GUCCI",
            slug: createSlug("GUCCI")
          }
        ]
      },
      {
        id: "sub-guertel",
        name: "GÜRTEL",
        slug: createSlug("GÜRTEL"),
        brands: [
          {
            id: "brand-ferragamo",
            name: "FERRAGAMO",
            slug: createSlug("FERRAGAMO")
          },
          {
            id: "brand-gucci-belts",
            name: "GUCCI",
            slug: createSlug("GUCCI")
          },
          {
            id: "brand-burberry",
            name: "BURBERRY",
            slug: createSlug("BURBERRY")
          },
          {
            id: "brand-balenciaga-belts",
            name: "BALENCIAGA",
            slug: createSlug("BALENCIAGA")
          },
          {
            id: "brand-hermes-belts",
            name: "HERMÈS",
            slug: createSlug("HERMÈS")
          }
        ]
      },
      {
        id: "sub-high-heels",
        name: "HIGH HEELS",
        slug: createSlug("HIGH HEELS"),
        brands: [
          {
            id: "brand-louboutin",
            name: "CHRISTIAN LOUBOUTIN",
            slug: createSlug("CHRISTIAN LOUBOUTIN")
          },
          {
            id: "brand-jimmy-choo",
            name: "JIMMY CHOO",
            slug: createSlug("JIMMY CHOO")
          },
          {
            id: "brand-manolo-blahnik",
            name: "MANOLO BLAHNIK",
            slug: createSlug("MANOLO BLAHNIK")
          }
        ]
      }
    ]
  },
  {
    id: "cat-taschen",
    slug: "taschen",
    name: "Taschen",
    description: "Rucksäcke, Taschen und Bags von Premium Marken.",
    icon: "👜",
    order: 5,
    subItems: [
      {
        id: "sub-mens",
        name: "MENS",
        slug: createSlug("MENS"),
        brands: [
          {
            id: "brand-goyard-mens",
            name: "GOYARD",
            slug: createSlug("GOYARD")
          },
          {
            id: "brand-dior-mens",
            name: "DIOR",
            slug: createSlug("DIOR")
          },
          {
            id: "brand-trapstar-mens",
            name: "TRAPSTAR",
            slug: createSlug("TRAPSTAR")
          }
        ]
      },
      {
        id: "sub-womens",
        name: "WOMENS",
        slug: createSlug("WOMENS"),
        brands: [
          {
            id: "brand-prada-womens",
            name: "PRADA",
            slug: createSlug("PRADA")
          },
          {
            id: "brand-dior-womens",
            name: "DIOR",
            slug: createSlug("DIOR")
          }
        ]
      },
      {
        id: "sub-reisen",
        name: "REISEN",
        slug: createSlug("REISEN"),
        items: [
          "BIG BAGS"
        ]
      }
    ]
  },
  {
    id: "cat-tech",
    slug: "tech",
    name: "Tech",
    description: "Smartphone Cases, Laptop Sleeves und Tech Accessories.",
    icon: "📱",
    order: 6
  },
  {
    id: "cat-bundle",
    slug: "bundle",
    name: "Bundles",
    description: "Curated Packs mit Extra-Coins und Specials.",
    icon: "🎁",
    order: 7,
    featured: true
  }
];
