// Theme Selector Component
import React from 'react';
import { useTheme, ThemeVariant, AccentColor } from '../../lib/themes/themeConfig';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Palette, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../../utils/cn';

export function ThemeSelector() {
  const { theme, colors, setVariant, setAccentColor, themes, accentColors } = useTheme();

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Theme Variant</h3>
        <p className="text-sm text-muted mb-4">Wähle deine bevorzugte Dark-Mode Variante</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(themes).map(([key, themeOption]) => (
            <button
              key={key}
              onClick={() => setVariant(key as ThemeVariant)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left",
                theme.variant === key
                  ? "border-accent bg-accent/10"
                  : "border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {key === 'dark' && <Moon className="w-4 h-4" />}
                {key === 'darker' && <Moon className="w-4 h-4 opacity-75" />}
                {key === 'oled' && <Monitor className="w-4 h-4" />}
                <span className="font-medium">{themeOption.name}</span>
              </div>
              <p className="text-xs text-muted">{themeOption.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Accent Color</h3>
        <p className="text-sm text-muted mb-4">Wähle deine bevorzugte Akzentfarbe</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Object.entries(accentColors).map(([key, colorOption]) => (
            <button
              key={key}
              onClick={() => setAccentColor(key as AccentColor)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                theme.accentColor === key
                  ? "border-accent bg-accent/10"
                  : "border-white/10 hover:border-white/20"
              )}
              style={{
                '--accent-color': colorOption.value,
              } as React.CSSProperties}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: colorOption.value }}
              />
              <span className="text-xs font-medium">{colorOption.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Custom Accent Color</h3>
        <p className="text-sm text-muted mb-4">Oder wähle eine eigene Farbe</p>
        <div className="flex gap-2">
          <input
            type="color"
            value={theme.customAccent || colors.accent}
            onChange={(e) => setAccentColor(e.target.value)}
            className="w-16 h-10 rounded border border-white/10 cursor-pointer"
          />
          <input
            type="text"
            value={theme.customAccent || colors.accent}
            onChange={(e) => setAccentColor(e.target.value)}
            placeholder="#3B82F6"
            className="flex-1 px-3 py-2 rounded border border-white/10 bg-black/20 text-text"
          />
        </div>
      </div>
    </Card>
  );
}

