import { WebSocketServer, PaymentMonitor } from '../websocket/server';

export class PaymentMonitorService {
  private paymentMonitor: PaymentMonitor;
  private wsServer: WebSocketServer;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
    this.paymentMonitor = new PaymentMonitor(wsServer);
  }

  // Öffentliche API für andere Services
  async startPaymentMonitoring(paymentId: string, method: string, userId: string, txData?: any) {
    return this.paymentMonitor.startMonitoringPayment(paymentId, method, userId, txData);
  }

  async completePayment(paymentId: string, orderId: string, trackingNumber?: string) {
    return this.paymentMonitor.markPaymentCompleted(paymentId, orderId, trackingNumber);
  }

  async failPayment(paymentId: string, reason: string) {
    return this.paymentMonitor.markPaymentFailed(paymentId, reason);
  }

  // Broadcast Utilities
  async broadcastOrderStatusChange(orderId: string, oldStatus: string, newStatus: string, trackingSteps: any[]) {
    return this.wsServer.broadcastOrderStatusChange(orderId, oldStatus, newStatus, trackingSteps);
  }

  async broadcastOrderShipped(orderId: string, trackingNumber: string, carrier: string) {
    return this.wsServer.broadcastOrderShipped(orderId, trackingNumber, carrier);
  }

  async broadcastProfilePaymentUpdate(userId: string, paymentId: string, status: string) {
    return this.wsServer.broadcastProfilePaymentUpdate(userId, paymentId, status);
  }

  async broadcastProfileOrderUpdate(userId: string, orderId: string, status: string) {
    return this.wsServer.broadcastProfileOrderUpdate(userId, orderId, status);
  }
}

// Factory function
export const createPaymentMonitorService = (wsServer: WebSocketServer) => {
  return new PaymentMonitorService(wsServer);
};




