import { Router } from 'express';
import { body, validationResult, query } from 'express-validator';
import { getOrderService } from '../services/orderService';
import { logger } from '../utils/logger';
import { shopRealtimeEvents } from '../websocket/shopEvents';

const router = Router();

// Types for API requests/responses
interface OrderItem {
  id: string;
  type: 'shop' | 'drop';
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CreateOrderRequest {
  userId: string;
  items: OrderItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress: {
    sameAsShipping: boolean;
    firstName?: string;
    lastName?: string;
    address1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  paymentMethod: string;
  paymentDetails: Record<string, any>;
  totalAmount: number;
  currency: string;
}

interface OrderResponse {
  orderId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  shippingAddress: any;
  billingAddress: any;
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderStatusResponse {
  orderId: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'current' | 'pending';
    timestamp?: string;
    eta?: string;
  }>;
}

// POST /api/orders - Create new order
router.post('/', [
  body('userId').isString().notEmpty(),
  body('items').isArray({ min: 1 }),
  body('items.*.id').isString().notEmpty(),
  body('items.*.type').isIn(['shop', 'drop']),
  body('items.*.name').isString().notEmpty(),
  body('items.*.variant').isString().notEmpty(),
  body('items.*.price').isNumeric().isFloat({ min: 0 }),
  body('items.*.quantity').isInt({ min: 1 }),
  body('shippingAddress').isObject(),
  body('shippingAddress.firstName').isString().notEmpty(),
  body('shippingAddress.lastName').isString().notEmpty(),
  body('shippingAddress.address1').isString().notEmpty(),
  body('shippingAddress.city').isString().notEmpty(),
  body('shippingAddress.postalCode').isString().notEmpty(),
  body('shippingAddress.country').isString().notEmpty(),
  body('paymentMethod').isString().notEmpty(),
  body('totalAmount').isNumeric().isFloat({ min: 0.01 }),
  body('currency').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderData: CreateOrderRequest = req.body;

    // Generate unique order ID
    const orderId = `NEB-${Date.now().toString(36).toUpperCase()}`;

    // Create order in database
    const orderResponse: OrderResponse = {
      orderId,
      status: 'pending',
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      currency: orderData.currency,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: orderData.paymentMethod,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // In production, save to database
    // For demo, just return the order
    res.json(orderResponse);

    shopRealtimeEvents.orderCreated({
      type: 'order:created',
      orderId,
      order: orderResponse,
      timestamp: orderResponse.createdAt,
      adminId: (req as any).user?.id
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      error: 'Order creation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orders/:orderId - Get order details
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // In production, get order from database
    // For demo, return mock order
    const orderResponse: OrderResponse = {
      orderId,
      status: 'processing',
      items: [],
      totalAmount: 0,
      currency: 'EUR',
      shippingAddress: {},
      billingAddress: {},
      paymentMethod: 'btc_chain',
      trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json(orderResponse);
  } catch (error) {
    console.error('Order retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// GET /api/orders - Get orders with filters (Admin)
router.get('/', [
  query('status').optional().isString(),
  query('paymentStatus').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('customerId').optional().isString(),
  query('search').optional().isString(),
  query('minAmount').optional().isNumeric(),
  query('maxAmount').optional().isNumeric(),
  query('hasTracking').optional().isBoolean(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'totalAmount', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const filters = {
      status: req.query.status ? req.query.status.toString().split(',') : undefined,
      paymentStatus: req.query.paymentStatus ? req.query.paymentStatus.toString().split(',') : undefined,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      customerId: req.query.customerId as string,
      search: req.query.search as string,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
      hasTracking: req.query.hasTracking ? req.query.hasTracking === 'true' : undefined,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await orderService.getOrders(filters);

    res.json({
      success: true,
      data: result.orders,
      total: result.total,
      metrics: result.metrics,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: result.orders.length === filters.limit
      }
    });
  } catch (error) {
    logger.error('Failed to get orders', { error: error.message, query: req.query });
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// PUT /api/orders/:orderId/status - Update order status (Admin only)
router.put('/:orderId/status', [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  body('trackingNumber').optional().isString(),
  body('trackingUrl').optional().isString(),
  body('carrier').optional().isString(),
  body('estimatedDelivery').optional().isISO8601(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderId } = req.params;
    const { status, trackingNumber, trackingUrl, carrier, estimatedDelivery, notes } = req.body;

    const trackingInfo = trackingNumber ? {
      trackingNumber,
      trackingUrl,
      carrier,
      estimatedDelivery
    } : undefined;

    const updatedOrder = await orderService.updateOrderStatus(orderId, status, trackingInfo);

    // Add note if provided
    if (notes) {
      await orderService.addOrderNote(orderId, notes, req.user?.id || 'admin', true);
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    logger.error('Order status update error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PATCH /api/orders/:orderId/tracking - Update tracking info
router.patch('/:orderId/tracking', [
  body('trackingNumber').isString().notEmpty(),
  body('trackingUrl').optional().isString(),
  body('carrier').optional().isString(),
  body('estimatedDelivery').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderId } = req.params;
    const { trackingNumber, trackingUrl, carrier, estimatedDelivery } = req.body;

    const updatedOrder = await orderService.updateOrderTracking(orderId, {
      trackingNumber,
      trackingUrl,
      carrier,
      estimatedDelivery
    });

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Tracking info updated successfully'
    });
  } catch (error) {
    logger.error('Order tracking update error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to update tracking info' });
  }
});

// POST /api/orders/:orderId/notes - Add order note
router.post('/:orderId/notes', [
  body('content').isString().notEmpty(),
  body('isInternal').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderId } = req.params;
    const { content, isInternal = false } = req.body;

    const updatedOrder = await orderService.addOrderNote(
      orderId, 
      content, 
      req.user?.id || 'admin', 
      isInternal
    );

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Note added successfully'
    });
  } catch (error) {
    logger.error('Order note add error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// PATCH /api/orders/bulk-update - Bulk update orders
router.patch('/bulk-update', [
  body('orderIds').isArray({ min: 1 }),
  body('orderIds.*').isString().notEmpty(),
  body('updates').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderIds, updates } = req.body;

    const results = await orderService.bulkUpdateOrders(orderIds, updates);

    res.json({
      success: true,
      data: results,
      message: `Bulk update completed: ${results.success} successful, ${results.failed} failed`
    });
  } catch (error) {
    logger.error('Bulk order update error', { error: error.message, orderIds: req.body.orderIds });
    res.status(500).json({ error: 'Failed to bulk update orders' });
  }
});

// GET /api/orders/:orderId/tracking - Get order tracking info
router.get('/:orderId/tracking', async (req, res) => {
  try {
    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderId } = req.params;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const trackingSteps = orderService.generateTrackingSteps(order.status);

    const trackingResponse: OrderStatusResponse = {
      orderId,
      status: order.status,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery,
      currentStep: trackingSteps.findIndex(step => step.status === 'current') + 1,
      totalSteps: trackingSteps.length,
      steps: trackingSteps
    };

    res.json(trackingResponse);
  } catch (error) {
    logger.error('Order tracking error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to get order tracking' });
  }
});

// POST /api/orders/:orderId/return - Request return
router.post('/:orderId/return', [
  body('items').isArray({ min: 1 }),
  body('items.*.orderItemId').isString().notEmpty(),
  body('items.*.productId').isString().notEmpty(),
  body('items.*.productName').isString().notEmpty(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.reason').isString().notEmpty(),
  body('reason').isString().notEmpty(),
  body('customerNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderId } = req.params;
    const { items, reason, customerNotes } = req.body;

    const orderReturn = await orderService.requestReturn(orderId, {
      items,
      reason,
      customerNotes
    });

    res.json({
      success: true,
      data: orderReturn,
      message: 'Return request submitted successfully'
    });
  } catch (error) {
    logger.error('Return request error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ 
      error: 'Failed to request return',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/orders/return/:returnId/status - Update return status (Admin)
router.patch('/return/:returnId/status', [
  body('status').isIn(['requested', 'approved', 'rejected', 'in_transit', 'received', 'completed']),
  body('adminNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { returnId } = req.params;
    const { status, adminNotes } = req.body;

    const updatedReturn = await orderService.updateReturnStatus(returnId, status, adminNotes);

    res.json({
      success: true,
      data: updatedReturn,
      message: 'Return status updated successfully'
    });
  } catch (error) {
    logger.error('Return status update error', { error: error.message, returnId: req.params.returnId });
    res.status(500).json({ 
      error: 'Failed to update return status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/orders/:orderId/refund - Process refund (Admin)
router.post('/:orderId/refund', [
  body('amount').isNumeric().isFloat({ min: 0.01 }),
  body('reason').isString().notEmpty(),
  body('type').isIn(['full', 'partial']),
  body('adminNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderId } = req.params;
    const { amount, reason, type, adminNotes } = req.body;

    const refund = await orderService.processRefund(orderId, {
      amount: parseFloat(amount),
      reason,
      type,
      adminNotes
    });

    res.json({
      success: true,
      data: refund,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    logger.error('Refund processing error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ 
      error: 'Failed to process refund',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orders/:orderId/returns - Get order returns
router.get('/:orderId/returns', async (req, res) => {
  try {
    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderId } = req.params;
    const returns = await orderService.getOrderReturns(orderId);

    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    logger.error('Get returns error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to get order returns' });
  }
});

// GET /api/orders/:orderId/refunds - Get order refunds
router.get('/:orderId/refunds', async (req, res) => {
  try {
    const orderService = getOrderService();
    if (!orderService) {
      return res.status(500).json({ error: 'Order service not available' });
    }

    const { orderId } = req.params;
    const refunds = await orderService.getOrderRefunds(orderId);

    res.json({
      success: true,
      data: refunds
    });
  } catch (error) {
    logger.error('Get refunds error', { error: error.message, orderId: req.params.orderId });
    res.status(500).json({ error: 'Failed to get order refunds' });
  }
});

// Export router
export default router;


