import { memo, useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { Category, Product } from "@nebula/shared";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../MobileOptimizations";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface CategoryNavSuuupplyProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  products: Product[];
  onCategoryHover?: (categoryId: string | null, products: Product[]) => void;
  filterByBrand?: (brandSlug: string | undefined) => void;
  filterBySeries?: (seriesSlug: string | undefined) => void;
}

export const CategoryNavSuuupply = memo(
  ({ 
    categories, 
    activeCategoryId, 
    onSelectCategory, 
    products,
    onCategoryHover,
    filterByBrand,
    filterBySeries
  }: CategoryNavSuuupplyProps) => {
    const { triggerHaptic } = useEnhancedTouch();
    const { isMobile } = useMobileOptimizations();
    const scrollRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef<HTMLButtonElement | null>(null);
    const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const navRef = useRef<HTMLElement>(null);

    // Calculate product counts per category
    const productCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      products.forEach(p => {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      });
      return counts;
    }, [products]);

    // Get products for a category
    const getCategoryProducts = useCallback((categoryId: string | null): Product[] => {
      if (categoryId === null) return products;
      return products.filter(p => p.categoryId === categoryId);
    }, [products]);

    // Auto-scroll active category into view
    useEffect(() => {
      if (activeRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const chip = activeRef.current;
        const containerRect = container.getBoundingClientRect();
        const chipRect = chip.getBoundingClientRect();
        
        const chipCenter = chipRect.left - containerRect.left + chipRect.width / 2;
        const containerCenter = containerRect.width / 2;
        const scrollOffset = chipCenter - containerCenter + container.scrollLeft;
        
        container.scrollTo({ 
          left: scrollOffset, 
          behavior: "smooth" 
        });
      }
    }, [activeCategoryId]);

    const handleCategoryHover = useCallback((categoryId: string | null) => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
        menuTimeoutRef.current = null;
      }
      setHoveredCategoryId(categoryId);
      const categoryProducts = getCategoryProducts(categoryId);
      onCategoryHover?.(categoryId, categoryProducts);
      
      // Open mega menu on desktop if category has subItems
      if (!isMobile && categoryId) {
        const category = categories.find(c => c.id === categoryId);
        if (category?.subItems && category.subItems.length > 0) {
          setMegaMenuOpen(true);
        } else {
          setMegaMenuOpen(false);
        }
      } else {
        setMegaMenuOpen(false);
      }
    }, [getCategoryProducts, onCategoryHover, categories, isMobile]);

    const handleCategoryLeave = useCallback(() => {
      // Delay closing mega menu for better UX - longer delay so user can move to dropdown
      menuTimeoutRef.current = setTimeout(() => {
        setHoveredCategoryId(null);
        setMegaMenuOpen(false);
        onCategoryHover?.(null, []);
      }, 200);
    }, [onCategoryHover]);

    const handleMegaMenuEnter = useCallback(() => {
      if (menuTimeoutRef.current) {
        clearTimeout(menuTimeoutRef.current);
        menuTimeoutRef.current = null;
      }
    }, []);

    const handleMegaMenuLeave = useCallback(() => {
      setHoveredCategoryId(null);
      setMegaMenuOpen(false);
      onCategoryHover?.(null, []);
    }, [onCategoryHover]);

    const handleCategoryClick = useCallback((categoryId: string | null) => {
      triggerHaptic('light');
      onSelectCategory(categoryId);
    }, [onSelectCategory, triggerHaptic]);

    if (categories.length === 0) return null;

    const isAllActive = activeCategoryId === null;
    const hoveredCategory = hoveredCategoryId ? categories.find(c => c.id === hoveredCategoryId) : null;
    const hasMegaMenu = hoveredCategory?.subItems && hoveredCategory.subItems.length > 0;
    const isClothingCategory = hoveredCategory?.id === "cat-clothing";
    const isSneakerCategory = hoveredCategory?.id === "cat-shoes";
    const isAccessoriesCategory = hoveredCategory?.id === "cat-accessories";
    const isTaschenCategory = hoveredCategory?.id === "cat-taschen";

    return (
      <nav
        ref={navRef}
        className={`relative w-full ${isMobile ? 'border-b border-white/10 bg-black/40' : 'bg-black/80 backdrop-blur-xl border-b border-white/10'} backdrop-blur-sm`}
        onMouseLeave={handleCategoryLeave}
        aria-label="Kategorienavigation"
      >
        <div className={!isMobile ? 'max-w-7xl mx-auto relative overflow-visible' : ''}>
          <div
            ref={scrollRef}
            className={`flex items-center ${isMobile ? 'gap-0 overflow-x-auto px-6 py-4' : 'gap-2 overflow-visible px-4 py-3 justify-center'} scrollbar-hide scroll-smooth`}
            style={isMobile ? {
              WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)",
              maskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)",
            } : {}}
          >
            {/* Category Buttons - Desktop */}
            {!isMobile && categories.map((category, index) => {
              const isActive = category.id === activeCategoryId;
              const isHovered = hoveredCategoryId === category.id;
              const hasSubItems = category.subItems && category.subItems.length > 0;

              return (
                <div key={category.id} className="relative">
                  <button
                    ref={isActive ? activeRef : undefined}
                    onClick={() => handleCategoryClick(category.id)}
                    onMouseEnter={() => handleCategoryHover(category.id)}
                    className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-lg border transition-all duration-200 whitespace-nowrap text-xs font-semibold uppercase tracking-wider ${
                      isActive || isHovered
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span>{category.name.toUpperCase()}</span>
                    {hasSubItems && (
                      <ChevronDown 
                        className={`h-3 w-3 transition-transform duration-200 ${
                          isHovered && megaMenuOpen ? 'rotate-180 text-white' : 'text-gray-400'
                        }`} 
                      />
                    )}
                  </button>

                  {/* Mega Menu - Desktop Only - Show if category has subItems and is hovered */}
                  {!isMobile && isHovered && hasSubItems && hoveredCategory && hoveredCategory.subItems && hoveredCategory.subItems.length > 0 && (
                    <motion.div
                      key={`mega-menu-${hoveredCategory.id}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ 
                        duration: 0.2,
                        ease: "easeOut"
                      }}
                      onMouseEnter={handleMegaMenuEnter}
                      onMouseLeave={handleMegaMenuLeave}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
                      style={{
                        width: isClothingCategory || isTaschenCategory ? '900px' : isSneakerCategory ? '1100px' : isAccessoriesCategory ? '850px' : '800px',
                        maxWidth: '95vw',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                        zIndex: 9999,
                      }}
                    >
                          {/* Small upward triangle pointing to category - centered under button */}
                          <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-900/95" />
                          <div className="px-8 py-8">
                          {/* Sneaker Category - Brand Columns Layout */}
                          {isSneakerCategory && (() => {
                            // Collect all brands from all subItems
                            const allBrands: Array<{ brand: any; index: number }> = [];
                            hoveredCategory.subItems?.forEach((subItem) => {
                              if (subItem.brands && subItem.brands.length > 0) {
                                subItem.brands.forEach((brand) => {
                                  allBrands.push({ brand, index: allBrands.length });
                                });
                              }
                            });

                            return (
                              <div className="grid grid-cols-6 gap-8">
                                {allBrands.map(({ brand, index }) => (
                                  <div key={brand.id} className={`space-y-0 relative ${index > 0 ? 'pl-8 border-l border-white/10' : ''}`}>
                                    <h3 className="text-xs font-bold text-gray-200 mb-4 pb-2 border-b border-white/10">
                                      {brand.name}
                                    </h3>
                                    {brand.series && brand.series.length > 0 ? (
                                      <ul className="space-y-0">
                                        {brand.series.map((series: any, idx: number) => (
                                          <li key={series.id} className={idx > 0 ? "border-t border-white/10" : ""}>
                                            <button
                                              onClick={() => {
                                                triggerHaptic('light');
                                                onSelectCategory(hoveredCategory.id);
                                                filterByBrand?.(brand.slug);
                                                filterBySeries?.(series.slug);
                                                setHoveredCategoryId(null);
                                                setMegaMenuOpen(false);
                                              }}
                                              className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                            >
                                              {series.name}
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <ul className="space-y-0">
                                        <li>
                                          <button
                                            onClick={() => {
                                              triggerHaptic('light');
                                              onSelectCategory(hoveredCategory.id);
                                              filterByBrand?.(brand.slug);
                                              setHoveredCategoryId(null);
                                              setMegaMenuOpen(false);
                                            }}
                                            className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                          >
                                            {brand.name}
                                          </button>
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Clothing Category - Product Types with Brands */}
                          {isClothingCategory && (
                            <div className="grid grid-cols-3 gap-8">
                              {hoveredCategory.subItems?.map((subItem, subIndex) => (
                                <div key={subItem.id} className={`space-y-0 relative ${subIndex > 0 ? 'pl-8 border-l border-white/10' : ''}`}>
                                  <h3 className="text-xs font-bold text-gray-200 mb-4 pb-2 border-b border-white/10">
                                    {subItem.name}
                                  </h3>
                                  {subItem.brands && subItem.brands.length > 0 ? (
                                    <ul className="space-y-0">
                                      {subItem.brands.map((brand, idx) => (
                                        <li key={brand.id} className={idx > 0 ? "border-t border-white/10" : ""}>
                                          <button
                                            onClick={() => {
                                              triggerHaptic('light');
                                              onSelectCategory(hoveredCategory.id);
                                              filterByBrand?.(brand.slug);
                                              setHoveredCategoryId(null);
                                              setMegaMenuOpen(false);
                                            }}
                                            className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                          >
                                            {brand.name}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Accessoires Category - Multi-column Layout */}
                          {isAccessoriesCategory && (
                            <div className="grid grid-cols-5 gap-8">
                              {hoveredCategory.subItems?.map((subItem, subIndex) => (
                                <div key={subItem.id} className={`space-y-0 relative ${subIndex > 0 ? 'pl-8 border-l border-white/10' : ''}`}>
                                  <h3 className="text-xs font-bold text-gray-200 mb-4 pb-2 border-b border-white/10">
                                    {subItem.name}
                                  </h3>
                                  {subItem.brands && subItem.brands.length > 0 ? (
                                    <ul className="space-y-0">
                                      {subItem.brands.map((brand, idx) => (
                                        <li key={brand.id} className={idx > 0 ? "border-t border-white/10" : ""}>
                                          <button
                                            onClick={() => {
                                              triggerHaptic('light');
                                              onSelectCategory(hoveredCategory.id);
                                              filterByBrand?.(brand.slug);
                                              setHoveredCategoryId(null);
                                              setMegaMenuOpen(false);
                                            }}
                                            className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                          >
                                            {brand.name}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Taschen Category - Similar to Clothing (MENS, WOMENS, REISEN) */}
                          {isTaschenCategory && (
                            <div className="grid grid-cols-3 gap-8">
                              {hoveredCategory.subItems?.map((subItem, subIndex) => (
                                <div key={subItem.id} className={`space-y-0 relative ${subIndex > 0 ? 'pl-8 border-l border-white/10' : ''}`}>
                                  <h3 className="text-xs font-bold text-gray-200 mb-4 pb-2 border-b border-white/10">
                                    {subItem.name}
                                  </h3>
                                  {subItem.brands && subItem.brands.length > 0 ? (
                                    <ul className="space-y-0">
                                      {subItem.brands.map((brand, idx) => (
                                        <li key={brand.id} className={idx > 0 ? "border-t border-white/10" : ""}>
                                          <button
                                            onClick={() => {
                                              triggerHaptic('light');
                                              onSelectCategory(hoveredCategory.id);
                                              filterByBrand?.(brand.slug);
                                              setHoveredCategoryId(null);
                                              setMegaMenuOpen(false);
                                            }}
                                            className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                          >
                                            {brand.name}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : subItem.items && subItem.items.length > 0 ? (
                                    <ul className="space-y-0">
                                      {subItem.items.map((item, itemIndex) => (
                                        <li key={itemIndex} className={itemIndex > 0 ? "border-t border-white/10" : ""}>
                                          <button
                                            onClick={() => {
                                              triggerHaptic('light');
                                              onSelectCategory(hoveredCategory.id);
                                              setHoveredCategoryId(null);
                                              setMegaMenuOpen(false);
                                            }}
                                            className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                          >
                                            {item}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Other Categories - Standard Layout */}
                          {!isSneakerCategory && !isClothingCategory && !isAccessoriesCategory && !isTaschenCategory && (() => {
                            // Collect all columns (brands or items)
                            const allColumns: Array<{ type: 'brand' | 'item'; data: any; index: number }> = [];
                            hoveredCategory.subItems?.forEach(subItem => {
                              if (subItem.brands && subItem.brands.length > 0) {
                                subItem.brands.forEach((brand) => {
                                  allColumns.push({ type: 'brand', data: { brand, subItem }, index: allColumns.length });
                                });
                              } else if (subItem.items && subItem.items.length > 0) {
                                allColumns.push({ type: 'item', data: { subItem }, index: allColumns.length });
                              }
                            });
                            
                            const gridCols = allColumns.length <= 4 ? 'grid-cols-4' : allColumns.length <= 5 ? 'grid-cols-5' : 'grid-cols-6';
                            
                            return (
                              <div className={`grid ${gridCols} gap-8`}>
                                {allColumns.map((column) => {
                                  if (column.type === 'brand') {
                                    const { brand, subItem } = column.data;
                                    if (brand.series && brand.series.length > 0) {
                                      return (
                                        <div key={brand.id} className={`space-y-0 relative ${column.index > 0 ? 'pl-8 border-l border-white/10' : ''}`}>
                                            <h3 className="text-xs font-bold text-gray-200 mb-4 pb-2 border-b border-white/10">
                                              {brand.name}
                                            </h3>
                                            <ul className="space-y-0">
                                              {brand.series.map((series: any, idx: number) => (
                                                <li key={series.id} className={idx > 0 ? "border-t border-white/10" : ""}>
                                                  <button
                                                    onClick={() => {
                                                      triggerHaptic('light');
                                                      onSelectCategory(hoveredCategory.id);
                                                    }}
                                                    className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                                  >
                                                    {series.name}
                                                  </button>
                                                </li>
                                              ))}
                                            </ul>
                                        </div>
                                      );
                                    }
                                    return (
                                        <div key={brand.id} className={`space-y-0 relative ${column.index > 0 ? 'pl-8 border-l border-white/10' : ''}`}>
                                          <h3 className="text-xs font-bold text-gray-200 mb-4 pb-2 border-b border-white/10">
                                            {subItem.name}
                                          </h3>
                                          <ul className="space-y-0">
                                            <li>
                                              <button
                                                onClick={() => {
                                                  triggerHaptic('light');
                                                  onSelectCategory(hoveredCategory.id);
                                                  filterByBrand?.(brand.slug);
                                                  setHoveredCategoryId(null);
                                                  setMegaMenuOpen(false);
                                                }}
                                                className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                              >
                                                {brand.name}
                                              </button>
                                            </li>
                                          </ul>
                                      </div>
                                    );
                                  }
                                  // type === 'item'
                                  const { subItem } = column.data;
                                  return (
                                    <div key={subItem.id} className={`space-y-0 relative ${column.index > 0 ? 'pl-8 border-l border-white/10' : ''}`}>
                                      <h3 className="text-xs font-bold text-gray-200 mb-4 pb-2 border-b border-white/10">
                                        {subItem.name}
                                      </h3>
                                      <ul className="space-y-0">
                                        {subItem.items.map((item: string, itemIndex: number) => (
                                          <li key={itemIndex} className={itemIndex > 0 ? "border-t border-white/10" : ""}>
                                            <button
                                              onClick={() => {
                                                triggerHaptic('light');
                                                onSelectCategory(hoveredCategory.id);
                                              }}
                                              className="text-xs text-gray-400 hover:text-white transition-colors duration-200 text-left w-full py-3 uppercase tracking-wide"
                                            >
                                              {item}
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                                        </div>
                                      </motion.div>
                  )}
                </div>
              );
            })}

            {/* Mobile Navigation */}
            {isMobile && (
              <>
                <motion.button
                  ref={isAllActive ? activeRef : undefined}
                  onClick={() => handleCategoryClick(null)}
                  onMouseEnter={() => handleCategoryHover(null)}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    isAllActive
                      ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                      : "text-gray-400 hover:text-white border border-transparent hover:border-white/10"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-base">⭐</span>
                  <span>Alle</span>
                </motion.button>

                {categories.map((category, index) => {
                  const isActive = category.id === activeCategoryId;
                  const hasSubItems = category.subItems && category.subItems.length > 0;

                  return (
                    <motion.button
                      key={category.id}
                      ref={isActive ? activeRef : undefined}
                      onClick={() => handleCategoryClick(category.id)}
                      onMouseEnter={() => handleCategoryHover(category.id)}
                      className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                        isActive
                          ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                          : "text-gray-400 hover:text-white border border-transparent hover:border-white/10"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <span className="text-base">{category.icon}</span>
                      <span>{category.name}</span>
                      {isActive && (
                        <motion.div
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-yellow-400 rounded-full"
                          layoutId="activeIndicatorMobile"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </nav>
    );
  }
);

CategoryNavSuuupply.displayName = "CategoryNavSuuupply";
