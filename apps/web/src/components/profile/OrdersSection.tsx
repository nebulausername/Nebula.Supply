import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  ShoppingBag, 
  Gift, 
  Calendar, 
  Euro, 
  Truck, 
  CreditCard,
  Filter,
  ChevronDown,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  Target,
  Search,
  Loader2
} from 'lucide-react';
import { useShopStore } from '../../store/shop';
import { useDropsStore } from '../../store/drops';
import { cn } from '../../utils/cn';
import { useMobileOptimizations } from '../MobileOptimizations';

interface UnifiedOrder {
  id: string;
  type: 'shop' | 'drop';
  date: string;
  status: 'paid' | 'pending' | 'completed' | 'cancelled';
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  paymentMethod?: string;
  trackingNumber?: string;
  shippingAddress?: string;
}

type FilterType = 'all' | 'shop' | 'drop';

export const OrdersSection = () => {
  const { isMobile } = useMobileOptimizations();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Get data from stores
  const shopOrders = useShopStore((state) => state.orders);
  const shopLoading = useShopStore((state) => state.isLoading);
  const dropReservations = useDropsStore((state) => state.reservationHistory);
  
  // Check if data is loading
  const isLoading = shopLoading;

  // Transform shop orders
  const transformedShopOrders: UnifiedOrder[] = shopOrders.map(order => ({
    id: order.id,
    type: 'shop',
    date: order.createdAt,
    status: order.status === 'paid' ? 'completed' : 'pending',
    total: order.total,
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.unitPrice,
    })),
    paymentMethod: order.payment.method,
  }));

  // Transform drop reservations
  const transformedDropOrders: UnifiedOrder[] = dropReservations.map(reservation => ({
    id: reservation.id,
    type: 'drop',
    date: reservation.createdAt,
    status: reservation.status === 'confirmed' ? 'completed' : 'pending',
    total: reservation.totalPrice,
    items: [{
      name: reservation.dropName,
      quantity: reservation.quantity,
      price: reservation.unitPrice,
    }],
  }));

  // Combine and sort orders - memoized for performance
  const allOrders = useMemo(() => {
    return [...transformedShopOrders, ...transformedDropOrders]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transformedShopOrders, transformedDropOrders]);

  // Filter and search orders - optimized with memoization
  const filteredOrders = useMemo(() => {
    let filtered = allOrders;
    
    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.type === activeFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const normalized = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => {
        return (
          order.id.toLowerCase().includes(normalized) ||
          order.items.some(item => item.name.toLowerCase().includes(normalized)) ||
          order.status.toLowerCase().includes(normalized) ||
          order.paymentMethod?.toLowerCase().includes(normalized) ||
          order.trackingNumber?.toLowerCase().includes(normalized)
        );
      });
    }
    
    return filtered;
  }, [allOrders, activeFilter, statusFilter, searchQuery]);

  // Memoize helper functions for performance
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'Abgeschlossen';
      case 'pending': return 'Ausstehend';
      case 'cancelled': return 'Storniert';
      default: return 'Unbekannt';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10';
      case 'pending': return 'text-yellow-400 bg-yellow-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    return type === 'shop' ? <ShoppingBag className="w-5 h-5" /> : <Gift className="w-5 h-5" />;
  }, []);

  const getTypeColor = useCallback((type: string) => {
    return type === 'shop' ? 'text-blue-400' : 'text-purple-400';
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6" role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-gray-400">Bestellungen werden geladen...</p>
          </div>
        </div>
        {/* Loading Skeletons */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (allOrders.length === 0) {
    return (
      <div className="space-y-6" role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Keine Bestellungen</h3>
          <p className="text-gray-400 mb-6">Du hast noch keine Bestellungen aufgegeben</p>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200">
            Zum Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="tabpanel" id="panel-orders" aria-labelledby="tab-orders">
      {/* Header with Search and Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Meine Bestellungen</h2>
            <p className="text-gray-400 text-sm mt-1">{filteredOrders.length} von {allOrders.length} Bestellungen</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              "bg-slate-800/50 hover:bg-slate-700/50 text-white border border-slate-600/50"
            )}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
          </button>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'completed', label: 'Abgeschlossen', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
            { value: 'pending', label: 'Ausstehend', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
            { value: 'cancelled', label: 'Storniert', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
          ].map((status) => (
            <motion.button
              key={status.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(statusFilter === status.value ? null : status.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all touch-target",
                statusFilter === status.value
                  ? `${status.color} border-opacity-50 shadow-lg`
                  : "bg-slate-700/30 text-gray-300 border-slate-600/30 hover:bg-slate-700/50"
              )}
              aria-label={`Filter nach Status: ${status.label}`}
              aria-pressed={statusFilter === status.value}
            >
              {status.label}
            </motion.button>
          ))}
        </div>

        {/* Search Bar with View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isMobile ? "Suchen..." : "Nach Bestellnummer, Artikel oder Status suchen..."}
              className={cn(
                "w-full pl-10 pr-3 bg-slate-800/60 border border-slate-700/60 rounded-xl text-sm text-gray-200 placeholder:text-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/10 touch-target",
                isMobile ? "py-2 text-sm" : "py-2.5"
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-colors touch-target",
                viewMode === 'grid'
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : "bg-slate-700/50 text-gray-300 border border-slate-600/30 hover:bg-slate-600/50"
              )}
              aria-label="Grid-Ansicht"
              aria-pressed={viewMode === 'grid'}
            >
              <Package className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "p-2 rounded-lg transition-colors touch-target",
                viewMode === 'timeline'
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                  : "bg-slate-700/50 text-gray-300 border border-slate-600/30 hover:bg-slate-600/50"
              )}
              aria-label="Timeline-Ansicht"
              aria-pressed={viewMode === 'timeline'}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
              {[
                { id: 'all', label: 'Alle', icon: Package },
                { id: 'shop', label: 'Shop', icon: ShoppingBag },
                { id: 'drop', label: 'Drops', icon: Gift }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id as FilterType)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                    activeFilter === filter.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "bg-slate-700/50 text-gray-300 hover:bg-slate-600/50"
                  )}
                >
                  <filter.icon className="w-4 h-4" />
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders List */}
      <div className={cn(
        viewMode === 'grid' ? "space-y-4" : "relative"
      )}>
        {filteredOrders.length === 0 && searchQuery && (
          <div className="p-6 bg-slate-800/40 border border-slate-700/40 rounded-xl text-center">
            <p className="text-gray-300">Keine Bestellungen für "{searchQuery}" gefunden.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300 touch-target"
              aria-label="Suche zurücksetzen"
            >
              Suche zurücksetzen
            </button>
          </div>
        )}
        {viewMode === 'timeline' ? (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/30 via-blue-500/30 to-green-500/30" />
            <div className="space-y-6">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative flex gap-4"
                >
                  {/* Timeline Dot */}
                  <div className={cn(
                    "relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center border-2",
                    order.status === 'completed' ? "bg-green-500/20 border-green-500/50" :
                    order.status === 'pending' ? "bg-yellow-500/20 border-yellow-500/50" :
                    "bg-red-500/20 border-red-500/50"
                  )}>
                    <div className={cn("p-2 rounded-lg", getTypeColor(order.type))}>
                      {getTypeIcon(order.type)}
                    </div>
                  </div>
                  
                  {/* Order Card */}
                  <div className="flex-1">
                    <motion.div
                      layout
                      className={cn(
                        "relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer",
                        "bg-gradient-to-br from-slate-900/80 to-slate-800/40 border-slate-600/30",
                        "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10"
                      )}
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">#{order.id}</h3>
                              <span className="text-xs text-gray-400">{order.type === 'shop' ? 'Shop' : 'Drop'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(order.date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Euro className="w-4 h-4" />
                                <span>{formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <span className="text-sm font-medium text-white">
                              {getStatusText(order.status)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{order.items.length} Artikel</span>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-slate-600/30 bg-slate-800/20"
                          >
                            <div className="p-4 space-y-4">
                              {/* Items */}
                              <div>
                                <h4 className="font-semibold text-white mb-3">Artikel</h4>
                                <div className="space-y-2">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                                      <div>
                                        <p className="font-medium text-white">{item.name}</p>
                                        <p className="text-sm text-gray-400">Menge: {item.quantity}</p>
                                      </div>
                                      <span className="font-semibold text-white">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Payment & Shipping Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {order.paymentMethod && (
                                  <div className="p-4 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CreditCard className="w-4 h-4 text-blue-400" />
                                      <h5 className="font-semibold text-white">Zahlung</h5>
                                    </div>
                                    <p className="text-sm text-gray-400">{order.paymentMethod}</p>
                                  </div>
                                )}
                                
                                {order.trackingNumber && (
                                  <div className="p-4 bg-slate-700/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Truck className="w-4 h-4 text-green-400" />
                                      <h5 className="font-semibold text-white">Tracking</h5>
                                    </div>
                                    <p className="text-sm text-gray-400">{order.trackingNumber}</p>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-4">
                                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors touch-target">
                                  <ExternalLink className="w-4 h-4" />
                                  Details anzeigen
                                </button>
                                {order.status === 'pending' && (
                                  <button className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors touch-target">
                                    Stornieren
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
                "bg-gradient-to-br from-slate-900/80 to-slate-800/40 border-slate-600/30",
                "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10"
              )}
            >
              {/* Order Header */}
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl bg-slate-800/50", getTypeColor(order.type))}>
                      {getTypeIcon(order.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">#{order.id}</h3>
                        <span className="text-xs text-gray-400">{order.type === 'shop' ? 'Shop' : 'Drop'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4" />
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium text-white">
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <ChevronDown className={cn(
                      "w-5 h-5 text-gray-400 transition-transform",
                      expandedOrder === order.id && "rotate-180"
                    )} />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedOrder === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-600/30 bg-slate-800/20"
                  >
                    <div className="p-6 space-y-4">
                      {/* Items */}
                      <div>
                        <h4 className="font-semibold text-white mb-3">Artikel</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                              <div>
                                <p className="font-medium text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">Menge: {item.quantity}</p>
                              </div>
                              <span className="font-semibold text-white">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Payment & Shipping Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.paymentMethod && (
                          <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="w-4 h-4 text-blue-400" />
                              <h5 className="font-semibold text-white">Zahlung</h5>
                            </div>
                            <p className="text-sm text-gray-400">{order.paymentMethod}</p>
                          </div>
                        )}
                        
                        {order.trackingNumber && (
                          <div className="p-4 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="w-4 h-4 text-green-400" />
                              <h5 className="font-semibold text-white">Tracking</h5>
                            </div>
                            <p className="text-sm text-gray-400">{order.trackingNumber}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                          Details anzeigen
                        </button>
                        {order.status === 'pending' && (
                          <button className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors">
                            Stornieren
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>

      {/* Enhanced Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Analytics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Bestellungs-Analytics
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{allOrders.length}</div>
                  <div className="text-sm text-blue-300">Gesamt Orders</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>+12% diese Woche</span>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Euro className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(allOrders.reduce((sum, order) => sum + order.total, 0))}
                  </div>
                  <div className="text-sm text-green-300">Gesamtausgaben</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>+8% diese Woche</span>
              </div>
            </motion.div>
          </div>

          {/* Order Status Distribution */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              Status Verteilung
            </h4>
            <div className="space-y-2">
              {[
                { status: 'completed', label: 'Abgeschlossen', count: allOrders.filter(o => o.status === 'completed').length, color: 'text-green-400' },
                { status: 'pending', label: 'Ausstehend', count: allOrders.filter(o => o.status === 'pending').length, color: 'text-yellow-400' },
                { status: 'cancelled', label: 'Storniert', count: allOrders.filter(o => o.status === 'cancelled').length, color: 'text-red-400' }
              ].map((item) => {
                const percentage = allOrders.length > 0 ? (item.count / allOrders.length) * 100 : 0;
                return (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                      <span className="text-sm text-gray-300">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color.replace('text-', 'bg-')}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity & Insights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Aktivitäten & Insights
          </h3>

          {/* Recent Orders Timeline */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-600/30">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Letzte Aktivitäten
            </h4>
            <div className="space-y-3">
              {allOrders.slice(0, 3).map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${order.type === 'shop' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
                    {order.type === 'shop' ? <ShoppingBag className="w-4 h-4 text-blue-400" /> : <Gift className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">#{order.id}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatPrice(order.total)}</p>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-purple-900/20 to-violet-900/20 rounded-xl border border-purple-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Durchschnitt</span>
              </div>
              <div className="text-xl font-bold text-white">
                {allOrders.length > 0 ? formatPrice(allOrders.reduce((sum, order) => sum + order.total, 0) / allOrders.length) : '€0'}
              </div>
              <div className="text-xs text-purple-300">pro Bestellung</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-br from-orange-900/20 to-amber-900/20 rounded-xl border border-orange-500/20"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-semibold text-white">Erfolgsrate</span>
              </div>
              <div className="text-xl font-bold text-white">
                {allOrders.length > 0 ? Math.round((allOrders.filter(o => o.status === 'completed').length / allOrders.length) * 100) : 0}%
              </div>
              <div className="text-xs text-orange-300">erfolgreiche Orders</div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
