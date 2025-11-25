import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked = false, onCheckedChange, disabled = false, className }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'w-4 h-4 rounded border border-white/20 bg-black/25 flex items-center justify-center',
        'hover:border-white/40 transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        checked && 'bg-blue-500 border-blue-500',
        className
      )}
    >
      {checked && <Check className="w-3 h-3 text-white" />}
    </button>
  );
}

