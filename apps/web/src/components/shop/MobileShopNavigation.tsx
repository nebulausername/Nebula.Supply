import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import type { Category } from "@nebula/shared";
import { 
  ChevronLeft, 
  Search, 
  X, 
  ChevronRight,
  Menu
} from "lucide-react";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { CategoryIcon } from "../../utils/categoryIcons";
import { getBrandIcon } from "../../utils/brandIcons";
import nebulaMark from "../../assets/nebula-mark.svg";
import "../../styles/premiumMobileNav.css";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";

interface MobileShopNavigationProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  variant?: "sidebar" | "overlay";
  isOpen: boolean;
  onClose: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  products?: Array<{ categoryId: string }>;
  recentCategories?: string[];
}

// Memoized Category Item Component for Performance
const CategoryItem = memo(({
  category,
  index,
  isActive,
  openSubMenuId,
  productCount,
  isRecent,
  onCategoryClick,
}: {
  category: Category;
  index: number;
  isActive: boolean;
  openSubMenuId: string | null;
  productCount: number;
  isRecent: boolean;
  onCategoryClick: (categoryId: string, category: Category) => void;
}) => {
  return (
    <motion.button
      onClick={() => onCategoryClick(category.id, category)}
      className={cn(
        "premium-nav-category-item",
        isActive && "active",
        isRecent && "border-l-yellow-400/50"
      )}
      aria-expanded={openSubMenuId === category.id}
      aria-current={isActive ? "page" : undefined}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: (index + 1) * 0.05, duration: 0.3 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="premium-nav-category-content">
        <motion.div 
          className="premium-nav-category-icon"
          initial={{ scale: 0.8, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: (index + 1) * 0.05 + 0.1, duration: 0.4, type: "spring" }}
          whileHover={{ scale: 1.2, rotate: 5 }}
        >
          <CategoryIcon 
            categoryId={category.id} 
            size={24}
            animated={true}
            showColor={true}
          />
        </motion.div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="premium-nav-category-name">
              {category.name.toUpperCase()}
            </span>
            {category.featured && (
              <span className="px-1.5 py-0.5 text-[8px] font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-full uppercase tracking-wide shadow-sm">
                FEATURED
              </span>
            )}
            {isRecent && (
              <span className="px-1.5 py-0.5 text-[8px] font-bold bg-blue-100 text-blue-600 rounded-full uppercase">
                NEW
              </span>
            )}
          </div>
          {productCount > 0 && (
            <span className="text-[11px] text-gray-500 font-medium mt-0.5">
              {productCount} {productCount === 1 ? 'Produkt' : 'Produkte'}
            </span>
          )}
        </div>
      </div>
      {category.subItems && category.subItems.length > 0 && (
        <motion.div
          animate={{ x: openSubMenuId === category.id ? 4 : 0 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <ChevronRight className="premium-nav-category-arrow" />
        </motion.div>
      )}
    </motion.button>
  );
});

CategoryItem.displayName = "CategoryItem";

export const MobileShopNavigation = memo(({
  categories,
  activeCategoryId,
  onSelectCategory,
  variant = "sidebar",
  isOpen,
  onClose,
  searchQuery = "",
  onSearchChange,
  products = [],
  recentCategories = [],
}: MobileShopNavigationProps) => {
  const { triggerHaptic } = useEnhancedTouch();
  const [openSubMenuId, setOpenSubMenuId] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const quickRowRef = useRef<HTMLDivElement>(null);

  // Handle back navigation
  const handleBack = useCallback(() => {
    triggerHaptic('light');
    if (openSubMenuId) {
      setOpenSubMenuId(null);
      setNavigationHistory(prev => prev.slice(0, -1));
    } else {
      onClose();
    }
  }, [openSubMenuId, onClose, triggerHaptic]);

  // Quick product counts for quick-access chips
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

  const getCount = useCallback((id: string | null) => {
    if (id === null) return products.length;
    return productCounts[id] || 0;
  }, [products.length, productCounts]);

  // Handle category click
  const handleCategoryClick = useCallback((categoryId: string | null, category?: Category) => {
    triggerHaptic('medium');
    
    if (category?.subItems && category.subItems.length > 0) {
      // Open submenu
      setOpenSubMenuId(category.id);
      setNavigationHistory(prev => [...prev, category.id]);
    } else {
      // Select category and close
      onSelectCategory(categoryId);
      onClose();
    }
  }, [onSelectCategory, onClose, triggerHaptic]);

  // Handle subcategory click
  const handleSubCategoryClick = useCallback((categoryId: string | null) => {
    triggerHaptic('medium');
    onSelectCategory(categoryId);
    setOpenSubMenuId(null);
    setNavigationHistory([]);
    onClose();
  }, [onSelectCategory, onClose, triggerHaptic]);

  // Keyboard Navigation - Premium Enhanced
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === "Escape") {
        handleBack();
        return;
      }

      // Arrow key navigation
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const categoryButtons = Array.from(
          document.querySelectorAll('.premium-nav-category-item')
        ) as HTMLButtonElement[];
        
        if (categoryButtons.length === 0) return;
        
        const currentIndex = categoryButtons.findIndex(btn => btn === document.activeElement);
        let nextIndex: number;
        
        if (e.key === "ArrowDown") {
          nextIndex = currentIndex < categoryButtons.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : categoryButtons.length - 1;
        }
        
        categoryButtons[nextIndex]?.focus();
        triggerHaptic('light');
      }

      // Enter to select
      if (e.key === "Enter" && document.activeElement?.classList.contains('premium-nav-category-item')) {
        (document.activeElement as HTMLButtonElement).click();
      }

      // Search focus (Ctrl/Cmd + K)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleBack, triggerHaptic]);

  // Close on click outside (for sidebar)
  useEffect(() => {
    if (!isOpen || variant !== "sidebar") return;

    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Small delay to avoid immediate close
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, variant, onClose]);

  // Prevent body scroll when menu is open
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

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current && variant === "sidebar") {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, variant]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setOpenSubMenuId(null);
      setNavigationHistory([]);
    }
  }, [isOpen]);

  // Get current category for submenu
  const currentCategory = categories.find(cat => cat.id === openSubMenuId);

  // Helper to get product count for category - Memoized
  const getCategoryProductCount = useCallback((categoryId: string | null): number => {
    if (!products.length) return 0;
    if (categoryId === null) return products.length;
    return products.filter(p => p.categoryId === categoryId).length;
  }, [products]);

  // Memoized filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(query) ||
      cat.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Always render but conditionally show/hide
  if (!isOpen) return null;

  // Sidebar Variant
  if (variant === "sidebar") {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]"
          onClick={onClose}
          style={{ animation: "fadeIn 0.2s ease-out" }}
        />
        
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className="premium-mobile-nav-sidebar"
          role="navigation"
          aria-label="Shop Navigation"
        >
          {/* Header */}
          <div className="premium-nav-header">
            <div className="premium-nav-header-content">
              <button
                onClick={handleBack}
                className="premium-nav-back-button"
                aria-label={openSubMenuId ? "Zurück" : "Menü schließen"}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <h2 className="premium-nav-title">
                {openSubMenuId ? currentCategory?.name.toUpperCase() || "KATEGORIE" : "KATEGORIEN"}
              </h2>
              
              <button
                onClick={onClose}
                className="premium-nav-back-button"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {!openSubMenuId && (
            <div className="premium-nav-search">
              <Search className="premium-nav-search-icon" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Suche..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="premium-nav-search-input"
                aria-label="Kategorien durchsuchen"
                onKeyDown={(e) => {
                  // Clear search on Escape
                  if (e.key === "Escape" && searchQuery) {
                    e.stopPropagation();
                    onSearchChange?.("");
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  aria-label="Suche zurücksetzen"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          )}

          {/* Logo (only on main menu) */}
          {!openSubMenuId && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-transparent via-gray-50 to-transparent">
              <div className="flex items-center justify-between">
                <img 
                  src={nebulaMark} 
                  alt="Nebula Supply" 
                  className="premium-nav-logo"
                />
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
                  PREMIUM
                </span>
              </div>
            </div>
          )}

          {/* Categories or Subcategories */}
          <div className="premium-nav-categories" data-animate={isOpen && !openSubMenuId ? "true" : "false"}>
            {openSubMenuId && currentCategory ? (
              // Subcategories View
              <>
                {currentCategory.subItems?.map((subItem) => (
                  <div key={subItem.id} className="premium-nav-subcategories">
                    <div className="premium-nav-subcategory-header">
                      {subItem.name}
                    </div>
                    <div className="premium-nav-subcategory-list">
                      {subItem.items && subItem.items.length > 0 ? (
                        subItem.items.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleSubCategoryClick(currentCategory.id)}
                            className="premium-nav-subcategory-item"
                          >
                            <span className="mr-3 text-lg">
                              {getBrandIcon(item)}
                            </span>
                            {item}
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() => handleSubCategoryClick(currentCategory.id)}
                          className="premium-nav-subcategory-item"
                        >
                          Alle {subItem.name} anzeigen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // Main Categories View
              <>
                {/* All Categories Button */}
                <motion.button
                  onClick={() => handleCategoryClick(null)}
                  className={cn(
                    "premium-nav-category-item",
                    activeCategoryId === null && "active"
                  )}
                  aria-current={activeCategoryId === null ? "page" : undefined}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0, duration: 0.3 }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="premium-nav-category-content">
                    <div className="premium-nav-category-icon flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 mr-3">
                      <span className="text-sm">⭐</span>
                    </div>
                    <span className="premium-nav-category-name">ALLE</span>
                    <span className="ml-auto text-xs text-gray-500 font-medium">
                      {products.length}
                    </span>
                  </div>
                </motion.button>

                {/* Category Items - Memoized */}
                <AnimatePresence>
                  {filteredCategories.map((category, index) => {
                    const productCount = getCategoryProductCount(category.id);
                    const isRecent = recentCategories.includes(category.id);
                    
                    return (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        index={index}
                        isActive={activeCategoryId === category.id}
                        openSubMenuId={openSubMenuId}
                        productCount={productCount}
                        isRecent={isRecent}
                        onCategoryClick={handleCategoryClick}
                      />
                    );
                  })}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // Overlay Modal Variant
  return (
    <div className="premium-mobile-nav-overlay">
      <div 
        className="premium-mobile-nav-overlay-backdrop"
        onClick={onClose}
      />
      
      <div className="premium-mobile-nav-overlay-content">
        {/* Header */}
        <div className="premium-nav-header">
          <div className="premium-nav-header-content">
            <button
              onClick={handleBack}
              className="premium-nav-back-button"
              aria-label={openSubMenuId ? "Zurück" : "Menü schließen"}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <h2 className="premium-nav-title">
              {openSubMenuId ? currentCategory?.name.toUpperCase() || "KATEGORIE" : "KATEGORIEN"}
            </h2>
            
            <button
              onClick={onClose}
              className="premium-nav-back-button"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {!openSubMenuId && (
          <div className="premium-nav-search">
            <Search className="premium-nav-search-icon" />
            <div className="relative">
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Suche..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="premium-nav-search-input"
                aria-label="Kategorien durchsuchen"
                onKeyDown={(e) => {
                  if (e.key === "Escape" && searchQuery) {
                    e.stopPropagation();
                    onSearchChange?.("");
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
                  aria-label="Suche zurücksetzen"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

          {/* Quick-Access Chips (sticky) */}
          {!openSubMenuId && (
            <div className="px-4 pb-2 sticky top-[56px] z-[1] bg-gradient-to-b from-black/70 to-transparent">
              <div ref={quickRowRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2">
                {/* All chip */}
                <button
                  onClick={() => handleCategoryClick(null)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition"
                  aria-label="Alle Produkte"
                >
                  <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-300">⭐</span>
                  <span>ALLE</span>
                  <span className="ml-1 text-[11px] text-white/60">{getCount(null)}</span>
                </button>
                {categories.slice(0, 12).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id, cat)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition"
                    aria-label={`${cat.name} öffnen`}
                  >
                    <CategoryIcon categoryId={cat.id} size={16} animated={true} showColor={true} />
                    <span>{cat.name.toUpperCase()}</span>
                    <span className="ml-1 text-[11px] text-white/60">{getCount(cat.id)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Logo */}
        {!openSubMenuId && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-transparent via-gray-50 to-transparent">
            <div className="flex items-center justify-center gap-3">
              <img 
                src={nebulaMark} 
                alt="Nebula Supply" 
                className="premium-nav-logo"
              />
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
                PREMIUM
              </span>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="premium-nav-categories" data-animate={isOpen && !openSubMenuId ? "true" : "false"}>
          {openSubMenuId && currentCategory ? (
            // Subcategories View
            <>
              {currentCategory.subItems?.map((subItem) => (
                <div key={subItem.id} className="premium-nav-subcategories">
                  <div className="premium-nav-subcategory-header">
                    {subItem.name}
                  </div>
                  <div className="premium-nav-subcategory-list">
                    {subItem.items && subItem.items.length > 0 ? (
                      subItem.items.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSubCategoryClick(currentCategory.id)}
                          className="premium-nav-subcategory-item"
                        >
                          <span className="mr-3 text-lg">
                            {getBrandIcon(item)}
                          </span>
                          {item}
                        </button>
                      ))
                    ) : (
                      <button
                        onClick={() => handleSubCategoryClick(currentCategory.id)}
                        className="premium-nav-subcategory-item"
                      >
                        Alle {subItem.name} anzeigen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            // Main Categories View
            <>
              {/* All Categories Button */}
              <button
                onClick={() => handleCategoryClick(null)}
                className={cn(
                  "premium-nav-category-item",
                  activeCategoryId === null && "active"
                )}
                aria-current={activeCategoryId === null ? "page" : undefined}
              >
                <div className="premium-nav-category-content">
                  <span className="premium-nav-category-name">ALLE</span>
                </div>
              </button>

                {/* Category Items - Memoized */}
              <AnimatePresence>
                {filteredCategories.map((category, index) => {
                  const productCount = getCategoryProductCount(category.id);
                  const isRecent = recentCategories.includes(category.id);
                  
                  return (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      index={index}
                      isActive={activeCategoryId === category.id}
                      openSubMenuId={openSubMenuId}
                      productCount={productCount}
                      isRecent={isRecent}
                      onCategoryClick={handleCategoryClick}
                    />
                  );
                })}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

MobileShopNavigation.displayName = "MobileShopNavigation";

