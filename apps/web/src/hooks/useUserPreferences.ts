import { useState, useEffect, useCallback } from 'react';

interface ViewRecord {
  id: string;
  timestamp: number;
}

export interface UserPreferences {
  favoriteCategories: string[];
  viewedProducts: ViewRecord[];
  clickedDrops: ViewRecord[];
  lastVisit: number | null;
  theme?: 'dark' | 'light';
  language?: string;
}

const STORAGE_KEY = 'nebula_user_preferences';
const MAX_RECORDS = 50; // Keep last 50 views

const defaultPreferences: UserPreferences = {
  favoriteCategories: [],
  viewedProducts: [],
  clickedDrops: [],
  lastVisit: null,
  theme: 'dark',
  language: 'de'
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences({
          ...defaultPreferences,
          ...parsed,
          lastVisit: Date.now()
        });
      } else {
        setPreferences({
          ...defaultPreferences,
          lastVisit: Date.now()
        });
      }
    } catch (error) {
      console.error('[UserPreferences] Failed to load:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.error('[UserPreferences] Failed to save:', error);
      }
    }
  }, [preferences, isLoading]);

  // Track product view
  const trackProductView = useCallback((productId: string) => {
    setPreferences(prev => {
      const newView: ViewRecord = {
        id: productId,
        timestamp: Date.now()
      };

      // Remove duplicates and add new view
      const filtered = prev.viewedProducts.filter(v => v.id !== productId);
      const updated = [newView, ...filtered].slice(0, MAX_RECORDS);

      return {
        ...prev,
        viewedProducts: updated
      };
    });
  }, []);

  // Track drop click
  const trackDropClick = useCallback((dropId: string) => {
    setPreferences(prev => {
      const newClick: ViewRecord = {
        id: dropId,
        timestamp: Date.now()
      };

      // Remove duplicates and add new click
      const filtered = prev.clickedDrops.filter(c => c.id !== dropId);
      const updated = [newClick, ...filtered].slice(0, MAX_RECORDS);

      return {
        ...prev,
        clickedDrops: updated
      };
    });
  }, []);

  // Toggle favorite category
  const toggleFavoriteCategory = useCallback((categoryId: string) => {
    setPreferences(prev => {
      const isFavorite = prev.favoriteCategories.includes(categoryId);
      const updated = isFavorite
        ? prev.favoriteCategories.filter(id => id !== categoryId)
        : [...prev.favoriteCategories, categoryId];

      return {
        ...prev,
        favoriteCategories: updated
      };
    });
  }, []);

  // Set theme
  const setTheme = useCallback((theme: 'dark' | 'light') => {
    setPreferences(prev => ({
      ...prev,
      theme
    }));
  }, []);

  // Clear all preferences
  const clearPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get recently viewed products
  const getRecentlyViewedProducts = useCallback((limit: number = 10) => {
    return preferences.viewedProducts
      .slice(0, limit)
      .map(v => v.id);
  }, [preferences.viewedProducts]);

  // Get recently clicked drops
  const getRecentlyClickedDrops = useCallback((limit: number = 10) => {
    return preferences.clickedDrops
      .slice(0, limit)
      .map(c => c.id);
  }, [preferences.clickedDrops]);

  // Check if returning user
  const isReturningUser = preferences.lastVisit !== null && 
    (preferences.viewedProducts.length > 0 || preferences.clickedDrops.length > 0);

  // Calculate session count (simplified)
  const sessionCount = preferences.viewedProducts.length + preferences.clickedDrops.length;

  return {
    preferences,
    isLoading,
    trackProductView,
    trackDropClick,
    toggleFavoriteCategory,
    setTheme,
    clearPreferences,
    getRecentlyViewedProducts,
    getRecentlyClickedDrops,
    isReturningUser,
    sessionCount
  };
};

