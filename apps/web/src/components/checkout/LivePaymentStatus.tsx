import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  Zap,
  Bitcoin,
  Smartphone,
  AlertCircle,
  TrendingUp,
  Wifi,
  WifiOff
} from 'lucide-react';
import { usePaymentWebSocket } from '../../hooks/usePaymentWebSocket';
import { cn } from '../../utils/cn';

interface LivePaymentStatusProps {
  paymentId: string;
  method: string;
  userId: string;
  orderId?: string;
  amount: number;
}

interface PaymentStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'failed';
  icon: React.ReactNode;
  timestamp?: string;
  eta?: string;
  details?: any;
}

export const LivePaymentStatus: React.FC<LivePaymentStatusProps> = ({
  paymentId,
  method,
  userId,
  orderId,
  amount
}) => {
  const { isConnected, paymentUpdates, orderUpdates } = usePaymentWebSocket(paymentId, orderId, userId);
  const [steps, setSteps] = useState<PaymentStep[]>([]);

  // Initialize steps based on payment method
  useEffect(() => {
    const initialSteps: PaymentStep[] = [];

    switch (method) {
      case 'btc_chain':
        initialSteps.push(
          {
            id: 'initiated',
            title: 'Zahlung initiiert',
            description: 'Bitcoin-Adresse generiert',
            status: 'completed',
            icon: <CheckCircle className="h-4 w-4" />
          },
          {
            id: 'mempool',
            title: 'Im Mempool',
            description: 'Transaktion wird verarbeitet',
            status: 'pending',
            icon: <Clock className="h-4 w-4" />,
            eta: '10-30 Minuten'
          },
          {
            id: 'confirmed',
            title: 'Bestätigt',
            description: '1. Block-Bestätigung',
            status: 'pending',
            icon: <Bitcoin className="h-4 w-4" />
          },
          {
            id: 'processing',
            title: 'Bestellung wird verarbeitet',
            description: 'Mixing & Verarbeitung',
            status: 'pending',
            icon: <Activity className="h-4 w-4" />
          }
        );
        break;

      case 'eth_chain':
        initialSteps.push(
          {
            id: 'initiated',
            title: 'Zahlung initiiert',
            description: 'Stealth-Adresse generiert',
            status: 'completed',
            icon: <CheckCircle className="h-4 w-4" />
          },
          {
            id: 'pending',
            title: 'Pending',
            description: 'Transaktion im Pool',
            status: 'pending',
            icon: <Clock className="h-4 w-4" />,
            eta: '< 5 Minuten'
          },
          {
            id: 'confirmed',
            title: 'Bestätigt',
            description: '2 Block-Bestätigungen',
            status: 'pending',
            icon: <Zap className="h-4 w-4" />
          },
          {
            id: 'processing',
            title: 'Bestellung wird verarbeitet',
            description: 'MEV-Schutz aktiv',
            status: 'pending',
            icon: <Activity className="h-4 w-4" />
          }
        );
        break;

      case 'crypto_voucher':
        initialSteps.push(
          {
            id: 'initiated',
            title: 'Voucher aktiviert',
            description: 'Warte auf Code-Eingabe',
            status: 'completed',
            icon: <CheckCircle className="h-4 w-4" />
          },
          {
            id: 'validating',
            title: 'Validierung läuft',
            description: 'Code wird überprüft',
            status: 'pending',
            icon: <Clock className="h-4 w-4" />,
            eta: 'Sofort'
          },
          {
            id: 'confirmed',
            title: 'Bestätigt',
            description: 'Betrag gutgeschrieben',
            status: 'pending',
            icon: <Smartphone className="h-4 w-4" />
          },
          {
            id: 'processing',
            title: 'Bestellung wird verarbeitet',
            description: 'Versand wird vorbereitet',
            status: 'pending',
            icon: <Activity className="h-4 w-4" />
          }
        );
        break;
    }

    setSteps(initialSteps);
  }, [method]);

  // Update steps based on live updates
  useEffect(() => {
    setSteps(prevSteps => {
      const updatedSteps = [...prevSteps];

      paymentUpdates.forEach(update => {
        switch (update.eventType) {
          case 'btc_mempool':
            const mempoolStep = updatedSteps.find(s => s.id === 'mempool');
            if (mempoolStep) {
              mempoolStep.status = 'current';
              mempoolStep.details = update.data;
              mempoolStep.eta = update.data.eta;
            }
            break;

          case 'btc_confirmed':
            const confirmedStep = updatedSteps.find(s => s.id === 'confirmed');
            if (confirmedStep) {
              confirmedStep.status = 'completed';
              confirmedStep.timestamp = new Date().toLocaleTimeString();
              confirmedStep.details = update.data;
            }

            // Start processing
            const processingStep = updatedSteps.find(s => s.id === 'processing');
            if (processingStep) {
              processingStep.status = 'current';
            }
            break;

          case 'eth_pending':
            const pendingStep = updatedSteps.find(s => s.id === 'pending');
            if (pendingStep) {
              pendingStep.status = 'current';
              pendingStep.details = update.data;
            }
            break;

          case 'eth_confirmed':
            const ethConfirmedStep = updatedSteps.find(s => s.id === 'confirmed');
            if (ethConfirmedStep) {
              ethConfirmedStep.status = 'completed';
              ethConfirmedStep.timestamp = new Date().toLocaleTimeString();
              ethConfirmedStep.details = update.data;
            }

            const ethProcessingStep = updatedSteps.find(s => s.id === 'processing');
            if (ethProcessingStep) {
              ethProcessingStep.status = 'current';
            }
            break;

          case 'voucher_validated':
            const validatingStep = updatedSteps.find(s => s.id === 'validating');
            if (validatingStep) {
              validatingStep.status = 'completed';
              validatingStep.timestamp = new Date().toLocaleTimeString();
              validatingStep.details = update.data;
            }

            const voucherConfirmedStep = updatedSteps.find(s => s.id === 'confirmed');
            if (voucherConfirmedStep) {
              voucherConfirmedStep.status = 'completed';
              voucherConfirmedStep.timestamp = new Date().toLocaleTimeString();
            }

            const voucherProcessingStep = updatedSteps.find(s => s.id === 'processing');
            if (voucherProcessingStep) {
              voucherProcessingStep.status = 'current';
            }
            break;

          case 'payment_completed':
            const allSteps = updatedSteps;
            allSteps.forEach(step => {
              if (step.status === 'pending') {
                step.status = 'completed';
                step.timestamp = new Date().toLocaleTimeString();
              }
            });
            break;
        }
      });

      return updatedSteps;
    });
  }, [paymentUpdates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'current': return 'text-orange-400 bg-orange-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'current': return <Activity className="h-4 w-4 text-orange-400 animate-pulse" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-400" />
            <span className="text-green-400">Live-Verbindung aktiv</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400">Verbinde...</span>
          </>
        )}
      </div>

      {/* Live Updates Banner */}
      {paymentUpdates.length > 0 && (
        <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="flex items-center gap-2 text-orange-400">
            <TrendingUp className="h-4 w-4 animate-pulse" />
            <span className="font-medium">Live-Updates aktiv</span>
          </div>
        </div>
      )}

      {/* Payment Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all duration-300",
              step.status === 'current' && "border-orange-500/50 bg-orange-500/10",
              step.status === 'completed' && "border-green-500/50 bg-green-500/10",
              step.status === 'failed' && "border-red-500/50 bg-red-500/10",
              step.status === 'pending' && "border-slate-700 bg-slate-800/50"
            )}
          >
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
              getStatusColor(step.status)
            )}>
              {getStatusIcon(step.status)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">{step.title}</h4>
                {step.timestamp && (
                  <span className="text-xs text-slate-400">{step.timestamp}</span>
                )}
              </div>

              <p className="text-sm text-slate-400 mt-1">{step.description}</p>

              {step.eta && step.status === 'current' && (
                <div className="flex items-center gap-1 mt-2 text-xs text-orange-400">
                  <Clock className="h-3 w-3" />
                  <span>ETA: {step.eta}</span>
                </div>
              )}

              {step.details && (
                <div className="mt-2 p-2 rounded bg-slate-700/50">
                  <div className="text-xs text-slate-300 space-y-1">
                    {step.details.txHash && (
                      <div>TxHash: {step.details.txHash.slice(0, 10)}...{step.details.txHash.slice(-8)}</div>
                    )}
                    {step.details.confirmations !== undefined && (
                      <div>Bestätigungen: {step.details.confirmations}</div>
                    )}
                    {step.details.fee && (
                      <div>Fee: {step.details.fee} sats/vByte</div>
                    )}
                    {step.details.gasPrice && (
                      <div>Gas Price: {step.details.gasPrice} gwei</div>
                    )}
                    {step.details.amount && (
                      <div>Betrag: {step.details.amount} EUR</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live Activity Feed */}
      {paymentUpdates.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <h5 className="font-medium text-white mb-2">Live Activity</h5>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {paymentUpdates.slice(0, 5).map((update, index) => (
              <div key={index} className="text-xs text-slate-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                <span>{getEventDescription(update.eventType)}</span>
                <span className="text-slate-500 ml-auto">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getEventDescription = (eventType: string): string => {
  const descriptions: Record<string, string> = {
    payment_initiated: 'Zahlung gestartet',
    btc_mempool: 'Bitcoin im Mempool erkannt',
    btc_confirmed: 'Bitcoin-Bestätigung erhalten',
    eth_pending: 'Ethereum-Transaktion pending',
    eth_confirmed: 'Ethereum-Bestätigung erhalten',
    voucher_validated: 'Voucher erfolgreich validiert',
    payment_completed: 'Zahlung abgeschlossen'
  };

  return descriptions[eventType] || eventType;
};




