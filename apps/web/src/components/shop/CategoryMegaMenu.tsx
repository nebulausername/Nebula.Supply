import { memo, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Category, CategoryBrand } from "@nebula/shared";
import { ChevronDown } from "lucide-react";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMagneticHover } from "../../hooks/useMagneticHover";
import { getCategoryDesign, animationConfig } from "../../utils/categoryDesignSystem";
import { getBrandIcon } from "../../utils/brandIcons";
import { CategoryIcon } from "../../utils/categoryIcons";
import { motion, AnimatePresence } from "framer-motion";
import "../../styles/category-menu-animations.css";

interface CategoryMegaMenuProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  products?: Array<{ categoryId: string }>;
}

export const CategoryMegaMenu = memo(
  ({ categories, activeCategoryId, onSelectCategory, products = [] }: CategoryMegaMenuProps) => {
    const navigate = useNavigate();
    // Performance: Memoize product counts
    const productCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      products.forEach(p => {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      });
      return counts;
    }, [products]);
    const { triggerHaptic } = useEnhancedTouch();
    const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
    const [hoveredBrandId, setHoveredBrandId] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [focusedCategoryIndex, setFocusedCategoryIndex] = useState<number>(-1);
    const [focusedSubItemIndex, setFocusedSubItemIndex] = useState<{ categoryIndex: number; subItemIndex: number } | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const categoryButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const subItemButtonsRef = useRef<(HTMLButtonElement | null)[][]>([]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setHoveredCategoryId(null);
          setIsDropdownOpen(false);
          setFocusedCategoryIndex(-1);
          setFocusedSubItemIndex(null);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Memoize categories for performance
    const categoriesMemo = useMemo(() => categories, [categories]);

    

    const scrollLeft = useCallback(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }, []);
    const scrollRight = useCallback(() => {
      if (!scrollRef.current) return;
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }, []);

    // Handle hover with optimized debounce for better UX and performance
    const handleMouseEnter = useCallback((categoryId: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Immediate haptic feedback
      triggerHaptic('light');
      // Small delay for smoother transitions (debounced)
      const hoverTimeout = setTimeout(() => {
        setHoveredCategoryId(categoryId);
        setIsDropdownOpen(true);
      }, 50); // Reduced delay for better responsiveness
      timeoutRef.current = hoverTimeout;
    }, [triggerHaptic]);

    const handleMouseLeave = useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      timeoutRef.current = setTimeout(() => {
        setHoveredCategoryId(null);
        setIsDropdownOpen(false);
      }, 150); // Reduced delay for better responsiveness
    }, []);

    const handleCategoryClick = useCallback((categoryId: string | null) => {
      triggerHaptic('medium');
      onSelectCategory(categoryId);
      setHoveredCategoryId(null);
      setIsDropdownOpen(false);
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, [onSelectCategory, triggerHaptic]);

    const handleSubItemClick = useCallback((categoryId: string, subItemId: string) => {
      triggerHaptic('light');
      // For now, just select the main category
      // Could be extended to filter by sub-item in the future
      onSelectCategory(categoryId);
      setHoveredCategoryId(null);
      setIsDropdownOpen(false);
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, [onSelectCategory, triggerHaptic]);

    // 3-Level navigation handlers
    const handleBrandClick = useCallback((categorySlug: string, brandSlug: string) => {
      triggerHaptic('medium');
      navigate(`/shop/${categorySlug}/${brandSlug}`);
      setHoveredCategoryId(null);
      setHoveredBrandId(null);
      setIsDropdownOpen(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, [navigate, triggerHaptic]);

    const handleSeriesClick = useCallback((categorySlug: string, brandSlug: string, seriesSlug: string) => {
      triggerHaptic('medium');
      navigate(`/shop/${categorySlug}/${brandSlug}/${seriesSlug}`);
      setHoveredCategoryId(null);
      setHoveredBrandId(null);
      setIsDropdownOpen(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }, [navigate, triggerHaptic]);

    // Helper to get product count - Optimized with memoization
    const getProductCount = useCallback((categoryId: string | null): number => {
      if (!products.length) return 0;
      if (categoryId === null) return products.length;
      return productCounts[categoryId] || 0;
    }, [products.length, productCounts]);

    // Keyboard shortcuts: Numbers 1-9 jump to categories, 0 -> All
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.altKey || e.metaKey || e.ctrlKey) return;
        const key = e.key;
        if (key === '0') {
          handleCategoryClick(null);
        }
        const num = parseInt(key, 10);
        if (!isNaN(num) && num >= 1 && num <= 9) {
          const targetIdx = num - 1;
          const target = categoriesMemo[targetIdx];
          if (target) {
            handleCategoryClick(target.id);
            // ensure visibility in scroll area
            const container = scrollRef.current;
            const btn = categoryButtonsRef.current[targetIdx];
            if (container && btn) {
              const cRect = container.getBoundingClientRect();
              const bRect = btn.getBoundingClientRect();
              if (bRect.left < cRect.left) container.scrollBy({ left: bRect.left - cRect.left - 24, behavior: 'smooth' });
              if (bRect.right > cRect.right) container.scrollBy({ left: bRect.right - cRect.right + 24, behavior: 'smooth' });
            }
          }
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [categoriesMemo, handleCategoryClick]);

    return (
      <nav
        ref={menuRef}
        className="hidden lg:flex justify-center items-center py-5 bg-gradient-to-b from-black/98 via-black/95 to-black/98 backdrop-blur-[40px] border-b border-white/30 sticky top-0 z-40 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)]"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 80px rgba(16, 185, 129, 0.1)',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.98) 100%), radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        }}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setHoveredCategoryId(null);
            setIsDropdownOpen(false);
            setFocusedCategoryIndex(-1);
          }
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const dir = e.key === 'ArrowRight' ? 1 : -1;
            const total = categoriesMemo.length;
            if (total === 0) return;
            const next = (Math.max(-1, focusedCategoryIndex) + dir + total) % total;
            const btn = categoryButtonsRef.current[next];
            if (btn) {
              btn.focus();
              setFocusedCategoryIndex(next);
            }
          }
        }}
        role="menubar"
        aria-label="Hauptnavigation Kategorien"
      >
        <div className="flex items-center gap-3 max-w-7xl w-full px-6">
          {/* All Categories Button - Premium Enhanced Design */}
          <motion.button
            ref={(el) => {
              categoryButtonsRef.current[-1] = el;
            }}
            onClick={() => handleCategoryClick(null)}
            onMouseEnter={() => handleMouseEnter('all')}
            onFocus={() => setFocusedCategoryIndex(-1)}
            className={`relative flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-sm font-extrabold transition-all duration-300 uppercase focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black group overflow-hidden backdrop-blur-xl ${
              activeCategoryId === null
                ? 'text-yellow-400 bg-gradient-to-br from-yellow-500/25 via-yellow-500/20 to-yellow-500/30 border-2 border-yellow-500/50 shadow-[0_8px_32px_rgba(234,179,8,0.3)] scale-105'
                : 'text-muted hover:text-yellow-300 hover:bg-gradient-to-br hover:from-yellow-500/15 hover:via-yellow-500/10 hover:to-yellow-500/15 hover:border-yellow-500/40 border-2 border-transparent hover:scale-105 hover:shadow-[0_4px_20px_rgba(234,179,8,0.2)]'
            }`}
            role="menuitem"
            aria-label="Alle Kategorien anzeigen"
            aria-current={activeCategoryId === null ? 'page' : undefined}
            whileHover={{ scale: 1.08, y: -3, rotateZ: -1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.1em',
              textShadow: activeCategoryId === null ? '0 0 20px rgba(234, 179, 8, 0.5)' : 'none',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Shimmer Effect */}
            {activeCategoryId === null && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
            )}
            
            <div className="relative z-10 flex items-center gap-3">
              <motion.span 
                className="text-xl drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]"
                animate={activeCategoryId === null ? { 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.2, 1]
                } : {}}
                transition={{ duration: 2, repeat: activeCategoryId === null ? Infinity : 0, repeatDelay: 3 }}
              >
                ⭐
              </motion.span>
              <span style={{ fontWeight: 900, fontSize: '0.875rem' }}>Alle</span>
              <motion.span 
                className="text-xs font-bold opacity-90 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {getProductCount(null)}
              </motion.span>
            </div>
            
            {/* Active Indicator - Enhanced */}
            {activeCategoryId === null && (
              <motion.div 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </motion.button>

          {/* Divider */}
          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Scroll Controls */}
          <button
            onClick={scrollLeft}
            aria-label="Scroll links"
            className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-xl border border-white/10 text-muted hover:text-white hover:bg-white/5 transition scroll-arrow"
          >
            ‹
          </button>

          {/* Main Categories - horizontally scrollable */}
          <div ref={scrollRef} className="relative flex-1 overflow-x-auto no-scrollbar">
            {/* Edge glow overlays */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-black/80 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-black/80 to-transparent" />
            <div className="flex items-center gap-3 pr-6">
            {categoriesMemo.map((category, index) => {
            const isActive = category.id === activeCategoryId;
            const isHovered = hoveredCategoryId === category.id;
            const hasSubItems = category.subItems && category.subItems.length > 0;
            const design = getCategoryDesign(category.id);
            
            // Get sub-items (cannot use hooks inside map, so direct access)
            const subItems = category.subItems || [];

            return (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => hasSubItems && handleMouseEnter(category.id)}
              >
                <motion.button
                  ref={(el) => {
                    categoryButtonsRef.current[index] = el;
                  }}
                  onClick={(e) => {
                    handleCategoryClick(category.id);
                  }}
                  onFocus={() => setFocusedCategoryIndex(index)}
                  className={`relative flex items-center gap-3 px-7 py-3.5 rounded-2xl text-sm font-extrabold transition-all duration-300 uppercase group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black overflow-hidden border-2 backdrop-blur-xl chip-btn ${
                    isActive
                      ? `${design.accentColor} ${design.backgroundTint} ${design.borderColor} shadow-[0_8px_32px_rgba(16,185,129,0.4)] scale-105`
                      : `text-muted hover:text-white border-transparent hover:${design.borderColor.replace('border-', 'border-')} ${design.neumorphismClass || 'neumorphism-soft'} hover:scale-105 hover:shadow-lg hover:backdrop-blur-xl`
                  }`}
                  role="menuitem"
                  aria-label={`${category.name} Kategorie`}
                  aria-haspopup={hasSubItems ? 'true' : undefined}
                  aria-expanded={hasSubItems && isDropdownOpen && isHovered ? 'true' : 'false'}
                  aria-current={isActive ? 'page' : undefined}
                  whileHover={{ scale: 1.08, y: -3, rotateZ: -1, z: 10 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '0.08em',
                    fontWeight: 900,
                    textShadow: isActive ? `0 0 20px ${design.accentColor.includes('purple') ? 'rgba(168, 85, 247, 0.5)' : design.accentColor.includes('blue') ? 'rgba(59, 130, 246, 0.5)' : 'rgba(16, 185, 129, 0.5)'}` : 'none',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Premium Shimmer Effect for Featured Categories */}
                  {category.featured && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '100%' }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    />
                  )}
                  
                  {/* Icon - Premium Display */}
                  <motion.div 
                    className="transition-transform duration-300"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                  >
                    <CategoryIcon 
                      categoryId={category.id} 
                      size={28}
                      animated={true}
                      showColor={true}
                    />
                  </motion.div>
                  
                  <div className="relative z-10 flex items-center gap-2.5">
                    <span className="hidden xl:inline" style={{ fontSize: '0.875rem', fontWeight: 900 }}>{category.name}</span>
                    {getProductCount(category.id) > 0 && (
                      <motion.span 
                        className="text-xs font-bold opacity-90 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm chip-count"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.9 }}
                        transition={{ delay: 0.3 + index * 0.03, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {getProductCount(category.id)}
                      </motion.span>
                    )}
                    {category.featured && (
                      <motion.span 
                        className="px-2 py-0.5 text-[9px] font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-full uppercase tracking-wide shadow-lg chip-featured"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                      >
                        FEATURED
                      </motion.span>
                    )}
                  </div>
                  
                  {hasSubItems && (
                    <motion.div
                      animate={{ rotate: isHovered ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Active Indicator - Enhanced with Animation */}
                  {isActive && (
                    <motion.div 
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 ${design.borderColor.replace('border-', 'bg-')} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: '64px' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  
                  {/* Premium Hover Glow Effect */}
                  {(isActive || isHovered) && (
                    <>
                      <motion.div 
                        className={`absolute -inset-2 ${design.backgroundTint} blur-2xl opacity-60 rounded-2xl -z-10`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isActive ? 0.6 : 0.3 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="absolute -inset-3 bg-black/20 blur-3xl opacity-40 -z-20" />
                    </>
                  )}
                </motion.button>

                {/* Mega Dropdown Menu - Premium Design */}
                {hasSubItems && (isHovered || (isDropdownOpen && focusedCategoryIndex === index)) && (
                  <motion.div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[800px] max-w-[90vw] bg-gradient-to-br from-black/98 via-black/95 to-black/98 backdrop-blur-[40px] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-white/30 overflow-hidden z-50 parallax-container"
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                    style={{ 
                      animation: 'fadeInDown 0.3s ease-out',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 120px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    }}
                    onMouseEnter={() => handleMouseEnter(category.id)}
                    onMouseMove={(e) => {
                      // Parallax Effect
                      const rect = e.currentTarget.getBoundingClientRect();
                      const centerX = rect.left + rect.width / 2;
                      const centerY = rect.top + rect.height / 2;
                      const deltaX = (e.clientX - centerX) * 0.02;
                      const deltaY = (e.clientY - centerY) * 0.02;
                      e.currentTarget.style.transform = `translate(-50%, 0) translate3d(${deltaX}px, ${deltaY}px, 0)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                      handleMouseLeave();
                    }}
                    role="menu"
                    aria-label={`${category.name} Untermenü`}
                  >
                    {/* Category-specific Tint with Animated Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${design.gradient} pointer-events-none animated-gradient`} />
                    
                    {/* 3D Depth Effect */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)',
                      transform: 'translateZ(0)',
                    }} />
                    
                    {/* Dropdown Arrow with Category Color */}
                    <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black/95 rotate-45 border-l border-t ${design.borderColor} shadow-lg`} />
                    
                    {/* Header Section - Premium Enhanced */}
                    <div className="relative z-10 p-6 border-b border-white/10 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className={`p-4 rounded-2xl ${design.backgroundTint} border-2 ${design.borderColor} shadow-lg`}
                          initial={{ scale: 0.8, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <CategoryIcon 
                            categoryId={category.id} 
                            size={40}
                            animated={true}
                            showColor={true}
                          />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-white tracking-tight leading-tight" style={{
                              letterSpacing: '-0.02em',
                              fontWeight: 700,
                            }}>{category.name}</h3>
                            {category.featured && (
                              <span className="px-2 py-0.5 text-[9px] font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-full uppercase tracking-wide shadow-sm">
                                FEATURED
                              </span>
                            )}
                            {getProductCount(category.id) > 0 && (
                              <span className="text-xs font-medium text-muted/80">
                                {getProductCount(category.id)} Produkte
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted leading-relaxed" style={{
                            letterSpacing: '0.01em',
                            lineHeight: '1.5',
                          }}>{category.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dropdown Content with 3-Level Support */}
                    <div className="p-8 relative z-10 max-h-[600px] overflow-y-auto scrollbar-hide" ref={(el) => {
                      // Add scroll indicator if content is scrollable
                      if (el) {
                        const checkScroll = () => {
                          const hasScroll = el.scrollHeight > el.clientHeight;
                          let indicator = el.querySelector('.scroll-indicator') as HTMLElement;
                          if (hasScroll && !indicator) {
                            indicator = document.createElement('div');
                            indicator.className = 'scroll-indicator';
                            el.appendChild(indicator);
                          } else if (!hasScroll && indicator) {
                            indicator.remove();
                          }
                        };
                        checkScroll();
                        el.addEventListener('scroll', checkScroll);
                        const resizeObserver = new ResizeObserver(checkScroll);
                        resizeObserver.observe(el);
                        return () => {
                          el.removeEventListener('scroll', checkScroll);
                          resizeObserver.disconnect();
                        };
                      }
                    }}>
                      {/* Check if we have 3-level structure (brands with series) */}
                      {subItems.some(si => si.brands && si.brands.length > 0) ? (
                        // 3-Level Layout: Brands with Series
                        <div className="grid grid-cols-3 gap-8">
                          {subItems.map((subItem, subIndex) => (
                            subItem.brands && subItem.brands.length > 0 ? (
                              <div
                                key={subItem.id}
                                className="opacity-0 translate-y-2"
                                style={{ 
                                  animation: `fadeInUp 0.3s ease-out ${subIndex * animationConfig.staggerDelay}ms forwards`
                                }}
                              >
                                <h3 className={`text-xs font-bold ${design.accentColor} mb-4 uppercase tracking-widest border-b ${design.borderColor} pb-3`} style={{
                                  letterSpacing: '0.15em',
                                  fontWeight: 800,
                                  lineHeight: '1.4',
                                }}>
                                  {subItem.name}
                                </h3>
                                <div className="space-y-4" role="group" aria-label={subItem.name}>
                                  {subItem.brands.map((brand, brandIndex) => (
                                    <div 
                                      key={brand.id}
                                      className="relative"
                                      onMouseEnter={() => setHoveredBrandId(brand.id)}
                                      onMouseLeave={() => setHoveredBrandId(null)}
                                    >
                                      <button
                                        onClick={() => handleBrandClick(category.slug, brand.slug)}
                                        className={`text-sm font-bold text-white hover:${design.accentColor.replace('text-', 'text-')} transition-all duration-200 text-left w-full py-2 mb-2 group`}
                                        role="menuitem"
                                        aria-label={`${brand.name} anzeigen`}
                                      >
                                        <span className="flex items-center gap-2">
                                          {brand.icon && <span className="text-base">{getBrandIcon(brand.name)}</span>}
                                          <span>{brand.name}</span>
                                          {brand.series && brand.series.length > 0 && (
                                            <ChevronDown className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                          )}
                                        </span>
                                      </button>
                                      {/* Series (Level 3) - appears on hover */}
                                      {brand.series && brand.series.length > 0 && hoveredBrandId === brand.id && (
                                        <motion.div
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: -10 }}
                                          className="absolute left-full top-0 ml-4 p-4 bg-black/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-xl min-w-[200px] z-50"
                                        >
                                          <div className="space-y-1">
                                            {brand.series.map((series) => (
                                              <button
                                                key={series.id}
                                                onClick={() => handleSeriesClick(category.slug, brand.slug, series.slug)}
                                                className="text-xs text-muted hover:text-white w-full text-left py-2 px-3 rounded-lg hover:bg-white/5 transition-all"
                                                role="menuitem"
                                                aria-label={`${series.name} anzeigen`}
                                              >
                                                {series.name}
                                              </button>
                                            ))}
                                          </div>
                                        </motion.div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          ))}
                        </div>
                      ) : (
                        // Legacy 2-Level Layout (items array)
                        <div className="space-y-8">
                          {subItems.map((subItem, index) => (
                            <div
                              key={subItem.id}
                              className="opacity-0 -translate-x-4 border-b border-white/10 last:border-b-0 pb-8 last:pb-0"
                              style={{ 
                                animation: `fadeInLeft 0.4s ease-out ${index * (animationConfig.staggerDelay + 10)}ms forwards`
                              }}
                            >
                              <h3 className={`text-base font-bold ${design.accentColor} mb-5 uppercase tracking-wider border-b ${design.borderColor} pb-3 flex items-center gap-3`} style={{
                                letterSpacing: '0.1em',
                                fontWeight: 700,
                                lineHeight: '1.5',
                              }}>
                                <span className="text-xl">{getBrandIcon(subItem.name)}</span>
                                {subItem.name}
                              </h3>
                              {subItem.items && subItem.items.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                  {subItem.items.map((item, itemIndex) => (
                                    <button
                                      key={itemIndex}
                                      onClick={() => handleSubItemClick(category.id, subItem.id)}
                                      className={`text-sm text-muted hover:font-medium transition-all duration-200 text-left w-full py-3 px-4 rounded-xl ${design.backgroundTint} border border-transparent hover:shadow-lg hover:scale-[1.02] group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black`}
                                      role="menuitem"
                                      aria-label={`${item} auswählen`}
                                      style={{ transition: animationConfig.hoverTransition }}
                                      onMouseEnter={(e) => {
                                        const color = design.accentColor.includes('purple') ? 'rgb(196, 181, 253)' : design.accentColor.includes('blue') ? 'rgb(147, 197, 253)' : 'rgb(16, 185, 129)';
                                        e.currentTarget.style.color = color;
                                        e.currentTarget.style.borderColor = color + '40';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '';
                                        e.currentTarget.style.borderColor = '';
                                      }}
                                    >
                                      <span className="flex items-center gap-2.5">
                                        <span className="text-base">{getBrandIcon(item)}</span>
                                        <span className="flex-1">{item}</span>
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSubItemClick(category.id, subItem.id)}
                                  className={`w-full text-sm text-muted hover:font-medium transition-all duration-200 py-3 px-4 rounded-xl ${design.backgroundTint} border border-transparent hover:shadow-lg hover:scale-[1.02] group focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black`}
                                  role="menuitem"
                                  aria-label={`Alle ${subItem.name} anzeigen`}
                                  style={{ transition: animationConfig.hoverTransition }}
                                  onMouseEnter={(e) => {
                                    const color = design.accentColor.includes('purple') ? 'rgb(196, 181, 253)' : design.accentColor.includes('blue') ? 'rgb(147, 197, 253)' : 'rgb(16, 185, 129)';
                                    e.currentTarget.style.color = color;
                                    e.currentTarget.style.borderColor = color + '40';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '';
                                    e.currentTarget.style.borderColor = '';
                                  }}
                                >
                                  <span className="flex items-center gap-2.5">
                                    <span className="text-base">{getBrandIcon(subItem.name)}</span>
                                    <span>Alle {subItem.name} anzeigen</span>
                                  </span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </motion.div>
                )}
              </div>
            );
          })}
            </div>
          </div>

          <button
            onClick={scrollRight}
            aria-label="Scroll rechts"
            className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-xl border border-white/10 text-muted hover:text-white hover:bg-white/5 transition scroll-arrow"
          >
            ›
          </button>
        </div>
      </nav>
    );
  }
);

CategoryMegaMenu.displayName = "CategoryMegaMenu";

