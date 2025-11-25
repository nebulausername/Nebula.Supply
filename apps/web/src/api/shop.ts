import {
  categories as categorySeed,
  products as productSeed,
  coinRewardTiers,
  inviteStatusMock,
  inviteActivityMock,
  type Category,
  type Product,
  type CoinRewardTier,
  type InviteActivity
} from "@nebula/shared";
import { shopApi } from "../lib/api/shopApi";

// Define InviteStatus type locally since it's not exported from shared
type InviteStatus = {
  userId: string;
  hasInvite: boolean;
  inviteCode: string;
  personalInviteCode?: string;
  availableInvites: number;
  totalReferrals: number;
  rank: string;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Feature flag to enable/disable backend integration
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API !== 'false';

/**
 * Fetch categories from backend API with fallback to mock data
 */
export const fetchCategories = async (): Promise<Category[]> => {
  // Try backend API first if enabled
  if (USE_BACKEND_API) {
    try {
      const apiCategories = await shopApi.getCategories();
      if (apiCategories.length > 0) {
        return apiCategories;
      }
    } catch (error) {
      console.warn('[Shop] Failed to fetch categories from API, using fallback:', error);
    }
  }

  // Fallback to mock data
  await delay(50);
  return categorySeed.slice().sort((a, b) => a.order - b.order);
};

/**
 * Fetch products from backend API with fallback to mock data
 */
export const fetchProducts = async (): Promise<Product[]> => {
  // Try backend API first if enabled
  if (USE_BACKEND_API) {
    try {
      const apiProducts = await shopApi.getProducts({
        status: ['active'],
        type: ['shop'],
        inStock: true, // Only show products in stock
      });
      
      if (apiProducts.length > 0) {
        return apiProducts;
      }
    } catch (error) {
      console.warn('[Shop] Failed to fetch products from API, using fallback:', error);
    }
  }

  // Fallback to mock data
  await delay(50);
  
  // Return seed products immediately for instant loading
  const seedProducts = productSeed;
  
  // Lazy load generated products only when needed
  // Only generate limited products to avoid performance issues
  if (seedProducts.length < 15) {
    const { generateProductsForBrand, categories } = await import("@nebula/shared");
    const generatedProducts: Product[] = [];
    
    // Limit generation to first 3 categories for performance
    const categoriesToProcess = categories.slice(0, 3);
    
    for (const category of categoriesToProcess) {
      if (category.subItems) {
        for (const subItem of category.subItems) {
          if (subItem.brands) {
            // Only generate for first 2 brands per subItem to limit products
            const brandsToProcess = subItem.brands.slice(0, 2);
            for (const brand of brandsToProcess) {
              const brandProducts = generateProductsForBrand(
                category.id,
                category.slug,
                category.name,
                brand
              );
              // Limit to 8 products per brand for performance
              generatedProducts.push(...brandProducts.slice(0, 8));
            }
          }
        }
      }
    }
    
    return [...seedProducts, ...generatedProducts];
  }
  
  // Return only seed products if we already have enough
  return seedProducts;
};

export const fetchInviteStatus = async (): Promise<InviteStatus> => {
  await delay(100);
  return inviteStatusMock;
};

export const fetchInviteActivity = async (): Promise<InviteActivity[]> => {
  await delay(120);
  return inviteActivityMock;
};

export const fetchCoinRewards = async (): Promise<CoinRewardTier[]> => {
  await delay(100);
  return coinRewardTiers;
};

// Fake stream for inventory/interest updates
export type ShopUpdate =
  | { type: "inventory"; productId: string; inventory: number }
  | { type: "interest"; productId: string; interest: number };

type Listener = (update: ShopUpdate) => void;

let listeners: Listener[] = [];
let feedInterval: ReturnType<typeof setInterval> | null = null;

export const subscribeShopFeed = (listener: Listener) => {
  listeners.push(listener);
  if (!feedInterval) {
    feedInterval = setInterval(() => {
      const product = productSeed[Math.floor(Math.random() * productSeed.length)];
      if (!product) return;

      const interestUpdate = Math.max(
        0,
        Math.round(product.interest + (Math.random() * 10 - 4))
      );
      const inventoryUpdate = Math.max(
        0,
        product.inventory + Math.floor(Math.random() * 6 - 2)
      );

      listeners.forEach((cb) =>
        cb({ type: "interest", productId: product.id, interest: interestUpdate })
      );
      listeners.forEach((cb) =>
        cb({ type: "inventory", productId: product.id, inventory: inventoryUpdate })
      );
    }, 8000);
  }

  return () => {
    listeners = listeners.filter((cb) => cb !== listener);
    if (listeners.length === 0 && feedInterval) {
      clearInterval(feedInterval);
      feedInterval = null;
    }
  };
};

// Fetch personal invite code for a user
export const fetchPersonalInviteCode = async (telegramId: number): Promise<string | null> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('telegram_token');
    
    const response = await fetch(`${apiUrl}/api/bot/users/personal-invite-code/${telegramId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch personal invite code');
    }

    const data = await response.json();
    return data.data?.personalInviteCode || null;
  } catch (error) {
    console.error('Error fetching personal invite code:', error);
    return null;
  }
};

// Update personal invite code
export const updatePersonalInviteCode = async (telegramId: number, code: string): Promise<void> => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const token = localStorage.getItem('telegram_token');
  
  const response = await fetch(`${apiUrl}/api/bot/users/personal-invite-code/update`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ telegramId, code })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update personal invite code');
  }
};

// Validate personal invite code availability
export const validatePersonalInviteCode = async (code: string): Promise<boolean> => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('telegram_token');
    
    const response = await fetch(`${apiUrl}/api/bot/users/personal-invite-code/validate`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.data?.available || false;
  } catch (error) {
    console.error('Error validating personal invite code:', error);
    return false;
  }
};



