/**
 * Common TypeScript interfaces and types for the admin dashboard
 * Centralized type definitions to replace 'any' types throughout the codebase
 */

import { OrderStatus } from '../../components/ecommerce/OrderStatusBadge';

/**
 * Tracking information for orders
 */
export interface TrackingInfo {
  trackingNumber: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  status?: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
}

/**
 * Order changes for real-time updates
 */
export interface OrderChanges {
  status?: OrderStatus;
  trackingInfo?: TrackingInfo;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Complete order object (used in real-time updates)
 */
export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

/**
 * API Error structure
 */
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * KPI Update Event from WebSocket
 */
export interface KpiUpdateEvent {
  type: 'kpi:updated' | 'kpi:refresh' | 'kpi:reset';
  timestamp: string;
  data?: {
    openTickets?: number;
    waitingTickets?: number;
    escalatedTickets?: number;
    totalTickets?: number;
    avgResponseTime?: number;
    avgResolutionTime?: number;
    satisfactionScore?: number | null;
    automationDeflectionRate?: number;
  };
  [key: string]: unknown;
}

/**
 * Error context for error handling
 */
export interface ErrorContext {
  component?: string;
  operation?: string;
  scope?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Dashboard view types
 */
export type ViewType = 
  | 'overview' 
  | 'shop' 
  | 'drops' 
  | 'orders' 
  | 'customers' 
  | 'images' 
  | 'shipping' 
  | 'tickets' 
  | 'automation' 
  | 'users' 
  | 'security' 
  | 'settings' 
  | 'bot' 
  | 'contests' 
  | 'cookieClicker' 
  | 'maintenance' 
  | 'invite-codes';

/**
 * Valid view types array for validation
 */
export const VALID_VIEW_TYPES: ViewType[] = [
  'overview',
  'shop',
  'drops',
  'orders',
  'customers',
  'images',
  'shipping',
  'tickets',
  'automation',
  'users',
  'security',
  'settings',
  'bot',
  'contests',
  'cookieClicker',
  'maintenance',
  'invite-codes'
] as const;

