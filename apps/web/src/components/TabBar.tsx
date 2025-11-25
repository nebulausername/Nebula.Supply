import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Home, Rocket, ShoppingCart, Sparkles, LayoutDashboard, Cookie } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useEffect, useState, useMemo, useCallback, useRef, memo } from "react";
import { useGlobalCartStore } from "../store/globalCart";
import { useGamingDiscountStore } from "../store/gamingDiscounts";
import { cn } from "../utils/cn";
import { MobileNavigation } from "./MobileNavigation";
import { useEnhancedTouch } from "../hooks/useEnhancedTouch";

const tabs = [
  { id: "home", label: "Home", icon: LayoutDashboard, href: "/" },
  { id: "drops", label: "Drops", icon: Rocket, href: "/drops", featured: true },
  { id: "shop", label: "Shop", icon: Home, href: "/shop" },
  { id: "cookie-clicker", label: "Cookies", icon: Cookie, href: "/cookie-clicker", featured: true },
  { id: "profile", label: "Profil", icon: Sparkles, href: "/profile" },
  { id: "cart", label: "Cart", icon: ShoppingCart, href: "/cart" }
] as const;

export const TabBar = memo(() => {
  const { totalItems, openCart } = useGlobalCartStore();
  const hasAvailableDiscounts = useGamingDiscountStore(state => state.hasAvailableDiscounts());
  const availableDiscounts = useGamingDiscountStore(state => state.availableDiscounts);
  const location = useLocation();
  const navigate = useNavigate();
  const { triggerHaptic } = useEnhancedTouch();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [focusedTabIndex, setFocusedTabIndex] = useState<number | null>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | HTMLButtonElement>>({});
  const navRef = useRef<HTMLElement>(null);

  // Memoize active tab detection
  const activeTabId = useMemo(() => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/shop') return 'shop';
    if (path === '/drops') return 'drops';
    if (path === '/cookie-clicker' || path === '/mobile-cookie-clicker') return 'cookie-clicker';
    if (path === '/profile') return 'profile';
    if (path === '/cart') return 'cart';
    return 'home';
  }, [location.pathname]);

  // Memoize filtered tabs (excluding cart for keyboard nav)
  const navigableTabs = useMemo(() => 
    tabs.filter(tab => tab.id !== 'cart'),
    []
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Arrow key navigation
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const currentIndex = focusedTabIndex !== null
          ? focusedTabIndex
          : navigableTabs.findIndex(t => t.id === activeTabId);

        let nextIndex: number;
        if (e.key === 'ArrowRight') {
          nextIndex = currentIndex < navigableTabs.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : navigableTabs.length - 1;
        }

        const nextTab = navigableTabs[nextIndex];
        if (nextTab) {
          setFocusedTabIndex(nextIndex);
          tabRefs.current[nextTab.id]?.focus();
        }
        return;
      }

      // Enter to navigate
      if (e.key === 'Enter' && focusedTabIndex !== null) {
        e.preventDefault();
        const tab = navigableTabs[focusedTabIndex];
        if (tab) {
          triggerHaptic('light');
          navigate(tab.href);
        }
        return;
      }

      // Number keys 1-6 for quick navigation
      const num = parseInt(e.key);
      if (num >= 1 && num <= 6 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        const tab = navigableTabs[num - 1];
        if (tab) {
          triggerHaptic('light');
          navigate(tab.href);
          setFocusedTabIndex(num - 1);
        }
        return;
      }

      // Home/End keys
      if (e.key === 'Home') {
        e.preventDefault();
        const firstTab = navigableTabs[0];
        if (firstTab) {
          setFocusedTabIndex(0);
          tabRefs.current[firstTab.id]?.focus();
        }
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        const lastTab = navigableTabs[navigableTabs.length - 1];
        if (lastTab) {
          setFocusedTabIndex(navigableTabs.length - 1);
          tabRefs.current[lastTab.id]?.focus();
        }
        return;
      }
    };

    const element = navRef.current || window;
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [navigableTabs, focusedTabIndex, activeTabId, navigate, triggerHaptic]);

  const handleCartClick = useCallback(() => {
    triggerHaptic('medium');
    openCart();
  }, [openCart, triggerHaptic]);

  return (
    <nav
      ref={navRef}
      className={cn(
        "sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl transition-all duration-300",
        isScrolled && "bg-black/95 shadow-lg shadow-black/20"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Scroll Progress Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent via-purple-500 to-pink-500 origin-left"
        style={{ scaleX }}
      />
      
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-muted">
            <span className="font-semibold text-text">Nebula Supply</span>
            <span className="hidden sm:inline">On-Demand Drops</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1" role="tablist" aria-orientation="horizontal">
          {tabs.map(({ id, label, icon: Icon, href }, index) => (
            <div key={id}>
              {id === 'cart' ? (
                <button
                  ref={(el) => {
                    if (el) tabRefs.current[id] = el;
                  }}
                  onClick={handleCartClick}
                  onFocus={() => setFocusedTabIndex(null)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    "text-muted hover:text-text hover:bg-white/5"
                  )}
                  aria-label={`Shopping cart${totalItems > 0 ? `, ${totalItems} items` : ''}`}
                >
                  <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <span className="hidden lg:inline">{label}</span>
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse"
                      aria-label={`${totalItems} items in cart`}
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}
                </button>
              ) : (
                <NavLink
                  ref={(el) => {
                    if (el) tabRefs.current[id] = el;
                  }}
                  to={href}
                  onFocus={() => setFocusedTabIndex(index)}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      id === 'cookie-clicker' && hasAvailableDiscounts && "bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse",
                      isActive 
                        ? "bg-accent/20 text-accent shadow-[0_0_20px_rgba(11,247,188,0.3)]" 
                        : "text-muted hover:text-text hover:bg-white/5 hover:shadow-lg",
                      focusedTabIndex === index && !isActive && "ring-2 ring-accent/50"
                    )
                  }
                  role="tab"
                  aria-selected={activeTabId === id}
                  aria-controls={`panel-${id}`}
                  tabIndex={activeTabId === id ? 0 : -1}
                >
                  <Icon className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" aria-hidden="true" />
                  <span className="hidden lg:inline">{label}</span>
                  {id === 'cookie-clicker' && hasAvailableDiscounts && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse"
                      aria-label={`${availableDiscounts.length} available discounts`}
                    >
                      {availableDiscounts.length}
                    </motion.span>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MobileNavigation />
        </div>
      </div>
    </nav>
  );
});

TabBar.displayName = 'TabBar';
