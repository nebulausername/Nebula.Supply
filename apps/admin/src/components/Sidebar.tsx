import { Rocket, LineChart, UserCog, Ticket, Shield, Settings, Database, Activity, Zap, ShoppingBag, Package, TrendingUp, Users, Truck, BarChart3, Image, Trophy, Sparkles, Cookie, Wrench, Key, Search, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "../utils/cn";
import { preloadComponentDelayed } from "../lib/utils/componentPreloader";
import { useCallback, useMemo, useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { ViewType, VALID_VIEW_TYPES } from "../lib/types/common";

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
  { id: "automation", label: "AI Automation", icon: Zap, badge: "42%" },
  { id: "contests", label: "Contest Management", icon: Trophy, badge: "NEW", category: "Gaming" },
  { id: "cookieClicker", label: "Cookie Clicker", icon: Cookie, badge: "NEW", category: "Gaming" },
  { id: "maintenance", label: "Maintenance Mode", icon: Wrench, badge: "NEW", category: "System" },
  { id: "users", label: "User Management", icon: UserCog, badge: null },
  { id: "security", label: "Security Center", icon: Shield, badge: null },
  { id: "settings", label: "System Config", icon: Settings, badge: null }
];

interface SidebarProps {
  activeView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

// Component loaders for preloading
const componentLoaders: Record<string, () => Promise<any>> = {
  shop: () => import("./ecommerce/ShopManagement").then(m => ({ default: m.ShopManagement })),
  drops: () => import("./ecommerce/DropManagementPage").then(m => ({ default: m.DropManagementPage })),
  orders: () => import("./ecommerce/OrderManagement").then(m => ({ default: m.OrderManagement })),
  customers: () => import("./ecommerce/CustomerManagement").then(m => ({ default: m.CustomerManagement })),
  images: () => import("../features/images/ImageLibraryPage").then(m => ({ default: m.ImageLibraryPage })),
  shipping: () => import("./ecommerce/ShippingManagement").then(m => ({ default: m.ShippingManagement })),
  tickets: () => import("./tickets/TicketManagement").then(m => ({ default: m.TicketManagement })),
  users: () => import("./users/UserManagement").then(m => ({ default: m.UserManagement })),
  security: () => import("./security/SecurityCenter").then(m => ({ default: m.SecurityCenter })),
  settings: () => import("./system/SystemConfig").then(m => ({ default: m.SystemConfig })),
  contests: () => import("./contest/ContestAdminPanel").then(m => ({ default: m.ContestAdminPanel })),
  cookieClicker: () => import("./cookieClicker/CookieClickerAdmin").then(m => ({ default: m.CookieClickerAdmin })),
  maintenance: () => import("./maintenance/MaintenanceControl").then(m => ({ default: m.MaintenanceControl })),
  'invite-codes': () => import("./invite/InviteCodeAdminPage").then(m => ({ default: m.InviteCodeAdminPage })),
};

// LocalStorage key for collapsed categories
const COLLAPSED_CATEGORIES_KEY = 'nebula-sidebar-collapsed-categories';

export const Sidebar = memo(({ activeView = 'overview', onViewChange }: SidebarProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
    // Load from localStorage
    const saved = localStorage.getItem(COLLAPSED_CATEGORIES_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [focusedIndex, setFocusedIndex] = useState<{ category: string; itemIndex: number } | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement>>({});

  // Sync URL with activeView - only read from URL, don't write to avoid loops
  useEffect(() => {
    const urlView = searchParams.get('view') as ViewType | null;
    // Clean up malformed URLs
    const cleanView = urlView?.includes('/') ? urlView.split('/')[0] as ViewType : urlView;
    
    if (cleanView && cleanView !== activeView && onViewChange) {
      // Only update if it's a valid view type
      if (VALID_VIEW_TYPES.includes(cleanView)) {
        onViewChange(cleanView);
      }
    }
  }, [searchParams]); // Only depend on searchParams to avoid loops

  // Save collapsed categories to localStorage
  useEffect(() => {
    localStorage.setItem(COLLAPSED_CATEGORIES_KEY, JSON.stringify(Array.from(collapsedCategories)));
  }, [collapsedCategories]);

  // Group links by category with memoization
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

  // Flatten all links for keyboard navigation
  const allLinks = useMemo(() => {
    const flattened: Array<{ id: string; label: string; category: string; itemIndex: number }> = [];
    Object.entries(filteredGroupedLinks).forEach(([category, categoryLinks]) => {
      if (!collapsedCategories.has(category)) {
        categoryLinks.forEach((link, itemIndex) => {
          flattened.push({
            id: link.id,
            label: link.label,
            category,
            itemIndex
          });
        });
      }
    });
    return flattened;
  }, [filteredGroupedLinks, collapsedCategories]);

  // Preload component on hover
  const handleMouseEnter = useCallback((viewId: string) => {
    const loader = componentLoaders[viewId];
    if (loader && activeView !== viewId) {
      preloadComponentDelayed(loader, 200);
    }
  }, [activeView]);

  // Handle view change
  const handleViewChange = useCallback((viewId: ViewType) => {
    onViewChange?.(viewId);
    setSearchQuery('');
    setFocusedIndex(null);
  }, [onViewChange]);

  // Toggle category collapse
  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in search input
      if (e.target instanceof HTMLInputElement) {
        // Allow Escape to clear search
        if (e.key === 'Escape' && searchQuery) {
          e.preventDefault();
          setSearchQuery('');
          searchInputRef.current?.blur();
        }
        return;
      }

      // Focus search with Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Number keys 1-9 for quick navigation
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const link = allLinks[num - 1];
        if (link) {
          handleViewChange(link.id as ViewType);
          buttonRefs.current[link.id]?.focus();
        }
        return;
      }

      // Arrow key navigation
      if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        const currentIndex = focusedIndex
          ? allLinks.findIndex(l => l.category === focusedIndex.category && l.itemIndex === focusedIndex.itemIndex)
          : allLinks.findIndex(l => l.id === activeView);

        let nextIndex: number;
        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < allLinks.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : allLinks.length - 1;
        }

        const nextLink = allLinks[nextIndex];
        if (nextLink) {
          // Expand category if collapsed
          if (collapsedCategories.has(nextLink.category)) {
            toggleCategory(nextLink.category);
          }
          setFocusedIndex({ category: nextLink.category, itemIndex: nextLink.itemIndex });
          buttonRefs.current[nextLink.id]?.focus();
        }
        return;
      }

      // Enter to select focused item
      if (e.key === 'Enter' && focusedIndex) {
        e.preventDefault();
        const link = allLinks.find(l => l.category === focusedIndex.category && l.itemIndex === focusedIndex.itemIndex);
        if (link) {
          handleViewChange(link.id as ViewType);
        }
        return;
      }

      // Home/End keys
      if (e.key === 'Home') {
        e.preventDefault();
        const firstLink = allLinks[0];
        if (firstLink) {
          setFocusedIndex({ category: firstLink.category, itemIndex: firstLink.index });
          buttonRefs.current[firstLink.id]?.focus();
        }
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        const lastLink = allLinks[allLinks.length - 1];
        if (lastLink) {
          setFocusedIndex({ category: lastLink.category, itemIndex: lastLink.index });
          buttonRefs.current[lastLink.id]?.focus();
        }
        return;
      }
    };

    const element = sidebarRef.current || window;
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [allLinks, focusedIndex, activeView, collapsedCategories, toggleCategory, handleViewChange, searchQuery]);

  return (
    <aside
      ref={sidebarRef}
      className="hidden w-72 flex-col border-r border-neon/20 bg-gradient-to-b from-black/60 to-black/40 px-5 py-8 backdrop-blur-xl lg:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mb-8">
        <h2 className="text-xl font-orbitron font-bold tracking-tight text-white mb-2">
          NEBULA SUPPLY
        </h2>
        <p className="text-xs font-space-grotesk text-neon/70 uppercase tracking-wider">
          Mission Control
        </p>
      </div>

      {/* Search Input */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neon/50" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search navigation..."
          className={cn(
            "w-full pl-10 pr-8 py-2 bg-black/40 border border-neon/20 rounded-lg",
            "text-sm text-white placeholder:text-neon/40",
            "focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon/50",
            "transition-all duration-200"
          )}
          aria-label="Search navigation items"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-neon/10 rounded transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3 w-3 text-neon/60" />
          </button>
        )}
      </div>

      <nav className="space-y-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neon/20 scrollbar-track-transparent">
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
                transition={{ delay: categoryIndex * 0.05 }}
              >
                {!isGeneral && (
                  <button
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "w-full flex items-center justify-between mb-3 px-2 py-1.5 rounded-lg",
                      "text-xs font-space-grotesk text-neon/60 uppercase tracking-wider font-semibold",
                      "hover:bg-neon/10 hover:text-neon transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-neon/50"
                    )}
                    aria-expanded={!isCollapsed}
                    aria-controls={`category-${category}`}
                  >
                    <span>{category}</span>
                    {isCollapsed ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
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
                      {categoryLinks.map(({ id, label, icon: Icon, badge }, itemIndex) => {
                        const isActive = activeView === id;
                        const isFocused = focusedIndex?.category === category && focusedIndex?.itemIndex === itemIndex;

                        return (
                          <motion.button
                            key={id}
                            ref={(el) => {
                              if (el) buttonRefs.current[id] = el;
                            }}
                            type="button"
                            onClick={() => handleViewChange(id as ViewType)}
                            onMouseEnter={() => handleMouseEnter(id)}
                            onFocus={() => setFocusedIndex({ category, itemIndex })}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-space-grotesk font-medium text-muted",
                              "transition-all duration-300 group relative",
                              "focus:outline-none focus:ring-2 focus:ring-neon/50 focus:ring-offset-2 focus:ring-offset-black/40",
                              isActive
                                ? "bg-neon/20 text-neon border border-neon/30 shadow-lg shadow-neon/20"
                                : "hover:bg-neon/10 hover:text-neon hover:border hover:border-neon/30",
                              isFocused && !isActive && "ring-2 ring-neon/30"
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
                                className="absolute right-2"
                              >
                                <div className="w-2 h-2 bg-neon rounded-full animate-pulse" />
                              </motion.div>
                            )}

                            {/* Keyboard shortcut hint */}
                            {allLinks.findIndex(l => l.id === id) < 9 && (
                              <span className="absolute -left-8 text-xs text-neon/30 font-mono">
                                {allLinks.findIndex(l => l.id === id) + 1}
                              </span>
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

      {/* Keyboard shortcuts hint */}
      <div className="mt-6 pt-4 border-t border-neon/10">
        <p className="text-xs text-neon/40 font-space-grotesk">
          <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-neon/60">Ctrl+K</kbd> Search •{' '}
          <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-neon/60">1-9</kbd> Quick nav
        </p>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';
