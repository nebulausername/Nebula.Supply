import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { Product } from "@nebula/shared";
import type { SortOrder } from "../store/shop";
import { Header } from "../layout/Header";
import { CategoryNav } from "../components/shop/CategoryNav";
import { ProductCard } from "../components/shop/ProductCard";
import { ProductModal } from "../components/shop/ProductModal";
import { MobileBottomNav } from "../components/mobile/MobileBottomNav";
import { MobileShopNavigation } from "../components/shop/MobileShopNavigation";
import { useShopStore } from "../store/shop";
import { useEnhancedTouch } from "../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../components/MobileOptimizations";
import { useBotCommandHandler } from "../utils/botCommandHandler";
import { Search, Filter, Grid, List, SlidersHorizontal, ChevronDown, X, RefreshCw, Check, ShoppingBag, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { springConfigs } from "../utils/springConfigs";

const applySearch = (products: Product[], searchTerm?: string): Product[] => {
  if (!searchTerm?.trim()) return products;
  const term = searchTerm.toLowerCase();
  return products.filter((product) =>
    [product.name, product.description, ...(product.badges ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );
};

const applySort = (products: Product[], sortBy: string, sortDirection: "asc" | "desc"): Product[] => {
  const clone = [...products];
  if (sortBy === "price") {
    clone.sort((a, b) => sortDirection === "asc" ? a.price - b.price : b.price - a.price);
  } else {
    clone.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }
  return clone;
};

export const MobileShopPage = () => {
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();
  const { executeCommand } = useBotCommandHandler();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [navVariant, setNavVariant] = useState<"sidebar" | "overlay">("sidebar");
  const [navSearchQuery, setNavSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Toggle between sidebar and overlay variants (for testing both)
  // In production, you might want to auto-detect screen size
  useEffect(() => {
    // Auto-switch to overlay on larger screens
    if (window.innerWidth >= 768) {
      setNavVariant("overlay");
    }
  }, []);

  const {
    fetchAll,
    isLoading,
    categories,
    products,
    activeCategoryId,
    setActiveCategoryId,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    filters,
    setFilters,
    cartItems,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    coinsBalance
  } = useShopStore((state) => ({
    fetchAll: state.fetchAll,
    isLoading: state.isLoading,
    categories: state.categories,
    products: state.products,
    activeCategoryId: state.activeCategoryId,
    setActiveCategoryId: state.setActiveCategoryId,
    searchQuery: state.searchTerm,
    setSearchQuery: state.setSearchTerm,
    sortBy: state.sortOrder?.split('-')[0] || 'popularity',
    setSortBy: state.setSortOrder,
    sortDirection: (state.sortOrder?.includes('asc') ? 'asc' : 'desc') as 'asc' | 'desc',
    setSortDirection: state.setSortOrder,
    filters: state.filters || {},
    setFilters: state.setFilters || (() => {}),
    cartItems: state.cart || [],
    addToCart: state.addToCart || (() => {}),
    removeFromCart: state.removeFromCart || (() => {}),
    updateCartItemQuantity: state.updateCartItemQuantity || (() => {}),
    coinsBalance: state.coinsBalance ?? 0
  }));

  // Check for bot commands in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  // Mobile scroll handler for header effects
  useEffect(() => {
    if (!isMobile || !scrollRef.current) return;

    const handleScroll = () => {
      const scrolled = scrollRef.current!.scrollTop > 20;
      setIsScrolled(scrolled);
    };

    const scrollElement = scrollRef.current;
    scrollElement.addEventListener('scroll', handleScroll);
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Load data on mount
  useEffect(() => {
    if (!categories.length) {
      fetchAll().catch((err) => console.error("Shop bootstrap failed", err));
    }
  }, [categories.length, fetchAll]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Category filter
    if (activeCategoryId) {
      filtered = filtered.filter(product => product.categoryId === activeCategoryId);
    }
    
    // Search filter
    filtered = applySearch(filtered, searchQuery);
    
    // Sort
    filtered = applySort(filtered, sortBy, sortDirection);
    
    return filtered;
  }, [products, activeCategoryId, searchQuery, sortBy, sortDirection]);

  const handleCategoryChange = useCallback((categoryId: string | null) => {
    triggerHaptic('light');
    setActiveCategoryId(categoryId);
  }, [setActiveCategoryId, triggerHaptic]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleSortChange = useCallback((newSortBy: string) => {
    triggerHaptic('light');
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy, sortDirection, setSortBy, setSortDirection, triggerHaptic]);

  const handleViewModeToggle = useCallback(() => {
    triggerHaptic('light');
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, [triggerHaptic]);

  const handleFilterToggle = useCallback(() => {
    triggerHaptic('light');
    setShowFilters(prev => !prev);
  }, [triggerHaptic]);

  const handleNavToggle = useCallback(() => {
    triggerHaptic('light');
    setIsNavOpen(prev => !prev);
  }, [triggerHaptic]);

  const handleNavClose = useCallback(() => {
    setIsNavOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#06060A] to-[#050505] text-white">
      {/* Mobile Header */}
      <motion.div
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled ? 'bg-black/90 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={springConfigs.smooth}
      >
        <div className="px-4 pt-3 pb-4 space-y-3">
          {/* Eyebrow */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Premium Navigation Menu Button */}
              <button
                onClick={handleNavToggle}
                className="p-2.5 rounded-xl bg-gradient-to-r from-accent/20 to-cyan-400/20 hover:from-accent/30 hover:to-cyan-400/30 border border-accent/30 transition-all duration-300 active:scale-95 shadow-lg shadow-accent/20 z-50 relative"
                aria-label="Kategorien öffnen"
              >
                <Menu className="w-6 h-6 text-accent" />
              </button>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-medium">
                NEBULA SHOP
              </p>
            </div>
            {/* Coins Display - Mobile Optimized */}
            <div className="flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700/50 px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 2v8M2 6h8" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-[9px] uppercase tracking-wide text-gray-400 leading-tight">COINS</p>
                <p className="text-sm font-bold text-white leading-tight">{coinsBalance.toLocaleString("de-DE")}</p>
              </div>
            </div>
          </div>
          
          {/* Title & Description */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-white leading-tight">Nebula Shop</h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              Entdecke unsere Produkte und sichere dir exklusive Drops.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-20"
        style={{ height: 'calc(100vh - 60px)' }}
      >
        {/* Search and Controls */}
        <div className="p-6 space-y-6">
          {/* Search Bar - Enhanced */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springConfigs.smooth}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Produkte durchsuchen..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-400 placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 focus:bg-white/10 transition-all duration-300 text-sm font-medium"
            />
          </motion.div>

          {/* Controls Row */}
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfigs.smooth, delay: 0.1 }}
          >
            {/* Sort Buttons - Screenshot Style */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSortChange('popularity')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  sortBy === 'popularity'
                    ? 'bg-accent/20 text-accent border-2 border-accent/50 shadow-[0_0_8px_rgba(11,247,188,0.3)]'
                    : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:bg-gray-700/60'
                }`}
              >
                Beliebtheit
              </button>
              <button
                onClick={() => handleSortChange('price')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  sortBy === 'price'
                    ? 'bg-accent/20 text-accent border-2 border-accent/50 shadow-[0_0_8px_rgba(11,247,188,0.3)]'
                    : 'bg-gray-800/60 text-gray-400 border border-gray-700/50 hover:bg-gray-700/60'
                }`}
              >
                Preis
              </button>
            </div>

            {/* View Mode Toggle & Filter */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleViewModeToggle}
                className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 text-gray-400"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>
              <button
                onClick={handleFilterToggle}
                className="p-2 rounded-lg bg-gray-800/60 border border-gray-700/50 hover:bg-gray-700/60 transition-all duration-300 text-gray-400"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfigs.smooth, delay: 0.2 }}
          >
            <CategoryNav 
              categories={categories} 
              activeCategoryId={activeCategoryId} 
              onSelectCategory={handleCategoryChange} 
            />
          </motion.div>
        </div>

        {/* Products Grid - Performance Optimized */}
        <motion.div
          className={`px-6 ${
              viewMode === 'grid' 
              ? 'grid grid-cols-2 gap-6'
              : 'space-y-4'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfigs.smooth, delay: 0.3 }}
          style={{ 
            contain: 'layout style paint',
            willChange: 'transform'
          }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className={`${
                  viewMode === 'grid' 
                    ? 'aspect-square' 
                    : 'h-32'
                } bg-white/5 rounded-2xl animate-pulse`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              />
            ))
          ) : (
            filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.5) }}
                className={`${viewMode === 'list' ? 'w-full' : ''} will-change-transform`}
                style={{
                  contentVisibility: index > 10 ? 'auto' : undefined,
                }}
              >
                <ProductCard
                  product={product}
                  viewMode={viewMode}
                  onAddToCart={addToCart}
                  onRemoveFromCart={removeFromCart}
                  onUpdateQuantity={updateCartItemQuantity}
                  cartQuantity={cartItems.find(item => item.product.id === product.id)?.quantity || 0}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 px-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springConfigs.smooth}
          >
            <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Keine Produkte gefunden</h3>
            <p className="text-gray-400 text-center">
              Versuche andere Suchbegriffe oder ändere deine Filter
            </p>
          </motion.div>
        )}
      </div>

      {/* Premium Mobile Shop Navigation */}
      <MobileShopNavigation
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleCategoryChange}
        variant={navVariant}
        isOpen={isNavOpen}
        onClose={handleNavClose}
        searchQuery={navSearchQuery}
        onSearchChange={setNavSearchQuery}
        products={products}
        recentCategories={[]} // TODO: Implement recent categories tracking
      />

      {/* Mobile Bottom Navigation - Use correct navigation items */}
      <MobileBottomNav
        activeItem="shop"
        onItemChange={(item) => {
          triggerHaptic('light');
          // Navigate to correct route
          const routes: Record<string, string> = {
            'home': '/',
            'shop': '/shop',
            'drops': '/drops',
            'cookie-clicker': '/cookie-clicker',
            'profile': '/profile'
          };
          if (routes[item]) {
            window.location.href = routes[item];
          }
          console.log('Navigate to:', item);
        }}
      />
    </div>
  );
};




