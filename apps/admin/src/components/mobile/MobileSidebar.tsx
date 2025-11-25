import { Rocket, LineChart, UserCog, Ticket, Shield, Settings, Database, Activity, Zap, ShoppingBag, Package, TrendingUp, Users, Truck, BarChart3, Image, Trophy, Sparkles, Cookie, Wrench, Key, Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { preloadComponentDelayed } from "../../lib/utils/componentPreloader";
import { useCallback, useMemo, useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useSwipe } from "../../hooks/useSwipe";
import { useTouchFeedback } from "../../hooks/useTouchFeedback";
import { ViewType } from "../../lib/types/common";

const links = [
  { id: "overview", label: "Mission Control", icon: LineChart, badge: null },
  { id: "shop", label: "Shop Management", icon: ShoppingBag, badge: "NEW", category: "E-commerce" },
  { id: "drops", label: "Drop Management", icon: Zap, badge: "NEW", category: "E-commerce" },
  { id: "orders", label: "Order Management", icon: ShoppingBag, badge: null, category: "E-commerce" },
  { id: "customers", label: "Customer Management", icon: Users, badge: null, category: "E-commerce" },
  { id: "images", label: "Bildverwaltung", icon: Image, badge: null, category: "E-commerce" },
  { id: "shipping", label: "DHL/HERMES/DPS/UPS", icon: Truck, badge: null, category: "E-commerce" },
  { id: "tickets", label: "Support Tickets", icon: Ticket, badge: "7" },
  { id: "invite-codes", label: "Invite Codes", icon: Key, badge: "NEW", category: "Bot" },
  { id: "automation", label: "AI Automation", icon: Zap, badge: "42%", category: "Bot" },
  { id: "contests", label: "Contest Management", icon: Trophy, badge: "NEW", category: "Gaming" },
  { id: "cookieClicker", label: "Cookie Clicker", icon: Cookie, badge: "NEW", category: "Gaming" },
  { id: "maintenance", label: "Maintenance Mode", icon: Wrench, badge: "NEW", category: "System" },
  { id: "users", label: "User Management", icon: UserCog, badge: null },
  { id: "security", label: "Security Center", icon: Shield, badge: null },
  { id: "settings", label: "System Config", icon: Settings, badge: null }
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

const COLLAPSED_CATEGORIES_KEY = 'nebula-sidebar-collapsed-categories';

export const MobileSidebar = memo(({ isOpen, onClose, activeView = 'overview', onViewChange }: MobileSidebarProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(COLLAPSED_CATEGORIES_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const sidebarRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { triggerHaptic } = useTouchFeedback();

  // Swipe to close gesture
  const swipeHandlers = useSwipe({
    onSwipeLeft: onClose,
    threshold: 100,
    enableHaptic: true
  });

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus first focusable element
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Sync URL with activeView
  useEffect(() => {
    const urlView = searchParams.get('view') as ViewType | null;
    if (urlView && urlView !== activeView && onViewChange) {
      onViewChange(urlView);
    }
  }, [searchParams, activeView, onViewChange]);

  // Update URL when activeView changes
  useEffect(() => {
    if (activeView) {
      const currentView = searchParams.get('view');
      if (currentView !== activeView) {
        setSearchParams({ view: activeView }, { replace: true });
      }
    }
  }, [activeView, searchParams, setSearchParams]);

  // Save collapsed categories
  useEffect(() => {
    localStorage.setItem(COLLAPSED_CATEGORIES_KEY, JSON.stringify(Array.from(collapsedCategories)));
  }, [collapsedCategories]);

  // Group links by category
  const groupedLinks = useMemo(() => {
    return links.reduce((acc, link) => {
      const category = link.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(link);
      return acc;
    }, {} as Record<string, typeof links>);
  }, []);

  // Filter links based on search query
  const filteredGroupedLinks = useMemo(() => {
    if (!searchQuery.trim()) return groupedLinks;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof links> = {};

    Object.entries(groupedLinks).forEach(([category, categoryLinks]) => {
      const matchingLinks = categoryLinks.filter(link =>
        link.label.toLowerCase().includes(query) ||
        link.id.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query)
      );

      if (matchingLinks.length > 0) {
        filtered[category] = matchingLinks;
      }
    });

    return filtered;
  }, [groupedLinks, searchQuery]);

  // Handle view change
  const handleViewChange = useCallback((viewId: ViewType) => {
    triggerHaptic('light');
    onViewChange?.(viewId);
    setSearchQuery('');
    onClose();
  }, [onViewChange, onClose, triggerHaptic]);

  // Toggle category collapse
  const toggleCategory = useCallback((category: string) => {
    triggerHaptic('light');
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, [triggerHaptic]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-80 flex flex-col",
              "bg-gradient-to-b from-black/95 to-black/90 backdrop-blur-xl",
              "border-r border-neon/20",
              "lg:hidden",
              "pt-safe-top pb-safe-bottom"
            )}
            role="navigation"
            aria-label="Main navigation"
            aria-modal="true"
            {...swipeHandlers}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neon/10">
              <div>
                <h2 className="text-lg font-orbitron font-bold tracking-tight text-white">
                  NEBULA SUPPLY
                </h2>
                <p className="text-xs font-space-grotesk text-neon/70 uppercase tracking-wider">
                  Mission Control
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                className="min-w-touch min-h-touch flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Search Input */}
            <div className="px-5 py-4 relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-4 w-4 text-neon/50" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search navigation..."
                className={cn(
                  "w-full pl-10 pr-10 py-3 bg-black/40 border border-neon/20 rounded-lg",
                  "text-base text-white placeholder:text-neon/40",
                  "focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon/50",
                  "transition-all duration-200"
                )}
                aria-label="Search navigation items"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 min-w-touch min-h-touch flex items-center justify-center hover:bg-neon/10 rounded transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-neon/60" />
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-5 pb-4 scrollbar-thin scrollbar-thumb-neon/20 scrollbar-track-transparent">
              <AnimatePresence>
                {Object.entries(filteredGroupedLinks).map(([category, categoryLinks], categoryIndex) => {
                  const isCollapsed = collapsedCategories.has(category);
                  const isGeneral = category === 'General';

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: categoryIndex * 0.03 }}
                    >
                      {!isGeneral && (
                        <button
                          onClick={() => toggleCategory(category)}
                          className={cn(
                            "w-full flex items-center justify-between mb-3 px-3 py-2.5 rounded-lg",
                            "text-xs font-space-grotesk text-neon/60 uppercase tracking-wider font-semibold",
                            "hover:bg-neon/10 hover:text-neon transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-neon/50",
                            "min-h-touch"
                          )}
                          aria-expanded={!isCollapsed}
                          aria-controls={`category-${category}`}
                        >
                          <span>{category}</span>
                          {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            id={!isGeneral ? `category-${category}` : undefined}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2 overflow-hidden"
                          >
                            {categoryLinks.map(({ id, label, icon: Icon, badge }) => {
                              const isActive = activeView === id;

                              return (
                                <motion.button
                                  key={id}
                                  type="button"
                                  onClick={() => handleViewChange(id as ViewType)}
                                  className={cn(
                                    "flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-base font-space-grotesk font-medium",
                                    "transition-all duration-300 group relative",
                                    "focus:outline-none focus:ring-2 focus:ring-neon/50 focus:ring-offset-2 focus:ring-offset-black/40",
                                    "min-h-touch",
                                    isActive
                                      ? "bg-neon/20 text-neon border border-neon/30 shadow-lg shadow-neon/20"
                                      : "text-muted hover:bg-neon/10 hover:text-neon hover:border hover:border-neon/30"
                                  )}
                                  role="menuitem"
                                  aria-current={isActive ? 'page' : undefined}
                                  aria-label={`${label}${badge ? `, ${badge}` : ''}`}
                                >
                                  <Icon className={cn(
                                    "h-5 w-5 transition-all duration-300 flex-shrink-0",
                                    isActive ? "text-neon scale-110" : "text-muted group-hover:scale-110"
                                  )} />
                                  <span className="font-medium flex-1 text-left">{label}</span>

                                  {/* Badge */}
                                  {badge && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="bg-neon/20 text-neon text-xs font-bold px-2 py-1 rounded-full border border-neon/30 flex-shrink-0">
                                      {badge}
                                    </motion.span>
                                  )}

                                  {/* Active indicator */}
                                  {isActive && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute right-3"
                                    >
                                      <div className="w-2 h-2 bg-neon rounded-full animate-pulse" />
                                    </motion.div>
                                  )}
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
});

MobileSidebar.displayName = 'MobileSidebar';


