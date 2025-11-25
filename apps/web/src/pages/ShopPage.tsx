import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { Product } from "@nebula/shared";
import type { SortOrder } from "../store/shop";
import { CategoryNavSuuupply } from "../components/shop/CategoryNavSuuupply";
import { CategoryHoverPreview } from "../components/shop/CategoryHoverPreview";
import { MobileSideDrawer } from "../components/shop/MobileSideDrawer";
import { ProductCard } from "../components/shop/ProductCard";
import { ProductModal } from "../components/shop/ProductModal";
import { useShopStore } from "../store/shop";
import { useEnhancedTouch } from "../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../components/MobileOptimizations";
import { useBotCommandHandler } from "../utils/botCommandHandler";
import { useDebounce } from "../hooks/useDebounce";
import { useRealtimeShop } from "../hooks/useRealtimeShop";
import { Search, Grid, List, Menu, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/premiumShop.css";

export const ShopPage = () => {
  const { triggerHaptic } = useEnhancedTouch();
  const { isMobile } = useMobileOptimizations();
  const { executeCommand } = useBotCommandHandler();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [hoveredProducts, setHoveredProducts] = useState<Product[]>([]);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    fetchAll,
    isLoading,
    error,
    categories,
    products,
    activeCategoryId,
    activeBrandSlug,
    activeSeriesSlug,
    searchTerm,
    sortOrder,
    setSearchTerm,
    setSortOrder,
    setCategory,
    filterByBrand,
    filterBySeries,
    clearFilters
  } = useShopStore((state) => ({
    fetchAll: state.fetchAll,
    isLoading: state.isLoading,
    error: state.error ?? null,
    categories: state.categories,
    products: state.products,
    activeCategoryId: state.activeCategoryId,
    activeBrandSlug: state.activeBrandSlug,
    activeSeriesSlug: state.activeSeriesSlug,
    searchTerm: state.searchTerm,
    sortOrder: state.sortOrder,
    setSearchTerm: state.setSearchTerm,
    setSortOrder: state.setSortOrder,
    setCategory: state.setCategory,
    filterByBrand: state.filterByBrand,
    filterBySeries: state.filterBySeries,
    clearFilters: state.clearFilters
  }));

  // Use ref to track if fetchAll has been called to prevent infinite loops
  const hasFetchedRef = useRef(false);
  
  // Real-time product updates via WebSocket
  const { isConnected: isRealtimeConnected } = useRealtimeShop({
    enabled: true,
    onProductUpdated: (event) => {
      if (import.meta.env.DEV) {
        console.log('[ShopPage] Product updated via realtime:', event.data.productId);
      }
    },
    onProductCreated: (event) => {
      if (import.meta.env.DEV) {
        console.log('[ShopPage] Product created via realtime:', event.data.productId);
      }
    },
    onProductDeleted: (event) => {
      if (import.meta.env.DEV) {
        console.log('[ShopPage] Product deleted via realtime:', event.data.productId);
      }
    },
    onProductStockChanged: (event) => {
      if (import.meta.env.DEV) {
        console.log('[ShopPage] Product stock changed via realtime:', event.data.productId);
      }
    }
  });
  
  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedRef.current && !categories.length) {
      hasFetchedRef.current = true;
      fetchAll().catch((err) => console.error("Shop bootstrap failed", err));
    }
    
    // Check for bot commands in URL
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [categories.length, executeCommand]); // Removed fetchAll from dependencies to prevent infinite loop

  // Handle category hover for preview
  const handleCategoryHover = useCallback((categoryId: string | null, categoryProducts: Product[]) => {
    setHoveredCategoryId(categoryId);
    setHoveredProducts(categoryProducts);
  }, []);

  // Debounce search term to reduce filtering computations
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Optimized: Memoized filtered products with better performance + 3-level filtering
  const filteredProducts = useMemo(() => {
    let result = products;
    
    // Category filter (Level 1)
    if (activeCategoryId !== null) {
      result = result.filter(p => p.categoryId === activeCategoryId);
    }
    
    // Brand filter (Level 2)
    if (activeBrandSlug) {
      result = result.filter(p => p.brandSlug === activeBrandSlug);
    }
    
    // Series filter (Level 3)
    if (activeSeriesSlug) {
      result = result.filter(p => p.seriesSlug === activeSeriesSlug);
    }
    
    // Search filter - use debounced term
    if (debouncedSearchTerm?.trim()) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter((product) =>
        [product.name, product.description, ...(product.badges ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }
    
    // Sort
    const sorted = [...result];
    if (sortOrder === "price-asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-desc") {
      sorted.sort((a, b) => b.price - a.price);
    } else {
      sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    }
    
    return sorted;
  }, [products, activeCategoryId, activeBrandSlug, activeSeriesSlug, debouncedSearchTerm, sortOrder]);

  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? null;

  // Search handler
  const handleSearchChange = useCallback((value: string) => {
    triggerHaptic('light');
    setSearchTerm(value);
  }, [setSearchTerm, triggerHaptic]);

  // Sort handler
  const handleSortChange = useCallback((value: SortOrder) => {
    triggerHaptic('light');
    setSortOrder(value);
  }, [setSortOrder, triggerHaptic]);

  // Category change handler
  const handleCategoryChange = useCallback((categoryId: string | null) => {
    triggerHaptic('light');
    setCategory(categoryId);
  }, [setCategory, triggerHaptic]);

  // Mobile drawer handlers
  const handleMobileDrawerOpen = useCallback(() => {
    triggerHaptic('light');
    setIsMobileDrawerOpen(true);
  }, [triggerHaptic]);

  const handleMobileDrawerClose = useCallback(() => {
    triggerHaptic('light');
    setIsMobileDrawerOpen(false);
  }, [triggerHaptic]);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Category Navigation - Desktop Only */}
      {!isMobile && (
        <div className="sticky top-0 z-50">
          <CategoryNavSuuupply
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={handleCategoryChange}
            products={products}
            onCategoryHover={handleCategoryHover}
            filterByBrand={filterByBrand}
            filterBySeries={filterBySeries}
          />
        </div>
      )}

      {/* Mobile Header with Hamburger Menu */}
      {isMobile && (
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleMobileDrawerOpen}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              aria-label="Menü öffnen"
            >
              <Menu className="h-6 w-6 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Shop</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>
      )}

      {/* Mobile Side Drawer */}
      {isMobile && (
        <MobileSideDrawer
          isOpen={isMobileDrawerOpen}
          onClose={handleMobileDrawerClose}
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleCategoryChange}
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      {/* Hover Preview - Desktop Only (only show if no mega menu) */}
      {!isMobile && (
        <CategoryHoverPreview
          categoryId={hoveredCategoryId}
          products={hoveredProducts}
          isVisible={hoveredCategoryId !== null && hoveredProducts.length > 0 && !categories.find(c => c.id === hoveredCategoryId)?.subItems?.length}
        />
      )}

      {/* Main Content */}
      <div
        ref={scrollRef}
        className={`
          ${isMobile ? 'min-h-screen px-4 pb-24 pt-4' : 'mx-auto w-full max-w-7xl px-6 py-8 space-y-8'}
        `}
      >
        {/* Search and Sort Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Produkte suchen..."
              className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-400 focus:border-white/20 focus:outline-none focus:bg-white/10 transition-all"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <select
              value={sortOrder}
              onChange={(e) => handleSortChange(e.target.value as SortOrder)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none focus:bg-white/10 transition-all appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="popularity-desc" className="bg-black">Beliebtheit</option>
              <option value="price-asc" className="bg-black">Preis aufsteigend</option>
              <option value="price-desc" className="bg-black">Preis absteigend</option>
              <option value="newest" className="bg-black">Neueste</option>
            </select>

            {/* View Mode Toggle */}
            <button
              className={`
                rounded-full p-3 transition-colors
                ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}
              `}
              onClick={() => {
                triggerHaptic('light');
                setViewMode(viewMode === 'grid' ? 'list' : 'grid');
              }}
              aria-label={`Ansicht: ${viewMode === 'grid' ? 'Liste' : 'Grid'}`}
            >
              {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Category Description */}
        {activeCategory && (
          <div className="text-center py-4">
            <h2 className="text-2xl font-semibold text-white mb-2">{activeCategory.name}</h2>
            <p className="text-gray-400">{activeCategory.description}</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fehler beim Laden</h3>
              <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
              <button
                onClick={() => {
                  hasFetchedRef.current = false;
                  fetchAll().catch((err) => console.error("Retry failed", err));
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black rounded-lg font-semibold hover:bg-accent/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Erneut versuchen
              </button>
            </div>
          </div>
        )}

        {/* Products Grid/List */}
        {isLoading ? (
          <div className={viewMode === 'grid' 
            ? isMobile
              ? 'grid grid-cols-2 gap-4'
              : 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
            : 'space-y-4'
          }>
            {Array.from({ length: isMobile ? 6 : 9 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-black/30 p-4 animate-pulse"
              >
                <div className="aspect-[4/3] bg-white/10 rounded-xl mb-4" />
                <div className="h-4 bg-white/10 rounded mb-2" />
                <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
                <div className="h-6 bg-white/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={
              viewMode === 'grid'
                ? isMobile
                  ? 'grid grid-cols-2 gap-4'
                  : 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
                : 'space-y-4'
            }
          >
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">Keine Produkte gefunden</h3>
                <p className="text-muted-foreground max-w-md">
                  {searchTerm 
                    ? `Keine Produkte gefunden für "${searchTerm}". Versuche es mit anderen Suchbegriffen.`
                    : 'Es sind derzeit keine Produkte verfügbar.'}
                </p>
              </div>
            ) : (
              filteredProducts.map((product, index) => {
                const shouldAnimate = index < 20;
                return (
                  <motion.div
                    key={product.id}
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldAnimate ? { delay: Math.min(index * 0.03, 0.4), duration: 0.3 } : { duration: 0 }}
                    whileHover={{ y: -4 }}
                    className={viewMode === 'list' ? 'w-full' : ''}
                  >
                    <ProductCard product={product} index={index} />
                  </motion.div>
                );
              })
            )}

            <AnimatePresence>
              {filteredProducts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`${viewMode === 'list' ? 'w-full' : 'col-span-full'} rounded-2xl border border-white/10 bg-black/40 p-12 text-center`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <Search className="h-10 w-10 text-gray-400" />
                    <div>
                      <p className="text-xl font-bold text-white mb-2">Keine Produkte gefunden</p>
                      <p className="text-sm text-gray-400">Versuche einen anderen Suchbegriff oder Filter.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </div>

      <ProductModal />
    </div>
  );
};
