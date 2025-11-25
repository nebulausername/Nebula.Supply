export interface ProductTemplate {
  defaultPrice: number;
  defaultDescription: string;
  defaultVariants?: VariantTemplate[];
  defaultImages?: string[];
  defaultTags?: string[];
  defaultStock?: number;
  defaultLeadTime?: string;
}

export interface VariantTemplate {
  name: string;
  options: string[];
  required?: boolean;
}

export interface CategoryTemplateConfig {
  categoryName: string;
  categorySlug: string;
  categoryIcon: string;
  categoryDescription: string;
  productTemplate: ProductTemplate;
}

// Hauptkategorien Definitionen
export const MAIN_CATEGORIES: CategoryTemplateConfig[] = [
  {
    categoryName: 'SNEAKER',
    categorySlug: 'sneaker',
    categoryIcon: '👟',
    categoryDescription: 'Premium Sneaker und Sportschuhe',
    productTemplate: {
      defaultPrice: 150,
      defaultDescription: 'Premium Sneaker mit hochwertigen Materialien und modernem Design.',
      defaultVariants: [
        {
          name: 'Größe',
          options: ['40', '41', '42', '43', '44', '45', '46', '47'],
          required: true
        },
        {
          name: 'Farbe',
          options: ['Schwarz', 'Weiß', 'Grau', 'Blau', 'Rot'],
          required: false
        }
      ],
      defaultStock: 10,
      defaultLeadTime: '1_week',
      defaultTags: ['sneaker', 'sportschuhe', 'premium']
    }
  },
  {
    categoryName: 'KLEIDUNG',
    categorySlug: 'kleidung',
    categoryIcon: '👕',
    categoryDescription: 'Streetwear und Mode',
    productTemplate: {
      defaultPrice: 80,
      defaultDescription: 'Hochwertige Streetwear mit modernem Design und bester Qualität.',
      defaultVariants: [
        {
          name: 'Größe',
          options: ['S', 'M', 'L', 'XL', 'XXL'],
          required: true
        },
        {
          name: 'Farbe',
          options: ['Schwarz', 'Weiß', 'Grau', 'Navy'],
          required: false
        }
      ],
      defaultStock: 15,
      defaultLeadTime: '2_days',
      defaultTags: ['kleidung', 'streetwear', 'mode']
    }
  },
  {
    categoryName: 'ACCESSOIRES',
    categorySlug: 'accessoires',
    categoryIcon: '👜',
    categoryDescription: 'Accessoires und Zubehör',
    productTemplate: {
      defaultPrice: 50,
      defaultDescription: 'Stylische Accessoires für den perfekten Look.',
      defaultVariants: [
        {
          name: 'Farbe',
          options: ['Schwarz', 'Weiß', 'Braun', 'Beige'],
          required: false
        }
      ],
      defaultStock: 20,
      defaultLeadTime: 'same_day',
      defaultTags: ['accessoires', 'zubehör', 'styling']
    }
  },
  {
    categoryName: 'TASCHEN',
    categorySlug: 'taschen',
    categoryIcon: '💼',
    categoryDescription: 'Taschen und Rucksäcke',
    productTemplate: {
      defaultPrice: 120,
      defaultDescription: 'Funktionale und stylische Taschen für jeden Anlass.',
      defaultVariants: [
        {
          name: 'Farbe',
          options: ['Schwarz', 'Braun', 'Beige', 'Navy'],
          required: false
        },
        {
          name: 'Material',
          options: ['Leder', 'Canvas', 'Nylon'],
          required: false
        }
      ],
      defaultStock: 12,
      defaultLeadTime: '1_week',
      defaultTags: ['taschen', 'rucksäcke', 'accessoires']
    }
  },
  {
    categoryName: 'TECH',
    categorySlug: 'tech',
    categoryIcon: '📱',
    categoryDescription: 'Technologie und Elektronik',
    productTemplate: {
      defaultPrice: 200,
      defaultDescription: 'Moderne Technologie-Produkte mit innovativen Features.',
      defaultVariants: [
        {
          name: 'Modell',
          options: ['Standard', 'Pro', 'Max'],
          required: false
        },
        {
          name: 'Farbe',
          options: ['Schwarz', 'Weiß', 'Silber'],
          required: false
        }
      ],
      defaultStock: 8,
      defaultLeadTime: '2_days',
      defaultTags: ['tech', 'elektronik', 'innovation']
    }
  }
];

// 3-Level Hierarchie für Sneaker: SNEAKER → Marken → Modelle
export interface SneakerBrand {
  name: string;
  slug: string;
  models: string[];
  template: ProductTemplate;
}

export interface SneakerHierarchy {
  mainCategory: 'SNEAKER';
  brands: SneakerBrand[];
}

// Vollständige 3-Level SNEAKER Hierarchie
export const SNEAKER_HIERARCHY: SneakerHierarchy = {
  mainCategory: 'SNEAKER',
  brands: [
    {
      name: 'NIKE',
      slug: 'nike',
      models: ['AIRMAX 95', 'AIRMAX DN', 'SHOX TL', 'AIR FORCE', 'DUNK SB'],
      template: {
        defaultPrice: 180,
        defaultDescription: 'Nike Sneaker mit ikonischem Design und maximalem Komfort.',
        defaultTags: ['nike', 'sneaker', 'sportschuhe'],
        defaultVariants: [
          {
            name: 'Größe',
            options: ['40', '41', '42', '43', '44', '45', '46', '47'],
            required: true
          },
          {
            name: 'Farbe',
            options: ['Schwarz', 'Weiß', 'Grau', 'Blau', 'Rot'],
            required: false
          }
        ],
        defaultStock: 10,
        defaultLeadTime: '1_week'
      }
    },
    {
      name: 'AIR JORDAN',
      slug: 'air-jordan',
      models: ['AIR JORDAN 1 HIGH', 'AIR JORDAN 1 LOW', 'AIR JORDAN 3', 'AIR JORDAN 4', 'AIR JORDAN 5', 'AIR JORDAN 6', 'AIR JORDAN 11'],
      template: {
        defaultPrice: 200,
        defaultDescription: 'Air Jordan Sneaker - Legenden des Basketballs.',
        defaultTags: ['jordan', 'nike', 'basketball'],
        defaultVariants: [
          {
            name: 'Größe',
            options: ['40', '41', '42', '43', '44', '45', '46', '47'],
            required: true
          },
          {
            name: 'Farbe',
            options: ['Schwarz', 'Weiß', 'Grau', 'Blau', 'Rot', 'Bred', 'Royal'],
            required: false
          }
        ],
        defaultStock: 8,
        defaultLeadTime: '1_week'
      }
    },
    {
      name: 'NOCTA',
      slug: 'nocta',
      models: ['GLIDE', 'HOT STEP', 'HOT STEP 2'],
      template: {
        defaultPrice: 250,
        defaultDescription: 'NOCTA Sneaker - Kollaboration mit Drake.',
        defaultTags: ['nocta', 'drake', 'premium'],
        defaultVariants: [
          {
            name: 'Größe',
            options: ['40', '41', '42', '43', '44', '45', '46', '47'],
            required: true
          },
          {
            name: 'Farbe',
            options: ['Schwarz', 'Weiß', 'Grau'],
            required: false
          }
        ],
        defaultStock: 5,
        defaultLeadTime: '2_weeks'
      }
    },
    {
      name: 'MAISON MARGIELA',
      slug: 'maison-margiela',
      models: ['GATS'],
      template: {
        defaultPrice: 600,
        defaultDescription: 'Maison Margiela GATS - Luxus-Sneaker mit avantgardistischem Design.',
        defaultTags: ['margiela', 'luxus', 'designer'],
        defaultVariants: [
          {
            name: 'Größe',
            options: ['40', '41', '42', '43', '44', '45'],
            required: true
          },
          {
            name: 'Farbe',
            options: ['Schwarz', 'Weiß', 'Beige'],
            required: false
          }
        ],
        defaultStock: 3,
        defaultLeadTime: '2_weeks'
      }
    },
    {
      name: 'CHANEL',
      slug: 'chanel',
      models: ['RUNNER'],
      template: {
        defaultPrice: 1200,
        defaultDescription: 'Chanel Runner - Exklusive Luxus-Sneaker.',
        defaultTags: ['chanel', 'luxus', 'designer'],
        defaultVariants: [
          {
            name: 'Größe',
            options: ['38', '39', '40', '41', '42', '43'],
            required: true
          },
          {
            name: 'Farbe',
            options: ['Schwarz', 'Weiß', 'Beige'],
            required: false
          }
        ],
        defaultStock: 2,
        defaultLeadTime: '3_weeks'
      }
    },
    {
      name: 'LV',
      slug: 'lv',
      models: ['SKATE', 'TRAINER'],
      template: {
        defaultPrice: 900,
        defaultDescription: 'Louis Vuitton Sneaker - Luxus trifft Streetwear.',
        defaultTags: ['lv', 'louis-vuitton', 'luxus'],
        defaultVariants: [
          {
            name: 'Größe',
            options: ['40', '41', '42', '43', '44', '45'],
            required: true
          },
          {
            name: 'Farbe',
            options: ['Schwarz', 'Weiß', 'Braun', 'Monogram'],
            required: false
          }
        ],
        defaultStock: 3,
        defaultLeadTime: '2_weeks'
      }
    }
  ]
};

// Legacy Support: Alte SNEAKER_SUBCATEGORIES für Rückwärtskompatibilität
export const SNEAKER_SUBCATEGORIES = {
  'Nike': {
    subcategories: SNEAKER_HIERARCHY.brands[0].models,
    template: SNEAKER_HIERARCHY.brands[0].template
  },
  'AIR JORDAN': {
    subcategories: SNEAKER_HIERARCHY.brands[1].models,
    template: SNEAKER_HIERARCHY.brands[1].template
  },
  'NOCTA': {
    subcategories: SNEAKER_HIERARCHY.brands[2].models,
    template: SNEAKER_HIERARCHY.brands[2].template
  },
  'MAISON MARGIELA': {
    subcategories: SNEAKER_HIERARCHY.brands[3].models,
    template: SNEAKER_HIERARCHY.brands[3].template
  },
  'CHANEL': {
    subcategories: SNEAKER_HIERARCHY.brands[4].models,
    template: SNEAKER_HIERARCHY.brands[4].template
  },
  'LV': {
    subcategories: SNEAKER_HIERARCHY.brands[5].models,
    template: SNEAKER_HIERARCHY.brands[5].template
  }
};

// Subkategorien Templates für Kleidung
export const KLEIDUNG_SUBCATEGORIES = {
  'T-SHIRTS': {
    brands: ['DIOR', 'NIKE', 'GUCCI', 'PRADA', 'BALENCIAGA'],
    template: {
      defaultPrice: 80,
      defaultDescription: 'Premium T-Shirt mit hochwertigen Materialien.',
      defaultTags: ['t-shirt', 'basic', 'casual']
    }
  },
  'SHORTS': {
    brands: ['NIKE', 'GUCCI', 'STÜSSY'],
    template: {
      defaultPrice: 90,
      defaultDescription: 'Stylische Shorts für den Sommer.',
      defaultTags: ['shorts', 'sommer', 'casual']
    }
  },
  'HOODIES': {
    brands: ['NIKE', 'GUCCI', 'STÜSSY', 'CORTEIZ', 'BALENCIAGA'],
    template: {
      defaultPrice: 120,
      defaultDescription: 'Comfortable Hoodie mit modernem Design.',
      defaultTags: ['hoodie', 'warm', 'casual']
    }
  },
  'WINTER JACKEN': {
    brands: ['CANADA GOOSE', 'MONCLER HERREN', 'MONCLER DAMEN', 'POLO RALPH LAUREN', 'STÜSSY', 'CORTEIZ', 'C.P. COMPANY', 'BBR'],
    template: {
      defaultPrice: 400,
      defaultDescription: 'Warme Winterjacke für kalte Tage.',
      defaultTags: ['jacke', 'winter', 'warm']
    }
  },
  'HOSEN': {
    brands: ['NIKE', 'GUCCI', 'C.P. COMPANY', 'STÜSSY'],
    template: {
      defaultPrice: 150,
      defaultDescription: 'Stylische Hose mit perfektem Fit.',
      defaultTags: ['hose', 'pants', 'casual']
    }
  },
  'CARDIGANS': {
    brands: ['MONCLER'],
    template: {
      defaultPrice: 250,
      defaultDescription: 'Eleganter Cardigan für jeden Anlass.',
      defaultTags: ['cardigan', 'elegant', 'warm']
    }
  },
  'TRACKSUITS': {
    brands: ['NOCTA'],
    template: {
      defaultPrice: 300,
      defaultDescription: 'Stylischer Tracksuit für Sport und Freizeit.',
      defaultTags: ['tracksuit', 'sport', 'casual']
    }
  }
};

// Generiere SKU basierend auf Kategorie und Name
export function generateSKU(categorySlug: string, productName: string): string {
  const categoryPrefix = categorySlug.toUpperCase().substring(0, 3);
  const namePrefix = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 5);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${categoryPrefix}-${namePrefix}-${randomSuffix}`;
}

// Hole Template für eine Kategorie
export function getCategoryTemplate(categorySlug: string): ProductTemplate | null {
  const category = MAIN_CATEGORIES.find(c => c.categorySlug === categorySlug);
  return category?.productTemplate || null;
}

// Generiere Produktname aus Kategorie-Hierarchie
export function generateProductName(parentCategory: string, subCategory: string, brand?: string): string {
  if (brand) {
    return `${brand} ${subCategory}`;
  }
  return `${parentCategory} ${subCategory}`;
}

