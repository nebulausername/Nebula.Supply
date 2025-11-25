import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Check, X, Loader2 } from 'lucide-react';

export interface InlineEditCellProps {
  value: any;
  onSave: (newValue: any) => Promise<void>;
  type?: 'text' | 'number' | 'email' | 'url' | 'select' | 'date' | 'textarea';
  options?: Array<{ value: any; label: string }>;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
  validate?: (value: any) => string | null;
  formatDisplay?: (value: any) => string;
  formatInput?: (value: any) => string;
}

export const InlineEditCell: React.FC<InlineEditCellProps> = ({
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder,
  min,
  max,
  step,
  disabled = false,
  className = '',
  autoFocus = false,
  validate,
  formatDisplay,
  formatInput
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize edit value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      const initialValue = formatInput ? formatInput(value) : String(value || '');
      setEditValue(initialValue);
      setError(null);
    }
  }, [isEditing, value, formatInput]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'number' || type === 'email' || type === 'url') {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, type]);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
  }, [disabled]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setError(null);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    // Validate input
    if (validate) {
      const validationError = validate(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Convert value based on type
    let processedValue = editValue;
    if (type === 'number') {
      processedValue = parseFloat(editValue);
      if (isNaN(processedValue)) {
        setError('Invalid number');
        return;
      }
      if (min !== undefined && processedValue < min) {
        setError(`Value must be at least ${min}`);
        return;
      }
      if (max !== undefined && processedValue > max) {
        setError(`Value must be at most ${max}`);
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(processedValue);
      setIsEditing(false);
      setShowSuccess(true);
      
      // Hide success indicator after 1 second
      const successTimeout = setTimeout(() => setShowSuccess(false), 1000);
      
      // Cleanup on unmount
      return () => {
        clearTimeout(successTimeout);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }, [editValue, onSave, type, min, max, validate, isSaving]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave, handleCancel]);

  const handleBlur = useCallback(() => {
    // Debounced save on blur
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (editValue !== String(value || '')) {
        handleSave();
      } else {
        handleCancel();
      }
    }, 500);
  }, [editValue, value, handleSave, handleCancel]);

  const renderInput = () => {
    const commonProps = {
      ref: inputRef as any,
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        setEditValue(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      disabled: isSaving,
      placeholder,
      className: `w-full ${error ? 'border-red-500' : ''} ${className}`
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={3}
            className={`resize-none ${commonProps.className}`}
          />
        );

      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select an option</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
          />
        );

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        );

      default:
        return (
          <input
            {...commonProps}
            type={type}
          />
        );
    }
  };

  const displayValue = formatDisplay ? formatDisplay(value) : String(value || '');

  if (isEditing) {
    return (
      <div className="relative">
        {renderInput()}
        
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border">
            {error}
          </div>
        )}

        <div className="absolute top-1 right-1 flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-6 w-6 p-0"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Check className="w-3 h-3 text-green-600" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3 text-red-600" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      className={`
        cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${showSuccess ? 'bg-green-50 border border-green-200' : ''}
        ${className}
      `}
      title={disabled ? 'Cannot edit' : 'Click to edit'}
    >
      {displayValue || <span className="text-gray-400 italic">{placeholder || 'Click to edit'}</span>}
    </div>
  );
};

// Specialized components for common use cases
export const InlineTextCell: React.FC<Omit<InlineEditCellProps, 'type'>> = (props) => (
  <InlineEditCell {...props} type="text" />
);

export const InlineNumberCell: React.FC<Omit<InlineEditCellProps, 'type'>> = (props) => (
  <InlineEditCell {...props} type="number" />
);

export const InlineSelectCell: React.FC<Omit<InlineEditCellProps, 'type'>> = (props) => (
  <InlineEditCell {...props} type="select" />
);

export const InlineDateCell: React.FC<Omit<InlineEditCellProps, 'type'>> = (props) => (
  <InlineEditCell {...props} type="date" />
);

export const InlineTextareaCell: React.FC<Omit<InlineEditCellProps, 'type'>> = (props) => (
  <InlineEditCell {...props} type="textarea" />
);






