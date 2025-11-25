import React, { useEffect, useState } from 'react';
import {
  Bitcoin,
  Zap,
  Smartphone,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { usePaymentWebSocket } from '../../hooks/usePaymentWebSocket';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../utils/cn';

interface PaymentHistoryItem {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  txHash?: string;
  confirmations?: number;
  blockHeight?: number;
  gasPrice?: string;
  trackingNumber?: string;
}

export const LivePaymentHistory: React.FC = () => {
  const { user } = useAuthStore();
  const { paymentUpdates, orderUpdates, isConnected } = usePaymentWebSocket(undefined, undefined, user?.id);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);

  // Initialize with mock data for demo
  useEffect(() => {
    if (user) {
      const mockPayments: PaymentHistoryItem[] = [
        {
          id: 'payment_1',
          orderId: 'NEB-ABC123',
          method: 'btc_chain',
          amount: 149.99,
          status: 'completed',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          txHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890',
          confirmations: 6,
          blockHeight: 812345
        },
        {
          id: 'payment_2',
          orderId: 'NEB-DEF456',
          method: 'eth_chain',
          amount: 89.50,
          status: 'processing',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          txHash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef',
          confirmations: 3
        }
      ];
      setPayments(mockPayments);
    }
  }, [user]);

  // Update payments based on live updates
  useEffect(() => {
    setPayments(prevPayments => {
      const updatedPayments = [...prevPayments];

      // Process payment updates
      paymentUpdates.forEach(update => {
        const existingPayment = updatedPayments.find(p => p.id === update.paymentId);

        if (existingPayment) {
          // Update existing payment
          Object.assign(existingPayment, update.data);
        } else {
          // Add new payment if it doesn't exist
          const newPayment: PaymentHistoryItem = {
            id: update.paymentId,
            orderId: update.data.orderId || `NEB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            method: update.data.method || 'unknown',
            amount: update.data.amount || 0,
            status: getStatusFromEvent(update.eventType),
            timestamp: update.timestamp,
            ...update.data
          };
          updatedPayments.unshift(newPayment);
        }
      });

      // Process order updates
      orderUpdates.forEach(update => {
        const payment = updatedPayments.find(p => p.orderId === update.orderId);
        if (payment) {
          payment.status = update.data.status || payment.status;
          payment.trackingNumber = update.data.trackingNumber;
        }
      });

      return updatedPayments;
    });
  }, [paymentUpdates, orderUpdates]);

  const getStatusFromEvent = (eventType: string): PaymentHistoryItem['status'] => {
    switch (eventType) {
      case 'payment_initiated': return 'pending';
      case 'btc_mempool':
      case 'eth_pending': return 'processing';
      case 'btc_confirmed':
      case 'eth_confirmed':
      case 'voucher_validated': return 'processing';
      case 'payment_completed': return 'completed';
      case 'payment_failed': return 'failed';
      default: return 'pending';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'btc_chain': return <Bitcoin className="h-5 w-5 text-orange-400" />;
      case 'eth_chain': return <Zap className="h-5 w-5 text-blue-400" />;
      case 'crypto_voucher': return <Smartphone className="h-5 w-5 text-purple-400" />;
      default: return <Activity className="h-5 w-5 text-slate-400" />;
    }
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'btc_chain': return 'Bitcoin';
      case 'eth_chain': return 'Ethereum';
      case 'crypto_voucher': return 'Crypto Voucher';
      default: return 'Unbekannt';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'processing': return 'text-orange-400 bg-orange-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      case 'pending': return 'text-slate-400 bg-slate-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'processing': return <Activity className="h-4 w-4 text-orange-400 animate-pulse" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'pending': return <Clock className="h-4 w-4 text-slate-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatTxHash = (txHash?: string) => {
    if (!txHash) return '';
    if (txHash.startsWith('0x')) {
      return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
    }
    return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Zahlungshistorie</h3>
          <p className="text-sm text-slate-400">Live-Updates deiner Zahlungen</p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span className="text-xs text-slate-400">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Live Updates Banner */}
      {(paymentUpdates.length > 0 || orderUpdates.length > 0) && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400">
            <TrendingUp className="h-4 w-4 animate-pulse" />
            <span className="font-medium">Live-Updates aktiv</span>
            <span className="text-sm">
              ({paymentUpdates.length + orderUpdates.length} Updates)
            </span>
          </div>
        </div>
      )}

      {/* Payment List */}
      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Keine Zahlungen vorhanden</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getMethodIcon(payment.method)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {getMethodName(payment.method)}
                      </span>
                      <span className="text-sm text-slate-400">
                        • {payment.orderId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-slate-400">€{payment.amount.toFixed(2)}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm text-slate-400">
                        {new Date(payment.timestamp).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {payment.txHash && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Tx: {formatTxHash(payment.txHash)}</span>
                        {payment.txHash.startsWith('0x') ? (
                          <a
                            href={`https://etherscan.io/tx/${payment.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <a
                            href={`https://mempool.space/tx/${payment.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:text-orange-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {payment.trackingNumber && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-green-400">📦 Tracking:</span>
                        <span className="text-xs text-slate-400">{payment.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                    getStatusColor(payment.status)
                  )}>
                    {getStatusIcon(payment.status)}
                    <span>{getStatusText(payment.status)}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar for processing payments */}
              {payment.status === 'processing' && (
                <div className="mt-3">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-orange-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Verarbeitung läuft...</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Abgeschlossen';
    case 'processing': return 'In Bearbeitung';
    case 'failed': return 'Fehlgeschlagen';
    case 'pending': return 'Ausstehend';
    default: return 'Unbekannt';
  }
};




