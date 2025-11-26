import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  description: string;
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

const formatKey = (key: string, ctrl?: boolean, meta?: boolean) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  if (ctrl || meta) {
    return (
      <span className="flex items-center gap-1">
        <kbd className="px-2 py-1 text-xs font-semibold bg-surface/50 border border-white/10 rounded">
          {modKey}
        </kbd>
        <span className="text-muted">+</span>
        <kbd className="px-2 py-1 text-xs font-semibold bg-surface/50 border border-white/10 rounded">
          {key === 'Esc' ? 'Esc' : key.toUpperCase()}
        </kbd>
      </span>
    );
  }
  
  return (
    <kbd className="px-2 py-1 text-xs font-semibold bg-surface/50 border border-white/10 rounded">
      {key === 'Esc' ? 'Esc' : key.toUpperCase()}
    </kbd>
  );
};

export const KeyboardShortcutsHelp = memo(function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden"
        >
          <Card
            variant="glassmorphic"
            className={cn(
              'p-6',
              'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
              'backdrop-blur-xl border border-white/10',
              'shadow-2xl'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <Keyboard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text">Tastaturkürzel</h2>
                  <p className="text-sm text-muted">Schnellzugriff auf Funktionen</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Shortcuts List */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
              {shortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    'bg-surface/30 border border-white/10',
                    'hover:bg-surface/40 hover:border-accent/30',
                    'transition-all duration-200'
                  )}
                >
                  <span className="text-sm text-text">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {formatKey(shortcut.key, shortcut.ctrl, shortcut.meta)}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-xs text-muted text-center">
                Tipp: Drücke <kbd className="px-1.5 py-0.5 text-xs bg-surface/50 border border-white/10 rounded">?</kbd> um diese Hilfe jederzeit anzuzeigen
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

