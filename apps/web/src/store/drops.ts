import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import type { Drop, DropReservation, DropVariant, UserProfile } from "@nebula/shared";
import { useUserInterestsStore } from "./userInterests";
import { revolutionaryDrops } from "../data/revolutionaryDrops";
import { drops as initialDrops } from "../data/drops";

// 🎯 Enhanced caching and performance utilities
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_MEMORY_ITEMS = 100;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  size: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private totalSize = 0;

  set<T>(key: string, data: T): void {
    const size = this.estimateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      size
    };

    // Remove oldest entries if we're at memory limit
    if (this.totalSize + size > MAX_MEMORY_ITEMS && this.cache.size > 0) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.totalSize += size;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
    }
  }

  private estimateSize(obj: any): number {
    return JSON.stringify(obj).length;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.totalSize -= entry.size;
      }
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }
}

const dropCache = new MemoryCache();

// 🎯 Intelligent Quantity Calculation
const calculateOptimalQuantity = (variant: DropVariant): number => {
  const minQty = variant.minQuantity ?? 1;
  const maxQty = Math.min(variant.maxQuantity ?? 10, variant.stock);
  
  // Smart quantity based on variant type and price
  if (variant.basePrice === 0) {
    // Free variants: max allowed (up to 3)
    return Math.min(maxQty, 3);
  } else if (variant.basePrice < 5) {
    // Budget variants: 2-3 pieces
    return Math.min(maxQty, 3);
  } else if (variant.basePrice < 10) {
    // Mid-range variants: 1-2 pieces
    return Math.min(maxQty, 2);
  } else if (variant.basePrice < 20) {
    // Premium variants: 1 piece
    return Math.min(maxQty, 1);
  } else {
    // Ultra premium: 1 piece
    return Math.min(maxQty, 1);
  }
};

export type DropActivity = {
  id: string;
  message: string;
  timestamp: string;
};

export type DropInterestEntry = {
  id: string;
  handle: string;
  timestamp: string;
};

// 🎯 Enhanced performance state management
interface PerformanceState {
  isLoading: Record<string, boolean>;
  lastFetch: Record<string, number>;
  error: Record<string, string | null>;
  prefetchQueue: string[];
  loadingStates: Record<string, 'idle' | 'loading' | 'success' | 'error'>;
}

interface DropsState extends PerformanceState {
  drops: Drop[];
  selectedId: string | null;
  interests: Record<string, number>;
  activityLog: Record<string, DropActivity[]>;
  interestList: Record<string, DropInterestEntry[]>;
  variantSelections: Record<string, string>;
  quantitySelections: Record<string, number>;
  shippingSelections: Record<string, string | undefined>;
  originSelections: Record<string, string | undefined>;
  lastReservation: DropReservation | null;
  reservationHistory: DropReservation[];
  selectDrop: (id: string) => void;
  closeDrop: () => void;
  setVariant: (dropId: string, variantId: string) => void;
  setQuantity: (dropId: string, quantity: number) => void;
  incrementQuantity: (dropId: string, delta: number) => void;
  setShipping: (dropId: string, optionId: string) => void;
  setOrigin: (dropId: string, originId: string) => void;
  applyQuantityPack: (dropId: string, quantity: number) => void;
  startPreorder: (dropId: string) => DropReservation | null;
  clearReservation: () => void;
  toggleInterest: (id: string, user?: UserProfile) => void;
  applyProgress: (id: string, progress: number) => void;
  // 🎯 Performance optimizations
  prefetchDropData: (dropIds: string[]) => Promise<void>;
  invalidateCache: (dropId?: string) => void;
  getCachedDrop: (id: string) => Drop | null;
  setLoadingState: (id: string, state: 'idle' | 'loading' | 'success' | 'error') => void;
}

const handlePool = [
  "@neo.supply",
  "@stardust",
  "@gravity",
  "@nova",
  "@aurora",
  "@quantum",
  "@orbit",
  "@galaxy",
  "@byte",
  "@flux"
];

const createId = () => Math.random().toString(36).slice(2, 9);

const makeActivity = (message: string): DropActivity => ({
  id: createId(),
  message,
  timestamp: new Date().toISOString()
});

const makeInterestEntry = (handle?: string): DropInterestEntry => ({
  id: createId(),
  handle: handle ?? handlePool[Math.floor(Math.random() * handlePool.length)],
  timestamp: new Date().toISOString()
});

const resolveVariant = (drop: Drop, variantId?: string): DropVariant => {
  if (variantId) {
    const direct = drop.variants.find((variant) => variant.id === variantId);
    if (direct) return direct;
  }
  const fallback = drop.variants.find((variant) => variant.id === drop.defaultVariantId);
  return fallback ?? drop.variants[0];
};

const getVariantLimits = (drop: Drop, variant: DropVariant) => {
  const min = Math.max(variant.minQuantity, 1);
  const fallbackMax = Math.max(min, variant.minQuantity * 4);
  const variantMax = variant.maxQuantity ?? fallbackMax;
  const dropMax = drop.maxPerUser ?? variantMax;
  const stockCap = variant.stock > 0 ? variant.stock : variantMax;
  const max = Math.max(min, Math.min(variantMax, dropMax, stockCap));
  return { min, max };
};

const clampQuantity = (drop: Drop, variant: DropVariant, value: number) => {
  const { min, max } = getVariantLimits(drop, variant);
  return Math.min(Math.max(value, min), max);
};

const resolveShippingSelection = (
  drop: Drop,
  variant: DropVariant,
  current?: string
) => {
  if (!drop.shippingOptions.length || !variant.shippingOptionIds.length) {
    return undefined;
  }
  const allowed = new Set(variant.shippingOptionIds);
  if (current && allowed.has(current) && drop.shippingOptions.some((option) => option.id === current)) {
    return current;
  }
  if (variant.defaultShippingOptionId && allowed.has(variant.defaultShippingOptionId)) {
    return variant.defaultShippingOptionId;
  }
  const fallback = variant.shippingOptionIds.find((optionId) =>
    drop.shippingOptions.some((option) => option.id === optionId)
  );
  return fallback ?? drop.shippingOptions[0]?.id;
};

const resolveOriginSelection = (variant: DropVariant, current?: string) => {
  if (!variant.originOptions?.length) return undefined;
  if (current && variant.originOptions.some((option) => option.id === current)) {
    return current;
  }
  const preferred = variant.originOptions.find((option) => option.isDefault);
  return preferred?.id ?? variant.originOptions[0]?.id;
};

const buildInitialSelections = (drops: Drop[]) => {
  const variantSelections: Record<string, string> = {};
  const quantitySelections: Record<string, number> = {};
  const shippingSelections: Record<string, string | undefined> = {};
  const originSelections: Record<string, string | undefined> = {};

  drops.forEach((drop) => {
    const variant = resolveVariant(drop, drop.defaultVariantId);
    variantSelections[drop.id] = variant.id;
    quantitySelections[drop.id] = clampQuantity(drop, variant, variant.minQuantity);
    shippingSelections[drop.id] = resolveShippingSelection(drop, variant);
    originSelections[drop.id] = resolveOriginSelection(variant);
  });

  return { variantSelections, quantitySelections, shippingSelections, originSelections };
};

const initialInterests: Record<string, number> = Object.fromEntries(
  initialDrops.map((drop) => [drop.id, drop.interestCount])
);

const initialActivity: Record<string, DropActivity[]> = Object.fromEntries(
  initialDrops.map((drop) => [drop.id, [makeActivity("Drop live gegangen")]])
);

const initialInterestList: Record<string, DropInterestEntry[]> = Object.fromEntries(
  initialDrops.map((drop) => [drop.id, [makeInterestEntry(), makeInterestEntry()]])
);

const initialSelections = buildInitialSelections(initialDrops);

// 🎯 Enhanced performance store creation with selective subscriptions
export const useDropsStore = create<DropsState>()(
  persist(
    subscribeWithSelector((set, get) => ({
  // 🎯 Performance state
  isLoading: {},
  lastFetch: {},
  error: {},
  prefetchQueue: [],
  loadingStates: {},

  drops: revolutionaryDrops,
  selectedId: null,
  interests: initialInterests,
  activityLog: initialActivity,
  interestList: initialInterestList,
  variantSelections: initialSelections.variantSelections,
  quantitySelections: initialSelections.quantitySelections,
  shippingSelections: initialSelections.shippingSelections,
  originSelections: initialSelections.originSelections,
  lastReservation: null,
  reservationHistory: [],

  selectDrop: (id) => set({ selectedId: id }),

  closeDrop: () => set({ selectedId: null }),

  setVariant: (dropId, variantId) =>
    set((state) => {
      const drop = state.drops.find((item) => item.id === dropId);
      if (!drop) return {};
      const variant = resolveVariant(drop, variantId);
      const nextVariantSelections = { ...state.variantSelections, [dropId]: variant.id };
      const nextQuantitySelections = {
        ...state.quantitySelections,
        [dropId]: clampQuantity(drop, variant, variant.minQuantity)
      };
      const nextShippingSelections = {
        ...state.shippingSelections,
        [dropId]: resolveShippingSelection(drop, variant)
      };
      const nextOriginSelections = {
        ...state.originSelections,
        [dropId]: resolveOriginSelection(variant)
      };
      return {
        variantSelections: nextVariantSelections,
        quantitySelections: nextQuantitySelections,
        shippingSelections: nextShippingSelections,
        originSelections: nextOriginSelections
      };
    }),

  setQuantity: (dropId, quantity) =>
    set((state) => {
      const drop = state.drops.find((item) => item.id === dropId);
      if (!drop) return {};
      const variant = resolveVariant(drop, state.variantSelections[dropId]);
      const nextQuantity = clampQuantity(drop, variant, quantity);
      return {
        quantitySelections: { ...state.quantitySelections, [dropId]: nextQuantity }
      };
    }),

  incrementQuantity: (dropId, delta) => {
    const state = get();
    const current = state.quantitySelections[dropId] ?? 0;
    state.setQuantity(dropId, current + delta);
  },

  setShipping: (dropId, optionId) =>
    set((state) => {
      const drop = state.drops.find((item) => item.id === dropId);
      if (!drop) return {};
      const variant = resolveVariant(drop, state.variantSelections[dropId]);
      const isAllowed = variant.shippingOptionIds.includes(optionId);
      const exists = drop.shippingOptions.some((option) => option.id === optionId);
      if (!isAllowed || !exists) return {};
      return {
        shippingSelections: { ...state.shippingSelections, [dropId]: optionId }
      };
    }),

  setOrigin: (dropId, originId) =>
    set((state) => {
      const drop = state.drops.find((item) => item.id === dropId);
      if (!drop) return {};
      const variant = resolveVariant(drop, state.variantSelections[dropId]);
      if (!variant.originOptions?.length) return {};
      const exists = variant.originOptions.some((option) => option.id === originId);
      if (!exists) return {};
      return {
        originSelections: { ...state.originSelections, [dropId]: originId }
      };
    }),

  applyQuantityPack: (dropId, quantity) =>
    set((state) => {
      const drop = state.drops.find((item) => item.id === dropId);
      if (!drop) return {};
      const variant = resolveVariant(drop, state.variantSelections[dropId]);
      const nextQuantity = clampQuantity(drop, variant, quantity);
      return {
        quantitySelections: { ...state.quantitySelections, [dropId]: nextQuantity }
      };
    }),

  startPreorder: (dropId) => {
    const stateSnapshot = get();
    const drop = stateSnapshot.drops.find((item) => item.id === dropId);
    if (!drop) return null;
    const variant = resolveVariant(drop, stateSnapshot.variantSelections[dropId]);
    const quantity = stateSnapshot.quantitySelections[dropId] ?? clampQuantity(drop, variant, variant.minQuantity);
    const shippingOptionId = stateSnapshot.shippingSelections[dropId] ?? resolveShippingSelection(drop, variant);
    const shippingOption = shippingOptionId
      ? drop.shippingOptions.find((option) => option.id === shippingOptionId)
      : undefined;
    const originOptionId = stateSnapshot.originSelections[dropId] ?? resolveOriginSelection(variant);
    const originOption = originOptionId
      ? variant.originOptions?.find((option) => option.id === originOptionId)
      : undefined;

    const unitPrice = variant.basePrice;
    const shippingCost = shippingOption?.price ?? 0;
    const total = unitPrice * quantity + shippingCost;

    const reservation: DropReservation = {
      id: createId(),
      dropId: drop.id,
      dropName: drop.name,
      variantId: variant.id,
      variantLabel: variant.label,
      quantity,
      unitPrice,
      total,
      currency: drop.currency,
      shippingOptionId: shippingOption?.id,
      shippingLabel: shippingOption?.label,
      shippingCost,
      originOptionId: originOption?.id,
      originLabel: originOption?.label,
      inviteRequired: variant.inviteRequired ?? drop.inviteRequired,
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      lastReservation: reservation,
      reservationHistory: [reservation, ...state.reservationHistory].slice(0, 12)
    }));

    return reservation;
  },

  clearReservation: () => set({ lastReservation: null }),

  toggleInterest: (id, user) =>
    set((state) => {
      const currentInterest = state.interests[id] ?? 0;
      const isInterested = currentInterest > 0;
      const nextInterest = isInterested ? currentInterest - 1 : currentInterest + 1;
      const currentList = state.interestList[id] ?? [];
      const entry = makeInterestEntry(user?.handle);
      const filtered = user ? currentList.filter((item) => item.handle !== user.handle) : currentList;
      const updatedList = isInterested 
        ? filtered.slice(0, 11) // Remove one
        : [entry, ...filtered].slice(0, 12); // Add one

      // Sync with userInterests store (bidirektional)
      if (isInterested) {
        useUserInterestsStore.getState().removeDropInterest(id);
      } else {
        useUserInterestsStore.getState().addDropInterest(id);
      }

      return {
        interests: { ...state.interests, [id]: nextInterest },
        interestList: { ...state.interestList, [id]: updatedList },
        drops: state.drops.map((drop) =>
          drop.id === id ? { ...drop, interestCount: nextInterest } : drop
        )
      };
    }),

  applyProgress: (id, progress) =>
    set((state) => ({
      activityLog: {
        ...state.activityLog,
        [id]: [makeActivity(`Fortschritt ${Math.round(progress * 100)} %`), ...(state.activityLog[id] ?? [])].slice(0, 20)
      },
      drops: state.drops.map((drop) =>
        drop.id === id
          ? {
              ...drop,
              progress,
              status: progress >= 1 ? "locked" : drop.status
            }
          : drop
      )
    })),

  // 🎯 Performance optimization methods
  prefetchDropData: async (dropIds: string[]) => {
    const state = get();
    const uncachedIds = dropIds.filter(id => {
      const cached = dropCache.get(`drop-${id}`);
      return !cached || Date.now() - state.lastFetch[id] > CACHE_DURATION;
    });

    if (uncachedIds.length === 0) return;

    // Set loading states
    set((state) => ({
      isLoading: { ...state.isLoading, ...Object.fromEntries(uncachedIds.map(id => [id, true])) },
      loadingStates: { ...state.loadingStates, ...Object.fromEntries(uncachedIds.map(id => [id, 'loading'])) }
    }));

    try {
      // Simulate API calls for drop data
      for (const id of uncachedIds) {
        // In a real implementation, this would be API calls
        const drop = state.drops.find(d => d.id === id);
        if (drop) {
          dropCache.set(`drop-${id}`, drop);
          set((state) => ({
            lastFetch: { ...state.lastFetch, [id]: Date.now() }
          }));
        }
      }

      set((state) => ({
        isLoading: Object.fromEntries(Object.keys(state.isLoading).map(id => [id, false])),
        loadingStates: Object.fromEntries(uncachedIds.map(id => [id, 'success']))
      }));
    } catch (error) {
      set((state) => ({
        isLoading: Object.fromEntries(Object.keys(state.isLoading).map(id => [id, false])),
        loadingStates: Object.fromEntries(uncachedIds.map(id => [id, 'error'])),
        error: { ...state.error, ...Object.fromEntries(uncachedIds.map(id => [id, (error as Error).message || 'Unknown error'])) }
      }));
    }
  },

  invalidateCache: (dropId?: string) => {
    if (dropId) {
      dropCache.delete(`drop-${dropId}`);
      set((state) => ({
        lastFetch: { ...state.lastFetch, [dropId]: 0 }
      }));
    } else {
      dropCache.clear();
      set((state) => ({
        lastFetch: Object.fromEntries(Object.keys(state.lastFetch).map(id => [id, 0]))
      }));
    }
  },

  getCachedDrop: (id: string) => {
    return dropCache.get(`drop-${id}`) || null;
  },

  setLoadingState: (id: string, state: 'idle' | 'loading' | 'success' | 'error') => {
    set((current) => ({
      loadingStates: { ...current.loadingStates, [id]: state }
    }));
  }
    })),
    {
      name: 'nebula-drops-store',
      partialize: (state) => ({
        interests: state.interests,
        variantSelections: state.variantSelections,
        quantitySelections: state.quantitySelections,
        shippingSelections: state.shippingSelections,
        originSelections: state.originSelections,
        reservationHistory: state.reservationHistory
      })
    }
  )
)

let mockInterval: ReturnType<typeof setInterval> | null = null;

export const startMockFeed = () => {
  if (mockInterval) return;

  mockInterval = setInterval(() => {
    useDropsStore.setState((state) => {
      if (!state.drops.length) return state;
      const target = state.drops[Math.floor(Math.random() * state.drops.length)];
      if (!target) return state;

      const increment = Math.random() * 0.08;
      const nextProgress = Math.min(1, target.progress + increment);

      const currentInterest = state.interests[target.id] ?? target.interestCount;
      const interestBoost = Math.random() > 0.6;
      const nextInterest = interestBoost ? currentInterest + 1 : currentInterest;
      const currentList = state.interestList[target.id] ?? [];
      const nextInterestList = interestBoost
        ? [makeInterestEntry(), ...currentList].slice(0, 12)
        : currentList;

      const nextActivity = makeActivity(
        nextProgress >= 1 ? "Drop gelockt" : `Fortschritt ${Math.round(nextProgress * 100)} %`
      );

      return {
        interests: { ...state.interests, [target.id]: nextInterest },
        interestList: { ...state.interestList, [target.id]: nextInterestList },
        activityLog: {
          ...state.activityLog,
          [target.id]: [nextActivity, ...(state.activityLog[target.id] ?? [])].slice(0, 20)
        },
        drops: state.drops.map((drop) =>
          drop.id === target.id
            ? {
                ...drop,
                progress: nextProgress,
                status: nextProgress >= 1 ? "locked" : drop.status,
                interestCount: nextInterest
              }
            : drop
        )
      };
    });
  }, 6500);
};

export const stopMockFeed = () => {
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
};

export const useSelectedDrop = () => {
  const {
    drops,
    selectedId,
    interests,
    activityLog,
    interestList,
    variantSelections,
    quantitySelections,
    shippingSelections,
    originSelections,
    lastReservation
  } = useDropsStore((state) => ({
    drops: state.drops,
    selectedId: state.selectedId,
    interests: state.interests,
    activityLog: state.activityLog,
    interestList: state.interestList,
    variantSelections: state.variantSelections,
    quantitySelections: state.quantitySelections,
    shippingSelections: state.shippingSelections,
    originSelections: state.originSelections,
    lastReservation: state.lastReservation
  }));

  if (!selectedId) return null;

  const drop = drops.find((item) => item.id === selectedId);
  if (!drop) return null;

  const variant = resolveVariant(drop, variantSelections[selectedId]);
  const limits = getVariantLimits(drop, variant);
  const quantity = quantitySelections[selectedId] ?? limits.min;
  const shippingOptionId = shippingSelections[selectedId] ?? resolveShippingSelection(drop, variant);
  const shippingOption = drop.shippingOptions.find((option) => option.id === shippingOptionId);
  const originOptionId = originSelections[selectedId] ?? resolveOriginSelection(variant);
  const originOption = variant.originOptions?.find((option) => option.id === originOptionId);

  const quickQuantityOptions = (
    variant.quickQuantityOptions ?? drop.quantityPacks?.map((pack) => pack.quantity) ?? []
  ).filter((value) => value >= limits.min && value <= limits.max);

  return {
    drop,
    interestCount: interests[selectedId] ?? drop.interestCount,
    activity: activityLog[selectedId] ?? [],
    interested: interestList[selectedId] ?? [],
    selection: {
      variant,
      variantId: variant.id,
      quantity,
      minQuantity: limits.min,
      maxQuantity: limits.max,
      shippingOption,
      shippingOptionId,
      shippingOptions: drop.shippingOptions.map((option) => ({
        option,
        enabled: variant.shippingOptionIds.includes(option.id)
      })),
      originOption,
      originOptionId,
      originOptions: variant.originOptions ?? [],
      quickQuantityOptions: quickQuantityOptions.length ? quickQuantityOptions : [limits.min]
    },
    lastReservation
  };
};
