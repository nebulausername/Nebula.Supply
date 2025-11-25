import { z } from 'zod';

// Base API Response Schema
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
});

// Paginated Response Schema
export const PaginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
    total: z.number().optional(),
  }),
  message: z.string().optional(),
  timestamp: z.string().optional(),
});

// Error Response Schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  code: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string().optional(),
});

// Order Status Schema
export const OrderStatusSchema = z.enum([
  'created',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'returned',
  'cancelled'
]);

// Order Schema
export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: OrderStatusSchema,
  total: z.number(),
  currency: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  shippingAddress: z.object({
    name: z.string(),
    street: z.string(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().optional(), // For optimistic concurrency control
});

// Product Schema
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number(),
  currency: z.string(),
  inventory: z.number(),
  categoryId: z.string(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  variants: z.array(z.object({
    type: z.string(),
    name: z.string(),
    options: z.array(z.object({
      id: z.string(),
      label: z.string(),
      value: z.string(),
    })),
  })).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().optional(),
});

// Inventory Update Schema
export const InventoryUpdateSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  operation: z.enum(['set', 'add', 'subtract']),
  reason: z.string().optional(),
  version: z.number().optional(),
});

// Media Upload Schema
export const MediaUploadSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional(),
  createdAt: z.string(),
});

// User Schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['admin', 'manager', 'viewer']),
  permissions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Realtime Event Schema
export const RealtimeEventSchema = z.object({
  type: z.string(),
  data: z.any(),
  timestamp: z.string(),
  source: z.string(),
});

// System Health Schema
export const SystemHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  uptime: z.number(),
  memory: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number(),
  }),
  cpu: z.object({
    usage: z.number(),
    load: z.array(z.number()),
  }),
  database: z.object({
    connected: z.boolean(),
    latency: z.number().optional(),
  }),
  redis: z.object({
    connected: z.boolean(),
    latency: z.number().optional(),
  }),
  timestamp: z.string(),
});

// Export types
export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & { data: T };
export type PaginatedResponse<T = any> = z.infer<typeof PaginatedResponseSchema> & { data: T[] };
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type InventoryUpdate = z.infer<typeof InventoryUpdateSchema>;
export type MediaUpload = z.infer<typeof MediaUploadSchema>;
export type User = z.infer<typeof UserSchema>;
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;
export type SystemHealth = z.infer<typeof SystemHealthSchema>;



