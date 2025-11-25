import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/DropdownMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import {
  Truck,
  Package,
  Download,
  Printer,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Calculator,
  Settings,
  BarChart3,
  ArrowLeft,
  AlertCircle,
  FileText,
  Mail
} from 'lucide-react';
import { shippingApi, Order, ShippingLabel, ShippingReturn, ShippingTracking, ShippingStats, ShippingProvider } from '../../lib/api/ecommerce';
import { useErrorHandler } from '../../lib/hooks/useErrorHandler';
import { usePerformanceMonitor } from '../../lib/hooks/usePerformanceMonitor';
import { logger } from '../../lib/logger';
import { motion } from 'framer-motion';
import { springConfigs } from '../../utils/springConfigs';

export function ShippingManagement() {
  const { measureAsync } = usePerformanceMonitor('ShippingManagement');
  const { handleError } = useErrorHandler('ShippingManagement');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'ready' | 'tracking' | 'returns' | 'providers' | 'calculator'>('overview');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');

  // Fetch shipping stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['shipping', 'stats'],
    queryFn: () => shippingApi.getShippingStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
    onError: (error) => {
      handleError(error, { operation: 'fetch_shipping_stats' });
    },
  });

  // Fetch orders ready for shipping
  const { data: readyOrdersData, isLoading: readyOrdersLoading, error: readyOrdersError } = useQuery({
    queryKey: ['shipping', 'ready', carrierFilter],
    queryFn: () => shippingApi.getOrdersReadyForShipping({ carrier: carrierFilter !== 'all' ? carrierFilter : undefined, limit: 100 }),
    retry: 2,
    onError: (error) => {
      handleError(error, { operation: 'fetch_ready_orders' });
    },
  });

  // Fetch shipping providers
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['shipping', 'providers'],
    queryFn: () => shippingApi.getShippingProviders(),
  });

  // Fetch returns
  const { data: returnsData, isLoading: returnsLoading } = useQuery({
    queryKey: ['shipping', 'returns'],
    queryFn: () => shippingApi.getReturns({ limit: 50 }),
  });

  // Memoized data
  const readyOrders = useMemo(() => {
    if (!readyOrdersData) return [];
    return Array.isArray(readyOrdersData) ? readyOrdersData : readyOrdersData.data || [];
  }, [readyOrdersData]);

  const filteredReadyOrders = useMemo(() => {
    if (!searchQuery) return readyOrders;
    const query = searchQuery.toLowerCase();
    return readyOrders.filter(order => 
      order.orderId.toLowerCase().includes(query) ||
      order.customerEmail.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.trackingNumber?.toLowerCase().includes(query)
    );
  }, [readyOrders, searchQuery]);

  const returns = useMemo(() => {
    if (!returnsData) return [];
    return Array.isArray(returnsData) ? returnsData : returnsData.data || [];
  }, [returnsData]);

  // Mutations
  const createLabelMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: any }) =>
      shippingApi.createShippingLabel(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping'] });
      logger.logUserAction('shipping_label_created', {});
    },
    onError: (error) => {
      handleError(error, { operation: 'create_label' });
    },
  });

  const createBulkLabelsMutation = useMutation({
    mutationFn: ({ orderIds, data }: { orderIds: string[]; data: any }) =>
      shippingApi.createBulkShippingLabels(orderIds, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shipping'] });
      logger.logUserAction('bulk_labels_created', { count: result.success });
    },
    onError: (error) => {
      handleError(error, { operation: 'create_bulk_labels' });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: ({ orderId, trackingNumber }: { orderId: string; trackingNumber?: string }) =>
      shippingApi.sendShippingNotification(orderId, trackingNumber),
    onSuccess: () => {
      logger.logUserAction('shipping_notification_sent', {});
    },
    onError: (error) => {
      handleError(error, { operation: 'send_notification' });
    },
  });

  const processReturnMutation = useMutation({
    mutationFn: ({ returnId, action, refundAmount }: { returnId: string; action: 'approve' | 'reject'; refundAmount?: number }) =>
      shippingApi.processReturn(returnId, action, refundAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping', 'returns'] });
      logger.logUserAction('return_processed', {});
    },
    onError: (error) => {
      handleError(error, { operation: 'process_return' });
    },
  });

  // Handlers
  const handleCreateLabel = useCallback(async (orderId: string, carrier: string, service?: string) => {
    await measureAsync('create_label', async () => {
      await createLabelMutation.mutateAsync({
        orderId,
        data: { carrier, service }
      });
    });
  }, [measureAsync, createLabelMutation]);

  const handleCreateBulkLabels = useCallback(async (carrier: string, service?: string) => {
    if (selectedOrders.size === 0) return;
    await measureAsync('create_bulk_labels', async () => {
      await createBulkLabelsMutation.mutateAsync({
        orderIds: Array.from(selectedOrders),
        data: { carrier, service }
      });
      setSelectedOrders(new Set());
    });
  }, [measureAsync, createBulkLabelsMutation, selectedOrders]);

  const handleSendNotification = useCallback(async (orderId: string, trackingNumber?: string) => {
    await measureAsync('send_notification', async () => {
      await sendNotificationMutation.mutateAsync({ orderId, trackingNumber });
    });
  }, [measureAsync, sendNotificationMutation]);

  const handleProcessReturn = useCallback(async (returnId: string, action: 'approve' | 'reject', refundAmount?: number) => {
    await measureAsync('process_return', async () => {
      await processReturnMutation.mutateAsync({ returnId, action, refundAmount });
    });
  }, [measureAsync, processReturnMutation]);

  const handleOrderSelect = useCallback((orderId: string, checked: boolean) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.size === filteredReadyOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredReadyOrders.map(o => o.id)));
    }
  }, [selectedOrders.size, filteredReadyOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-400 bg-green-400/20';
      case 'in_transit': return 'text-blue-400 bg-blue-400/20';
      case 'out_for_delivery': return 'text-purple-400 bg-purple-400/20';
      case 'exception': return 'text-red-400 bg-red-400/20';
      case 'returned': return 'text-orange-400 bg-orange-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getReturnStatusColor = (status: string) => {
    switch (status) {
      case 'refunded': return 'text-green-400 bg-green-400/20';
      case 'received': return 'text-blue-400 bg-blue-400/20';
      case 'approved': return 'text-purple-400 bg-purple-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      case 'in_transit': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-orbitron text-white">DHL / HERMES / DPS / UPS Versandverwaltung</h1>
          <p className="text-muted mt-1">Verwalte Sendungen, Tracking und Retouren mit deutschen Versanddienstleistern</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['shipping'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="ready">Versandbereit</TabsTrigger>
          <TabsTrigger value="tracking">Sendungsverfolgung</TabsTrigger>
          <TabsTrigger value="returns">Retouren</TabsTrigger>
          <TabsTrigger value="providers">Versanddienstleister</TabsTrigger>
          <TabsTrigger value="calculator">Kostenrechner</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          {statsError && (
            <Card className="p-6 border-red-500/20 bg-red-500/10">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p>Failed to load shipping statistics. Please try again.</p>
              </div>
            </Card>
          )}
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-800" />
              ))}
            </div>
          ) : stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfigs.gentle, delay: 0 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted">Gesamte Sendungen</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.totalShipments}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-500/20">
                      <Truck className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfigs.gentle, delay: 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted">Ausstehend</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.pendingShipments}</p>
                    </div>
                    <div className="p-3 rounded-full bg-yellow-500/20">
                      <Clock className="h-6 w-6 text-yellow-400" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfigs.gentle, delay: 0.2 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted">Unterwegs</p>
                      <p className="text-2xl font-bold text-white mt-1">{stats.inTransitShipments}</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-500/20">
                      <Package className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfigs.gentle, delay: 0.3 }}
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted">Gesamtkosten</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        €{stats.totalShippingCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500/20">
                      <BarChart3 className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Additional Stats */}
          {stats && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Sendungen nach Versanddienstleister</h3>
                <div className="space-y-3">
                  {stats.byCarrier.map((carrier, index) => (
                    <motion.div
                      key={carrier.carrier}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springConfigs.gentle, delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    >
                      <div>
                        <p className="font-medium text-white">{carrier.carrier}</p>
                        <p className="text-sm text-muted">{carrier.count} Sendungen</p>
                      </div>
                      <p className="font-semibold text-neon">€{carrier.cost.toFixed(2)}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Leistungsmetriken</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted">Durchschnittliche Lieferzeit</p>
                      <p className="font-semibold text-white">{stats.averageDeliveryTime} Tage</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted">Durchschnittliche Versandkosten</p>
                      <p className="font-semibold text-white">€{stats.averageShippingCost.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted">Zugestellt</p>
                      <p className="font-semibold text-green-400">{stats.deliveredShipments}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted">Retouren</p>
                      <p className="font-semibold text-orange-400">{stats.returnedShipments}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Ready to Ship Tab */}
        <TabsContent value="ready" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder="Bestellungen suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            >
              <option value="all">Alle Versanddienstleister</option>
              <option value="dhl">DHL</option>
              <option value="hermes">HERMES</option>
              <option value="dps">DPS</option>
              <option value="ups">UPS</option>
            </select>
            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedOrders.size} ausgewählt</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Printer className="h-4 w-4 mr-2" />
                      Massenaktionen
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleCreateBulkLabels('dhl')}>
                      DHL Paketlabel erstellen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCreateBulkLabels('hermes')}>
                      HERMES Paketlabel erstellen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCreateBulkLabels('dps')}>
                      DPS Paketlabel erstellen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCreateBulkLabels('ups')}>
                      UPS Paketlabel erstellen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Orders Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === filteredReadyOrders.length && filteredReadyOrders.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-white/20"
                    />
                  </TableHead>
                  <TableHead>Bestellnummer</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readyOrdersLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredReadyOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted">
                      Keine versandbereiten Bestellungen
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReadyOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={(e) => handleOrderSelect(order.id, e.target.checked)}
                          className="rounded border-white/20"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{order.customerName}</p>
                          <p className="text-sm text-muted">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.items.length} item(s)</TableCell>
                      <TableCell>€{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={order.status === 'processing' ? 'text-yellow-400 border-yellow-400/30' : ''}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleCreateLabel(order.id, 'dhl')}>
                                DHL Paketlabel (Paket/Express/Same Day)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateLabel(order.id, 'hermes')}>
                                HERMES Paketlabel (PaketShop/Abholung)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateLabel(order.id, 'dps')}>
                                DPS Paketlabel (Standard/Express)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateLabel(order.id, 'ups')}>
                                UPS Paketlabel (Standard/Express/Express Plus)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendNotification(order.id)}>
                                Versandbenachrichtigung senden
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card className="p-6">
            <p className="text-muted">Sendungsverfolgung wird implementiert...</p>
            <p className="text-sm text-muted mt-2">
              Sendungen verfolgen, Lieferstatus anzeigen und Ausnahmen verwalten
            </p>
          </Card>
        </TabsContent>

        {/* Returns Tab */}
        <TabsContent value="returns" className="space-y-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Retourennr.</TableHead>
                  <TableHead>Bestellnr.</TableHead>
                  <TableHead>Grund</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Angefragt</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted">
                      Keine Retouren gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((returnItem) => (
                    <TableRow key={returnItem.id}>
                      <TableCell className="font-medium">{returnItem.returnNumber}</TableCell>
                      <TableCell>{returnItem.orderId}</TableCell>
                      <TableCell className="text-sm text-muted">{returnItem.reason}</TableCell>
                      <TableCell>
                        <Badge className={getReturnStatusColor(returnItem.status)}>
                          {returnItem.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(returnItem.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {returnItem.status === 'requested' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProcessReturn(returnItem.id, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProcessReturn(returnItem.id, 'reject')}
                              >
                                <XCircle className="h-4 w-4 text-red-400" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          {providersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-800" />
              ))}
            </div>
          ) : providers && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Card key={provider.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white">{provider.name}</h3>
                      <p className="text-sm text-muted">{provider.code}</p>
                    </div>
                    <Badge variant={provider.enabled ? 'default' : 'outline'}>
                      {provider.enabled ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted">
                      {provider.services.filter(s => s.enabled).length} Services aktiv
                    </p>
                    <p className="text-sm text-muted">
                      Testmodus: {provider.testMode ? 'Ja' : 'Nein'}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Konfigurieren
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Versandkostenrechner</h3>
            <p className="text-muted">Berechne Versandkosten für verschiedene Dienstleister und Services</p>
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-muted mb-2 block">Von Land</label>
                  <Input placeholder="DE" />
                </div>
                <div>
                  <label className="text-sm text-muted mb-2 block">Nach Land</label>
                  <Input placeholder="AT" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted mb-2 block">Gewicht (kg)</label>
                <Input type="number" placeholder="1.5" />
              </div>
              <Button>
                <Calculator className="h-4 w-4 mr-2" />
                Kosten berechnen
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

