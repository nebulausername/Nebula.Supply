import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Rocket, ShoppingBag, User, Home, Cookie, TrendingUp, Settings } from 'lucide-react';
import { cn } from '../utils/cn';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  action: () => void;
  keywords?: string[];
  category: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = useMemo(() => [
    {
      id: 'home',
      label: 'Home',
      description: 'Zur Startseite',
      icon: Home,
      action: () => {
        navigate('/');
        onClose();
      },
      keywords: ['home', 'start', 'hauptseite'],
      category: 'Navigation'
    },
    {
      id: 'drops',
      label: 'Drops',
      description: 'Live Drops anzeigen',
      icon: Rocket,
      action: () => {
        navigate('/drops');
        onClose();
      },
      keywords: ['drops', 'releases', 'live'],
      category: 'Navigation'
    },
    {
      id: 'shop',
      label: 'Shop',
      description: 'Zum Shop',
      icon: ShoppingBag,
      action: () => {
        navigate('/shop');
        onClose();
      },
      keywords: ['shop', 'produkte', 'kaufen'],
      category: 'Navigation'
    },
    {
      id: 'profile',
      label: 'Profil',
      description: 'Mein Profil anzeigen',
      icon: User,
      action: () => {
        navigate('/profile');
        onClose();
      },
      keywords: ['profil', 'account', 'einstellungen'],
      category: 'Navigation'
    },
    {
      id: 'cookie-clicker',
      label: 'Cookie Clicker',
      description: 'Zum Cookie Clicker',
      icon: Cookie,
      action: () => {
        navigate('/cookie-clicker');
        onClose();
      },
      keywords: ['cookie', 'clicker', 'spiel'],
      category: 'Features'
    },
    {
      id: 'trending',
      label: 'Trending',
      description: 'Trending Items anzeigen',
      icon: TrendingUp,
      action: () => {
        navigate('/drops');
        onClose();
      },
      keywords: ['trending', 'popular', 'angesagt'],
      category: 'Features'
    }
  ], [navigate, onClose]);

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;

    const query = searchQuery.toLowerCase();
    return commands.filter(cmd => {
      const matchesLabel = cmd.label.toLowerCase().includes(query);
      const matchesDescription = cmd.description?.toLowerCase().includes(query);
      const matchesKeywords = cmd.keywords?.some(kw => kw.toLowerCase().includes(query));
      
      return matchesLabel || matchesDescription || matchesKeywords;
    });
  }, [searchQuery, commands]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Search className="h-5 w-5 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Befehle durchsuchen... (z.B. 'Drops', 'Shop', 'Profil')"
                  className="flex-1 bg-transparent text-text placeholder:text-muted outline-none"
                  autoFocus
                  aria-label="Command palette search"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-xs text-muted border border-white/10">
                  <span>Esc</span>
                </kbd>
              </div>

              {/* Commands List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length > 0 ? (
                  <div className="p-2">
                    {filteredCommands.map((command, index) => {
                      const Icon = command.icon;
                      return (
                        <motion.button
                          key={command.id}
                          onClick={command.action}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                            index === selectedIndex
                              ? "bg-accent/20 border border-accent/30"
                              : "hover:bg-white/5 border border-transparent"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            index === selectedIndex
                              ? "bg-accent/20"
                              : "bg-white/5"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5",
                              index === selectedIndex ? "text-accent" : "text-muted"
                            )} />
                          </div>
                          <div className="flex-1">
                            <div className={cn(
                              "font-semibold",
                              index === selectedIndex ? "text-accent" : "text-text"
                            )}>
                              {command.label}
                            </div>
                            {command.description && (
                              <div className="text-xs text-muted">{command.description}</div>
                            )}
                          </div>
                          <div className="text-xs text-muted px-2 py-1 rounded bg-white/5">
                            {command.category}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted">
                    <p>Keine Ergebnisse gefunden</p>
                    <p className="text-xs mt-2">Versuche andere Suchbegriffe</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-3 border-t border-white/10 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10">↑↓</kbd>
                    <span>Navigieren</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10">Enter</kbd>
                    <span>Auswählen</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10">Esc</kbd>
                  <span>Schließen</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook to use Command Palette
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  };
};

