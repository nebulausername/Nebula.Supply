import { useState, useMemo, memo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieClickerStore, UPGRADES } from '../../store/cookieClicker';
import {
  Zap,
  TrendingUp,
  Building2,
  Sparkles,
  Lightbulb,
  Target,
  CheckCircle,
  Lock,
  ArrowRight,
  Calculator,
  Crown,
  Gift,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/cookieFormatters';
import { toast } from './ToastSystem';

// ⚡ UPGRADE CATEGORIES
const UPGRADE_CATEGORIES = {
  all: { id: 'all', label: 'Alle', icon: Filter },
  cpc: { id: 'cpc', label: 'Klick-Power', icon: Zap, color: 'blue' },
  cps: { id: 'cps', label: 'Produktion', icon: TrendingUp, color: 'green' },
  building: { id: 'building', label: 'Gebäude-Boost', icon: Building2, color: 'purple' },
  special: { id: 'special', label: 'Spezial', icon: Sparkles, color: 'yellow' }
} as const;

// ⚡ Get Upgrade Category
const getUpgradeCategory = (upgradeId: string, effect: string): keyof typeof UPGRADE_CATEGORIES => {
  if (effect.includes('cookiesPerClick') || upgradeId.includes('finger')) return 'cpc';
  if (effect.includes('cookiesPerSecond') || effect.includes('CPS')) return 'cps';
  if (effect.includes('building') || upgradeId.includes('cursor') || upgradeId.includes('grandma') || 
      upgradeId.includes('farm') || upgradeId.includes('mine') || upgradeId.includes('factory') ||
      upgradeId.includes('bank') || upgradeId.includes('temple') || upgradeId.includes('wizard') ||
      upgradeId.includes('shipment') || upgradeId.includes('alchemy')) return 'building';
  return 'special';
};

// ⚡ Calculate Upgrade Efficiency
const calculateEfficiency = (upgrade: typeof UPGRADES[0], currentCookies: number): number => {
  if (!currentCookies) return 0;
  
  if (upgrade.effect.includes('cookiesPerClick')) {
    const match = upgrade.effect.match(/\*\=\s*([\d.]+)/);
    const multiplier = match ? parseFloat(match[1]) : 2;
    return (multiplier - 1) / upgrade.cost;
  }
  if (upgrade.effect.includes('cookiesPerSecond')) {
    const match = upgrade.effect.match(/\*\=\s*([\d.]+)/);
    const multiplier = match ? parseFloat(match[1]) : 1.5;
    return (multiplier - 1) / upgrade.cost;
  }
  return 0;
};

// ⚡ Get Preview Stats after Upgrade
const getPreviewStats = (upgrade: typeof UPGRADES[0], currentCpc: number, currentCps: number): {
  newCpc?: number;
  newCps?: number;
} => {
  if (upgrade.effect.includes('cookiesPerClick')) {
    const match = upgrade.effect.match(/\*\=\s*([\d.]+)/);
    const multiplier = match ? parseFloat(match[1]) : 2;
    return { newCpc: currentCpc * multiplier };
  }
  if (upgrade.effect.includes('cookiesPerSecond')) {
    const match = upgrade.effect.match(/\*\=\s*([\d.]+)/);
    const multiplier = match ? parseFloat(match[1]) : 1.5;
    return { newCps: currentCps * multiplier };
  }
  return {};
};

// ⚡ ENHANCED UPGRADE CARD
const EnhancedUpgradeCard = memo(({ upgrade, owned, canAfford, preview, recommended }: {
  upgrade: typeof UPGRADES[0];
  owned: boolean;
  canAfford: boolean;
  preview?: { newCpc?: number; newCps?: number };
  recommended?: boolean;
}) => {
  const buyUpgrade = useCookieClickerStore(state => state.buyUpgrade);
  const cookies = useCookieClickerStore(state => state.cookies);
  const cookiesPerClick = useCookieClickerStore(state => state.cookiesPerClick);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const [isHovered, setIsHovered] = useState(false);

  if (owned) return null;

  const category = getUpgradeCategory(upgrade.id, upgrade.effect);

  const handlePurchase = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // ✅ DOUBLE-CHECK: Prüfe nochmal ob wir uns es leisten können (aktueller Wert!)
    const currentCookies = useCookieClickerStore.getState().cookies;
    const canAffordCheck = typeof currentCookies === 'number' && currentCookies >= upgrade.cost;
    
    if (owned) {
      toast.info(`${upgrade.name} wurde bereits gekauft!`);
      return;
    }
    
    if (!canAffordCheck) {
      const missing = typeof currentCookies === 'number' ? upgrade.cost - currentCookies : upgrade.cost;
      toast.warning(`Nicht genug Cookies! Fehlen: ${formatNumber(missing)}`);
      return;
    }
    
    try {
      buyUpgrade(upgrade.id);
      toast.success(`🎉 ${upgrade.name} gekauft!`);
    } catch (error) {
      console.error('Fehler beim Kaufen:', error);
      toast.error(`Fehler beim Kaufen von ${upgrade.name}`);
    }
  }, [upgrade.id, upgrade.name, upgrade.cost, owned, buyUpgrade]);

  // Calculate preview values
  const currentCpc = cookiesPerClick;
  const currentCps = cookiesPerSecond;
  const newCpc = preview?.newCpc || currentCpc;
  const newCps = preview?.newCps || currentCps;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm transition-all duration-300",
        owned ? "opacity-50 border-green-500/30 bg-green-500/5" :
        canAfford 
          ? "border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
          : "border-white/10 bg-white/5 cursor-not-allowed opacity-60",
        recommended && canAfford && "ring-2 ring-yellow-400/50"
      )}
      whileHover={canAfford ? { scale: 1.02, y: -2 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        handlePurchase(e);
      }}
    >
      {/* Recommended Badge */}
      {recommended && canAfford && !owned && (
        <div className="absolute top-2 right-2 z-10">
          <motion.div
            className="px-2 py-1 rounded-lg bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 text-xs font-bold flex items-center gap-1 shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-3 h-3" />
            Empfohlen
          </motion.div>
        </div>
      )}

      {/* Hover Glow Effect */}
      {canAfford && !owned && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={isHovered ? {
            opacity: [0.3, 0.6, 0.3],
          } : { opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Purchase Pulse Effect */}
      {canAfford && !owned && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0px rgba(59, 130, 246, 0)',
              '0 0 20px rgba(59, 130, 246, 0.5)',
              '0 0 0px rgba(59, 130, 246, 0)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      <div className="relative p-3 md:p-5">
        {/* Header - Compact */}
        <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
          <motion.div
            className={cn(
              "w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-lg flex-shrink-0 relative overflow-hidden",
              owned ? "bg-green-500/20 ring-2 ring-green-500/30" :
              canAfford ? "bg-blue-500/20 ring-2 ring-blue-500/30" : "bg-white/10"
            )}
            animate={canAfford && isHovered ? {
              rotate: [0, -5, 5, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 0.6 }}
          >
            {upgrade.icon || '⚡'}
            {/* Shine effect on hover */}
            {canAfford && isHovered && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-bold mb-1 text-base md:text-lg",
              owned ? "text-green-400" : canAfford ? "text-white" : "text-white/60"
            )}>
              {upgrade.name}
            </h3>
            <p className="text-xs text-white/60 line-clamp-2">{upgrade.description}</p>
          </div>
          <div className={cn(
            "px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg text-xs font-bold flex-shrink-0",
            owned ? "bg-green-500/20 text-green-400 border border-green-500/30" :
            canAfford ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/10 text-white/40 border border-white/10"
          )}>
            {category === 'cpc' ? '⚡ CPC' : category === 'cps' ? '📈 CPS' : category === 'building' ? '🏗️ Bld' : '✨ SP'}
          </div>
        </div>

        {/* Preview Stats - Compact */}
        {canAfford && preview && (
          <motion.div
            className="mb-2 md:mb-3 p-2 md:p-3 rounded-lg bg-white/5 border border-white/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            {preview.newCpc && (
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-white/70">Cookies/Klick:</span>
                <span className="text-yellow-400 font-bold">
                  {formatNumber(currentCpc)} → {formatNumber(newCpc)}
                </span>
              </div>
            )}
            {preview.newCps && (
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="text-white/70">Cookies/Sek:</span>
                <span className="text-green-400 font-bold">
                  {formatNumber(currentCps)} → {formatNumber(newCps)}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Cost & Buy Button - Compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 pt-2 md:pt-3 border-t border-white/10">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <div className="text-lg md:text-xl font-bold text-accent">{formatNumber(upgrade.cost)}</div>
              {typeof cookies === 'number' && cookies < upgrade.cost && (
                <div className="text-xs text-red-400 font-medium">
                  (Fehlen: {formatNumber(upgrade.cost - cookies)})
                </div>
              )}
            </div>
            <div className="text-xs text-white/50">Cookies benötigt</div>
            {typeof cookies === 'number' && (
              <div className="text-xs text-white/40 mt-1">
                Vorhanden: {formatNumber(cookies)}
              </div>
            )}
          </div>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handlePurchase(e);
            }}
            disabled={!canAfford || owned}
            className={cn(
              "w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-1 md:gap-2 shadow-lg",
              owned 
                ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                : canAfford
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:shadow-xl active:scale-95"
                : "bg-white/10 text-white/40 cursor-not-allowed opacity-60"
            )}
            whileHover={canAfford && !owned ? { scale: 1.05 } : {}}
            whileTap={canAfford && !owned ? { scale: 0.95 } : {}}
          >
            {owned ? (
              <>
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Gekauft</span>
                <span className="sm:hidden">✓</span>
              </>
            ) : canAfford ? (
              <>
                <span className="hidden sm:inline">Kaufen</span>
                <span className="sm:hidden">Kauf</span>
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Zu teuer ({formatNumber(cookies)} / {formatNumber(upgrade.cost)})</span>
                <span className="md:hidden">Zu teuer</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});
EnhancedUpgradeCard.displayName = 'EnhancedUpgradeCard';

// ⚡ MAIN ENHANCED UPGRADES COMPONENT
export const EnhancedUpgrades = memo(() => {
  // ✅ KORREKTE STORE-SUBSCRIPTION - FIXED BUG!
  const cookies = useCookieClickerStore(state => state.cookies);
  const cookiesPerClick = useCookieClickerStore(state => state.cookiesPerClick);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const upgrades = useCookieClickerStore(state => state.upgrades);
  const buildings = useCookieClickerStore(state => state.buildings);

  const [activeCategory, setActiveCategory] = useState<keyof typeof UPGRADE_CATEGORIES>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOwned, setShowOwned] = useState(false);
  const [lastPurchaseError, setLastPurchaseError] = useState<string | null>(null);
  
  // ✅ DEBUG: Log cookies changes
  useEffect(() => {
    if (typeof cookies !== 'number') {
      console.error('❌ KRITISCHER BUG: cookies ist kein Number!', { cookies, type: typeof cookies });
      setLastPurchaseError(`Cookies-Value ist ungültig: ${String(cookies)}`);
    } else {
      setLastPurchaseError(null);
    }
  }, [cookies]);

  // ⚡ Filter Upgrades
  const filteredUpgrades = useMemo(() => {
    return UPGRADES.filter(upgrade => {
      const owned = upgrades[upgrade.id] || false;
      
      // Filter owned
      if (!showOwned && owned) return false;
      
      // Filter category
      if (activeCategory !== 'all') {
        const upgradeCategory = getUpgradeCategory(upgrade.id, upgrade.effect);
        if (upgradeCategory !== activeCategory) return false;
      }
      
      // Filter search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return upgrade.name.toLowerCase().includes(query) ||
               upgrade.description.toLowerCase().includes(query) ||
               upgrade.id.toLowerCase().includes(query);
      }
      
      return true;
    });
  }, [upgrades, activeCategory, searchQuery, showOwned]);

  // ⚡ Recommendation System
  const recommendedUpgrade = useMemo(() => {
    if (!filteredUpgrades.length || typeof cookies !== 'number' || cookies === 0) return null;
    
    const affordable = filteredUpgrades.filter(u => {
      const owned = upgrades[u.id] || false;
      return !owned && cookies >= u.cost;
    });
    
    if (!affordable.length) return null;
    
    // Find best ROI (efficiency)
    return affordable.reduce((best, current) => {
      const bestEfficiency = calculateEfficiency(best, cookies);
      const currentEfficiency = calculateEfficiency(current, cookies);
      return currentEfficiency > bestEfficiency ? current : best;
    });
  }, [filteredUpgrades, cookies, upgrades]);

  // ⚡ Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { total: number; owned: number }> = {};
    
    Object.values(UPGRADE_CATEGORIES).forEach(cat => {
      if (cat.id === 'all') return;
      const categoryUpgrades = UPGRADES.filter(u => {
        const category = getUpgradeCategory(u.id, u.effect);
        return category === cat.id;
      });
      counts[cat.id] = {
        total: categoryUpgrades.length,
        owned: categoryUpgrades.filter(u => upgrades[u.id]).length
      };
    });
    
    return counts;
  }, [upgrades]);

  return (
    <motion.div
      className="relative rounded-3xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-pink-500/10 backdrop-blur-xl p-4 md:p-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-8 h-8 md:w-10 md:h-10 text-purple-400" />
          </motion.div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">⚡ Upgrades</h2>
            <p className="text-white/70 text-xs md:text-sm">Power-Up deine Cookie-Produktion!</p>
          </div>
        </div>
      </div>

      {/* Stats Summary - Compact */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 mb-4 md:mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
          <div>
            <div className="text-xs text-white/60 mb-1">Deine Cookies</div>
            <div className="text-lg md:text-2xl font-bold text-accent">{formatNumber(cookies)}</div>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Upgrades gekauft</div>
            <div className="text-lg md:text-2xl font-bold text-blue-400">
              {Object.keys(upgrades).filter(id => upgrades[id]).length} / {UPGRADES.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Klick-Power</div>
            <div className="text-lg md:text-2xl font-bold text-yellow-400">{formatNumber(cookiesPerClick)}</div>
          </div>
          <div>
            <div className="text-xs text-white/60 mb-1">Cookies/Sek</div>
            <div className="text-lg md:text-2xl font-bold text-green-400">{formatNumber(cookiesPerSecond)}</div>
          </div>
        </div>
      </div>

      {/* Recommended Upgrade Banner - Compact */}
      {recommendedUpgrade && (
        <motion.div
          className="mb-3 md:mb-4 p-3 md:p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <Crown className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-white font-bold text-sm md:text-base truncate">Empfohlen: {recommendedUpgrade.name}</div>
                <div className="text-white/70 text-xs md:text-sm truncate">{recommendedUpgrade.description}</div>
              </div>
            </div>
            <motion.button
              onClick={() => {
                const element = document.getElementById(`upgrade-${recommendedUpgrade.id}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-medium flex items-center gap-1 md:gap-2 transition-colors text-xs md:text-sm flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Anzeigen <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* 🐛 DEBUG INFO (nur wenn Fehler) */}
      {lastPurchaseError && process.env.NODE_ENV === 'development' && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 mb-4">
          <div className="text-red-400 font-bold mb-2">⚠️ Debug Info:</div>
          <div className="text-sm text-red-300">{lastPurchaseError}</div>
          <div className="text-xs text-red-400/70 mt-2">
            Cookies: {String(cookies)} (Type: {typeof cookies})
          </div>
        </div>
      )}

      {/* ⚡ SEARCH & FILTERS - Compact */}
      <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-white/40" />
          <input
            type="text"
            placeholder="Upgrades durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400/50 transition-colors text-sm md:text-base"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {Object.values(UPGRADE_CATEGORIES).map((category) => {
            const Icon = category.icon;
            const count = categoryCounts[category.id as keyof typeof categoryCounts];
            
            return (
              <motion.button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-1 md:gap-2",
                  activeCategory === category.id
                    ? "bg-purple-500/40 text-white border border-purple-500/50 shadow-lg"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                {count && (
                  <span className="ml-1 opacity-70 text-xs">
                    ({count.owned}/{count.total})
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Show Owned Toggle */}
        <motion.button
          onClick={() => setShowOwned(!showOwned)}
          className={cn(
            "px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-1 md:gap-2",
            showOwned
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-white/10 text-white/70 hover:bg-white/20"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">{showOwned ? 'Gekaufte anzeigen' : 'Gekaufte ausblenden'}</span>
          <span className="sm:hidden">{showOwned ? 'Anzeigen' : 'Ausblenden'}</span>
        </motion.button>
      </div>

      {/* ⚡ UPGRADES GRID */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + searchQuery}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredUpgrades.map((upgrade) => {
            const owned = upgrades[upgrade.id] || false;
            // ✅ KORREKTE CANAFFORD BERECHNUNG - FIXED BUG!
            const canAfford = !owned && typeof cookies === 'number' && cookies >= upgrade.cost;
            const preview = canAfford ? getPreviewStats(upgrade, cookiesPerClick, cookiesPerSecond) : undefined;
            const isRecommended = recommendedUpgrade?.id === upgrade.id;
            
            // ✅ Debug log für Fehlerbehebung (nur in Dev)
            if (process.env.NODE_ENV === 'development' && typeof cookies !== 'number') {
              console.error(`❌ KRITISCHER BUG: Cookies ist kein Number!`, { 
                cookies, 
                upgrade: upgrade.id,
                upgradeCost: upgrade.cost,
                canAfford,
                type: typeof cookies
              });
            }

            return (
              <div key={upgrade.id} id={`upgrade-${upgrade.id}`}>
                <EnhancedUpgradeCard
                  upgrade={upgrade}
                  owned={owned}
                  canAfford={canAfford}
                  preview={preview}
                  recommended={isRecommended}
                />
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredUpgrades.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">Keine Upgrades gefunden</h3>
          <p className="text-white/60">
            {searchQuery ? 'Versuche andere Suchbegriffe' : 'Alle verfügbaren Upgrades wurden gekauft!'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});
EnhancedUpgrades.displayName = 'EnhancedUpgrades';

