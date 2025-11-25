import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag, Hash } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

interface TicketTagsEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestions?: string[];
  category?: string;
}

// Tag suggestions based on category
const categoryTagSuggestions: Record<string, string[]> = {
  shipping: ['versand', 'dhl', 'hermes', 'dps', 'ups', 'verzögert', 'verloren'],
  payment: ['zahlung', 'paypal', 'kreditkarte', 'fehler', 'rückerstattung'],
  product: ['produkt', 'verfügbarkeit', 'preis', 'qualität', 'defekt'],
  technical: ['bug', 'fehler', 'technisch', 'website', 'app'],
  order: ['bestellung', 'stornierung', 'änderung', 'status'],
  other: ['allgemein', 'frage', 'beschwerde', 'lob'],
};

const commonTags = ['wichtig', 'dringend', 'vip', 'follow-up', 'erledigt', 'warten'];

export const TicketTagsEditor = memo(function TicketTagsEditor({
  tags,
  onTagsChange,
  suggestions,
  category,
}: TicketTagsEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get tag suggestions
  const tagSuggestions = [
    ...(category && categoryTagSuggestions[category] ? categoryTagSuggestions[category] : []),
    ...(suggestions || []),
    ...commonTags,
  ].filter(
    (tag) => !tags.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      onTagsChange([...tags, normalizedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const getTagColor = (tag: string) => {
    // Color coding based on tag content
    if (tag.includes('wichtig') || tag.includes('dringend') || tag.includes('kritisch')) {
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    }
    if (tag.includes('vip') || tag.includes('premium')) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
    if (tag.includes('erledigt') || tag.includes('done')) {
      return 'bg-green-500/10 text-green-400 border-green-500/30';
    }
    return 'bg-surface/50 text-text border-white/10';
  };

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={cn(
                'text-xs font-medium px-2.5 py-1 flex items-center gap-1.5',
                'cursor-pointer hover:scale-105 transition-transform',
                getTagColor(tag)
              )}
              onClick={() => handleRemoveTag(tag)}
            >
              <Hash className="h-3 w-3" />
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className="ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Input */}
      <div className="relative">
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleInputKeyDown}
            placeholder="Tag hinzufügen... (Enter zum Hinzufügen)"
            className={cn(
              'pl-9',
              'bg-surface/50 border-white/10',
              'focus:border-accent/50 focus:ring-2 focus:ring-accent/20'
            )}
          />
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && tagSuggestions.length > 0 && inputValue && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'absolute z-10 w-full mt-1',
                'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
                'backdrop-blur-xl border border-white/10 rounded-lg',
                'shadow-xl shadow-black/30',
                'max-h-48 overflow-y-auto'
              )}
            >
              {tagSuggestions.slice(0, 10).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleAddTag(suggestion)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm',
                    'hover:bg-surface/50 transition-colors',
                    'flex items-center gap-2',
                    'first:rounded-t-lg last:rounded-b-lg'
                  )}
                >
                  <Hash className="h-3.5 w-3.5 text-muted" />
                  <span className="text-text">{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add Buttons */}
      {category && categoryTagSuggestions[category] && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted self-center">Schnell hinzufügen:</span>
          {categoryTagSuggestions[category]
            .filter((tag) => !tags.includes(tag))
            .slice(0, 5)
            .map((tag) => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(tag)}
                className="h-7 text-xs px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                {tag}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
});

