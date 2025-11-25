import { useState, useEffect, useMemo } from "react";
import { useDropsStore } from "../../store/drops";
import { RevolutionaryDropCard } from "../RevolutionaryDropCard";
import { MobileOptimizedDropModal } from "../MobileOptimizedDropModal";
import { VipDropsFilters } from "./VipDropsFilters";
import type { Drop } from "@nebula/shared";

interface VipDropsEnhancedProps {
  className?: string;
}

export const VipDropsEnhanced = ({ className = "" }: VipDropsEnhancedProps) => {
  const drops = useDropsStore((state) => state.drops);
  const selectDrop = useDropsStore((state) => state.selectDrop);

  const [filteredDrops, setFilteredDrops] = useState<Drop[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter VIP drops only
  const vipDrops = useMemo(() => {
    return drops.filter(drop => drop.access === 'vip');
  }, [drops]);

  // Initialize with all VIP drops
  useEffect(() => {
    setFilteredDrops(vipDrops);
  }, [vipDrops]);

  const handleFiltersChange = (newFilteredDrops: Drop[]) => {
    setFilteredDrops(newFilteredDrops);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Exklusive VIP Drops
        </h2>
        <p className="text-purple-300 max-w-2xl mx-auto">
          Entdecke Premium-Produkte, die nur für VIP-Mitglieder verfügbar sind.
          Nutze deine exklusiven Vorteile für frühen Zugang und besondere Konditionen.
        </p>
      </div>

      {/* Filter Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2
            ${showFilters
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
              : 'bg-black/20 text-purple-300 hover:text-white hover:bg-purple-600/20 border border-purple-400/20'
            }
          `}
        >
          <span>{showFilters ? '🔽' : '🔍'}</span>
          <span>{showFilters ? 'Filter ausblenden' : 'Erweiterte Filter'}</span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gradient-to-br from-black/40 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20">
          <VipDropsFilters
            drops={vipDrops}
            onFiltersChange={handleFiltersChange}
          />
        </div>
      )}

      {/* Drops Grid */}
      <div className="space-y-6">
        {filteredDrops.length > 0 ? (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredDrops.map((drop) => (
                <div key={drop.id} className="group">
                  <RevolutionaryDropCard
                    drop={drop}
                    onOpen={(selected) => selectDrop(selected.id)}
                    onQuickPreorder={(drop, variant, quantity) => {
                      console.log('Quick preorder:', drop.name, variant.label, quantity);
                      selectDrop(drop.id);
                    }}
                    showQuickActions={true}
                  />

                  {/* VIP Enhancement Badge */}
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    VIP EXCLUSIVE
                  </div>
                </div>
              ))}
            </div>

            {/* Load More / Pagination could go here */}
            {filteredDrops.length >= 8 && (
              <div className="text-center">
                <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25">
                  Mehr laden
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Keine Drops gefunden
            </h3>
            <p className="text-purple-300 mb-6">
              Versuche andere Filter oder schau später wieder vorbei.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Filter anpassen
            </button>
          </div>
        )}
      </div>

      {/* VIP Benefits Reminder */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">💎</div>
            <div>
              <h4 className="text-xl font-bold text-white">
                VIP-Vorteile nutzen
              </h4>
              <p className="text-purple-300">
                Als VIP-Mitglied profitierst du von exklusiven Preisen und frühem Zugang.
              </p>
            </div>
          </div>

          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105">
            Meine Benefits
          </button>
        </div>
      </div>

      {/* Mobile Drop Modal */}
      <MobileOptimizedDropModal />
    </div>
  );
};




