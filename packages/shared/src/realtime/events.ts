import { z } from 'zod';

// Core DTOs
export const OrderDTO = z.object({
  id: z.string(),
  status: z.string(),
  total: z.number().nonnegative(),
  currency: z.string().default('EUR'),
  userId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type OrderDTO = z.infer<typeof OrderDTO>;

export const TicketDTO = z.object({
  id: z.string(),
  userId: z.string().nullable().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  status: z.enum(['open', 'pending', 'resolved', 'closed']).default('open'),
  isVip: z.boolean().default(false),
  subject: z.string(),
  lastMessageAt: z.string().optional(),
});
export type TicketDTO = z.infer<typeof TicketDTO>;

export const DropDTO = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'live', 'ended']).default('draft'),
});
export type DropDTO = z.infer<typeof DropDTO>;

export const InventoryChangeDTO = z.object({
  sku: z.string(),
  delta: z.number(),
  newQuantity: z.number().nonnegative(),
  reason: z.string().optional(),
});
export type InventoryChangeDTO = z.infer<typeof InventoryChangeDTO>;

export const ShopConfigDTO = z.object({
  id: z.string().default('default'),
  currency: z.string().default('EUR'),
  taxRate: z.number().min(0).max(1).default(0.19),
  shippingProfiles: z.array(z.any()).optional(),
});
export type ShopConfigDTO = z.infer<typeof ShopConfigDTO>;

// Event payloads
export const OrdersCreatedEvent = z.object({ type: z.literal('orders:created'), order: OrderDTO });
export const OrdersUpdatedEvent = z.object({ type: z.literal('orders:updated'), order: OrderDTO, changes: z.record(z.any()).optional() });
export const OrdersStatusEvent = z.object({ type: z.literal('orders:status'), orderId: z.string(), oldStatus: z.string(), newStatus: z.string() });

export const TicketsNewEvent = z.object({ type: z.literal('tickets:new'), ticket: TicketDTO });
export const TicketsReplyEvent = z.object({ type: z.literal('tickets:reply'), ticketId: z.string(), messageId: z.string(), authorId: z.string(), content: z.string() });
export const TicketsStatusEvent = z.object({ type: z.literal('tickets:status'), ticketId: z.string(), oldStatus: z.string(), newStatus: z.string() });

export const DropsCreatedEvent = z.object({ type: z.literal('drop:created'), drop: DropDTO });
export const DropsUpdatedEvent = z.object({ type: z.literal('drop:updated'), drop: DropDTO });
export const DropsDeletedEvent = z.object({ type: z.literal('drop:deleted'), drop: z.object({ id: z.string() }) });
export const DropsStockChangedEvent = z.object({ type: z.literal('drop:stock_changed'), drop: z.object({ id: z.string() }), changes: z.record(z.any()).optional() });
export const DropsStatusChangedEvent = z.object({ type: z.literal('drop:status_changed'), drop: z.object({ id: z.string() }), oldStatus: z.string(), newStatus: z.string() });

export const InventoryChangedEvent = z.object({ type: z.literal('inventory:changed'), change: InventoryChangeDTO });
export const InventoryThresholdEvent = z.object({ type: z.literal('inventory:threshold'), sku: z.string(), quantity: z.number(), threshold: z.number() });

export const ShopConfigUpdatedEvent = z.object({ type: z.literal('shop:config:updated'), config: ShopConfigDTO });

export type RealtimeEvent =
  | z.infer<typeof OrdersCreatedEvent>
  | z.infer<typeof OrdersUpdatedEvent>
  | z.infer<typeof OrdersStatusEvent>
  | z.infer<typeof TicketsNewEvent>
  | z.infer<typeof TicketsReplyEvent>
  | z.infer<typeof TicketsStatusEvent>
  | z.infer<typeof DropsCreatedEvent>
  | z.infer<typeof DropsUpdatedEvent>
  | z.infer<typeof DropsDeletedEvent>
  | z.infer<typeof DropsStockChangedEvent>
  | z.infer<typeof DropsStatusChangedEvent>
  | z.infer<typeof InventoryChangedEvent>
  | z.infer<typeof InventoryThresholdEvent>
  | z.infer<typeof ShopConfigUpdatedEvent>;

export const RealtimeEvent = z.union([
  OrdersCreatedEvent,
  OrdersUpdatedEvent,
  OrdersStatusEvent,
  TicketsNewEvent,
  TicketsReplyEvent,
  TicketsStatusEvent,
  DropsCreatedEvent,
  DropsUpdatedEvent,
  DropsDeletedEvent,
  DropsStockChangedEvent,
  DropsStatusChangedEvent,
  InventoryChangedEvent,
  InventoryThresholdEvent,
  ShopConfigUpdatedEvent,
]);

// Helpers
export type EventName = RealtimeEvent['type'];

export function isEventName(name: string): name is EventName {
  try {
    const schema = RealtimeEvent as unknown as z.ZodUnion<any>;
    // Simple check by trying to find a matching literal
    return [
      'orders:created','orders:updated','orders:status',
      'tickets:new','tickets:reply','tickets:status',
      'drop:created','drop:updated','drop:deleted','drop:stock_changed','drop:status_changed',
      'inventory:changed','inventory:threshold',
      'shop:config:updated'
    ].includes(name);
  } catch {
    return false;
  }
}






















































































