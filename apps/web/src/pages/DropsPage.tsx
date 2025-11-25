import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import type { Drop } from "@nebula/shared";
import { RevolutionaryDropCard } from "../components/RevolutionaryDropCard";
import { useDropsStore, startMockFeed, stopMockFeed } from "../store/drops";
import { useShopStore } from "../store/shop";
import { EnhancedMobileDropModal } from "../components/EnhancedMobileDropModal";
import { HowDropsWorkSection } from "../components/drops/HowDropsWorkSection";
import { DropCountdown } from "../components/drops/DropCountdown";
import { useBotCommandHandler } from "../utils/botCommandHandler";
import { Search, Filter, SortAsc, SortDesc, Loader2, MapPin, Euro, X, Sparkles, Flame, Crown, Package, Zap, TrendingUp } from "lucide-react";
import { cn } from "../utils/cn";
import { CardSkeleton } from "../components/UI/SkeletonLoader";
 

export type FilterId = "all" | "free" | "limited" | "vip" | "standard";

type FilterConfig = {
  id: FilterId;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  predicate: (drop: Drop) => boolean;
};

const filterConfigs: FilterConfig[] = [
  {
    id: "all",
    label: "Alle",
    description: "Alle aktiven Drops – von kostenlosen Invites bis hin zu VIP-Only Releases.",
    icon: <Package className="h-4 w-4" />,
    color: "blue",
    predicate: () => true
  },
  {
    id: "free",
    label: "Kostenlos",
    description: "Gratis Drops für eingeladene Nutzer. Invite genügt, VIP-Rang ist optional.",
    icon: <Sparkles className="h-4 w-4" />,
    color: "green",
    predicate: (drop) => drop.access === "free"
  },
  {
    id: "limited",
    label: "Limitiert",
    description: "Begrenzte Batches mit Timer. Perfekt für Hype-Releases mit maximaler Nachfrage.",
    icon: <Flame className="h-4 w-4" />,
    color: "orange",
    predicate: (drop) => drop.access === "limited"
  },
  {
    id: "vip",
    label: "VIP",
    description: "Exklusive Drops für Comet-, Nova-, Supernova- und Galaxy-Ränge.",
    icon: <Crown className="h-4 w-4" />,
    color: "purple",
    predicate: (drop) => drop.access === "vip"
  },
  {
    id: "standard",
    label: "Standard",
    description: "Reguläre Shop-Drops – kein Invite erforderlich, sofort bestellbar.",
    icon: <Package className="h-4 w-4" />,
    color: "blue",
    predicate: (drop) => drop.access === "standard"
  }
];

interface DropsPageProps {
  defaultFilter?: FilterId;
  lockFilter?: boolean;
}

// 🎯 Advanced search and filtering types
type SortOption = "name" | "price" | "popularity" | "availability" | "newest";
type SearchResult = {
  id: string;
  name: string;
  relevance: number;
  matches: string[];
};

export const DropsPage = ({
  defaultFilter = "all",
  lockFilter = false
}: DropsPageProps) => {
  const drops = useDropsStore((state) => state.drops);
  const selectDrop = useDropsStore((state) => state.selectDrop);
  const loadingStates = useDropsStore((state) => state.loadingStates);
  const prefetchDropData = useDropsStore((state) => state.prefetchDropData);

  const [activeFilter, setActiveFilter] = useState<FilterId>(defaultFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDeliveryLocation, setSelectedDeliveryLocation] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const { executeCommand } = useBotCommandHandler();

 

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const debouncedSearch = useCallback((query: string) => {
    setIsSearching(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(query);
      setIsSearching(false);
    }, 300);
  }, []);

  // Smart search algorithm
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    drops.forEach(drop => {
      const matches: string[] = [];
      let relevance = 0;

      // Search in name (highest weight)
      if (drop.name.toLowerCase().includes(query)) {
        matches.push("name");
        relevance += 10;
      }

      // Search in variant labels
      drop.variants.forEach(variant => {
        if (variant.label.toLowerCase().includes(query)) {
          matches.push(`variant: ${variant.label}`);
          relevance += 5;
        }
        if (variant.flavor?.toLowerCase().includes(query)) {
          matches.push(`flavor: ${variant.flavor}`);
          relevance += 3;
        }
      });

      // Search in description/tags
      if (drop.badge?.toLowerCase().includes(query)) {
        matches.push(`badge: ${drop.badge}`);
        relevance += 2;
      }

      if (matches.length > 0) {
        results.push({
          id: drop.id,
          name: drop.name,
          relevance,
          matches
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  }, [drops, searchQuery]);

  // Enhanced sorting logic
  const filterConfig = useMemo(
    () => filterConfigs.find((filter) => filter.id === activeFilter) ?? filterConfigs[0],
    [activeFilter]
  );

  const sortedAndFilteredDrops = useMemo(() => {
    const predicate = filterConfig?.predicate ?? (() => true);
    let filtered = drops.filter((drop) => predicate(drop));

    // Category filtering removed (rollback to original behavior)

    if (searchQuery.trim()) {
      const searchDropIds = new Set(searchResults.map((result) => result.id));
      filtered = filtered.filter((drop) => searchDropIds.has(drop.id));
    }

    // Delivery location filter
    if (selectedDeliveryLocation !== "all") {
      filtered = filtered.filter((drop) => {
        return drop.variants.some((variant) => {
          if (!variant.originOptions || variant.originOptions.length === 0) return false;
          return variant.originOptions.some((origin) => {
            const originLabel = origin.label.toLowerCase();
            const locationFilter = selectedDeliveryLocation.toLowerCase();
            return originLabel.includes(locationFilter) || 
                   locationFilter.includes(originLabel);
          });
        });
      });
    }

    // Price filter
    if (minPrice !== "" || maxPrice !== "") {
      filtered = filtered.filter((drop) => {
        const minVariantPrice = Math.min(...drop.variants.map((v) => v.basePrice));
        const maxVariantPrice = Math.max(...drop.variants.map((v) => v.basePrice));
        
        const minFilter = minPrice !== "" ? Number(minPrice) : 0;
        const maxFilter = maxPrice !== "" ? Number(maxPrice) : Infinity;
        
        // Check if any price in the drop range overlaps with filter range
        return (minVariantPrice <= maxFilter && maxVariantPrice >= minFilter);
      });
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          const aPrice = Math.min(...a.variants.map((variant) => variant.basePrice));
          const bPrice = Math.min(...b.variants.map((variant) => variant.basePrice));
          comparison = aPrice - bPrice;
          break;
        case "popularity":
          comparison = (b.interestCount || 0) - (a.interestCount || 0);
          break;
        case "availability":
          const aStock = Math.max(...a.variants.map((variant) => variant.stock));
          const bStock = Math.max(...b.variants.map((variant) => variant.stock));
          comparison = bStock - aStock;
          break;
        case "newest":
          comparison = new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime();
          break;
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [drops, filterConfig, searchQuery, searchResults, sortBy, sortDirection, selectedDeliveryLocation, minPrice, maxPrice]);

  useEffect(() => {
    if (lockFilter) setActiveFilter(defaultFilter);
    
    // Check for bot commands in URL
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [defaultFilter, lockFilter, executeCommand]);

  useEffect(() => {
    startMockFeed();
    return () => {
      stopMockFeed();
    };
  }, []);

  // 🎯 Prefetch drop data for better performance
  useEffect(() => {
    const visibleDropIds = sortedAndFilteredDrops.slice(0, 10).map(drop => drop.id);
    if (visibleDropIds.length > 0) {
      prefetchDropData(visibleDropIds);
    }
  }, [sortedAndFilteredDrops, prefetchDropData]);

  // 🎯 Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Find next expiring drop for countdown
  const nextExpiringDrop = useMemo(() => {
    if (sortedAndFilteredDrops.length === 0) return null;
    
    const dropsWithDeadlines = sortedAndFilteredDrops
      .filter(drop => drop.deadlineAt)
      .map(drop => ({
        drop,
        deadline: new Date(drop.deadlineAt!).getTime()
      }))
      .filter(({ deadline }) => deadline > Date.now())
      .sort((a, b) => a.deadline - b.deadline);
    
    return dropsWithDeadlines.length > 0 ? dropsWithDeadlines[0].drop : null;
  }, [sortedAndFilteredDrops]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-6 pb-24">
      {/* 🔥 Live Countdown Header - Premium */}
      {nextExpiringDrop && nextExpiringDrop.deadlineAt && (
        <section className="relative overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-black/40 to-purple-500/10 backdrop-blur-xl shadow-xl shadow-accent/10">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-purple-500/5 to-accent/5 animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none" />
          
          {/* Pulse rings */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-1/2 left-1/4 w-32 h-32 -translate-y-1/2 bg-accent/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 -translate-y-1/2 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
              {/* Left: Drop Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">Heißester Drop</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                  {nextExpiringDrop.name}
                </h2>
                <div className="flex items-center gap-3 text-sm text-muted/80">
                  {nextExpiringDrop.badge && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
                      {nextExpiringDrop.badge}
                    </span>
                  )}
                  {nextExpiringDrop.interestCount && (
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-accent" />
                      <span className="font-semibold text-accent">{nextExpiringDrop.interestCount}</span>
                      <span className="text-muted/60">interessiert</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Countdown */}
              <div className="flex flex-col items-start md:items-end gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted/60">
                  Läuft ab in
                </span>
                <DropCountdown 
                  deadlineAt={nextExpiringDrop.deadlineAt} 
                  variant="desktop"
                  className="scale-110 md:scale-125 origin-left md:origin-right"
                />
                <button
                  onClick={() => selectDrop(nextExpiringDrop.id)}
                  className="group mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 border border-accent/30 text-accent text-sm font-bold backdrop-blur-md transition-all duration-300 hover:bg-accent/30 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 hover:scale-105"
                >
                  <span>Jetzt ansehen</span>
                  <Zap className="h-4 w-4 transition-transform group-hover:scale-110" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 🎯 How Drops Work Section with Category Filters */}
      <HowDropsWorkSection 
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        filterConfigs={!lockFilter ? filterConfigs.map(f => ({
          id: f.id,
          label: f.label,
          description: f.description,
          icon: f.icon,
          color: f.color
        })) : []}
        filterConfig={!lockFilter ? {
          icon: filterConfig.icon,
          description: filterConfig.description
        } : undefined}
      />

      {/* 🎯 Advanced Search & Sorting - Premium Optimized */}
      <section className="space-y-4">
        {/* Search Bar - Enhanced */}
        <div className="relative group">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent/60 transition-colors group-focus-within:text-accent" />
            <input
              type="text"
              placeholder="Durchsuche alle Drops..."
              value={searchQuery}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl pl-12 pr-12 py-4 text-sm text-white placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-accent/10"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-accent" />
            )}
          </div>

          {/* Search Results Count - Enhanced */}
          {searchQuery.trim() && (
            <div className="mt-2 px-2 text-xs text-muted/80 font-medium">
              {searchResults.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
                  {searchResults.length} Ergebnis{searchResults.length !== 1 ? 'se' : ''} für "{searchQuery}"
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-red-400/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                  Keine Ergebnisse für "{searchQuery}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Advanced Filters & Sort Controls - Premium Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-xl p-4 shadow-xl shadow-black/20">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          <div className="relative space-y-4">
            {/* Filter Row - Enhanced */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Delivery Location Filter - Premium */}
              <div className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 backdrop-blur-md transition-all duration-300 hover:border-accent/30 hover:bg-black/30 hover:shadow-lg hover:shadow-accent/10 min-h-[44px]">
                <MapPin className="h-4 w-4 text-accent/70 flex-shrink-0 transition-colors group-hover:text-accent" />
                <select
                  value={selectedDeliveryLocation}
                  onChange={(e) => setSelectedDeliveryLocation(e.target.value)}
                  className="bg-transparent border-none text-sm text-white focus:outline-none cursor-pointer min-w-[120px] font-medium"
                >
                  <option value="all" className="bg-black/90">🌍 Alle Lieferorte</option>
                  <option value="DE" className="bg-black/90">🇩🇪 Deutschland</option>
                  <option value="EU" className="bg-black/90">🇪🇺 Europa</option>
                  <option value="CN" className="bg-black/90">🇨🇳 China</option>
                  <option value="local" className="bg-black/90">📍 Lokal</option>
                </select>
              </div>

              {/* Price Filter - Premium */}
              <div className="group flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 backdrop-blur-md transition-all duration-300 hover:border-accent/30 hover:bg-black/30 hover:shadow-lg hover:shadow-accent/10">
                <Euro className="h-4 w-4 text-accent/70 flex-shrink-0 transition-colors group-hover:text-accent" />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-16 bg-transparent text-sm text-white placeholder:text-muted/50 focus:outline-none border-none font-medium"
                    min="0"
                  />
                  <span className="text-muted/50 text-xs">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-16 bg-transparent text-sm text-white placeholder:text-muted/50 focus:outline-none border-none font-medium"
                    min="0"
                  />
                  <span className="text-muted/70 text-xs font-medium">€</span>
                </div>
              </div>

              {/* Clear Filters Button - Enhanced */}
              {(selectedDeliveryLocation !== "all" || minPrice !== "" || maxPrice !== "") && (
                <button
                  onClick={() => {
                    setSelectedDeliveryLocation("all");
                    setMinPrice("");
                    setMaxPrice("");
                  }}
                  className="group flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300 backdrop-blur-md transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/20 hover:shadow-lg hover:shadow-red-500/20 min-h-[44px] font-medium"
                >
                  <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
                  <span className="hidden sm:inline">Zurücksetzen</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              )}
            </div>

            {/* Sort Controls - Enhanced */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-accent/70" />
                <span className="text-xs font-medium text-muted/80 uppercase tracking-wider">Sortierung</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="group relative rounded-lg border border-white/10 bg-black/20 backdrop-blur-md transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-transparent pl-3 pr-8 py-2 text-xs text-white focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="popularity" className="bg-black/90">🔥 Beliebtheit</option>
                    <option value="name" className="bg-black/90">📝 Name</option>
                    <option value="price" className="bg-black/90">💰 Preis</option>
                    <option value="availability" className="bg-black/90">📦 Verfügbarkeit</option>
                    <option value="newest" className="bg-black/90">✨ Neueste</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-3 w-3 text-muted/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="group flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white backdrop-blur-md transition-all duration-300 hover:border-accent/30 hover:bg-black/30 hover:shadow-lg hover:shadow-accent/10 hover:scale-110"
                  title={sortDirection === "asc" ? "Aufsteigend" : "Absteigend"}
                >
                  {sortDirection === "asc" ? (
                    <SortAsc className="h-4 w-4 text-accent transition-transform group-hover:scale-110" />
                  ) : (
                    <SortDesc className="h-4 w-4 text-accent transition-transform group-hover:scale-110" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drops Grid or Empty State - Enhanced */}
      {sortedAndFilteredDrops.length === 0 ? (
        <>
          {(selectedDeliveryLocation !== "all" || minPrice !== "" || maxPrice !== "" || searchQuery.trim()) ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-xl p-12 text-center shadow-xl shadow-black/20">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 pointer-events-none" />
              
              <div className="relative space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="rounded-full bg-red-500/10 border border-red-500/20 p-4">
                    <Search className="h-8 w-8 text-red-400/80" />
                  </div>
                </div>
                
                {/* Text */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Keine Drops gefunden</h3>
                  <p className="text-sm text-muted/80 max-w-md mx-auto">
                    Versuche andere Filter oder passe deine Suchkriterien an, um mehr Ergebnisse zu sehen
                  </p>
                </div>
                
                {/* Reset Button */}
                <button
                  onClick={() => {
                    setSelectedDeliveryLocation("all");
                    setMinPrice("");
                    setMaxPrice("");
                    setSearchQuery("");
                  }}
                  className="group inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-6 py-3 text-sm font-medium text-accent backdrop-blur-md transition-all duration-300 hover:border-accent/50 hover:bg-accent/20 hover:shadow-lg hover:shadow-accent/20 hover:scale-105"
                >
                  <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
                  Alle Filter zurücksetzen
                </button>
              </div>
            </div>
          ) : (
            <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={`drop-skel-${i}`} />
              ))}
            </section>
          )}
        </>
      ) : (
      <section className="grid gap-5 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {sortedAndFilteredDrops.map((drop) => (
          <RevolutionaryDropCard
            key={drop.id}
            drop={drop}
            onOpen={(selected) => selectDrop(selected.id)}
            onQuickPreorder={(drop, variant, quantity) => {
              // Quick preorder logic here
              console.log('Quick preorder:', drop.name, variant.label, quantity);
              selectDrop(drop.id);
            }}
            showQuickActions={true}
          />
        ))}
      </section>
      )}
      
      <EnhancedMobileDropModal />
    </div>
  );
};
