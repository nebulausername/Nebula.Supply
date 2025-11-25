import { memo, useState, useCallback, useMemo } from "react";
import type { Category } from "@nebula/shared";
import { Search, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";

interface MobileSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const MobileSideDrawer = memo(
  ({
    isOpen,
    onClose,
    categories,
    activeCategoryId,
    onSelectCategory,
    searchQuery = "",
    onSearchChange,
  }: MobileSideDrawerProps) => {
    const { triggerHaptic } = useEnhancedTouch();
    const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState(searchQuery);

    // Handle search
    const handleSearchChange = useCallback((value: string) => {
      setSearchTerm(value);
      onSearchChange?.(value);
    }, [onSearchChange]);

    // Toggle category expansion
    const toggleCategory = useCallback((categoryId: string) => {
      triggerHaptic('light');
      setExpandedCategoryId(prev => prev === categoryId ? null : categoryId);
    }, [triggerHaptic]);

    // Handle category selection
    const handleCategorySelect = useCallback((categoryId: string | null) => {
      triggerHaptic('medium');
      onSelectCategory(categoryId);
      onClose();
      setExpandedCategoryId(null);
    }, [onSelectCategory, onClose, triggerHaptic]);

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
      if (!searchTerm.trim()) return categories;
      const term = searchTerm.toLowerCase();
      return categories.filter(cat =>
        cat.name.toLowerCase().includes(term) ||
        cat.description?.toLowerCase().includes(term) ||
        cat.subItems?.some(subItem =>
          subItem.name.toLowerCase().includes(term) ||
          subItem.brands?.some(brand =>
            brand.name.toLowerCase().includes(term) ||
            brand.series?.some(series => series.name.toLowerCase().includes(term))
          ) ||
          subItem.items?.some(item => item.toLowerCase().includes(term))
        )
      );
    }, [categories, searchTerm]);

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999]"
          onClick={onClose}
        />

        {/* Side Drawer */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white z-[1000] shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {expandedCategoryId ? (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setExpandedCategoryId(null);
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm font-medium uppercase tracking-wide">
                  {categories.find(c => c.id === expandedCategoryId)?.name || 'KATEGORIE'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  aria-label="Schließen"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-black">
                  Kategorien
                </h2>
              </div>
            )}
            {expandedCategoryId && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Schließen"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Suche..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          {/* Categories List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!expandedCategoryId ? (
                // Main categories view
                <motion.div
                  key="main-categories"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="py-4"
                >
                  {filteredCategories.map((category) => {
                    const isActive = category.id === activeCategoryId;
                    const hasSubItems = category.subItems && category.subItems.length > 0;

                    return (
                      <div key={category.id}>
                        <button
                          onClick={() => {
                            if (hasSubItems) {
                              toggleCategory(category.id);
                            } else {
                              handleCategorySelect(category.id);
                            }
                          }}
                          className={`w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                            isActive ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{category.icon}</span>
                            <span className="text-sm font-medium text-black">{category.name}</span>
                          </div>
                          {hasSubItems && (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                // Expanded category view (sub-items)
                <motion.div
                  key={`category-${expandedCategoryId}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="py-4"
                >
                  {(() => {
                    const category = categories.find(c => c.id === expandedCategoryId);
                    if (!category?.subItems) return null;

                    return category.subItems.map((subItem) => {
                      // If subItem has brands (3-level structure)
                      if (subItem.brands && subItem.brands.length > 0) {
                        return subItem.brands.map((brand) => {
                          // Brand as heading, series as items
                          if (brand.series && brand.series.length > 0) {
                            return (
                              <div key={brand.id} className="mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-3 px-6">
                                  {brand.name}
                                </h3>
                                <ul className="space-y-1">
                                  {brand.series.map((series) => (
                                    <li key={series.id}>
                                      <button
                                        onClick={() => handleCategorySelect(category.id)}
                                        className="w-full text-left px-6 py-2.5 text-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                                      >
                                        {series.name}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          // No series, show brand as item
                          return (
                            <div key={brand.id} className="mb-6">
                              <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-3 px-6">
                                {subItem.name}
                              </h3>
                              <ul className="space-y-1">
                                <li>
                                  <button
                                    onClick={() => handleCategorySelect(category.id)}
                                    className="w-full text-left px-6 py-2.5 text-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                                  >
                                    {brand.name}
                                  </button>
                                </li>
                              </ul>
                            </div>
                          );
                        });
                      }
                      // Legacy 2-level structure (items array)
                      if (subItem.items && subItem.items.length > 0) {
                        return (
                          <div key={subItem.id} className="mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-black mb-3 px-6">
                              {subItem.name}
                            </h3>
                            <ul className="space-y-1">
                              {subItem.items.map((item, itemIndex) => (
                                <li key={itemIndex}>
                                  <button
                                    onClick={() => handleCategorySelect(category.id)}
                                    className="w-full text-left px-6 py-2.5 text-sm text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                                  >
                                    {item}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return null;
                    });
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer - Optional: Add login link */}
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              ANMELDEN
            </button>
          </div>
        </motion.div>
      </>
    );
  }
);

MobileSideDrawer.displayName = "MobileSideDrawer";

