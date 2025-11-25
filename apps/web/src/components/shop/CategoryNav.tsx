import { memo, useEffect, useRef, useState, useCallback } from "react";
import type { Category } from "@nebula/shared";
import { ChevronDown, X } from "lucide-react";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useSwipeGesture } from "../../hooks/useSwipeGesture";
import { getCategoryDesign, animationConfig } from "../../utils/categoryDesignSystem";
import { getBrandIcon } from "../../utils/brandIcons";
import { CategoryIcon } from "../../utils/categoryIcons";

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryNav = memo(
  ({ categories, activeCategoryId, onSelectCategory }: CategoryNavProps) => {
    // ⚠️ CRITICAL: All hooks must be called before any conditional returns!
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const activeRef = useRef<HTMLButtonElement | null>(null);
    const [openSubMenuId, setOpenSubMenuId] = useState<string | null>(null);
    const [bottomSheetHeight, setBottomSheetHeight] = useState<number>(75); // Percentage
    const { triggerHaptic } = useEnhancedTouch();
    const bottomSheetRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number>(0);
    const currentY = useRef<number>(0);
    
    // Swipe gesture for category navigation
    const categorySwipeRef = useSwipeGesture<HTMLDivElement>({
      onSwipe: (direction) => {
        if (direction === 'left' || direction === 'right') {
          const currentIndex = activeCategoryId === null 
            ? -1 
            : categories.findIndex(c => c.id === activeCategoryId);
          if (direction === 'right') {
            if (currentIndex > 0) {
              onSelectCategory(categories[currentIndex - 1].id);
            } else if (currentIndex === -1 && categories.length > 0) {
              onSelectCategory(categories[categories.length - 1].id);
            }
            triggerHaptic('light');
          } else if (direction === 'left') {
            if (currentIndex < categories.length - 1) {
              onSelectCategory(categories[currentIndex + 1].id);
            } else if (currentIndex === -1) {
              onSelectCategory(categories[0]?.id || null);
            }
            triggerHaptic('light');
          }
        }
      },
      threshold: 50,
      velocity: 0.3,
    });
    
    // Enhanced bottom sheet with snap points and drag
    useEffect(() => {
      if (!openSubMenuId || !bottomSheetRef.current) {
        setBottomSheetHeight(75); // Reset on close
        return;
      }
      
      const element = bottomSheetRef.current;
      
      const handleTouchStart = (e: TouchEvent) => {
        startY.current = e.touches[0].clientY;
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        currentY.current = e.touches[0].clientY;
        const deltaY = currentY.current - startY.current;
        if (deltaY > 0) {
          // Calculate new height based on drag
          const newHeight = Math.max(25, Math.min(100, 75 - (deltaY / window.innerHeight * 100)));
          setBottomSheetHeight(newHeight);
        }
      };
      
      const handleTouchEnd = () => {
        // Snap to nearest point
        const snapPoints = [25, 50, 75, 100];
        const nearest = snapPoints.reduce((prev, curr) => 
          Math.abs(curr - bottomSheetHeight) < Math.abs(prev - bottomSheetHeight) ? curr : prev
        );
        setBottomSheetHeight(nearest);
        
        // Close if dragged below 30%
        if (nearest <= 30) {
          triggerHaptic('medium');
          setOpenSubMenuId(null);
          setBottomSheetHeight(75);
        } else {
          triggerHaptic('light');
        }
      };
      
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });
      element.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }, [openSubMenuId, bottomSheetHeight, triggerHaptic]);
    
    // Swipe gesture handler for bottom sheet (swipe down to close)
    const handleBottomSheetSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
      if (direction === 'down' && openSubMenuId) {
        triggerHaptic('medium');
        setOpenSubMenuId(null);
        setBottomSheetHeight(75);
      }
    }, [openSubMenuId, triggerHaptic]);
    
    // Attach swipe handler to bottom sheet when it's open
    useEffect(() => {
      if (!openSubMenuId || !bottomSheetRef.current) return;
      
      const element = bottomSheetRef.current;
      let startY = 0;
      let currentY = 0;
      
      const handleTouchStart = (e: TouchEvent) => {
        startY = e.touches[0].clientY;
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        currentY = e.touches[0].clientY;
      };
      
      const handleTouchEnd = () => {
        const deltaY = currentY - startY;
        const deltaTime = Date.now();
        
        if (deltaY > 100 && Math.abs(deltaY) / 1000 > 0.3) {
          handleBottomSheetSwipe('down');
        }
      };
      
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: true });
      element.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }, [openSubMenuId, handleBottomSheetSwipe]);

    // Auto-scroll active chip into view on change (mobile UX) - Zentriert die aktive Kategorie
    useEffect(() => {
      // Only execute if categories are loaded and activeRef exists
      if (activeRef.current && scrollRef.current && categories && categories.length > 0) {
        const container = scrollRef.current;
        const chip = activeRef.current;
        const containerRect = container.getBoundingClientRect();
        const chipRect = chip.getBoundingClientRect();
        
        // Zentriere die aktive Kategorie im sichtbaren Bereich
        const chipCenter = chipRect.left - containerRect.left + chipRect.width / 2;
        const containerCenter = containerRect.width / 2;
        const scrollOffset = chipCenter - containerCenter + container.scrollLeft;
        
        container.scrollTo({ 
          left: scrollOffset, 
          behavior: "smooth" 
        });
      }
    }, [activeCategoryId, categories]);

    // Show loading state if categories are not loaded yet
    if (!categories) {
      return (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 animate-pulse rounded-full bg-white/5"
            />
          ))}
        </div>
      );
    }
    
    if (categories.length === 0) return null;

    const isAllActive = activeCategoryId === null;

    return (
      <div
        ref={(el) => {
          scrollRef.current = el;
          if (categorySwipeRef.current && el && categorySwipeRef.current !== el) {
            // Sync refs
            (categorySwipeRef as any).current = el;
          }
        }}
        className="sticky top-0 z-30 -mx-4 px-4 mb-4 flex gap-3 overflow-x-auto pb-3 pt-3 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        style={{ 
          WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)",
          maskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)",
          scrollPaddingLeft: '1rem',
          scrollPaddingRight: '1rem'
        }}
        aria-label="Kategorienavigation"
        role="tablist"
      >
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
        
        {/* All Categories Button - Premium Design with Yellow Starburst */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`snap-center relative flex items-center gap-2.5 whitespace-nowrap rounded-2xl border-2 px-6 py-3 text-sm font-bold transition-all duration-500 touch-target flex-shrink-0 group overflow-hidden ${
            isAllActive
              ? "border-yellow-500/60 bg-gradient-to-br from-yellow-500/25 via-yellow-500/20 to-yellow-500/30 text-yellow-400 shadow-[0_8px_32px_rgba(234,179,8,0.3)] scale-105 backdrop-blur-sm"
              : "border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/60 text-muted hover:border-yellow-500/50 hover:text-yellow-400 hover:bg-gradient-to-br hover:from-black/70 hover:via-black/60 hover:to-black/70 hover:shadow-[0_4px_16px_rgba(234,179,8,0.2)] hover:scale-[1.02] backdrop-blur-sm"
          }`}
          aria-selected={isAllActive}
          role="tab"
        >
          {/* Active glow effect */}
          {isAllActive && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-yellow-500/20 animate-pulse" />
              <div className="absolute -inset-1 bg-yellow-500/30 blur-xl opacity-50 animate-pulse" />
            </>
          )}
          
          {/* Content */}
          <span className={`relative z-10 text-2xl transition-transform duration-300 ${isAllActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            ⭐
          </span>
          <span className="relative z-10">Alle</span>
          
          {/* Active indicator - Green Dot */}
          {isAllActive && (
            <div className="relative z-10 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
              <div className="w-1.5 h-1.5 bg-accent rounded-full absolute" />
            </div>
          )}
          
          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>

        {/* Category Buttons - Premium Design */}
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          const hasSubItems = category.subItems && category.subItems.length > 0;
          const isSubMenuOpen = openSubMenuId === category.id;
          
          return (
            <div key={category.id} className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (hasSubItems) {
                    triggerHaptic('light');
                    setOpenSubMenuId(isSubMenuOpen ? null : category.id);
                  } else {
                    onSelectCategory(category.id);
                  }
                }}
                onTouchStart={(e) => {
                  // Touch feedback with ripple effect
                  e.currentTarget.style.transform = 'scale(0.97)';
                  triggerHaptic('light');
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = '';
                }}
                ref={isActive ? activeRef : undefined}
                className={`snap-center relative flex items-center gap-2.5 whitespace-nowrap rounded-2xl border-2 px-6 py-3 text-sm font-bold transition-all duration-500 touch-target flex-shrink-0 group overflow-hidden active:scale-95 ${
                  isActive
                    ? "border-accent/60 bg-gradient-to-br from-accent/25 via-accent/20 to-accent/30 text-accent shadow-[0_8px_32px_rgba(11,247,188,0.3)] scale-105 backdrop-blur-sm"
                    : `border-white/10 text-muted hover:border-accent/50 hover:text-accent hover:scale-[1.02] backdrop-blur-sm ${(() => {
                      const design = getCategoryDesign(category.id);
                      return design.neumorphismClass || 'neumorphism-soft';
                    })()}`
                }`}
                aria-selected={isActive}
                role="tab"
              >
                {/* Active glow effect */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 animate-pulse" />
                    <div className="absolute -inset-1 bg-accent/30 blur-xl opacity-50 animate-pulse" />
                  </>
                )}
                
                {/* Icon with animation - Using CategoryIcon component */}
                <div className="relative z-10">
                  <CategoryIcon 
                    categoryId={category.id} 
                    size={32}
                    animated={true}
                    showColor={true}
                    className="transition-all duration-300"
                  />
                </div>
                
                {/* Category name */}
                <span className="relative z-10 font-semibold">{category.name}</span>
                
                {/* Featured Badge */}
                {category.featured && (
                  <span className="relative z-10 px-2 py-0.5 text-[10px] font-bold bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                    FEATURED
                  </span>
                )}
                
                {/* Sub-Items Dot Indicator */}
                {hasSubItems && (
                  <>
                    <div className="relative z-10 w-1.5 h-1.5 bg-accent rounded-full" />
                    <ChevronDown
                      className={`relative z-10 h-3 w-3 transition-transform duration-300 ${
                        isSubMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div className="relative z-10 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                    <div className="w-1.5 h-1.5 bg-accent rounded-full absolute animate-pulse" />
                  </div>
                )}
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
              
              {/* Mobile Sub-Menu Bottom Sheet - Premium Redesign */}
              {hasSubItems && isSubMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]" onClick={() => setOpenSubMenuId(null)} style={{
                  boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.8)',
                }}>
                  <div
                    ref={bottomSheetRef}
                    className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black border-t-2 border-white/20 rounded-t-3xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      height: `${bottomSheetHeight}vh`,
                      maxHeight: '100vh',
                      boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 0, 0, 0.5)',
                      WebkitBackdropFilter: 'blur(20px)',
                      backdropFilter: 'blur(20px)',
                      transition: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'slideUp 0.4s ease-out',
                      transform: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'translateY(0)' : undefined,
                    }}
                  >
                    {/* Drag Handle */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/30 rounded-full cursor-grab active:cursor-grabbing" />
                    {/* Premium Header with Category Design */}
                    {(() => {
                      const design = getCategoryDesign(category.id);
                      return (
                        <div className={`relative p-6 border-b border-white/10 bg-gradient-to-br ${design.gradient} animated-gradient`}>
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`text-4xl p-4 rounded-2xl ${design.backgroundTint} border ${design.borderColor} shadow-lg`}>
                                {category.icon}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-white mb-1" style={{
                                  letterSpacing: '-0.02em',
                                  fontWeight: 700,
                                  lineHeight: '1.3',
                                }}>{category.name}</h3>
                                <p className="text-sm text-muted" style={{
                                  letterSpacing: '0.01em',
                                  lineHeight: '1.5',
                                }}>{category.description}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setOpenSubMenuId(null)}
                              className="rounded-full p-2.5 hover:bg-white/10 transition-colors border border-white/10"
                            >
                              <X className="h-5 w-5 text-white" />
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Sub-Items List - Card Layout */}
                    <div className="overflow-y-auto max-h-[calc(75vh-120px)] p-6 space-y-6">
                      {category.subItems?.map((subItem, index) => {
                        const design = getCategoryDesign(category.id);
                        return (
                          <div
                            key={subItem.id}
                            className="opacity-0 animate-[fadeInLeft_0.4s_ease-out_forwards]"
                            style={{ animationDelay: `${index * animationConfig.staggerDelay}ms` }}
                          >
                            <h4 className={`text-base font-bold ${design.accentColor} mb-4 uppercase tracking-wider border-b ${design.borderColor} pb-3 flex items-center gap-3`}>
                              <span className="text-xl">{getBrandIcon(subItem.name)}</span>
                              {subItem.name}
                            </h4>
                            {subItem.items && subItem.items.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3">
                                {subItem.items.map((item, itemIndex) => (
                                <button
                                  key={itemIndex}
                                  onClick={() => {
                                    triggerHaptic('medium');
                                    onSelectCategory(category.id);
                                    setOpenSubMenuId(null);
                                  }}
                                  onTouchStart={(e) => {
                                    // Touch feedback
                                    e.currentTarget.style.transform = 'scale(0.95)';
                                    triggerHaptic('light');
                                  }}
                                  onTouchEnd={(e) => {
                                    e.currentTarget.style.transform = '';
                                  }}
                                  className={`text-left px-4 py-3.5 rounded-xl border ${design.borderColor} ${design.backgroundTint} hover:bg-opacity-30 hover:border-opacity-60 active:scale-95 transition-all duration-200 text-sm text-muted group focus:outline-none focus:ring-2 focus:ring-accent touch-target`}
                                  style={{ 
                                    transition: animationConfig.hoverTransition,
                                    minHeight: '44px',
                                    minWidth: '44px',
                                  }}
                                  onMouseEnter={(e) => {
                                    const color = design.accentColor.includes('purple') ? 'rgb(196, 181, 253)' : design.accentColor.includes('blue') ? 'rgb(147, 197, 253)' : 'rgb(16, 185, 129)';
                                    e.currentTarget.style.color = color;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '';
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
                                onClick={() => {
                                  triggerHaptic('medium');
                                  onSelectCategory(category.id);
                                  setOpenSubMenuId(null);
                                }}
                                className={`w-full text-left px-4 py-3.5 rounded-xl border ${design.borderColor} ${design.backgroundTint} hover:bg-opacity-30 hover:border-opacity-60 transition-all duration-200 text-sm text-muted focus:outline-none focus:ring-2 focus:ring-accent`}
                                style={{ transition: animationConfig.hoverTransition }}
                                onMouseEnter={(e) => {
                                  const color = design.accentColor.includes('purple') ? 'rgb(196, 181, 253)' : design.accentColor.includes('blue') ? 'rgb(147, 197, 253)' : 'rgb(16, 185, 129)';
                                  e.currentTarget.style.color = color;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '';
                                }}
                              >
                                <span className="flex items-center gap-2.5">
                                  <span className="text-base">{getBrandIcon(subItem.name)}</span>
                                  <span>Alle {subItem.name} anzeigen</span>
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);
