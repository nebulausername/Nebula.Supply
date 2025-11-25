import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { z } from 'zod';
import { OrderSchema, ApiResponseSchema, PaginatedResponseSchema } from '../../../apps/admin/src/schemas/api';

// Mock API client for contract testing
class ContractTestClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

describe('Orders API Contract Tests', () => {
  let client: ContractTestClient;

  beforeAll(() => {
    client = new ContractTestClient();
  });

  describe('GET /api/orders', () => {
    test('should return paginated orders response', async () => {
      const response = await client.get('/api/orders');
      
      // Validate response structure
      const validatedResponse = PaginatedResponseSchema.parse(response);
      expect(validatedResponse.success).toBe(true);
      expect(validatedResponse.data).toBeInstanceOf(Array);
      expect(validatedResponse.pagination).toBeDefined();
      expect(validatedResponse.pagination.limit).toBeTypeOf('number');
      expect(validatedResponse.pagination.offset).toBeTypeOf('number');
      expect(validatedResponse.pagination.hasMore).toBeTypeOf('boolean');
    });

    test('should support pagination parameters', async () => {
      const response = await client.get('/api/orders?limit=10&offset=20');
      
      const validatedResponse = PaginatedResponseSchema.parse(response);
      expect(validatedResponse.pagination.limit).toBe(10);
      expect(validatedResponse.pagination.offset).toBe(20);
    });

    test('should support status filtering', async () => {
      const response = await client.get('/api/orders?status=created');
      
      const validatedResponse = PaginatedResponseSchema.parse(response);
      expect(validatedResponse.data.every((order: any) => order.status === 'created')).toBe(true);
    });
  });

  describe('GET /api/orders/:id', () => {
    test('should return single order', async () => {
      // First get a list to find an order ID
      const listResponse = await client.get('/api/orders');
      const orders = listResponse.data;
      
      if (orders.length > 0) {
        const orderId = orders[0].id;
        const response = await client.get(`/api/orders/${orderId}`);
        
        const validatedResponse = ApiResponseSchema.parse(response);
        expect(validatedResponse.success).toBe(true);
        
        const order = OrderSchema.parse(validatedResponse.data);
        expect(order.id).toBe(orderId);
      }
    });

    test('should return 404 for non-existent order', async () => {
      try {
        await client.get('/api/orders/non-existent-id');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });
  });

  describe('POST /api/orders', () => {
    test('should create new order', async () => {
      const orderData = {
        userId: 'test-user-id',
        items: [
          {
            productId: 'test-product-id',
            quantity: 2,
            price: 2999
          }
        ],
        shippingAddress: {
          name: 'Test User',
          street: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'US'
        },
        total: 5998,
        currency: 'USD'
      };

      const response = await client.post('/api/orders', orderData);
      
      const validatedResponse = ApiResponseSchema.parse(response);
      expect(validatedResponse.success).toBe(true);
      
      const order = OrderSchema.parse(validatedResponse.data);
      expect(order.userId).toBe(orderData.userId);
      expect(order.total).toBe(orderData.total);
      expect(order.status).toBe('created');
    });

    test('should validate required fields', async () => {
      const invalidOrderData = {
        // Missing required fields
        items: []
      };

      try {
        await client.post('/api/orders', invalidOrderData);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
      }
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    test('should update order status', async () => {
      // First create an order
      const orderData = {
        userId: 'test-user-id',
        items: [{ productId: 'test-product-id', quantity: 1, price: 2999 }],
        shippingAddress: {
          name: 'Test User',
          street: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'US'
        },
        total: 2999,
        currency: 'USD'
      };

      const createResponse = await client.post('/api/orders', orderData);
      const order = createResponse.data;

      // Update status
      const statusUpdate = {
        status: 'paid',
        reason: 'Payment received'
      };

      const response = await client.patch(`/api/orders/${order.id}/status`, statusUpdate);
      
      const validatedResponse = ApiResponseSchema.parse(response);
      expect(validatedResponse.success).toBe(true);
      
      const updatedOrder = OrderSchema.parse(validatedResponse.data);
      expect(updatedOrder.status).toBe('paid');
    });

    test('should validate status transitions', async () => {
      // Create an order
      const orderData = {
        userId: 'test-user-id',
        items: [{ productId: 'test-product-id', quantity: 1, price: 2999 }],
        shippingAddress: {
          name: 'Test User',
          street: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'US'
        },
        total: 2999,
        currency: 'USD'
      };

      const createResponse = await client.post('/api/orders', orderData);
      const order = createResponse.data;

      // Try invalid status transition
      const invalidStatusUpdate = {
        status: 'delivered', // Can't go directly from created to delivered
        reason: 'Invalid transition'
      };

      try {
        await client.patch(`/api/orders/${order.id}/status`, invalidStatusUpdate);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
      }
    });
  });

  describe('PATCH /api/orders/bulk-status', () => {
    test('should update multiple orders status', async () => {
      // Create multiple orders
      const orderData = {
        userId: 'test-user-id',
        items: [{ productId: 'test-product-id', quantity: 1, price: 2999 }],
        shippingAddress: {
          name: 'Test User',
          street: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'US'
        },
        total: 2999,
        currency: 'USD'
      };

      const order1 = await client.post('/api/orders', orderData);
      const order2 = await client.post('/api/orders', orderData);

      // Bulk update status
      const bulkUpdate = {
        orderIds: [order1.data.id, order2.data.id],
        status: 'paid',
        reason: 'Bulk payment received'
      };

      const response = await client.patch('/api/orders/bulk-status', bulkUpdate);
      
      const validatedResponse = ApiResponseSchema.parse(response);
      expect(validatedResponse.success).toBe(true);
      expect(validatedResponse.data.updatedCount).toBe(2);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    test('should cancel order', async () => {
      // Create an order
      const orderData = {
        userId: 'test-user-id',
        items: [{ productId: 'test-product-id', quantity: 1, price: 2999 }],
        shippingAddress: {
          name: 'Test User',
          street: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'US'
        },
        total: 2999,
        currency: 'USD'
      };

      const createResponse = await client.post('/api/orders', orderData);
      const order = createResponse.data;

      // Cancel order
      const response = await client.delete(`/api/orders/${order.id}`);
      
      const validatedResponse = ApiResponseSchema.parse(response);
      expect(validatedResponse.success).toBe(true);
      
      const cancelledOrder = OrderSchema.parse(validatedResponse.data);
      expect(cancelledOrder.status).toBe('cancelled');
    });
  });

  describe('Error Handling', () => {
    test('should return proper error format', async () => {
      try {
        await client.get('/api/orders/invalid-id');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('404');
      }
    });

    test('should handle validation errors', async () => {
      try {
        await client.post('/api/orders', { invalid: 'data' });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('400');
      }
    });
  });
});



