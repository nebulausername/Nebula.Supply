import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import type { Drop as WebDrop, DropVariant as WebVariant, DropShippingOption as WebShippingOption } from '@nebula/shared';

// Import real drops from web app with error handling
let webDrops: WebDrop[] = [];
try {
  // Try to import drops from web app
  const dropsModule = require('../../../../web/src/data/drops');
  webDrops = dropsModule.drops || [];
} catch (error) {
  console.warn('⚠️  Could not load drops from web app, using empty array:', error);
  // Fallback: empty array - drops will be initialized empty
  webDrops = [];
}
import { io } from '../../index';
import { adminOnly } from '../../middleware/auth';
import { sendPaymentNotifications, getPreorderUserIds } from '../../services/paymentNotification';
import { shopRealtimeEvents } from '../../websocket/shopEvents';
import type { DropUpdatedEvent, DropCreatedEvent, DropDeletedEvent, DropStockChangedEvent, DropStatusChangedEvent } from '../../websocket/events/dropEvents';

const router = Router();

// Rate limiting for admin operations - optimized for better performance
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for admin
  message: {
    error: 'Too many admin requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for localhost in development
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1');
  },
  // Enhanced error handling
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many admin requests',
      message: 'Please try again later.',
      retryAfter: Math.ceil(15 * 60 * 1000 / 1000) // seconds
    });
  }
});

// Apply rate limiting to all admin routes
router.use(adminRateLimit);

// Types for admin operations
interface Variant {
  id?: string;
  label: string;
  basePrice: number;
  stock: number;
  sold?: number;
  sku?: string;
  image?: string;
  description?: string;
}

interface ShippingOption {
  method: string;
  price: number;
  estimatedDays: number;
}

interface Drop {
  id: string;
  name: string;
  description?: string;
  badge?: string;
  access: 'free' | 'limited' | 'vip' | 'standard';
  status: 'active' | 'inactive' | 'sold_out' | 'scheduled';
  scheduledDate?: string;
  variants: Variant[];
  shipping?: ShippingOption[];
  interestCount?: number;
  createdAt?: string;
  updatedAt?: string;
  // Extended fields from web drops
  progress?: number; // 0-1 for live progress
  flavorTag?: string; // Mint, Peach, Berry, etc.
  heroImageUrl?: string;
  quantityPacks?: Array<{id: string; label: string; quantity: number; description?: string; highlight?: string}>;
  maxPerUser?: number;
  inviteRequired?: boolean;
  locale?: string;
  minimumOrders?: number;
  currentOrders?: number;
  preorderStatus?: string;
  autoOrderOnReach?: boolean;
  preorderDeadline?: string;
}

interface CreateDropRequest {
  name: string;
  description?: string;
  badge?: string;
  access: 'free' | 'limited' | 'vip' | 'standard';
  status: 'active' | 'inactive' | 'sold_out' | 'scheduled';
  scheduledDate?: string;
  variants: Variant[];
  shipping?: ShippingOption[];
}

interface UpdateDropRequest extends Partial<CreateDropRequest> {}

// Helper functions for drop calculations - optimized
const generateUniqueId = (prefix: string): string => 
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

// Optimized stats calculation with single pass
const calculateDropStats = (drop: Drop) => {
  let totalStock = 0;
  let soldCount = 0;
  let revenue = 0;
  
  // Single pass through variants for better performance
  for (const variant of drop.variants) {
    totalStock += variant.stock;
    const sold = variant.sold || 0;
    soldCount += sold;
    revenue += sold * variant.basePrice;
  }
  
  return { totalStock, soldCount, revenue };
};

const enrichDropWithAdminData = (drop: Drop) => ({
  ...drop,
  ...getCachedStats(drop)
});

// Queue for updates during maintenance mode
interface QueuedUpdate {
  id: string;
  event: string;
  data: any;
  timestamp: string;
  adminId?: string;
}

let updateQueue: QueuedUpdate[] = [];

// Import maintenance status (shared state - in production use proper service)
// For now, we'll create a simple shared state that can be updated
let maintenanceStatusCache: { isActive: boolean; lastChecked: number } = {
  isActive: false,
  lastChecked: Date.now()
};

// Get maintenance status (checks cache, updates every 5 seconds)
const getMaintenanceStatus = async (): Promise<{ isActive: boolean }> => {
  try {
    // Check cache first (valid for 5 seconds)
    const now = Date.now();
    if (now - maintenanceStatusCache.lastChecked < 5000) {
      return { isActive: maintenanceStatusCache.isActive };
    }

    // Fetch fresh status (in production, this would be from a service or database)
    // For now, we'll try to fetch from the status route
    try {
      const response = await fetch('http://localhost:3001/api/status/status');
      if (response.ok) {
        const status = await response.json();
        maintenanceStatusCache = {
          isActive: status.isActive || false,
          lastChecked: now
        };
        return { isActive: maintenanceStatusCache.isActive };
      }
    } catch (fetchError) {
      // If fetch fails, use cache or default
      console.warn('Failed to fetch maintenance status, using cache:', fetchError);
    }

    return { isActive: maintenanceStatusCache.isActive };
  } catch (error) {
    console.warn('Failed to check maintenance status:', error);
    return { isActive: false }; // Default to not in maintenance on error
  }
};

// Check if user is admin (simplified - in production use proper auth)
const isAdminUser = (req: any): boolean => {
  return req.user?.role === 'admin' || req.user?.isAdmin === true;
};

// Enhanced broadcast function with maintenance mode support
const broadcastDropEvent = async (req: any, eventType: string, eventData: any) => {
  try {
    const maintenanceStatus = await getMaintenanceStatus();
    const isAdmin = isAdminUser(req);

    // Always send to admin users, even during maintenance
    if (isAdmin) {
      // Use shopRealtimeEvents for proper event structure
      switch (eventType) {
        case 'drop:created':
          shopRealtimeEvents.dropCreated(eventData as DropCreatedEvent);
          break;
        case 'drop:updated':
          shopRealtimeEvents.dropUpdated(eventData as DropUpdatedEvent);
          break;
        case 'drop:deleted':
          shopRealtimeEvents.dropDeleted(eventData as DropDeletedEvent);
          break;
        case 'drop:stock_changed':
          shopRealtimeEvents.dropStockChanged(eventData as DropStockChangedEvent);
          break;
        case 'drop:status_changed':
          shopRealtimeEvents.dropStatusChanged(eventData as DropStatusChangedEvent);
          break;
        case 'drop:progress_updated':
          // New event for progress updates
          if (io) {
            io.emit('drop:progress_updated', eventData);
          }
          break;
        default:
          // Fallback to direct emit
          if (io) {
            io.emit(eventType, eventData);
          }
      }
    }

    // For non-admin users: queue during maintenance, broadcast otherwise
    if (maintenanceStatus.isActive && !isAdmin) {
      // Queue the update for later
      updateQueue.push({
        id: `${eventType}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        event: eventType,
        data: eventData,
        timestamp: new Date().toISOString(),
        adminId: req.user?.id
      });
    } else if (!maintenanceStatus.isActive) {
      // Broadcast to all users when not in maintenance
      switch (eventType) {
        case 'drop:created':
          shopRealtimeEvents.dropCreated(eventData as DropCreatedEvent);
          break;
        case 'drop:updated':
          shopRealtimeEvents.dropUpdated(eventData as DropUpdatedEvent);
          break;
        case 'drop:deleted':
          shopRealtimeEvents.dropDeleted(eventData as DropDeletedEvent);
          break;
        case 'drop:stock_changed':
          shopRealtimeEvents.dropStockChanged(eventData as DropStockChangedEvent);
          break;
        case 'drop:status_changed':
          shopRealtimeEvents.dropStatusChanged(eventData as DropStatusChangedEvent);
          break;
        case 'drop:progress_updated':
          if (io) {
            io.emit('drop:progress_updated', eventData);
          }
          break;
        default:
          if (io) {
            io.emit(eventType, eventData);
          }
      }
    }
  } catch (error) {
    console.warn(`Failed to broadcast ${eventType} event:`, error);
    // Don't throw - broadcast failures shouldn't break the API
  }
};

// Function to flush queued updates (called after maintenance ends)
const flushQueuedUpdates = async () => {
  if (updateQueue.length === 0) return;

  const updates = [...updateQueue];
  updateQueue = []; // Clear queue

  for (const queuedUpdate of updates) {
    try {
      switch (queuedUpdate.event) {
        case 'drop:created':
          shopRealtimeEvents.dropCreated(queuedUpdate.data as DropCreatedEvent);
          break;
        case 'drop:updated':
          shopRealtimeEvents.dropUpdated(queuedUpdate.data as DropUpdatedEvent);
          break;
        case 'drop:deleted':
          shopRealtimeEvents.dropDeleted(queuedUpdate.data as DropDeletedEvent);
          break;
        case 'drop:stock_changed':
          shopRealtimeEvents.dropStockChanged(queuedUpdate.data as DropStockChangedEvent);
          break;
        case 'drop:status_changed':
          shopRealtimeEvents.dropStatusChanged(queuedUpdate.data as DropStatusChangedEvent);
          break;
        case 'drop:progress_updated':
          if (io) {
            io.emit('drop:progress_updated', queuedUpdate.data);
          }
          break;
        default:
          if (io) {
            io.emit(queuedUpdate.event, queuedUpdate.data);
          }
      }
    } catch (error) {
      console.warn(`Failed to flush queued update ${queuedUpdate.id}:`, error);
    }
  }
};

// Legacy safeBroadcast for backward compatibility
const safeBroadcast = (io: any, event: string, data: any) => {
  if (!io) return;
  
  try {
    io.emit(event, data);
  } catch (error) {
    console.warn(`Failed to broadcast ${event} event:`, error);
    // Don't throw - broadcast failures shouldn't break the API
  }
};

// Convert Web Drop format to Admin Drop format
const convertWebDropToAdminDrop = (webDrop: WebDrop): Drop => {
  // Convert variants
  const variants: Variant[] = webDrop.variants.map((v: WebVariant) => ({
    id: v.id,
    label: v.label,
    basePrice: v.basePrice,
    stock: v.stock,
    sold: 0, // Initialize sold count
    sku: v.id, // Use variant ID as SKU
    image: v.media?.[0]?.url,
    description: v.description
  }));

  // Convert shipping options
  const shipping: ShippingOption[] = (webDrop.shippingOptions || []).map((s: WebShippingOption) => {
    // Extract estimated days from leadTime (e.g., "1-2 Tage" -> 2, "24h" -> 1)
    let estimatedDays = 3; // default
    if (s.leadTime) {
      const match = s.leadTime.match(/(\d+)/);
      if (match) {
        estimatedDays = parseInt(match[1]);
        if (s.leadTime.includes('h')) {
          estimatedDays = 1; // Same day or next day for hours
        }
      }
    }
    
    return {
      method: s.label || 'Standard',
      price: s.price || 0,
      estimatedDays
    };
  });

  // Map status
  let status: 'active' | 'inactive' | 'sold_out' | 'scheduled' = 'active';
  if (webDrop.status === 'locked') {
    status = 'scheduled';
  } else if (webDrop.status === 'available') {
    status = 'active';
  } else {
    status = 'inactive';
  }

  // Calculate initial sold count based on progress
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const progress = webDrop.progress || 0;
  const estimatedSold = Math.floor(totalStock * progress);
  
  // Distribute sold count across variants proportionally
  if (estimatedSold > 0 && totalStock > 0) {
    variants.forEach(v => {
      const proportion = v.stock / totalStock;
      v.sold = Math.floor(estimatedSold * proportion);
    });
  }

  return {
    id: webDrop.id,
    name: webDrop.name,
    description: webDrop.shortDescription || webDrop.name,
    badge: webDrop.badge,
    access: webDrop.access,
    status,
    scheduledDate: undefined,
    variants,
    shipping: shipping.length > 0 ? shipping : undefined,
    interestCount: webDrop.interestCount || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Extended fields
    progress: webDrop.progress,
    flavorTag: webDrop.flavorTag,
    heroImageUrl: webDrop.heroImageUrl,
    quantityPacks: webDrop.quantityPacks,
    maxPerUser: webDrop.maxPerUser,
    inviteRequired: webDrop.inviteRequired,
    locale: webDrop.locale
  };
};

// Initialize drops with all drops from web app
const initializeDrops = (): Drop[] => {
  // If no drops loaded, return empty array
  if (!webDrops || webDrops.length === 0) {
    console.warn('⚠️  No drops loaded from web app, initializing with empty array');
    return [];
  }

  // Load ALL drops from web app (no filtering)
  console.log(`✅ Loading ${webDrops.length} drops into admin dashboard`);
  
  // Convert all drops to admin format
  return webDrops.map(convertWebDropToAdminDrop);
};

// In-memory storage for drops (in production, this would be a database)
let drops: Drop[] = initializeDrops();

// Cache for drop statistics to improve performance
interface DropStatsCache {
  [dropId: string]: {
    stats: ReturnType<typeof calculateDropStats>;
    timestamp: number;
  };
}

const statsCache: DropStatsCache = {};
const CACHE_TTL = 30 * 1000; // 30 seconds cache TTL

// Get cached stats or calculate new ones
const getCachedStats = (drop: Drop) => {
  const cached = statsCache[drop.id];
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.stats;
  }
  
  const stats = calculateDropStats(drop);
  statsCache[drop.id] = { stats, timestamp: now };
  return stats;
};

// Clear cache for a specific drop or all drops
const clearStatsCache = (dropId?: string) => {
  if (dropId) {
    delete statsCache[dropId];
  } else {
    Object.keys(statsCache).forEach(key => delete statsCache[key]);
  }
};

// GET /api/admin/drops - Get all drops with admin details
router.get('/', [
  query('filter').optional().isIn(['all', 'free', 'limited', 'vip', 'standard']),
  query('search').optional().isString(),
  query('sort').optional().isIn(['name', 'price', 'popularity', 'availability', 'newest', 'status']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid query parameters', details: errors.array() });
    }

    const { filter = 'all', search, sort = 'newest', limit = 20, offset = 0 } = req.query;

    let filteredDrops = [...drops];

    // Apply filtering - optimized with early return
    if (filter !== 'all') {
      const filterMap: Record<string, (drop: Drop) => boolean> = {
        free: (drop) => drop.access === 'free',
        limited: (drop) => drop.access === 'limited',
        vip: (drop) => drop.access === 'vip',
        standard: (drop) => drop.access === 'standard'
      };
      const filterFn = filterMap[filter];
      if (filterFn) {
        filteredDrops = filteredDrops.filter(filterFn);
      }
    }

    // Apply search - optimized with early termination
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredDrops = filteredDrops.filter(drop => {
        // Early return for name match (most common)
        if (drop.name.toLowerCase().includes(searchTerm)) return true;
        
        // Check badge if exists
        if (drop.badge?.toLowerCase().includes(searchTerm)) return true;
        
        // Check variants only if needed
        return drop.variants.some((v: Variant) => v.label.toLowerCase().includes(searchTerm));
      });
    }

    // Apply sorting - optimized with pre-computed values
    if (sort !== 'newest') {
      filteredDrops.sort((a, b) => {
        switch (sort) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'price': {
            // Pre-compute min prices to avoid recalculating
            const aPrice = a.variants.length > 0 ? Math.min(...a.variants.map((v: Variant) => v.basePrice)) : Infinity;
            const bPrice = b.variants.length > 0 ? Math.min(...b.variants.map((v: Variant) => v.basePrice)) : Infinity;
            return aPrice - bPrice;
          }
          case 'popularity':
            return (b.interestCount || 0) - (a.interestCount || 0);
          case 'availability': {
            // Pre-compute max stock to avoid recalculating
            const aStock = a.variants.length > 0 ? Math.max(...a.variants.map((v: Variant) => v.stock)) : 0;
            const bStock = b.variants.length > 0 ? Math.max(...b.variants.map((v: Variant) => v.stock)) : 0;
            return bStock - aStock;
          }
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
    } else {
      // Optimized newest sort with pre-computed timestamps
      filteredDrops.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }

    // Apply pagination
    const paginatedDrops = filteredDrops.slice(offset as number, (offset as number) + (limit as number));

    // Add calculated fields for admin
    const dropsWithAdminData = paginatedDrops.map(enrichDropWithAdminData);

    res.json({
      success: true,
      data: dropsWithAdminData,
      pagination: {
        total: filteredDrops.length,
        limit: limit as number,
        offset: offset as number,
        hasMore: (offset as number) + (limit as number) < filteredDrops.length
      },
      filters: {
        applied: { filter, search, sort },
        available: {
          filters: ['all', 'free', 'limited', 'vip', 'standard'],
          sorts: ['name', 'price', 'popularity', 'availability', 'newest', 'status']
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin drops:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/drops/:id - Get single drop details for admin
router.get('/:id', [
  param('id').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid drop ID', details: errors.array() });
    }

    const { id } = req.params;
    const drop = drops.find(d => d.id === id);

    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    // Add calculated fields for admin
    const dropWithAdminData = enrichDropWithAdminData(drop);

    res.json({
      success: true,
      data: dropWithAdminData
    });
  } catch (error) {
    console.error('Error fetching admin drop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/drops - Create new drop
router.post('/', [
  body('name').isString().notEmpty(),
  body('description').optional().isString(),
  body('badge').optional().isString(),
  body('access').isIn(['free', 'limited', 'vip', 'standard']),
  body('status').isIn(['active', 'inactive', 'sold_out', 'scheduled']),
  body('scheduledDate').optional().isISO8601(),
  body('variants').isArray({ min: 1 }),
  body('variants.*.label').isString().notEmpty(),
  body('variants.*.basePrice').isNumeric().isFloat({ min: 0 }),
  body('variants.*.stock').isInt({ min: 0 }),
  body('variants.*.sku').optional().isString(),
  body('variants.*.image').optional().isString(),
  body('variants.*.description').optional().isString()
], adminOnly as any, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
    }

    const dropData: CreateDropRequest = req.body;

    // Create new drop
    const newDrop: Drop = {
      id: generateUniqueId('drop'),
      name: dropData.name,
      description: dropData.description,
      badge: dropData.badge,
      access: dropData.access,
      status: dropData.status,
      scheduledDate: dropData.scheduledDate,
      variants: dropData.variants.map(variant => ({
        id: generateUniqueId('variant'),
        ...variant
      })),
      shipping: dropData.shipping || [],
      interestCount: 0,
      createdAt: new Date().toISOString()
    };

    drops.push(newDrop);

    // Broadcast drop created event with maintenance mode support
    await broadcastDropEvent(req, 'drop:created', {
      dropId: newDrop.id,
      drop: newDrop,
      timestamp: new Date().toISOString(),
      adminId: req.user?.id
    } as DropCreatedEvent);

    res.status(201).json({
      success: true,
      data: newDrop,
      message: 'Drop created successfully'
    });
  } catch (error) {
    console.error('Error creating drop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/drops/:id - Update drop
router.put('/:id', [
  param('id').isString().notEmpty(),
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('badge').optional().isString(),
  body('access').optional().isIn(['free', 'limited', 'vip', 'standard']),
  body('status').optional().isIn(['active', 'inactive', 'sold_out', 'scheduled']),
  body('scheduledDate').optional().isISO8601(),
  body('variants').optional().isArray(),
  body('shipping').optional().isArray()
], adminOnly as any, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
    }

    const { id } = req.params;
    const updateData: UpdateDropRequest = req.body;

    const dropIndex = drops.findIndex(d => d.id === id);
    if (dropIndex === -1) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    // Track changes for broadcast
    const oldDrop = { ...drops[dropIndex] };
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    // Update drop
    drops[dropIndex] = {
      ...drops[dropIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Handle variant updates
    if (updateData.variants) {
      drops[dropIndex].variants = updateData.variants.map(variant => ({
        id: variant.id || generateUniqueId('variant'),
        ...variant
      }));
    }

    // Clear cache for updated drop
    clearStatsCache(id);

    // Track changes
    Object.keys(updateData).forEach(key => {
      if (key !== 'variants' && oldDrop[key] !== drops[dropIndex][key]) {
        changes.push({
          field: key,
          oldValue: oldDrop[key],
          newValue: drops[dropIndex][key]
        });
      }
    });

    // Broadcast drop updated event with maintenance mode support
    if (changes.length > 0) {
      await broadcastDropEvent(req, 'drop:updated', {
        dropId: id,
        drop: drops[dropIndex],
        changes,
        timestamp: new Date().toISOString(),
        adminId: req.user?.id
      } as DropUpdatedEvent);
    }

    res.json({
      success: true,
      data: drops[dropIndex],
      message: 'Drop updated successfully'
    });
  } catch (error) {
    console.error('Error updating drop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/drops/:id - Delete drop
router.delete('/:id', [
  param('id').isString().notEmpty()
], adminOnly as any, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid drop ID', details: errors.array() });
    }

    const { id } = req.params;
    const dropIndex = drops.findIndex(d => d.id === id);

    if (dropIndex === -1) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    // Remove drop
    const deletedDrop = drops.splice(dropIndex, 1)[0];
    
    // Clear cache for deleted drop
    clearStatsCache(id);

    // Broadcast drop deleted event with maintenance mode support
    await broadcastDropEvent(req, 'drop:deleted', {
      dropId: id,
      drop: { id },
      timestamp: new Date().toISOString(),
      adminId: req.user?.id
    } as DropDeletedEvent);

    res.json({
      success: true,
      data: deletedDrop,
      message: 'Drop deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting drop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/drops/:id/analytics - Get drop analytics
router.get('/:id/analytics', [
  param('id').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid drop ID', details: errors.array() });
    }

    const { id } = req.params;
    const drop = drops.find(d => d.id === id);

    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    // Calculate analytics (use cache for better performance)
    const stats = getCachedStats(drop);
    const conversionRate = stats.totalStock > 0 ? (stats.soldCount / stats.totalStock) * 100 : 0;

    res.json({
      success: true,
      data: {
        dropId: id,
        dropName: drop.name,
        totalStock: stats.totalStock,
        soldCount: stats.soldCount,
        availableStock: stats.totalStock - stats.soldCount,
        revenue: stats.revenue,
        conversionRate: Math.round(conversionRate * 100) / 100,
        variants: drop.variants.map(variant => ({
          variantId: variant.id,
          variantName: variant.label,
          stock: variant.stock,
          sold: variant.sold || 0,
          available: variant.stock - (variant.sold || 0),
          revenue: (variant.sold || 0) * variant.basePrice,
          conversionRate: variant.stock > 0 ? ((variant.sold || 0) / variant.stock) * 100 : 0
        })),
        performance: {
          status: drop.status,
          access: drop.access,
          badge: drop.badge,
          interestCount: drop.interestCount || 0,
          createdAt: drop.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching drop analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/drops/:id/stock - Update drop stock (for real-time stock updates)
router.patch('/:id/stock', [
  param('id').isString().notEmpty(),
  body('variantId').isString().notEmpty(),
  body('stock').isInt({ min: 0 }),
  body('oldStock').isInt({ min: 0 })
], adminOnly as any, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
    }

    const { id } = req.params;
    const { variantId, stock, oldStock } = req.body;

    const dropIndex = drops.findIndex(d => d.id === id);
    if (dropIndex === -1) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    const variantIndex = drops[dropIndex].variants.findIndex((v: Variant) => v.id === variantId);
    if (variantIndex === -1) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Update stock
    drops[dropIndex].variants[variantIndex].stock = stock;
    drops[dropIndex].updatedAt = new Date().toISOString();
    
    // Clear cache for updated drop
    clearStatsCache(id);

    // Calculate and update progress
    const totalStock = drops[dropIndex].variants.reduce((sum, v) => sum + v.stock, 0);
    const soldCount = drops[dropIndex].variants.reduce((sum, v) => sum + (v.sold || 0), 0);
    const progress = totalStock > 0 ? soldCount / totalStock : 0;
    if (drops[dropIndex].progress !== undefined) {
      (drops[dropIndex] as any).progress = progress;
    }

    // Broadcast stock changed event with maintenance mode support
    await broadcastDropEvent(req, 'drop:stock_changed', {
      dropId: id,
      drop: { id },
      variantId,
      oldStock,
      newStock: stock,
      timestamp: new Date().toISOString(),
      adminId: req.user?.id
    } as DropStockChangedEvent);

    // Also broadcast progress update
    await broadcastDropEvent(req, 'drop:progress_updated', {
      dropId: id,
      progress,
      totalStock,
      soldCount,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        dropId: id,
        variantId,
        stock,
        available: stock - (drops[dropIndex].variants[variantIndex].sold || 0)
      },
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/drops/:id/preorder/track - Track preorder for drop
router.post('/:id/preorder/track', [
  param('id').isString().notEmpty(),
  body('userId').isString().notEmpty(),
  body('variantId').isString().notEmpty(),
  body('quantity').isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
    }

    const { id } = req.params;
    const { userId, variantId, quantity } = req.body;

    const dropIndex = drops.findIndex(d => d.id === id);
    if (dropIndex === -1) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    const drop = drops[dropIndex];

    // Initialize preorder fields if not present
    if (drop.minimumOrders === undefined) {
      (drop as any).minimumOrders = 10; // Default
      (drop as any).currentOrders = 0;
      (drop as any).preorderStatus = 'pending';
    }

    // Increment current orders
    (drop as any).currentOrders = ((drop as any).currentOrders || 0) + quantity;
    drop.updatedAt = new Date().toISOString();

    // Check if minimum reached
    const currentOrders = (drop as any).currentOrders || 0;
    const minimumOrders = drop.minimumOrders || 10;
    
    if (currentOrders >= minimumOrders && (drop as any).preorderStatus === 'collecting') {
      (drop as any).preorderStatus = 'reached';
      
      // Auto-order if enabled
      if ((drop as any).autoOrderOnReach) {
        (drop as any).preorderStatus = 'ordered';
      }

      // Broadcast preorder reached event
      safeBroadcast(io, 'drop:preorder_reached', {
        type: 'drop:preorder_reached',
        dropId: id,
        drop,
        currentOrders,
        minimumOrders,
        timestamp: new Date().toISOString()
      });

      // Send payment notifications if reached minimum
      try {
        const userIds = await getPreorderUserIds(id);
        if (userIds.length > 0) {
          const variantPrice = drop.variants.length > 0 ? drop.variants[0].basePrice : 0;
          await sendPaymentNotifications({
            dropId: id,
            dropName: drop.name,
            userIds,
            amount: variantPrice,
            currency: 'EUR',
            deadline: drop.preorderDeadline
          });
        }
      } catch (error) {
        console.error('Error sending payment notifications:', error);
        // Don't fail the request if notifications fail
      }
    }

    // Broadcast preorder updated
    safeBroadcast(io, 'drop:preorder_updated', {
      type: 'drop:preorder_updated',
      dropId: id,
      drop,
      currentOrders,
      minimumOrders,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        dropId: id,
        currentOrders,
        minimumOrders,
        remaining: Math.max(minimumOrders - currentOrders, 0),
        status: (drop as any).preorderStatus,
        reached: currentOrders >= minimumOrders
      },
      message: 'Preorder tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking preorder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/drops/:id/fake-complete - Fake complete preorder (fill missing orders)
router.post('/:id/fake-complete', [
  param('id').isString().notEmpty()
], adminOnly as any, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid drop ID', details: errors.array() });
    }

    const { id } = req.params;
    const dropIndex = drops.findIndex(d => d.id === id);

    if (dropIndex === -1) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    const drop = drops[dropIndex];

    // Check if drop has preorder system
    if (!drop.minimumOrders) {
      return res.status(400).json({ error: 'Drop does not use preorder system' });
    }

    const currentOrders = (drop as any).currentOrders || 0;
    const minimumOrders = drop.minimumOrders;

    if (currentOrders >= minimumOrders) {
      return res.status(400).json({ 
        error: 'Minimum orders already reached',
        currentOrders,
        minimumOrders
      });
    }

    // Fill missing orders to reach minimum
    (drop as any).currentOrders = minimumOrders;
    (drop as any).preorderStatus = 'reached';
    drop.updatedAt = new Date().toISOString();

    // Broadcast fake complete event
    safeBroadcast(io, 'drop:fake_completed', {
      type: 'drop:fake_completed',
      dropId: id,
      drop,
      previousOrders: currentOrders,
      newOrders: minimumOrders,
      filledOrders: minimumOrders - currentOrders,
      timestamp: new Date().toISOString(),
      adminId: req.user?.id
    });

    // Broadcast preorder reached
    safeBroadcast(io, 'drop:preorder_reached', {
      type: 'drop:preorder_reached',
      dropId: id,
      drop,
      currentOrders: minimumOrders,
      minimumOrders,
      fakeCompleted: true,
      timestamp: new Date().toISOString()
    });

    // Send payment notifications to all preorder users
    try {
      const userIds = await getPreorderUserIds(id);
      if (userIds.length > 0) {
        const variantPrice = drop.variants.length > 0 ? drop.variants[0].basePrice : 0;
        await sendPaymentNotifications({
          dropId: id,
          dropName: drop.name,
          userIds,
          amount: variantPrice,
          currency: 'EUR',
          deadline: (drop as any).preorderDeadline
        });
      }
    } catch (error) {
      console.error('Error sending payment notifications:', error);
      // Don't fail the request if notifications fail
    }

    res.json({
      success: true,
      data: {
        dropId: id,
        drop,
        previousOrders: currentOrders,
        newOrders: minimumOrders,
        filledOrders: minimumOrders - currentOrders,
        status: (drop as any).preorderStatus
      },
      message: `Preorder fake-completed: ${minimumOrders - currentOrders} orders added`
    });
  } catch (error) {
    console.error('Error fake-completing preorder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/drops/flush-queue - Flush queued updates (after maintenance ends)
router.post('/flush-queue', adminOnly as any, async (req, res) => {
  try {
    const queuedCount = updateQueue.length;
    await flushQueuedUpdates();
    
    res.json({
      success: true,
      message: `Flushed ${queuedCount} queued updates`,
      flushed: queuedCount
    });
  } catch (error) {
    console.error('Error flushing update queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/drops/queue-status - Get queue status
router.get('/queue-status', adminOnly as any, async (req, res) => {
  try {
    res.json({
      success: true,
      queueLength: updateQueue.length,
      queuedUpdates: updateQueue.map(u => ({
        id: u.id,
        event: u.event,
        timestamp: u.timestamp
      }))
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/drops/bulk - Bulk operations on drops
router.post('/bulk', [
  body('action').isIn(['activate', 'deactivate', 'delete', 'status_change', 'access_change']),
  body('dropIds').isArray({ min: 1 }),
  body('dropIds.*').isString().notEmpty(),
  body('status').optional().isIn(['active', 'inactive', 'sold_out', 'scheduled']),
  body('access').optional().isIn(['free', 'limited', 'vip', 'standard'])
], adminOnly as any, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
    }

    const { action, dropIds, status, access } = req.body;
    const results: Array<{ dropId: string; success: boolean; error?: string }> = [];
    const updatedDrops: Drop[] = [];

    // Process each drop
    for (const dropId of dropIds) {
      try {
        const dropIndex = drops.findIndex(d => d.id === dropId);
        if (dropIndex === -1) {
          results.push({ dropId, success: false, error: 'Drop not found' });
          continue;
        }

        const oldDrop = { ...drops[dropIndex] };
        let updated = false;

        switch (action) {
          case 'activate':
            drops[dropIndex].status = 'active';
            updated = true;
            break;
          case 'deactivate':
            drops[dropIndex].status = 'inactive';
            updated = true;
            break;
          case 'delete':
            drops.splice(dropIndex, 1);
            await broadcastDropEvent(req, 'drop:deleted', {
              dropId,
              drop: { id: dropId },
              timestamp: new Date().toISOString(),
              adminId: req.user?.id
            } as DropDeletedEvent);
            results.push({ dropId, success: true });
            continue;
          case 'status_change':
            if (status) {
              drops[dropIndex].status = status;
              updated = true;
            }
            break;
          case 'access_change':
            if (access) {
              drops[dropIndex].access = access;
              updated = true;
            }
            break;
        }

        if (updated) {
          drops[dropIndex].updatedAt = new Date().toISOString();
          updatedDrops.push(drops[dropIndex]);

          // Broadcast update
          await broadcastDropEvent(req, 'drop:updated', {
            dropId,
            drop: drops[dropIndex],
            changes: [{ field: action === 'status_change' ? 'status' : 'access', oldValue: oldDrop[action === 'status_change' ? 'status' : 'access'], newValue: drops[dropIndex][action === 'status_change' ? 'status' : 'access'] }],
            timestamp: new Date().toISOString(),
            adminId: req.user?.id
          } as DropUpdatedEvent);

          results.push({ dropId, success: true });
        } else {
          results.push({ dropId, success: false, error: 'No changes applied' });
        }
      } catch (error) {
        console.error(`Error processing drop ${dropId}:`, error);
        results.push({ dropId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    res.json({
      success: true,
      results,
      updated: updatedDrops.length,
      deleted: action === 'delete' ? results.filter(r => r.success).length : 0,
      message: `Bulk operation completed: ${results.filter(r => r.success).length}/${results.length} successful`
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/drops/reorder - Reorder drops
router.post('/reorder', [
  body('dropIds').isArray({ min: 1 }),
  body('dropIds.*').isString().notEmpty()
], adminOnly as any, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request data', details: errors.array() });
    }

    const { dropIds } = req.body;

    // Validate all drop IDs exist
    const invalidIds = dropIds.filter((id: string) => !drops.find(d => d.id === id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ error: 'Invalid drop IDs', invalidIds });
    }

    // Create a map for quick lookup
    const dropMap = new Map(drops.map(d => [d.id, d]));

    // Reorder drops according to the provided order
    const reorderedDrops = dropIds.map((id: string) => dropMap.get(id)).filter(Boolean) as Drop[];

    // Add any drops that weren't in the reorder list (shouldn't happen, but safety check)
    const existingIds = new Set(dropIds);
    const remainingDrops = drops.filter(d => !existingIds.has(d.id));
    reorderedDrops.push(...remainingDrops);

    // Update drops array
    drops.length = 0;
    drops.push(...reorderedDrops);

    // Broadcast reorder event
    await broadcastDropEvent(req, 'drop:reordered', {
      dropIds,
      timestamp: new Date().toISOString(),
      adminId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Drops reordered successfully',
      dropIds
    });
  } catch (error) {
    console.error('Error reordering drops:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

// Expose in-memory drops for scheduler access (development-only)
export const getAdminDrops = () => drops;

// Export flushQueuedUpdates for use by status route when maintenance ends
export { flushQueuedUpdates, updateQueue };


