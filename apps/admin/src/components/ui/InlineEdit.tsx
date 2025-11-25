import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Eye, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ChangePreviewModal, ChangePreview } from '../ecommerce/ChangePreviewModal';

export interface InlineEditProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  onCancel?: () => void;
  type?: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'date' | 'datetime' | 'toggle' | 'tags';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  validate?: (value: string) => string | null;
  format?: (value: string | number) => string;
  parse?: (value: string) => string | number;
  debounceMs?: number;
  autoFocus?: boolean;
  selectOnFocus?: boolean;
  min?: number;
  max?: number;
  step?: number;
  // New props for enhanced features
  options?: Array<{ value: string | number; label: string }>; // For select type
  multiline?: boolean; // For textarea
  rows?: number; // For textarea
  autoComplete?: string[]; // For autocomplete suggestions
  showThousandSeparator?: boolean; // For number formatting
  currency?: string; // For currency formatting
  // Preview mode props
  enablePreview?: boolean;
  fieldLabel?: string;
  entityName?: string;
  entityType?: 'product' | 'category' | 'other';
  // Optimistic update props
  enableOptimisticUpdate?: boolean;
  onOptimisticUpdate?: (value: string | number) => void;
  onRollback?: () => void;
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  type = 'text',
  placeholder,
  className,
  inputClassName,
  disabled = false,
  validate,
  format = (v) => String(v),
  parse = (v) => v,
  debounceMs = 300, // Reduced from 500ms to 300ms for better performance
  autoFocus = true,
  selectOnFocus = true,
  min,
  max,
  step,
  options,
  multiline = false,
  rows = 3,
  autoComplete,
  showThousandSeparator = false,
  currency,
  enablePreview = false,
  fieldLabel,
  entityName,
  entityType = 'other',
  enableOptimisticUpdate = true,
  onOptimisticUpdate,
  onRollback,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [filteredAutoComplete, setFilteredAutoComplete] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | number | null>(null);
  const [originalValue, setOriginalValue] = useState<string | number>(value);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const autoCompleteRef = useRef<HTMLDivElement>(null);

  // Initialize edit value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditValue(format(value));
      setError(null);
      setOriginalValue(value);
    }
  }, [isEditing, value, format]);

  // Sync optimistic value with actual value when it updates from server
  useEffect(() => {
    if (optimisticValue !== null && value !== optimisticValue) {
      // Server value differs from optimistic - might be a conflict
      // Keep optimistic for now, will be resolved on next save
    } else if (optimisticValue !== null && value === optimisticValue) {
      // Optimistic update confirmed
      setOptimisticValue(null);
    }
  }, [value, optimisticValue]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (selectOnFocus) {
        inputRef.current.select();
      }
    }
  }, [isEditing, selectOnFocus]);

  // Handle click to edit
  const handleClick = useCallback(() => {
    if (!disabled && !isEditing) {
      setIsEditing(true);
    }
  }, [disabled, isEditing]);

  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setError(null);

    // Handle autocomplete
    if (autoComplete && type === 'text' && newValue.length > 0) {
      const filtered = autoComplete.filter(item => 
        item.toLowerCase().includes(newValue.toLowerCase())
      ).slice(0, 5);
      setFilteredAutoComplete(filtered);
      setShowAutoComplete(filtered.length > 0);
    } else {
      setShowAutoComplete(false);
    }

    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Validate if validator provided
    if (validate) {
      const validationError = validate(newValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Set up debounced save (skip for select and date types - save immediately)
    if (debounceMs > 0 && type !== 'select' && type !== 'date' && type !== 'datetime') {
      const timer = setTimeout(() => {
        handleSave(newValue);
      }, debounceMs);
      setDebounceTimer(timer);
    } else if (type === 'select' || type === 'date' || type === 'datetime') {
      // Save immediately for select and date
      handleSave(newValue);
    }
  }, [debounceTimer, debounceMs, validate, autoComplete, type]);

  // Handle save with optimistic updates
  const handleSave = useCallback(async (valueToSave?: string | number, skipPreview = false) => {
    const finalValue = valueToSave !== undefined ? valueToSave : editValue;
    const parsedValue = parse(finalValue);

    // Validate before saving
    if (validate) {
      const validationError = validate(String(finalValue));
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Check if value actually changed
    if (parsedValue === value) {
      setIsEditing(false);
      return;
    }

    // Show preview if enabled and not skipped
    if (enablePreview && !skipPreview) {
      setShowPreview(true);
      return;
    }

    setIsSaving(true);
    setError(null);

    // Optimistic update
    if (enableOptimisticUpdate) {
      setOptimisticValue(parsedValue);
      onOptimisticUpdate?.(parsedValue);
    }

    try {
      await onSave(parsedValue);
      setOptimisticValue(null);
      setSaveSuccess(true);
      
      // Clear success indicator after animation
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 500);
    } catch (err) {
      // Rollback optimistic update on error
      if (enableOptimisticUpdate) {
        setOptimisticValue(null);
        onRollback?.();
      }
      setError(err instanceof Error ? err.message : 'Save failed');
      setSaveSuccess(false);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [editValue, value, parse, validate, onSave, enablePreview, enableOptimisticUpdate, onOptimisticUpdate, onRollback]);

  // Cleanup success timeout
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Handle preview confirmation
  const handlePreviewConfirm = useCallback(async () => {
    setShowPreview(false);
    await handleSave(undefined, true);
  }, [handleSave]);

  // Get preview changes
  const getPreviewChanges = useCallback((): ChangePreview[] => {
    if (!isEditing) return [];
    const finalValue = editValue;
    const parsedValue = parse(finalValue);
    
    if (parsedValue === originalValue) return [];

    return [{
      field: 'value',
      label: fieldLabel || 'Wert',
      oldValue: originalValue,
      newValue: parsedValue,
      type: type === 'number' ? 'number' : 'text'
    }];
  }, [isEditing, editValue, originalValue, parse, fieldLabel, type]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    setEditValue(format(value));
    setError(null);
    setIsEditing(false);
    onCancel?.();
  }, [debounceTimer, value, format, onCancel]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  // Handle blur
  const handleBlur = useCallback(() => {
    // Don't save on blur if clicking autocomplete
    if (!isSaving && !showAutoComplete) {
      handleSave();
    }
  }, [isSaving, showAutoComplete, handleSave]);

  // Handle autocomplete selection
  const handleAutoCompleteSelect = useCallback((suggestion: string) => {
    setEditValue(suggestion);
    setShowAutoComplete(false);
    handleSave(suggestion);
  }, [handleSave]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  if (isEditing) {
    const isSelect = type === 'select';
    const isTextarea = type === 'textarea' || multiline;
    const isDate = type === 'date' || type === 'datetime';
    const isToggle = type === 'toggle';
    const isTags = type === 'tags';

    return (
      <div className={cn('relative', className)}>
        {isSelect && options ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={disabled || isSaving}
            className={cn(
              'w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              inputClassName
            )}
          >
            {Array.isArray(options) ? options.filter(opt => opt && opt.value !== undefined && opt.label).map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            )) : null}
          </select>
        ) : isTextarea ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={handleChange as any}
            onKeyDown={handleKeyDown as any}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || isSaving}
            rows={rows}
            className={cn(
              'w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded resize-y',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              inputClassName
            )}
          />
        ) : isDate ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type === 'datetime' ? 'datetime-local' : 'date'}
            value={editValue}
            onChange={handleChange as any}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || isSaving}
            className={cn(
              'w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              inputClassName
            )}
          />
        ) : isToggle ? (
          <div className={cn('relative', className)}>
            <button
              type="button"
              onClick={() => {
                const boolValue = value === true || value === 'true' || value === 1 || String(value).toLowerCase() === 'true';
                handleSave(!boolValue);
              }}
              disabled={disabled || isSaving}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                (value === true || value === 'true' || value === 1 || String(value).toLowerCase() === 'true') ? 'bg-blue-600' : 'bg-gray-600',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  (value === true || value === 'true' || value === 1 || String(value).toLowerCase() === 'true') ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            {isSaving && (
              <div className="absolute -top-6 left-0 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                Wird gespeichert...
              </div>
            )}
          </div>
        ) : isTags ? (
          <InlineTagsEditor
            value={value}
            onSave={handleSave}
            disabled={disabled || isSaving}
            className={className}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={editValue}
            onChange={handleChange as any}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || isSaving}
            min={min}
            max={max}
            step={step}
            className={cn(
              'w-full px-2 py-1 text-sm bg-black/50 border border-white/20 rounded',
              'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              inputClassName
            )}
          />
        )}

        {/* Autocomplete dropdown */}
        {showAutoComplete && filteredAutoComplete.length > 0 && (
          <div
            ref={autoCompleteRef}
            className="absolute z-50 w-full mt-1 bg-gray-900 border border-white/20 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredAutoComplete.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAutoCompleteSelect(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {/* Action buttons */}
        {!isSelect && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 items-center">
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                </motion.div>
              ) : saveSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="bg-green-500/20 rounded-full p-0.5"
                >
                  <Check className="w-3 h-3 text-green-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-1"
                >
                  <button
                    onClick={() => handleSave()}
                    disabled={isSaving || !!error}
                    className="p-0.5 hover:bg-green-500/20 rounded text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
                    title="Speichern"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="p-0.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                    title="Abbrechen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <div className="absolute -top-6 left-0 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
            Wird gespeichert...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
            {error}
          </div>
        )}

        {/* Preview button */}
        {enablePreview && !isSelect && (
          <button
            onClick={() => {
              const finalValue = editValue;
              const parsedValue = parse(finalValue);
              if (parsedValue !== value) {
                setShowPreview(true);
              }
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-0.5 hover:bg-blue-500/20 rounded text-blue-400 hover:text-blue-300"
            title="Vorschau"
          >
            <Eye className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Preview Modal
  const previewChanges = getPreviewChanges();

  const displayValue = optimisticValue !== null ? optimisticValue : value;

  return (
    <>
      <motion.div
        ref={displayRef}
        onClick={handleClick}
        className={cn(
          'px-2 py-1 text-sm rounded cursor-pointer hover:bg-white/5 transition-all duration-200',
          'focus:outline-none focus:ring-1 focus:ring-blue-500',
          disabled && 'opacity-50 cursor-not-allowed',
          optimisticValue !== null && 'bg-yellow-500/10 border border-yellow-500/30',
          saveSuccess && 'bg-green-500/10 border border-green-500/30',
          className
        )}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Click to edit"
        whileHover={!disabled ? { scale: 1.02 } : {}}
        animate={optimisticValue !== null ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <span className="flex items-center gap-2">
          {format(displayValue)}
          <AnimatePresence>
            {optimisticValue !== null && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="text-xs text-yellow-400 flex items-center gap-1"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-3 h-3" />
                </motion.div>
                Wird gespeichert...
              </motion.span>
            )}
            {saveSuccess && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="text-xs text-green-400 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Gespeichert!
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.div>

      {/* Preview Modal */}
      {enablePreview && (
        <ChangePreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={handlePreviewConfirm}
          title="Änderung bestätigen"
          description={`Möchten Sie diese Änderung wirklich speichern?`}
          changes={previewChanges}
          entityName={entityName}
          entityType={entityType}
          isLoading={isSaving}
        />
      )}
    </>
  );
}

// Specialized components for common use cases
export function InlineTextEdit(props: Omit<InlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="text" />;
}

export function InlineNumberEdit(props: Omit<InlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="number" />;
}

export function InlineEmailEdit(props: Omit<InlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="email" />;
}

export function InlineUrlEdit(props: Omit<InlineEditProps, 'type'>) {
  return <InlineEdit {...props} type="url" />;
}

// Currency formatter
export function InlineCurrencyEdit(props: Omit<InlineEditProps, 'format' | 'parse'>) {
  return (
    <InlineEdit
      {...props}
      type="number"
      format={(value) => `€${Number(value).toFixed(2)}`}
      parse={(value) => parseFloat(value.replace('€', ''))}
      step="0.01"
      min={0}
    />
  );
}

// Percentage formatter
export function InlinePercentageEdit(props: Omit<InlineEditProps, 'format' | 'parse'>) {
  return (
    <InlineEdit
      {...props}
      type="number"
      format={(value) => `${Number(value)}%`}
      parse={(value) => parseFloat(value.replace('%', ''))}
      step="0.1"
      min={0}
      max={100}
    />
  );
}

// Tags Editor Component
function InlineTagsEditor({ 
  value, 
  onSave, 
  disabled, 
  className 
}: { 
  value: string | number | any; 
  onSave: (value: any) => Promise<void>; 
  disabled?: boolean;
  className?: string;
}) {
  const tags = Array.isArray(value) ? value : (value ? String(value).split(',').filter(Boolean) : []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleTagAdd = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = [...tags, tagInput.trim()];
      setIsSaving(true);
      try {
        await onSave(newTags);
        setTagInput('');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleTagRemove = async (tagToRemove: string) => {
    const newTags = tags.filter((t: string) => t !== tagToRemove);
    setIsSaving(true);
    try {
      await onSave(newTags);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex flex-wrap gap-2 p-2 bg-black/50 border border-white/20 rounded min-h-[2.5rem]">
        {tags.map((tag: string, idx: number) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleTagRemove(tag)}
              className="hover:text-red-400"
              disabled={disabled || isSaving}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagAdd}
          placeholder="Tag hinzufügen..."
          disabled={disabled || isSaving}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
        />
      </div>
      {isSaving && (
        <div className="absolute -top-6 left-0 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
          Wird gespeichert...
        </div>
      )}
    </div>
  );
}















































