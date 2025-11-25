import { create } from "zustand";
import {
  fetchCategories,
  fetchProducts,
  fetchCoinRewards,
  fetchInviteStatus,
  fetchInviteActivity,
  subscribeShopFeed,
  fetchPersonalInviteCode,
  updatePersonalInviteCode as updatePersonalInviteCodeApi,
  validatePersonalInviteCode,
  type ShopUpdate
} from "../api/shop";
import {
  createPaymentSession,
  waitForPaymentConfirmation,
  getPaymentMethods,
  type PaymentMethod,
  type PaymentMethodConfig,
  type PaymentSession
} from "../api/checkout";
import { useAuthStore } from "./auth";
import { useUserInterestsStore } from "./userInterests";
import type {
  Category,
  Product,
  CoinRewardTier,
  InviteActivity,
  CartItem,
  VariantType
} from "@nebula/shared";

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

// Define InviteSummary type locally
type InviteSummary = {
  totalSent: number;
  totalActivated: number;
  totalPending: number;
  totalRewardsClaimed: number;
  pendingCoins: number;
  conversionRate: number;
};

// Helper function for reward errors
const formatRewardError = (reward: CoinRewardTier, subtotal: number, coinsBalance: number): string => {
  if (coinsBalance < reward.coins) {
    return `Du brauchst ${reward.coins - coinsBalance} mehr Coins für ${reward.reward}`;
  }
  if (subtotal < reward.minSpend) {
    return `Mindestbestellwert von ${reward.minSpend}€ für ${reward.reward} nicht erreicht`;
  }
  return `Reward ${reward.reward} kann nicht angewendet werden`;
};

interface SelectionState {
  [productId: string]: Partial<Record<VariantType, string>>;
}

type ShippingSelectionState = Record<string, string>;

export type SortOrder = "popularity-desc" | "price-asc" | "price-desc";
export type CheckoutStatus = "idle" | "processing" | "succeeded" | "failed";

export interface CoinLedgerEntry {
  id: string;
  type: "earn" | "burn";
  amount: number;
  description: string;
  createdAt: string;
}

export interface OrderItemSummary {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  selectedOptions?: Partial<Record<VariantType, string>>;
  shippingOptionId?: string;
  shippingLabel?: string;
  shippingAdjustment?: number;
}

export interface OrderSummary {
  id: string;
  subtotal: number;
  discount: number;
  total: number;
  rewardId: string | null;
  coinsEarned: number;
  createdAt: string;
  status: "paid" | "pending";
  payment: {
    method: PaymentMethod;
    reference: string;
  };
  items: OrderItemSummary[];
}

interface ShopState {
  isLoading: boolean;
  error: string | null;
  categories: Category[];
  products: Product[];
  coinRewards: CoinRewardTier[];
  invite: InviteStatus | null;
  inviteActivity: InviteActivity[];
  inviteSummary: InviteSummary;
  activeCategoryId: string | null;
  activeBrandSlug?: string;
  activeSeriesSlug?: string;
  selectedProductId: string | null;
  selections: SelectionState;
  shippingSelections: ShippingSelectionState;
  cart: CartItem[];
  interestedProducts: Record<string, boolean>;
  interests: Record<string, number>;
  inventory: Record<string, number>;
  searchTerm: string;
  sortOrder: SortOrder;
  coinsBalance: number;
  coinLedger: CoinLedgerEntry[];
  orders: OrderSummary[];
  paymentMethods: PaymentMethodConfig[];
  selectedPaymentMethod: PaymentMethod | null;
  paymentSession: PaymentSession | null;
  selectedRewardId: string | null;
  checkoutStatus: CheckoutStatus;
  checkoutError: string | null;
  lastCheckoutIdempotencyKey: string | null;
  lastCheckoutSessionId: string | null;
  fetchAll: () => Promise<void>;
  setCategory: (categoryId: string | null) => void;
  filterByBrand: (brandSlug: string | undefined) => void;
  filterBySeries: (seriesSlug: string | undefined) => void;
  clearFilters: () => void;
  setSearchTerm: (value: string) => void;
  setSortOrder: (order: SortOrder) => void;
  openProduct: (productId: string) => void;
  closeProduct: () => void;
  selectVariant: (productId: string, variantType: VariantType, optionId: string) => void;
  selectShippingOption: (productId: string, optionId: string) => void;
  toggleInterest: (productId: string) => void;
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  selectReward: (rewardId: string) => void;
  clearReward: () => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  clearPaymentSession: () => void;
  checkout: () => Promise<void>;
  resetCheckoutStatus: () => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => void;
  updatePersonalInviteCode: (telegramId: number, code: string) => Promise<void>;
  validatePersonalInviteCode: (code: string) => Promise<boolean>;
  refreshPersonalInviteCode: (telegramId: number) => Promise<void>;
  // Real-time update actions
  updateProduct: (productId: string, updates: Partial<Product> | Product) => void;
  addProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
}

const createId = () => Math.random().toString(36).slice(2, 10);

const optionLabelFromSelection = (product: Product, selection: Partial<Record<VariantType, string>>) => {
  const labels: Partial<Record<VariantType, string>> = {};
  product.variants?.forEach((variant) => {
    const optionId = selection[variant.type];
    const option = variant.options.find((item) => item.id === optionId);
    if (option) {
      labels[variant.type] = option.label;
    }
  });
  return labels;
};

const calculateCart = (
  products: Product[],
  cart: CartItem[],
  selections: SelectionState,
  shippingSelections: ShippingSelectionState
): { items: OrderItemSummary[]; subtotal: number; shippingTotal: number } => {
  const items: OrderItemSummary[] = [];
  let subtotal = 0;
  let shippingTotal = 0;

  cart.forEach((entry) => {
    const product = products.find((item) => item.id === entry.productId);
    if (!product) return;

    const unitPrice = product.price;
    const lineTotal = unitPrice * entry.quantity;
    const shippingOptionId = shippingSelections[entry.productId] ?? product.shippingOptions?.[0]?.id ?? null;
    const shippingOption = shippingOptionId
      ? product.shippingOptions?.find((option) => option.id === shippingOptionId) ?? null
      : null;
    const shippingAdjustment = shippingOption?.priceAdjustment ?? 0;

    subtotal += lineTotal + shippingAdjustment;
    shippingTotal += shippingAdjustment;

    const selectedOptions = optionLabelFromSelection(product, selections[entry.productId] ?? {});

    items.push({
      productId: product.id,
      name: product.name,
      quantity: entry.quantity,
      unitPrice,
      total: lineTotal + shippingAdjustment,
      selectedOptions: Object.keys(selectedOptions).length ? selectedOptions : undefined,
      shippingOptionId: shippingOption?.id,
      shippingLabel: shippingOption?.label,
      shippingAdjustment: shippingAdjustment || undefined
    });
  });

  return { items, subtotal, shippingTotal };
};

const coinsEarnedFromSubtotal = (subtotal: number) =>
  subtotal > 0 ? 100 + Math.ceil(subtotal * 0.05) : 0;

const isRewardEligible = (reward: CoinRewardTier, subtotal: number, coinsBalance: number) =>
  subtotal >= reward.minSpend && coinsBalance >= reward.coins;

const buildIdempotencyKey = (items: OrderItemSummary[], rewardId: string | null, method: PaymentMethod) => {
  const sorted = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
  return JSON.stringify({
    rewardId,
    method,
    items: sorted.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      shippingOptionId: item.shippingOptionId ?? null
    }))
  });
};

const emptyInviteSummary: InviteSummary = {
  totalSent: 0,
  totalActivated: 0,
  totalPending: 0,
  totalRewardsClaimed: 0,
  pendingCoins: 0,
  conversionRate: 0
};

const buildInviteSummary = (activity: InviteActivity[]): InviteSummary => {
  if (!activity.length) {
    return { ...emptyInviteSummary };
  }

  const totals = activity.reduce(
    (acc, item) => {
      acc.totalSent += 1;
      if (item.status === "pending") {
        acc.totalPending += 1;
      }
      if (item.status === "activated" || item.status === "rewarded") {
        acc.totalActivated += 1;
      }
      if (item.status === "rewarded") {
        acc.totalRewardsClaimed += 1;
      }
      acc.pendingCoins += item.coinsPending ?? 0;
      return acc;
    },
    { ...emptyInviteSummary }
  );

  return {
    ...totals,
    conversionRate: totals.totalSent ? totals.totalActivated / totals.totalSent : 0
  };
};

// Track shop feed subscription to prevent duplicates
let shopFeedUnsubscribe: (() => void) | null = null;

export const useShopStore = create<ShopState>((set, get) => ({
  isLoading: false,
  error: null,
  categories: [],
  products: [],
  coinRewards: [],
  invite: null,
  inviteActivity: [],
  inviteSummary: emptyInviteSummary,
  activeCategoryId: null,
  selectedProductId: null,
  selections: {},
  shippingSelections: {},
  cart: [],
  interestedProducts: {},
  interests: {},
  inventory: {},
  searchTerm: "",
  sortOrder: "popularity-desc",
  coinsBalance: 0,
  coinLedger: [],
  orders: [],
  paymentMethods: [],
  selectedPaymentMethod: null,
  paymentSession: null,
  selectedRewardId: null,
  checkoutStatus: "idle",
  checkoutError: null,
  lastCheckoutIdempotencyKey: null,
  lastCheckoutSessionId: null,

  fetchAll: async () => {
    set({ isLoading: true });
    
    try {
      // Load categories first (fastest, show immediately)
      const categories = await fetchCategories().catch((error) => {
        console.warn('[ShopStore] Failed to fetch categories:', error);
        return [];
      });
      set({ categories, isLoading: true }); // Show categories immediately
      
      // Then load other data in parallel (products load separately for better UX)
      const [products, rewards, invite, inviteActivity, paymentMethods] = await Promise.all([
        fetchProducts().catch((error) => {
          console.warn('[ShopStore] Failed to fetch products:', error);
          return [];
        }),
        fetchCoinRewards().catch((error) => {
          console.warn('[ShopStore] Failed to fetch coin rewards:', error);
          return [];
        }),
        fetchInviteStatus().catch((error) => {
          console.warn('[ShopStore] Failed to fetch invite status:', error);
          return inviteStatusMock;
        }),
        fetchInviteActivity().catch((error) => {
          console.warn('[ShopStore] Failed to fetch invite activity:', error);
          return [];
        }),
        getPaymentMethods().catch((error) => {
          console.warn('[ShopStore] Failed to fetch payment methods:', error);
          return [];
        })
      ]);

      const authState = useAuthStore.getState();
      const initialCoins = authState.user?.coins ?? 0;

      // Start with empty interested products (no persistence)
      const interestsWithUser = Object.fromEntries(
        products.map((product) => [
          product.id,
          product.interest ?? 0
        ])
      );

      const inviteSummary = buildInviteSummary(inviteActivity);

      const existingShippingSelections = get().shippingSelections ?? {};
      const shippingSelections = Object.fromEntries(
        products
          .map((product) => {
            const validOptionIds = new Set(product.shippingOptions?.map((option) => option.id) || []);
            const existing = existingShippingSelections[product.id];
            if (existing && validOptionIds.has(existing)) {
              return [product.id, existing];
            }
            const fallback = product.shippingOptions?.[0];
            return fallback ? [product.id, fallback.id] : null;
          })
          .filter(Boolean) as [string, string][]
      );

      set({
        isLoading: false,
        categories,
        products,
        coinRewards: rewards,
        invite,
        inviteActivity,
        inviteSummary,
        activeCategoryId: null,
        interestedProducts: {},
        interests: interestsWithUser,
        shippingSelections,
        inventory: Object.fromEntries(products.map((p) => [p.id, p.inventory || 0])),
        coinsBalance: initialCoins,
        paymentMethods,
        selectedPaymentMethod: paymentMethods[0]?.id ?? null
      });

      // Subscribe to shop feed only once to prevent duplicate subscriptions
      // Clean up existing subscription first
      if (shopFeedUnsubscribe) {
        shopFeedUnsubscribe();
        shopFeedUnsubscribe = null;
      }
      
      shopFeedUnsubscribe = subscribeShopFeed((update: ShopUpdate) => {
        if (update.type === "interest") {
          set((state) => ({
            interests: {
              ...state.interests,
              [update.productId]: update.interest + (state.interestedProducts[update.productId] ? 1 : 0)
            }
          }));
        } else if (update.type === "inventory") {
          set((state) => ({
            inventory: { ...state.inventory, [update.productId]: update.inventory }
          }));
        }
      });
    } catch (error) {
      console.error('[ShopStore] Error in fetchAll:', error);
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Laden der Produkte';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  setCategory: (categoryId) => set({ activeCategoryId: categoryId }),
  
  filterByBrand: (brandSlug) => set({ activeBrandSlug: brandSlug }),
  
  filterBySeries: (seriesSlug) => set({ activeSeriesSlug: seriesSlug }),
  
  clearFilters: () => set({ 
    activeCategoryId: null, 
    activeBrandSlug: undefined, 
    activeSeriesSlug: undefined 
  }),
  setSearchTerm: (value) => set({ searchTerm: value }),
  setSortOrder: (order) => set({ sortOrder: order }),

  openProduct: (productId) => set({ selectedProductId: productId }),

  closeProduct: () => set({ selectedProductId: null }),

  selectVariant: (productId, variantType, optionId) =>
    set((state) => ({
      selections: {
        ...state.selections,
        [productId]: {
          ...(state.selections[productId] ?? {}),
          [variantType]: optionId
        }
      }
    })),

  selectShippingOption: (productId, optionId) =>
    set((state) => {
      const product = state.products.find((item) => item.id === productId);
      if (!product) return {};
      const isValid = product.shippingOptions.some((option) => option.id === optionId);
      if (!isValid) return {};
      return {
        shippingSelections: {
          ...state.shippingSelections,
          [productId]: optionId
        }
      };
    }),

  toggleInterest: (productId) =>
    set((state) => {
      const isInterested = Boolean(state.interestedProducts[productId]);
      const baseInterest =
        state.interests[productId] ??
        state.products.find((item) => item.id === productId)?.interest ??
        0;

      const nextInterested = { ...state.interestedProducts };
      let nextInterestCount = baseInterest;

      if (isInterested) {
        delete nextInterested[productId];
        nextInterestCount = Math.max(0, baseInterest - 1);
        // Remove from userInterests store
        useUserInterestsStore.getState().removeShopInterest(productId);
      } else {
        nextInterested[productId] = true;
        nextInterestCount = baseInterest + 1;
        // Add to userInterests store
        useUserInterestsStore.getState().addShopInterest(productId);
      }

      return {
        interestedProducts: nextInterested,
        interests: { ...state.interests, [productId]: nextInterestCount }
      };
    }),

  addToCart: (productId, quantity = 1) =>
    set((state) => {
      const existing = state.cart.find((item) => item.productId === productId);
      if (existing) {
        const cart = state.cart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        return { cart };
      }
      return {
        cart: [
          ...state.cart,
          {
            productId,
            quantity,
            selectedOptions: state.selections[productId] as Record<VariantType, string> | undefined
          }
        ]
      };
    }),

  updateCartQuantity: (productId, quantity) =>
    set((state) => {
      const cart = quantity <= 0
        ? state.cart.filter((item) => item.productId !== productId)
        : state.cart.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          );

      const updates: Partial<ShopState> = { cart };
      if (state.selectedRewardId) {
        const reward = state.coinRewards.find((tier) => tier.id === state.selectedRewardId);
        if (reward) {
          const { subtotal } = calculateCart(state.products, cart, state.selections, state.shippingSelections);
          if (!isRewardEligible(reward, subtotal, state.coinsBalance)) {
            updates.selectedRewardId = null;
          }
        }
      }
      return updates;
    }),

  removeFromCart: (productId) =>
    set((state) => {
      const cart = state.cart.filter((item) => item.productId !== productId);
      const updates: Partial<ShopState> = { cart };
      if (state.selectedRewardId) {
        const reward = state.coinRewards.find((tier) => tier.id === state.selectedRewardId);
        if (reward) {
          const { subtotal } = calculateCart(state.products, cart, state.selections, state.shippingSelections);
          if (!isRewardEligible(reward, subtotal, state.coinsBalance)) {
            updates.selectedRewardId = null;
          }
        }
      }
      return updates;
    }),

  selectReward: (rewardId) =>
    set((state) => {
      const reward = state.coinRewards.find((tier) => tier.id === rewardId);
      if (!reward) return {};
      const { subtotal } = calculateCart(state.products, state.cart, state.selections, state.shippingSelections);
      if (!isRewardEligible(reward, subtotal, state.coinsBalance)) {
        return {
          checkoutError: formatRewardError(reward, subtotal, state.coinsBalance)
        };
      }
      return { selectedRewardId: rewardId, checkoutError: null };
    }),

  clearReward: () => set({ selectedRewardId: null }),

  setPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  clearPaymentSession: () => set({ paymentSession: null }),

  checkout: async () => {
    const state = get();
    if (state.checkoutStatus === "processing") return;

    const { items, subtotal } = calculateCart(state.products, state.cart, state.selections, state.shippingSelections);
    if (!items.length) {
      set({ checkoutStatus: "failed", checkoutError: "Dein Warenkorb ist leer." });
      return;
    }

    if (!state.selectedPaymentMethod) {
      set({ checkoutStatus: "failed", checkoutError: "Bitte wähle eine Zahlungsart aus." });
      return;
    }

    const reward = state.coinRewards.find((tier) => tier.id === state.selectedRewardId) ?? null;
    if (reward && !isRewardEligible(reward, subtotal, state.coinsBalance)) {
      set({
        checkoutStatus: "failed",
        checkoutError: formatRewardError(reward, subtotal, state.coinsBalance)
      });
      return;
    }

    const discount = reward?.discountValue ?? 0;
    const total = Math.max(0, subtotal - discount);
    const coinsEarned = coinsEarnedFromSubtotal(subtotal);
    const idempotencyKey = buildIdempotencyKey(items, reward?.id ?? null, state.selectedPaymentMethod);

    set({ checkoutStatus: "processing", checkoutError: null });

    try {
      const session = await createPaymentSession({
        idempotencyKey,
        subtotal,
        discount,
        total,
        rewardId: reward?.id ?? null,
        method: state.selectedPaymentMethod,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitAmount: item.unitPrice
        }))
      });

      set({ paymentSession: session, lastCheckoutIdempotencyKey: idempotencyKey, lastCheckoutSessionId: session.id });

      const confirmed = await waitForPaymentConfirmation(session.id);

      const isConfirmed = confirmed.status === "confirmed";
      const burnedCoins = reward?.coins ?? 0;
      const newBalance = state.coinsBalance - burnedCoins + (isConfirmed ? coinsEarned : 0);
      const ledgerUpdates: CoinLedgerEntry[] = [];
      if (reward) {
        ledgerUpdates.push({
          id: createId(),
          type: "burn",
          amount: burnedCoins,
          description: `${reward.reward} ${isConfirmed ? "eingelöst" : "reserviert"}`,
          createdAt: new Date().toISOString()
        });
      }
      if (isConfirmed) {
        ledgerUpdates.push({
          id: createId(),
          type: "earn",
          amount: coinsEarned,
          description: `Checkout ${confirmed.id}`,
          createdAt: new Date().toISOString()
        });
      }

      const order: OrderSummary = {
        id: confirmed.id,
        subtotal,
        discount,
        total,
        rewardId: reward?.id ?? null,
        coinsEarned: isConfirmed ? coinsEarned : 0,
        createdAt: confirmed.createdAt,
        status: confirmed.status === "confirmed" ? "paid" : "pending",
        payment: {
          method: confirmed.method,
          reference: confirmed.reference
        },
        items
      };

      set((prev) => ({
        coinsBalance: newBalance,
        coinLedger: [...ledgerUpdates, ...prev.coinLedger].slice(0, 50),
        orders: [order, ...prev.orders].slice(0, 20),
        cart: [],
        selectedRewardId: null,
        checkoutStatus: "succeeded",
        checkoutError: null,
        paymentSession: confirmed
      }));

      const auth = useAuthStore.getState();
      if (auth.user) {
        auth.setUser({ ...auth.user, coins: newBalance });
      }
    } catch (error) {
      set({
        checkoutStatus: "failed",
        checkoutError: error instanceof Error ? error.message : "Checkout fehlgeschlagen."
      });
    }
  },

  resetCheckoutStatus: () => set({ checkoutStatus: "idle", checkoutError: null }),

  addCoins: (amount: number) =>
    set((state) => {
      const newBalance = state.coinsBalance + amount;
      const ledgerEntry: CoinLedgerEntry = {
        id: createId(),
        type: "earn",
        amount,
        description: "Cookie conversion",
        createdAt: new Date().toISOString()
      };
      return {
        coinsBalance: newBalance,
        coinLedger: [ledgerEntry, ...state.coinLedger].slice(0, 50)
      };
    }),

  spendCoins: (amount: number) =>
    set((state) => {
      if (state.coinsBalance < amount) return {};
      const newBalance = state.coinsBalance - amount;
      const ledgerEntry: CoinLedgerEntry = {
        id: createId(),
        type: "burn",
        amount,
        description: "Cookie boost purchase",
        createdAt: new Date().toISOString()
      };
      return {
        coinsBalance: newBalance,
        coinLedger: [ledgerEntry, ...state.coinLedger].slice(0, 50)
      };
    }),

  updatePersonalInviteCode: async (telegramId: number, code: string) => {
    try {
      await updatePersonalInviteCodeApi(telegramId, code);
      
      // Optimistic update
      set((state) => {
        if (state.invite) {
          return {
            invite: {
              ...state.invite,
              personalInviteCode: code.toUpperCase()
            }
          };
        }
        return {};
      });
    } catch (error) {
      console.error('Failed to update personal invite code:', error);
      throw error;
    }
  },

  validatePersonalInviteCode: async (code: string) => {
    try {
      return await validatePersonalInviteCode(code);
    } catch (error) {
      console.error('Failed to validate personal invite code:', error);
      return false;
    }
  },

  refreshPersonalInviteCode: async (telegramId: number) => {
    try {
      const code = await fetchPersonalInviteCode(telegramId);
      
      set((state) => {
        if (state.invite && code) {
          return {
            invite: {
              ...state.invite,
              personalInviteCode: code
            }
          };
        }
        return {};
      });
    } catch (error) {
      console.error('Failed to refresh personal invite code:', error);
    }
  },

  // Real-time update actions
  updateProduct: (productId: string, updates: Partial<Product> | Product) => {
    set((state) => {
      const productIndex = state.products.findIndex((p) => p.id === productId);
      if (productIndex === -1) {
        console.warn('[ShopStore] Product not found for update:', productId);
        return {};
      }

      const existingProduct = state.products[productIndex];
      const updatedProduct: Product = 
        // If updates has an 'id' property, treat it as a full Product object
        'id' in updates && updates.id === productId
          ? (updates as Product)
          : { ...existingProduct, ...updates };

      const newProducts = [...state.products];
      newProducts[productIndex] = updatedProduct;

      return { products: newProducts };
    });
  },

  addProduct: (product: Product) => {
    set((state) => {
      // Check if product already exists
      const exists = state.products.some((p) => p.id === product.id);
      if (exists) {
        console.warn('[ShopStore] Product already exists, updating instead:', product.id);
        // Update instead of adding
        const productIndex = state.products.findIndex((p) => p.id === product.id);
        const newProducts = [...state.products];
        newProducts[productIndex] = product;
        return { products: newProducts };
      }

      return { products: [...state.products, product] };
    });
  },

  removeProduct: (productId: string) => {
    set((state) => {
      const newProducts = state.products.filter((p) => p.id !== productId);
      
      // Also remove from cart if present
      const newCart = state.cart.filter((item) => item.productId !== productId);
      
      // Close product modal if it's the removed product
      const newSelectedProductId = state.selectedProductId === productId ? null : state.selectedProductId;

      return {
        products: newProducts,
        cart: newCart,
        selectedProductId: newSelectedProductId
      };
    });
  }
}));































