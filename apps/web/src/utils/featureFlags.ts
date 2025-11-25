/**
 * 🎯 Feature Flags for Gradual Rollout
 * Control which enhanced components are active
 */

export interface FeatureFlags {
  useEnhancedDropCard: boolean;
  useEnhancedMobileModal: boolean;
  useEnhancedDesktopModal: boolean;
  enableGestures: boolean;
  enableHapticFeedback: boolean;
  enableAnimations: boolean;
}

// Default feature flags (can be overridden)
const defaultFlags: FeatureFlags = {
  useEnhancedDropCard: true,
  useEnhancedMobileModal: true,
  useEnhancedDesktopModal: true,
  enableGestures: true,
  enableHapticFeedback: true,
  enableAnimations: true
};

// Load from localStorage if available
const loadFlags = (): FeatureFlags => {
  if (typeof window === 'undefined') return defaultFlags;
  
  try {
    const stored = localStorage.getItem('nebula-feature-flags');
    if (stored) {
      return { ...defaultFlags, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load feature flags:', error);
  }
  
  return defaultFlags;
};

// Save to localStorage
export const saveFlags = (flags: Partial<FeatureFlags>) => {
  if (typeof window === 'undefined') return;
  
  try {
    const currentFlags = loadFlags();
    const newFlags = { ...currentFlags, ...flags };
    localStorage.setItem('nebula-feature-flags', JSON.stringify(newFlags));
  } catch (error) {
    console.error('Failed to save feature flags:', error);
  }
};

// Get current flags
export const getFeatureFlags = (): FeatureFlags => {
  return loadFlags();
};

// Check individual flag
export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  const flags = loadFlags();
  return flags[flag] ?? false;
};

// Reset to defaults
export const resetFeatureFlags = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('nebula-feature-flags');
};

// Enable all features
export const enableAllFeatures = () => {
  saveFlags({
    useEnhancedDropCard: true,
    useEnhancedMobileModal: true,
    useEnhancedDesktopModal: true,
    enableGestures: true,
    enableHapticFeedback: true,
    enableAnimations: true
  });
};

// Disable all features (fallback to original components)
export const disableAllFeatures = () => {
  saveFlags({
    useEnhancedDropCard: false,
    useEnhancedMobileModal: false,
    useEnhancedDesktopModal: false,
    enableGestures: false,
    enableHapticFeedback: false,
    enableAnimations: false
  });
};





