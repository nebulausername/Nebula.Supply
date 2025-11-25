export type ProductCategory = 'audio' | 'sneakers' | 'fashion' | 'accessories' | 'tech' | 'vape' | 'bundle' | 'mystery';

export interface MaintenanceProduct {
  id: string;
  category: ProductCategory;
  hint: string;
  priceRange: { min: number; max: number } | number;
  minQuantity: number;
  deliveryTime?: string;
  description?: string;
}

// Shop Products (4-5 Teaser)
export const shopProducts: MaintenanceProduct[] = [
  {
    id: 'airpods',
    category: 'audio',
    hint: 'Premium Audio',
    priceRange: { min: 45, max: 60 },
    minQuantity: 1,
    deliveryTime: '1-5 Werktage',
    description: 'AirPods Gen 1-4'
  },
  {
    id: 'airforce',
    category: 'sneakers',
    hint: 'Nike Classics',
    priceRange: 50,
    minQuantity: 2,
    deliveryTime: '7-14 Werktage',
    description: 'Air Force 1 Weiß/Schwarz'
  },
  {
    id: 'hoodies',
    category: 'fashion',
    hint: 'Designer Style',
    priceRange: 35,
    minQuantity: 2,
    deliveryTime: '7-14 Werktage',
    description: 'Premium Hoodies'
  },
  {
    id: 'caps',
    category: 'accessories',
    hint: 'Streetwear',
    priceRange: 20,
    minQuantity: 1,
    deliveryTime: '5-10 Werktage',
    description: 'Designer Caps'
  },
  {
    id: 'watches',
    category: 'accessories',
    hint: 'Luxury Watches',
    priceRange: { min: 80, max: 150 },
    minQuantity: 1,
    deliveryTime: '7-14 Werktage',
    description: 'Designer Uhren'
  }
];

// Drop Products (4 Teaser)
export const dropProducts: MaintenanceProduct[] = [
  {
    id: 'waspe-100k',
    category: 'vape',
    hint: 'Waspe 100K',
    priceRange: 15,
    minQuantity: 2,
    deliveryTime: '9-15 Tage',
    description: '4 Sorten in einem Drop'
  },
  {
    id: 'vape-bundle',
    category: 'bundle',
    hint: 'Premium Bundle',
    priceRange: 40,
    minQuantity: 1,
    deliveryTime: '2 Wochen',
    description: '3er Vape Pack'
  },
  {
    id: 'mystery-sneaker',
    category: 'mystery',
    hint: 'Mystery Box',
    priceRange: 120,
    minQuantity: 1,
    deliveryTime: '14 Tage',
    description: 'Nike/Adidas Sneaker'
  },
  {
    id: 'tech-gadget',
    category: 'tech',
    hint: 'Tech Drop',
    priceRange: { min: 25, max: 45 },
    minQuantity: 1,
    deliveryTime: '7-10 Tage',
    description: 'Wechselnde Gadgets'
  }
];

// Category Metadata
export const categoryMetadata: Record<ProductCategory, {
  icon: string;
  gradient: string;
  label: string;
}> = {
  audio: {
    icon: '🎧',
    gradient: 'from-blue-500 to-cyan-500',
    label: 'Audio'
  },
  sneakers: {
    icon: '👟',
    gradient: 'from-orange-500 to-red-500',
    label: 'Sneakers'
  },
  fashion: {
    icon: '👕',
    gradient: 'from-purple-500 to-pink-500',
    label: 'Fashion'
  },
  accessories: {
    icon: '🧢',
    gradient: 'from-yellow-500 to-orange-500',
    label: 'Accessories'
  },
  tech: {
    icon: '📱',
    gradient: 'from-green-500 to-emerald-500',
    label: 'Tech'
  },
  vape: {
    icon: '💨',
    gradient: 'from-indigo-500 to-violet-500',
    label: 'Vape'
  },
  bundle: {
    icon: '📦',
    gradient: 'from-pink-500 to-rose-500',
    label: 'Bundle'
  },
  mystery: {
    icon: '🎁',
    gradient: 'from-purple-600 to-pink-600',
    label: 'Mystery'
  }
};

