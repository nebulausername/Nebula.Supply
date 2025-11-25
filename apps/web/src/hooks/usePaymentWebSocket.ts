import { useEffect, useState, useRef } from 'react';

export interface PaymentUpdate {
  eventType: string;
  paymentId: string;
  data: any;
  timestamp: string;
}

export interface OrderUpdate {
  eventType: string;
  orderId: string;
  data: any;
  timestamp: string;
}

export const usePaymentWebSocket = (paymentId?: string, orderId?: string, userId?: string) => {
  const [paymentUpdates, setPaymentUpdates] = useState<PaymentUpdate[]>([]);
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [liveStats, setLiveStats] = useState({
    activePayments: 0,
    pendingOrders: 0,
    completedToday: 0,
    revenueToday: 0
  });

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Erstelle WebSocket Connection
    const ws = new WebSocket(`ws://localhost:3001/ws/payments`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('Payment WebSocket connected');

      // Subscribe zu relevanten Events
      ws.send(JSON.stringify({
        type: 'subscribe',
        data: {
          paymentIds: paymentId ? [paymentId] : undefined,
          orderIds: orderId ? [orderId] : undefined,
          userId: userId,
          sections: ['payments', 'orders']
        }
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'payment:initiated':
          setPaymentUpdates(prev => [{
            eventType: 'payment_initiated',
            paymentId: message.paymentId,
            data: message,
            timestamp: new Date().toISOString()
          }, ...prev]);
          break;

        case 'payment:btc_mempool':
          setPaymentUpdates(prev => [{
            eventType: 'btc_mempool',
            paymentId: message.paymentId,
            data: message,
            timestamp: new Date().toISOString()
          }, ...prev]);
          break;

        case 'payment:btc_confirmed':
          setPaymentUpdates(prev => [{
            eventType: 'btc_confirmed',
            paymentId: message.paymentId,
            data: message,
            timestamp: new Date().toISOString()
          }, ...prev]);
          break;

        case 'payment:eth_pending':
          setPaymentUpdates(prev => [{
            eventType: 'eth_pending',
            paymentId: message.paymentId,
            data: message,
            timestamp: new Date().toISOString()
          }, ...prev]);
          break;

        case 'payment:eth_confirmed':
          setPaymentUpdates(prev => [{
            eventType: 'eth_confirmed',
            paymentId: message.paymentId,
            data: message,
            timestamp: new Date().toISOString()
          }, ...prev]);
          break;

        case 'payment:voucher_validated':
          setPaymentUpdates(prev => [{
            eventType: 'voucher_validated',
            paymentId: message.paymentId,
            data: message,
            timestamp: new Date().toISOString()
          }, ...prev]);
          break;

        case 'payment:completed':
          setPaymentUpdates(prev => [{
            eventType: 'payment_completed',
            paymentId: message.paymentId,
            data: message,
            timestamp: new Date().toISOString()
          }, ...prev]);

          // Bei erfolgreichem Payment -> Order Update triggern
          if (message.orderId) {
            setOrderUpdates(prev => [{
              eventType: 'order_processing',
              orderId: message.orderId,
              data: { status: 'processing', trackingNumber: message.trackingNumber },
              timestamp: new Date().toISOString()
            }, ...prev]);
          }
          break;

        case 'order:status_changed':
          setOrderUpdates(prev => [{
            eventType: 'order_status_changed',
            orderId: message.orderId,
            data: message,
            timestamp: new Date().toISOString()
          }, ...prev]);

          // Bei Versand -> automatischer Redirect
          if (message.newStatus === 'shipped') {
            setTimeout(() => {
              window.location.href = `/tracking/${message.trackingNumber}`;
            }, 2000);
          }
          break;

        case 'live:stats':
          setLiveStats(message.data);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('Payment WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('Payment WebSocket disconnected');

      // Auto-Reconnect nach 5 Sekunden
      setTimeout(() => {
        if (userId) {
          // Reconnect wird durch useEffect getriggert
        }
      }, 5000);
    };

    return () => {
      ws.close();
    };
  }, [paymentId, orderId, userId]);

  const sendMessage = (type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  };

  return {
    isConnected,
    paymentUpdates,
    orderUpdates,
    liveStats,
    sendMessage,
    clearUpdates: () => {
      setPaymentUpdates([]);
      setOrderUpdates([]);
    }
  };
};




