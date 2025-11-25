import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingBag, 
  Gift, 
  X, 
  ExternalLink,
  Euro,
  Star,
  Calendar,
  Eye,
  Trash2,
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  BarChart3,
  Lightbulb,
  Filter,
  ArrowRight,
  Flame,
  Search,
  Loader2
} from 'lucide-react';
import { useUserInterestsStore } from '../../store/userInterests';
import { useShopStore } from '../../store/shop';
import { useDropsStore } from '../../store/drops';
import { cn } from '../../utils/cn';
import { useMobileOptimizations } from '../MobileOptimizations';

type InterestType = 'shop' | 'drop';

export const InterestsSection = () => {
  const { isMobile } = useMobileOptimizations();
  const [activeTab, setActiveTab] = useState<InterestType>('shop');
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage] = useState(12); // For pagination/virtual scrolling

  // Get data from stores
  const { shopInterests, dropInterests, removeShopInterest, removeDropInterest } = useUserInterestsStore();
  const toggleShopInterest = useShopStore((state) => state.toggleInterest);
  const shopProducts = useShopStore((state) => state.products);
  const shopLoading = useShopStore((state) => state.isLoading);
  const drops = useDropsStore((state) => state.drops);
  
  // Check if data is loading
  const isLoading = shopLoading;

  // Get interested products and drops - memoized
  const interestedProducts = useMemo(() => {
    return shopProducts.filter(product => shopInterests.includes(product.id));
  }, [shopProducts, shopInterests]);

  const interestedDrops = useMemo(() => {
    return drops.filter(drop => dropInterests.includes(drop.id));
  }, [drops, dropInterests]);

  // Filter by search query - optimized
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return interestedProducts;
    const normalized = searchQuery.toLowerCase().trim();
    return interestedProducts.filter(product => 
      product.name.toLowerCase().includes(normalized) ||
      product.description?.toLowerCase().includes(normalized) ||
      product.category?.toLowerCase().includes(normalized)
    );
  }, [interestedProducts, searchQuery]);

  const filteredDrops = useMemo(() => {
    if (!searchQuery.trim()) return interestedDrops;
    const normalized = searchQuery.toLowerCase().trim();
    return interestedDrops.filter(drop => 
      drop.name.toLowerCase().includes(normalized) ||
      drop.description?.toLowerCase().includes(normalized) ||
      drop.category?.toLowerCase().includes(normalized)
    );
  }, [interestedDrops, searchQuery]);

  const handleRemoveInterest = useCallback(async (id: string, type: InterestType) => {
    setRemovingItems(prev => new Set(prev).add(id));
    
    // Add a small delay for smooth animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (type === 'shop') {
      // 1) Remove from persisted interests list
      removeShopInterest(id);
      // 2) Toggle global shop store so cards/modals update everywhere
      if (useShopStore.getState().interestedProducts[id]) {
        toggleShopInterest(id);
      }
    } else {
      removeDropInterest(id);
    }
    
    setRemovingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, [removeShopInterest, removeDropInterest, toggleShopInterest]);

  // Memoize helper functions for performance
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const getDropStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'live': return 'text-green-400 bg-green-400/10';
      case 'upcoming': return 'text-blue-400 bg-blue-400/10';
      case 'locked': return 'text-purple-400 bg-purple-400/10';
      case 'ended': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  }, []);

  const getDropStatusText = useCallback((status: string) => {
    switch (status) {
      case 'live': return 'Live';
      case 'upcoming': return 'Bald';
      case 'locked': return 'Gesperrt';
      case 'ended': return 'Beendet';
      default: return 'Unbekannt';
    }
  }, []);

  const renderEmptyState = (type: InterestType) => {
    const isShop = type === 'shop';
    const icon = isShop ? ShoppingBag : Gift;
    const title = isShop ? 'Keine Shop-Interessen' : 'Keine Drop-Interessen';
    const description = isShop 
      ? 'Du hast noch keine Shop-Produkte als interessant markiert'
      : 'Du hast noch keine Drops als interessant markiert';
    const ctaText = isShop ? 'Zum Shop' : 'Zu den Drops';

    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <icon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{description}</p>
        <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200">
          {ctaText}
        </button>
      </div>
    );
  };

  const renderShopInterests = () => {
    if (filteredProducts.length === 0) {
      if (searchQuery) {
        return (
          <div className="p-6 bg-slate-800/40 border border-slate-700/40 rounded-xl text-center">
            <p className="text-gray-300">Keine Produkte für "{searchQuery}" gefunden.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300"
            >
              Suche zurücksetzen
            </button>
          </div>
        );
      }
      return renderEmptyState('shop');
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative group overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
                "bg-gradient-to-br from-slate-900/80 to-slate-800/40 border-slate-600/30",
                "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10",
                removingItems.has(product.id) && "opacity-50 scale-95"
              )}
            >
            {/* Product Image */}
            <div className="aspect-square bg-slate-800/50 flex items-center justify-center overflow-hidden rounded-t-2xl">
              {(() => {
                const productImage = product.media?.[0]?.url;
                return productImage ? (
                  <img
                    src={productImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                );
              })()}
            </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-green-400">{formatPrice(product.price)}</span>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm">4.5</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Interessiert seit {formatDate(new Date().toISOString())}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors text-sm">
                    <ExternalLink className="w-4 h-4" />
                    Ansehen
                  </button>
                  <button
                    onClick={() => handleRemoveInterest(product.id, 'shop')}
                    disabled={removingItems.has(product.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Interesse entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Remove Animation Overlay */}
              {removingItems.has(product.id) && (
                <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const renderDropInterests = () => {
    if (filteredDrops.length === 0) {
      if (searchQuery) {
        return (
          <div className="p-6 bg-slate-800/40 border border-slate-700/40 rounded-xl text-center">
            <p className="text-gray-300">Keine Drops für "{searchQuery}" gefunden.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300"
            >
              Suche zurücksetzen
            </button>
          </div>
        );
      }
      return renderEmptyState('drop');
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredDrops.map((drop) => (
            <motion.div
              key={drop.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative group overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
                "bg-gradient-to-br from-slate-900/80 to-slate-800/40 border-slate-600/30",
                "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10",
                removingItems.has(drop.id) && "opacity-50 scale-95"
              )}
            >
              {/* Drop Image */}
              <div className="aspect-square bg-slate-800/50 flex items-center justify-center relative overflow-hidden rounded-t-2xl">
                {(() => {
                  const defaultVariant = drop.variants.find(v => v.id === drop.defaultVariantId) ?? drop.variants[0];
                  const dropImage = defaultVariant?.media?.[0]?.url ?? drop.heroImageUrl;
                  return dropImage ? (
                    <img
                      src={dropImage}
                      alt={drop.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Gift className="w-12 h-12 text-gray-400" />
                  );
                })()}
                
                {/* Status Badge */}
                <div className={cn(
                  "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold",
                  getDropStatusColor(drop.status)
                )}>
                  {getDropStatusText(drop.status)}
                </div>
              </div>

              {/* Drop Info */}
              <div className="p-4">
                <h3 className="font-semibold text-white mb-2 line-clamp-2">{drop.name}</h3>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-purple-400">{formatPrice(drop.price)}</span>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{drop.interestCount}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Interessiert seit {formatDate(new Date().toISOString())}</span>
                </div>

                {/* Progress Bar */}
                {drop.progress !== undefined && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Fortschritt</span>
                      <span>{Math.round(drop.progress * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${drop.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors text-sm">
                    <ExternalLink className="w-4 h-4" />
                    Ansehen
                  </button>
                  <button
                    onClick={() => handleRemoveInterest(drop.id, 'drop')}
                    disabled={removingItems.has(drop.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Interesse entfernen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Remove Animation Overlay */}
              {removingItems.has(drop.id) && (
                <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6" role="tabpanel" id="panel-interests" aria-labelledby="tab-interests">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-gray-400">Interessen werden geladen...</p>
          </div>
        </div>
        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="tabpanel" id="panel-interests" aria-labelledby="tab-interests">
      {/* Header with Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Meine Interessen</h2>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'shop' 
                ? `${filteredProducts.length} von ${interestedProducts.length} Shop-Produkten`
                : `${filteredDrops.length} von ${interestedDrops.length} Drops`
              }
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Heart className="w-4 h-4" />
            <span>{shopInterests.length + dropInterests.length} gespeichert</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Nach ${activeTab === 'shop' ? 'Produkten' : 'Drops'} suchen...`}
            className="w-full pl-10 pr-3 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-gray-200 placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/10"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
        <button
          onClick={() => setActiveTab('shop')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 flex-1",
            activeTab === 'shop'
              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Shop Produkte</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {shopInterests.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('drop')}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 flex-1",
            activeTab === 'drop'
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Gift className="w-4 h-4" />
          <span>Drops</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {dropInterests.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'shop' ? renderShopInterests() : renderDropInterests()}
        </motion.div>
      </AnimatePresence>

      {/* Enhanced Analytics & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interest Analytics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Interesse Analytics
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{shopInterests.length}</div>
                  <div className="text-sm text-blue-300">Shop Produkte</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>+3 diese Woche</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-xl border border-purple-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Gift className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{dropInterests.length}</div>
                  <div className="text-sm text-purple-300">Drops</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>+1 diese Woche</span>
              </div>
            </motion.div>
          </div>

          {/* Interest Trends */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Deine Trends
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Flame className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Sneaker Enthusiast</p>
                    <p className="text-xs text-gray-400">Du liebst Sneaker-Drops</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-green-400">85%</div>
                  <div className="text-xs text-gray-400">Match</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Limited Edition Jäger</p>
                    <p className="text-xs text-gray-400">Du suchst seltene Items</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-400">92%</div>
                  <div className="text-xs text-gray-400">Match</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Recommendations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Smart Empfehlungen
          </h3>

          {/* Recommended Products */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Für dich empfohlen
            </h4>
            <div className="space-y-3">
              {[
                { name: "Nike Air Jordan 1 Retro", price: "€180", match: "95%", reason: "Basierend auf deinen Sneaker-Interessen" },
                { name: "Adidas Yeezy Boost 350", price: "€220", match: "88%", reason: "Ähnlich zu deinen gespeicherten Drops" },
                { name: "Off-White x Nike Dunk", price: "€300", match: "92%", reason: "Limited Edition - passt zu deinem Style" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{item.price}</div>
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-green-400">{item.match}</div>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-3 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-white">Smart Filter</span>
              </div>
              <p className="text-xs text-green-300">Basierend auf deinen Interessen</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-3 bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Filter className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Trends</span>
              </div>
              <p className="text-xs text-purple-300">Was ist gerade angesagt</p>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};
