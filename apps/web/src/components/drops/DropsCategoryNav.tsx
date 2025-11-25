import { memo, useEffect, useRef, useState } from "react";
import type { Category } from "@nebula/shared";
import { categories } from "@nebula/shared";
import { cn } from "../../utils/cn";

interface DropsCategoryNavProps {
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  dropCounts?: Record<string, number>;
}

export const DropsCategoryNav = memo(
  ({ activeCategoryId, onSelectCategory, dropCounts = {} }: DropsCategoryNavProps) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const activeRef = useRef<HTMLButtonElement | null>(null);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

    // Handle responsive breakpoint
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-scroll active category into view on mobile
    useEffect(() => {
      if (activeRef.current && scrollRef.current && isMobile) {
        const container = scrollRef.current;
        const button = activeRef.current;
        const containerRect = container.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();
        const offset = buttonRect.left - containerRect.left - 16;
        container.scrollTo({ left: container.scrollLeft + offset, behavior: "smooth" });
      }
    }, [activeCategoryId, isMobile]);

    // Sort categories: featured first, then by order
    const sortedCategories = [...categories].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.order - b.order;
    });

    const isAllActive = activeCategoryId === null;

    // Mobile: Horizontal scroll layout
    if (isMobile) {
      return (
        <div
          ref={scrollRef}
          className="sticky top-0 z-30 -mx-4 px-4 mb-4 flex gap-3 overflow-x-auto pb-3 pt-3 scrollbar-hide snap-x snap-mandatory"
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)",
            maskImage: "linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)"
          }}
          aria-label="Drops Kategorienavigation"
          role="tablist"
        >
          {/* Glowing background effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
          
          {/* All Categories Button */}
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            ref={isAllActive ? activeRef : undefined}
            className={cn(
              "snap-start relative flex items-center gap-2.5 whitespace-nowrap rounded-2xl border-2 px-5 py-3 text-sm font-bold transition-all duration-500 touch-target flex-shrink-0 group overflow-hidden min-h-[48px]",
              isAllActive
                ? "border-accent/60 bg-gradient-to-br from-accent/25 via-accent/20 to-accent/30 text-accent shadow-[0_8px_32px_rgba(11,247,188,0.3)] scale-105 backdrop-blur-sm"
                : "border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/60 text-muted hover:border-accent/50 hover:text-accent hover:bg-gradient-to-br hover:from-black/70 hover:via-black/60 hover:to-black/70 hover:shadow-[0_4px_16px_rgba(11,247,188,0.2)] hover:scale-[1.02] backdrop-blur-sm"
            )}
            aria-selected={isAllActive}
            role="tab"
          >
            {isAllActive && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 animate-pulse" />
                <div className="absolute -inset-1 bg-accent/30 blur-xl opacity-50 animate-pulse" />
              </>
            )}
            
            <span className={cn(
              "relative z-10 text-xl transition-transform duration-300",
              isAllActive ? 'scale-110' : 'group-hover:scale-110'
            )}>
              ⭐
            </span>
            <span className="relative z-10">Alle</span>
            
            {isAllActive && (
              <div className="relative z-10 flex items-center gap-1.5 ml-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                <div className="w-1.5 h-1.5 bg-accent rounded-full absolute" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </button>

          {/* Category Buttons */}
          {sortedCategories.map((category) => {
            const isActive = category.id === activeCategoryId;
            const count = dropCounts[category.id] ?? 0;
            
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                ref={isActive ? activeRef : undefined}
                className={cn(
                  "snap-start relative flex items-center gap-2.5 whitespace-nowrap rounded-2xl border-2 px-5 py-3 text-sm font-bold transition-all duration-500 touch-target flex-shrink-0 group overflow-hidden min-h-[48px]",
                  isActive
                    ? "border-accent/60 bg-gradient-to-br from-accent/25 via-accent/20 to-accent/30 text-accent shadow-[0_8px_32px_rgba(11,247,188,0.3)] scale-105 backdrop-blur-sm"
                    : "border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/60 text-muted hover:border-accent/50 hover:text-accent hover:bg-gradient-to-br hover:from-black/70 hover:via-black/60 hover:to-black/70 hover:shadow-[0_4px_16px_rgba(11,247,188,0.2)] hover:scale-[1.02] backdrop-blur-sm"
                )}
                aria-selected={isActive}
                role="tab"
              >
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 animate-pulse" />
                    <div className="absolute -inset-1 bg-accent/30 blur-xl opacity-50 animate-pulse" />
                  </>
                )}
                
                <span className={cn(
                  "relative z-10 text-xl transition-all duration-300",
                  isActive ? 'scale-110 rotate-6' : 'group-hover:scale-110 group-hover:rotate-6'
                )}>
                  {category.icon}
                </span>
                
                <span className="relative z-10 font-semibold">{category.name}</span>
                
                {count > 0 && (
                  <span className={cn(
                    "relative z-10 text-xs px-2 py-0.5 rounded-full font-semibold",
                    isActive ? 'bg-accent/20 text-accent' : 'bg-white/10 text-muted'
                  )}>
                    {count}
                  </span>
                )}
                
                {isActive && (
                  <div className="relative z-10 flex items-center gap-1.5 ml-1">
                    <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                    <div className="w-1.5 h-1.5 bg-accent rounded-full absolute animate-pulse" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
            );
          })}
        </div>
      );
    }

    // Desktop: Grid layout
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Kategorien</h3>
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300",
              isAllActive
                ? "bg-accent/20 text-accent border-2 border-accent/50"
                : "bg-white/5 text-muted hover:bg-white/10 hover:text-white border-2 border-transparent"
            )}
          >
            Alle anzeigen
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {sortedCategories.map((category) => {
            const isActive = category.id === activeCategoryId;
            const count = dropCounts[category.id] ?? 0;
            
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  "relative group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                  isActive
                    ? "border-accent/60 bg-gradient-to-br from-accent/25 via-accent/20 to-accent/30 text-accent shadow-[0_8px_32px_rgba(11,247,188,0.3)] scale-105 backdrop-blur-sm"
                    : "border-white/10 bg-gradient-to-br from-black/50 via-black/40 to-black/60 text-muted hover:border-accent/50 hover:text-accent hover:bg-gradient-to-br hover:from-black/70 hover:via-black/60 hover:to-black/70 hover:shadow-[0_4px_16px_rgba(11,247,188,0.2)] hover:scale-[1.02] backdrop-blur-sm"
                )}
                aria-selected={isActive}
                role="tab"
              >
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 animate-pulse" />
                    <div className="absolute -inset-1 bg-accent/30 blur-xl opacity-50 animate-pulse" />
                  </>
                )}
                
                <span className={cn(
                  "relative z-10 text-3xl transition-all duration-300",
                  isActive ? 'scale-110 rotate-6' : 'group-hover:scale-110 group-hover:rotate-6'
                )}>
                  {category.icon}
                </span>
                
                <div className="relative z-10 text-center">
                  <div className="font-bold text-sm">{category.name}</div>
                  {count > 0 && (
                    <div className={cn(
                      "text-xs mt-1",
                      isActive ? 'text-accent/80' : 'text-muted'
                    )}>
                      {count} Drops
                    </div>
                  )}
                </div>
                
                {isActive && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="w-2 h-2 bg-accent rounded-full animate-ping" />
                    <div className="w-1.5 h-1.5 bg-accent rounded-full absolute top-0.5 left-0.5 animate-pulse" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

DropsCategoryNav.displayName = 'DropsCategoryNav';
