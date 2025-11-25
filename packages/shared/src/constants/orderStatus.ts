export type OrderStatus = 
  | 'created'
  | 'paid'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'created',
  'paid',
  'packed',
  'shipped',
  'delivered',
  'returned',
  'cancelled'
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  created: 'Created',
  paid: 'Paid',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  returned: 'Returned',
  cancelled: 'Cancelled'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  created: 'bg-gray-500',
  paid: 'bg-blue-500',
  packed: 'bg-yellow-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  returned: 'bg-orange-500',
  cancelled: 'bg-red-500'
};

// Define allowed transitions between order statuses
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['paid', 'cancelled'],
  paid: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  returned: [], // Terminal state
  cancelled: [] // Terminal state
};

// Check if a transition is allowed
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// Get next possible statuses for a given status
export function getNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

// Check if a status is terminal (no further transitions allowed)
export function isTerminalStatus(status: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

// Get status progression percentage (0-100)
export function getStatusProgress(status: OrderStatus): number {
  const statusIndex = ORDER_STATUSES.indexOf(status);
  return Math.round((statusIndex / (ORDER_STATUSES.length - 1)) * 100);
}



