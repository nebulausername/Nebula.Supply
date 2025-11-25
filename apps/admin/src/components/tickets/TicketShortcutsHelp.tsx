import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface TicketShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { key: 'j', description: 'Nächstes Ticket', ctrl: false },
      { key: 'k', description: 'Vorheriges Ticket', ctrl: false },
      { key: 'Esc', description: 'Panel schließen', ctrl: false },
      { key: '/', description: 'Suche fokussieren', ctrl: false },
      { key: 'g', description: 'Go to... (siehe unten)', ctrl: false },
    ],
  },
  {
    category: 'Go To (g + key)',
    items: [
      { key: 'g a', description: 'Alle Tickets', ctrl: false },
      { key: 'g m', description: 'Meine Tickets', ctrl: false },
      { key: 'g o', description: 'Offene Tickets', ctrl: false },
      { key: 'g c', description: 'Kritische Tickets', ctrl: false },
      { key: 'g u', description: 'Nicht zugewiesene', ctrl: false },
    ],
  },
  {
    category: 'Ticket Actions',
    items: [
      { key: 'a', description: 'Ticket zuweisen', ctrl: false },
      { key: 'r', description: 'Antworten', ctrl: false },
      { key: 'e', description: 'Eskalieren', ctrl: false },
      { key: 'd', description: 'Als erledigt markieren', ctrl: false },
      { key: 'x', description: 'Aktuelles Ticket auswählen', ctrl: false },
      { key: '*', description: 'Alle sichtbaren auswählen', ctrl: false },
    ],
  },
  {
    category: 'Priority',
    items: [
      { key: '1', description: 'Priorität: Niedrig', ctrl: false },
      { key: '2', description: 'Priorität: Mittel', ctrl: false },
      { key: '3', description: 'Priorität: Hoch', ctrl: false },
      { key: '4', description: 'Priorität: Kritisch', ctrl: false },
    ],
  },
  {
    category: 'Status',
    items: [
      { key: 's', description: 'Status ändern', ctrl: false },
      { key: 'o', description: 'Status: Offen', ctrl: false },
      { key: 'w', description: 'Status: Wartend', ctrl: false },
      { key: 'i', description: 'Status: In Bearbeitung', ctrl: false },
    ],
  },
  {
    category: 'General',
    items: [
      { key: 'n', description: 'Neues Ticket erstellen', ctrl: false },
      { key: 'k', description: 'Neues Ticket erstellen', ctrl: true },
      { key: 'f', description: 'Filter umschalten', ctrl: true },
      { key: '?', description: 'Shortcuts anzeigen', ctrl: false },
    ],
  },
];

const formatKey = (key: string, ctrl: boolean) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  if (ctrl) {
    return (
      <span className="flex items-center gap-1">
        <kbd className="px-2 py-1 text-xs font-semibold bg-surface/50 border border-white/10 rounded">
          {modKey}
        </kbd>
        <span className="text-muted">+</span>
        <kbd className="px-2 py-1 text-xs font-semibold bg-surface/50 border border-white/10 rounded">
          {key.toUpperCase()}
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

export const TicketShortcutsHelp = memo(function TicketShortcutsHelp({
  isOpen,
  onClose,
}: TicketShortcutsHelpProps) {
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
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                  <Keyboard className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text">Tastaturkürzel</h2>
                  <p className="text-sm text-muted">Schnellzugriff auf alle Funktionen</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Shortcuts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
              {shortcuts.map((category) => (
                <div key={category.category} className="space-y-3">
                  <h3 className="text-sm font-semibold text-text uppercase tracking-wider">
                    {category.category}
                  </h3>
                  <div className="space-y-2">
                    {category.items.map((shortcut, idx) => (
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
                          {formatKey(shortcut.key, shortcut.ctrl)}
                        </div>
                      </div>
                    ))}
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

