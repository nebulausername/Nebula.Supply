// Theme Configuration mit mehreren Dark-Mode Varianten

export type ThemeVariant = 'dark' | 'darker' | 'oled' | 'auto';
export type AccentColor = 'blue' | 'green' | 'purple' | 'cyan' | 'orange' | 'pink';

export interface ThemeConfig {
  variant: ThemeVariant;
  accentColor: AccentColor;
  customAccent?: string; // Hex color for custom accent
}

// Theme Definitions
export const themes = {
  dark: {
    name: 'Dark',
    description: 'Standard Dark Mode',
    colors: {
      background: '#000000',
      surface: '#0B0B12',
      surfaceSecondary: '#050509',
      text: '#FFFFFF',
      textMuted: '#A0A0A0',
      border: 'rgba(255, 255, 255, 0.1)',
      borderHover: 'rgba(255, 255, 255, 0.2)',
    }
  },
  darker: {
    name: 'Darker',
    description: 'Deeper Dark Mode',
    colors: {
      background: '#000000',
      surface: '#050505',
      surfaceSecondary: '#020202',
      text: '#FFFFFF',
      textMuted: '#888888',
      border: 'rgba(255, 255, 255, 0.08)',
      borderHover: 'rgba(255, 255, 255, 0.15)',
    }
  },
  oled: {
    name: 'OLED',
    description: 'True Black for OLED Displays',
    colors: {
      background: '#000000',
      surface: '#000000',
      surfaceSecondary: '#000000',
      text: '#FFFFFF',
      textMuted: '#666666',
      border: 'rgba(255, 255, 255, 0.05)',
      borderHover: 'rgba(255, 255, 255, 0.1)',
    }
  }
} as const;

// Accent Color Definitions
export const accentColors: Record<AccentColor, { name: string; value: string; light: string }> = {
  blue: {
    name: 'Blue',
    value: '#3B82F6',
    light: '#60A5FA'
  },
  green: {
    name: 'Green',
    value: '#10B981',
    light: '#34D399'
  },
  purple: {
    name: 'Purple',
    value: '#8B5CF6',
    light: '#A78BFA'
  },
  cyan: {
    name: 'Cyan',
    value: '#06B6D4',
    light: '#22D3EE'
  },
  orange: {
    name: 'Orange',
    value: '#F59E0B',
    light: '#FBBF24'
  },
  pink: {
    name: 'Pink',
    value: '#EC4899',
    light: '#F472B6'
  }
};

// Theme Manager Class
class ThemeManager {
  private currentTheme: ThemeConfig = {
    variant: 'dark',
    accentColor: 'blue'
  };

  constructor() {
    this.loadTheme();
    this.applyTheme();
    
    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (this.currentTheme.variant === 'auto') {
          this.applyTheme();
        }
      });
    }
  }

  getTheme(): ThemeConfig {
    return { ...this.currentTheme };
  }

  setTheme(config: Partial<ThemeConfig>): void {
    this.currentTheme = { ...this.currentTheme, ...config };
    this.saveTheme();
    this.applyTheme();
  }

  setVariant(variant: ThemeVariant): void {
    this.setTheme({ variant });
  }

  setAccentColor(color: AccentColor | string): void {
    if (Object.keys(accentColors).includes(color)) {
      this.setTheme({ accentColor: color as AccentColor, customAccent: undefined });
    } else {
      this.setTheme({ customAccent: color });
    }
  }

  private loadTheme(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('nebula-theme');
      if (saved) {
        this.currentTheme = { ...this.currentTheme, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load theme:', error);
    }
  }

  private saveTheme(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('nebula-theme', JSON.stringify(this.currentTheme));
    } catch (error) {
      console.warn('Failed to save theme:', error);
    }
  }

  private applyTheme(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const variant = this.currentTheme.variant === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark')
      : this.currentTheme.variant;

    const theme = themes[variant];
    const accent = this.currentTheme.customAccent 
      ? { value: this.currentTheme.customAccent, light: this.currentTheme.customAccent }
      : accentColors[this.currentTheme.accentColor];

    // Apply CSS variables
    root.style.setProperty('--theme-bg', theme.colors.background);
    root.style.setProperty('--theme-surface', theme.colors.surface);
    root.style.setProperty('--theme-surface-secondary', theme.colors.surfaceSecondary);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-text-muted', theme.colors.textMuted);
    root.style.setProperty('--theme-border', theme.colors.border);
    root.style.setProperty('--theme-border-hover', theme.colors.borderHover);
    root.style.setProperty('--theme-accent', accent.value);
    root.style.setProperty('--theme-accent-light', accent.light);

    // Add data attribute for CSS selectors
    root.setAttribute('data-theme', variant);
    root.setAttribute('data-accent', this.currentTheme.accentColor);
  }

  // Get computed theme colors
  getComputedColors() {
    const variant = this.currentTheme.variant === 'auto'
      ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark')
      : this.currentTheme.variant;

    const theme = themes[variant];
    const accent = this.currentTheme.customAccent 
      ? { value: this.currentTheme.customAccent, light: this.currentTheme.customAccent }
      : accentColors[this.currentTheme.accentColor];

    return {
      ...theme.colors,
      accent: accent.value,
      accentLight: accent.light
    };
  }
}

// Singleton instance
let themeManager: ThemeManager | null = null;

export function getThemeManager(): ThemeManager {
  if (!themeManager) {
    themeManager = new ThemeManager();
  }
  return themeManager;
}

// React Hook for Theme
export function useTheme() {
  const [theme, setThemeState] = React.useState<ThemeConfig>(() => {
    return getThemeManager().getTheme();
  });

  React.useEffect(() => {
    const manager = getThemeManager();
    
    // Listen for theme changes
    const interval = setInterval(() => {
      const currentTheme = manager.getTheme();
      if (JSON.stringify(currentTheme) !== JSON.stringify(theme)) {
        setThemeState(currentTheme);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [theme]);

  const setTheme = React.useCallback((config: Partial<ThemeConfig>) => {
    getThemeManager().setTheme(config);
    setThemeState(getThemeManager().getTheme());
  }, []);

  const setVariant = React.useCallback((variant: ThemeVariant) => {
    getThemeManager().setVariant(variant);
    setThemeState(getThemeManager().getTheme());
  }, []);

  const setAccentColor = React.useCallback((color: AccentColor | string) => {
    getThemeManager().setAccentColor(color);
    setThemeState(getThemeManager().getTheme());
  }, []);

  const colors = React.useMemo(() => {
    return getThemeManager().getComputedColors();
  }, [theme]);

  return {
    theme,
    colors,
    setTheme,
    setVariant,
    setAccentColor,
    themes,
    accentColors
  };
}

// Fix für React Import
import React from 'react';

