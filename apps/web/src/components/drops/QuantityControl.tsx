import { memo, useState } from 'react';
import { cn } from '../../utils/cn';
import { Minus, Plus } from 'lucide-react';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface QuantityControlProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  showSlider?: boolean;
  showPresets?: boolean;
  presets?: number[];
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 🎨 Smart Quantity Control Component
 * Features: +/- buttons, slider, preset buttons, haptic feedback
 */
export const QuantityControl = memo(({
  value,
  min = 1,
  max = 10,
  onChange,
  showSlider = false,
  showPresets = false,
  presets = [1, 3, 5],
  disabled = false,
  size = 'md',
  className
}: QuantityControlProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const [isEditing, setIsEditing] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const inputSizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg'
  };

  const handleIncrement = () => {
    if (value < max) {
      triggerHaptic('light');
      onChange(value + 1);
    } else {
      triggerHaptic('warning');
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      triggerHaptic('light');
      onChange(value - 1);
    } else {
      triggerHaptic('warning');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (isNaN(newValue)) return;
    
    const clampedValue = Math.max(min, Math.min(newValue, max));
    onChange(clampedValue);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    triggerHaptic('light');
    onChange(newValue);
  };

  const handlePresetClick = (preset: number) => {
    triggerHaptic('medium');
    onChange(Math.min(preset, max));
  };

  const handleQuickMax = () => {
    triggerHaptic('medium');
    onChange(max);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Control */}
      <div className="flex items-center gap-3">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={cn(
            'flex items-center justify-center rounded-lg border border-white/10 bg-black/30 text-text transition-all',
            'hover:border-accent/40 hover:bg-accent/10 hover:text-accent',
            'active:scale-95',
            'disabled:cursor-not-allowed disabled:opacity-40',
            sizeClasses[size]
          )}
        >
          <Minus className="h-4 w-4" />
        </button>

        {/* Value Input */}
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          disabled={disabled}
          className={cn(
            'w-20 rounded-lg border border-white/10 bg-black/50 text-center font-semibold text-text',
            'outline-none transition-all',
            'focus:border-accent focus:ring-2 focus:ring-accent/40',
            'disabled:cursor-not-allowed disabled:opacity-40',
            isEditing && 'ring-2 ring-accent/40 border-accent',
            inputSizeClasses[size]
          )}
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={cn(
            'flex items-center justify-center rounded-lg border border-white/10 bg-black/30 text-text transition-all',
            'hover:border-accent/40 hover:bg-accent/10 hover:text-accent',
            'active:scale-95',
            'disabled:cursor-not-allowed disabled:opacity-40',
            sizeClasses[size]
          )}
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Max Button */}
        <button
          type="button"
          onClick={handleQuickMax}
          disabled={disabled || value >= max}
          className={cn(
            'px-4 rounded-lg border border-white/10 bg-black/30 text-xs font-semibold text-muted transition-all',
            'hover:border-accent/40 hover:bg-accent/10 hover:text-accent',
            'active:scale-95',
            'disabled:cursor-not-allowed disabled:opacity-40',
            inputSizeClasses[size]
          )}
        >
          MAX
        </button>
      </div>

      {/* Slider */}
      {showSlider && (
        <div className="space-y-2">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={handleSliderChange}
            disabled={disabled}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-accent disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, #0BF7BC ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%)`
            }}
          />
          <div className="flex justify-between text-xs text-muted">
            <span>Min: {min}</span>
            <span>Max: {max}</span>
          </div>
        </div>
      )}

      {/* Preset Buttons */}
      {showPresets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted self-center">Schnellwahl:</span>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={disabled || preset > max}
              className={cn(
                'px-3 py-1 rounded-lg border text-xs font-semibold transition-all',
                'hover:scale-105 active:scale-95',
                'disabled:cursor-not-allowed disabled:opacity-40',
                value === preset
                  ? 'border-accent bg-accent/20 text-accent'
                  : 'border-white/20 bg-black/30 text-muted hover:border-accent/40 hover:text-accent'
              )}
            >
              {preset}x
            </button>
          ))}
        </div>
      )}

      {/* Min/Max Info */}
      <div className="flex justify-between text-xs text-muted">
        <span>Min: {min}</span>
        <span>Aktuell: <span className="text-accent font-semibold">{value}</span></span>
        <span>Max: {max}</span>
      </div>
    </div>
  );
});

QuantityControl.displayName = 'QuantityControl';





