import { Order } from '../api/ecommerce';

// Mock order data for development and testing
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderId: 'NEB-2024-001',
    customerId: 'customer-1',
    customerEmail: 'john.doe@example.com',
    customerName: 'John Doe',
    status: 'pending',
    totalAmount: 159.00,
    currency: 'EUR',
    items: [
      {
        id: 'item-1',
        type: 'shop',
        name: 'Galaxy Runner V2',
        variant: 'Size 42, Color Aurora',
        price: 159.00,
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/100x100/5EE7DF/000000?text=Galaxy+Runner'
      }
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main Street',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Germany',
      phone: '+49123456789'
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main Street',
      city: 'Berlin',
      postalCode: '10115',
      country: 'Germany'
    },
    paymentMethod: 'Credit Card',
    paymentStatus: 'paid',
    paymentId: 'pay_123456789',
    trackingNumber: undefined,
    trackingUrl: undefined,
    carrier: undefined,
    estimatedDelivery: undefined,
    notes: [],
    timeline: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-2',
    orderId: 'NEB-2024-002',
    customerId: 'customer-2',
    customerEmail: 'jane.smith@example.com',
    customerName: 'Jane Smith',
    status: 'processing',
    totalAmount: 299.00,
    currency: 'EUR',
    items: [
      {
        id: 'item-2',
        type: 'drop',
        name: 'Nebula Hoodie',
        variant: 'Size M, Color Midnight',
        price: 149.00,
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/100x100/111827/FFFFFF?text=Nebula+Hoodie'
      },
      {
        id: 'item-3',
        type: 'shop',
        name: 'Space Cap',
        variant: 'One Size, Color Black',
        price: 150.00,
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/100x100/000000/FFFFFF?text=Space+Cap'
      }
    ],
    shippingAddress: {
      firstName: 'Jane',
      lastName: 'Smith',
      address1: '456 Oak Avenue',
      city: 'Munich',
      postalCode: '80331',
      country: 'Germany',
      phone: '+49987654321'
    },
    billingAddress: {
      firstName: 'Jane',
      lastName: 'Smith',
      address1: '456 Oak Avenue',
      city: 'Munich',
      postalCode: '80331',
      country: 'Germany'
    },
    paymentMethod: 'PayPal',
    paymentStatus: 'paid',
    paymentId: 'pay_987654321',
    trackingNumber: undefined,
    trackingUrl: undefined,
    carrier: undefined,
    estimatedDelivery: undefined,
    notes: [
      {
        id: 'note-1',
        content: 'Customer requested express shipping',
        authorId: 'admin-1',
        isInternal: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-3',
    orderId: 'NEB-2024-003',
    customerId: 'customer-3',
    customerEmail: 'mike.wilson@example.com',
    customerName: 'Mike Wilson',
    status: 'shipped',
    totalAmount: 89.00,
    currency: 'EUR',
    items: [
      {
        id: 'item-4',
        type: 'shop',
        name: 'Nebula Sticker Pack',
        variant: 'Set of 10',
        price: 89.00,
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/100x100/8B5CF6/FFFFFF?text=Sticker+Pack'
      }
    ],
    shippingAddress: {
      firstName: 'Mike',
      lastName: 'Wilson',
      address1: '789 Pine Street',
      city: 'Hamburg',
      postalCode: '20095',
      country: 'Germany',
      phone: '+49111222333'
    },
    billingAddress: {
      firstName: 'Mike',
      lastName: 'Wilson',
      address1: '789 Pine Street',
      city: 'Hamburg',
      postalCode: '20095',
      country: 'Germany'
    },
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'paid',
    paymentId: 'pay_456789123',
    trackingNumber: 'DHL123456789',
    trackingUrl: 'https://www.dhl.de/de/privatkunden/pakete-verfolgen.html?lang=de&idc=DHL123456789',
    carrier: 'DHL',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: [],
    timeline: [
      {
        id: 'timeline-1',
        title: 'Order Placed',
        description: 'Your order has been received.',
        status: 'completed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'timeline-2',
        title: 'Processing',
        description: 'We are preparing your items for shipment.',
        status: 'completed',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'timeline-3',
        title: 'Shipped',
        description: 'Your package is on its way.',
        status: 'current',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shippedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-4',
    orderId: 'NEB-2024-004',
    customerId: 'customer-4',
    customerEmail: 'sarah.jones@example.com',
    customerName: 'Sarah Jones',
    status: 'delivered',
    totalAmount: 199.00,
    currency: 'EUR',
    items: [
      {
        id: 'item-5',
        type: 'drop',
        name: 'Cosmic T-Shirt',
        variant: 'Size L, Color White',
        price: 199.00,
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/100x100/FFFFFF/000000?text=Cosmic+T-Shirt'
      }
    ],
    shippingAddress: {
      firstName: 'Sarah',
      lastName: 'Jones',
      address1: '321 Elm Street',
      city: 'Cologne',
      postalCode: '50667',
      country: 'Germany',
      phone: '+49444555666'
    },
    billingAddress: {
      firstName: 'Sarah',
      lastName: 'Jones',
      address1: '321 Elm Street',
      city: 'Cologne',
      postalCode: '50667',
      country: 'Germany'
    },
    paymentMethod: 'Credit Card',
    paymentStatus: 'paid',
    paymentId: 'pay_789123456',
    trackingNumber: 'DHL987654321',
    trackingUrl: 'https://www.dhl.de/de/privatkunden/pakete-verfolgen.html?lang=de&idc=DHL987654321',
    carrier: 'DHL',
    estimatedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    notes: [],
    timeline: [
      {
        id: 'timeline-4',
        title: 'Order Placed',
        description: 'Your order has been received.',
        status: 'completed',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'timeline-5',
        title: 'Processing',
        description: 'We are preparing your items for shipment.',
        status: 'completed',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'timeline-6',
        title: 'Shipped',
        description: 'Your package is on its way.',
        status: 'completed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'timeline-7',
        title: 'Delivered',
        description: 'Your order has been delivered.',
        status: 'completed',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shippedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'order-5',
    orderId: 'NEB-2024-005',
    customerId: 'customer-5',
    customerEmail: 'alex.brown@example.com',
    customerName: 'Alex Brown',
    status: 'cancelled',
    totalAmount: 79.00,
    currency: 'EUR',
    items: [
      {
        id: 'item-6',
        type: 'shop',
        name: 'Nebula Keychain',
        variant: 'Silver',
        price: 79.00,
        quantity: 1,
        imageUrl: 'https://via.placeholder.com/100x100/C0C0C0/000000?text=Keychain'
      }
    ],
    shippingAddress: {
      firstName: 'Alex',
      lastName: 'Brown',
      address1: '654 Maple Drive',
      city: 'Frankfurt',
      postalCode: '60311',
      country: 'Germany',
      phone: '+49777888999'
    },
    billingAddress: {
      firstName: 'Alex',
      lastName: 'Brown',
      address1: '654 Maple Drive',
      city: 'Frankfurt',
      postalCode: '60311',
      country: 'Germany'
    },
    paymentMethod: 'Credit Card',
    paymentStatus: 'refunded',
    paymentId: 'pay_321654987',
    trackingNumber: undefined,
    trackingUrl: undefined,
    carrier: undefined,
    estimatedDelivery: undefined,
    notes: [
      {
        id: 'note-2',
        content: 'Customer requested cancellation due to change of mind',
        authorId: 'admin-1',
        isInternal: true,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    timeline: [
      {
        id: 'timeline-8',
        title: 'Order Placed',
        description: 'Your order has been received.',
        status: 'completed',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'timeline-9',
        title: 'Cancelled',
        description: 'Your order has been cancelled.',
        status: 'completed',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    cancelledAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock metrics data
export const mockOrderMetrics = {
  totalOrders: mockOrders.length,
  pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
  processingOrders: mockOrders.filter(o => o.status === 'processing').length,
  shippedOrders: mockOrders.filter(o => o.status === 'shipped').length,
  deliveredOrders: mockOrders.filter(o => o.status === 'delivered').length,
  cancelledOrders: mockOrders.filter(o => o.status === 'cancelled').length,
  totalRevenue: mockOrders.reduce((sum, order) => sum + order.totalAmount, 0)
};























































































