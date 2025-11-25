import { useState, useMemo, useEffect } from "react";
import type { Drop } from "@nebula/shared";

export interface VipDropFilter {
  id: string;
  label: string;
  icon: string;
  description: string;
  predicate: (drop: Drop) => boolean;
  count?: number;
}

interface VipDropsFiltersProps {
  drops: Drop[];
  onFiltersChange: (filteredDrops: Drop[]) => void;
  className?: string;
}

const vipDropFilters: Omit<VipDropFilter, 'count'>[] = [
  {
    id: 'all',
    label: 'Alle VIP',
    icon: '✨',
    description: 'Alle exklusiven VIP-Drops',
    predicate: () => true
  },
  {
    id: 'coming-soon',
    label: 'Bald verfügbar',
    icon: '⏰',
    description: 'Drops, die bald released werden',
    predicate: (drop) => drop.status === 'coming_soon'
  },
  {
    id: 'limited-time',
    label: 'Begrenzt',
    icon: '⚡',
    description: 'Zeitlich begrenzte Angebote',
    predicate: (drop) => drop.badge === 'Limitiert' || drop.progress > 0.8
  },
  {
    id: 'my-tier',
    label: 'Für mein Tier',
    icon: '🎯',
    description: 'Drops für deinen aktuellen VIP-Status',
    predicate: (drop) => {
      // This would need user tier context
      return true; // Placeholder
    }
  },
  {
    id: 'priority-queue',
    label: 'Priority Queue',
    icon: '🚀',
    description: 'Ausverkaufte Drops mit Warteliste',
    predicate: (drop) => drop.status === 'locked' && drop.interestCount > 50
  },
  {
    id: 'waitlist',
    label: 'Warteliste',
    icon: '📋',
    description: 'Drops auf Warteliste',
    predicate: (drop) => (drop as any).gate?.mode === 'waitlist'
  },
  {
    id: 'new-releases',
    label: 'Neuheiten',
    icon: '🆕',
    description: 'Kürzlich hinzugefügte Drops',
    predicate: (drop) => {
      // Check if drop was added recently (would need timestamp)
      return (drop as any).badge === 'Neu';
    }
  },
  {
    id: 'high-demand',
    label: 'High Demand',
    icon: '🔥',
    description: 'Besonders beliebte Drops',
    predicate: (drop) => drop.interestCount > 100 || drop.progress > 0.9
  },
  {
    id: 'budget-friendly',
    label: 'Budget freundlich',
    icon: '💰',
    description: 'Günstigere VIP-Drops',
    predicate: (drop) => drop.price < 20
  },
  {
    id: 'premium',
    label: 'Premium',
    icon: '💎',
    description: 'Hochwertige Premium-Drops',
    predicate: (drop) => drop.price >= 50 || drop.badge === 'VIP'
  },
  {
    id: 'priority-queue',
    label: 'Priority Queue',
    icon: '🚀',
    description: 'Ausverkaufte Drops mit Warteliste',
    predicate: (drop) => drop.status === 'locked' && drop.interestCount > 50
  }
];

export const VipDropsFilters = ({ drops, onFiltersChange, className = "" }: VipDropsFiltersProps) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'interest' | 'progress'>('interest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculate filter counts
  const filtersWithCounts = useMemo(() => {
    return vipDropFilters.map(filter => ({
      ...filter,
      count: drops.filter(filter.predicate).length
    }));
  }, [drops]);

  // Filter and sort drops
  const filteredAndSortedDrops = useMemo(() => {
    let filtered = drops;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(drop =>
        drop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drop.flavorTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        drop.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply active filter
    const activeFilterData = filtersWithCounts.find(f => f.id === activeFilter);
    if (activeFilterData && activeFilterData.id !== 'all') {
      filtered = filtered.filter(activeFilterData.predicate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'interest':
          aValue = a.interestCount;
          bValue = b.interestCount;
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const numA = aValue as number;
      const numB = bValue as number;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });

    return filtered;
  }, [drops, searchTerm, activeFilter, sortBy, sortOrder, filtersWithCounts]);

  // Notify parent of filtered results
  useEffect(() => {
    onFiltersChange(filteredAndSortedDrops);
  }, [filteredAndSortedDrops, onFiltersChange]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="VIP-Drops suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-12 bg-black/30 border border-purple-400/30 rounded-xl text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-purple-400">🔍</span>
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-purple-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="text-purple-300 text-sm font-semibold">Sortieren nach:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-black/30 border border-purple-400/30 rounded-lg text-white text-sm focus:border-purple-400 focus:outline-none"
          >
            <option value="interest">Beliebtheit</option>
            <option value="price">Preis</option>
            <option value="name">Name</option>
            <option value="progress">Fortschritt</option>
          </select>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center space-x-2 px-3 py-2 bg-black/30 border border-purple-400/30 rounded-lg text-purple-300 hover:text-white hover:border-purple-400 transition-colors"
        >
          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
          <span className="text-sm">
            {sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'}
          </span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-3">
        {filtersWithCounts.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`
              relative px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2
              ${activeFilter === filter.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-black/20 text-purple-300 hover:text-white hover:bg-purple-600/20 border border-purple-400/20'
              }
            `}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>

            {/* Count Badge */}
            <span className={`
              px-2 py-1 rounded-full text-xs font-bold
              ${activeFilter === filter.id
                ? 'bg-white/20 text-white'
                : 'bg-purple-500/20 text-purple-300'
              }
            `}>
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Active Filter Info */}
      {activeFilter !== 'all' && (
        <div className="bg-purple-900/20 border border-purple-400/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold">
                {filtersWithCounts.find(f => f.id === activeFilter)?.label} Filter aktiv
              </h4>
              <p className="text-purple-300 text-sm">
                {filtersWithCounts.find(f => f.id === activeFilter)?.description}
              </p>
            </div>

            <button
              onClick={() => setActiveFilter('all')}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
            >
              Filter zurücksetzen
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-purple-300">
        {searchTerm && (
          <p>
            "{searchTerm}" • {filteredAndSortedDrops.length} Ergebnisse gefunden
          </p>
        )}
        {!searchTerm && (
          <p>
            {filteredAndSortedDrops.length} VIP-Drops verfügbar
          </p>
        )}
      </div>
    </div>
  );
};
