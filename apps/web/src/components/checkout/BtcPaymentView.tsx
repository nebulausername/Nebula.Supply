import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  QrCode,
  Clock,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { createBtcService, formatBtcAmount, validateBtcAddress } from '../../services/btcService';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../utils/cn';

interface BtcPaymentViewProps {
  amount: number; // EUR amount
  orderId: string;
  onPaymentDetected?: (txHash: string) => void;
  onCancel?: () => void;
}

interface BtcPaymentData {
  address: string;
  paymentId: string;
  qrCode: string;
  btcAmount: number;
  eurAmount: number;
  fee: number;
  estimatedTime: string;
}

export const BtcPaymentView: React.FC<BtcPaymentViewProps> = ({
  amount,
  orderId,
  onPaymentDetected,
  onCancel
}) => {
  const { user } = useAuthStore();
  const [paymentData, setPaymentData] = useState<BtcPaymentData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [monitoring, setMonitoring] = useState(false);

  const btcService = createBtcService('mainnet');

  useEffect(() => {
    generatePaymentAddress();
  }, [amount, orderId, user]);

  const generatePaymentAddress = async () => {
    if (!user) return;

    setIsGenerating(true);

    try {
      // Get current BTC rate
      const btcRate = await btcService.getBtcEurRate();
      const btcAmount = amount / btcRate;

      // Generate unique Taproot address for this transaction
      const btcData = btcService.generateTaprootAddress(user.id, orderId);

      // Get optimal fee
      const fees = btcService.calculateOptimalFee();

      setPaymentData({
        address: btcData.address,
        paymentId: btcData.paymentId,
        qrCode: btcData.qrCode,
        btcAmount,
        eurAmount: amount,
        fee: fees.standard,
        estimatedTime: '10-30 Minuten'
      });

      // Start monitoring for payments
      startPaymentMonitoring(btcData.address);

    } catch (error) {
      console.error('Error generating BTC payment:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startPaymentMonitoring = (address: string) => {
    setMonitoring(true);

    // Simulate payment monitoring (in production, use WebSocket or polling)
    const monitorInterval = setInterval(async () => {
      try {
        // In production, query blockchain APIs
        // For demo, simulate payment detection after random time
        if (Math.random() < 0.1) { // 10% chance per interval
          const mockTxHash = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          clearInterval(monitorInterval);

          if (onPaymentDetected) {
            onPaymentDetected(mockTxHash);
          }
        }
      } catch (error) {
        console.error('Error monitoring BTC payment:', error);
      }
    }, 5000); // Check every 5 seconds

    // Stop monitoring after 30 minutes
    setTimeout(() => {
      clearInterval(monitorInterval);
      setMonitoring(false);
    }, 30 * 60 * 1000);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openInWallet = (address: string) => {
    // Try to open in popular BTC wallets
    const walletUrls = [
      `bitcoin:${address}`,
      `https://pay.coinbase.com/btc/${address}`,
      `https://www.blockchain.com/btc/address/${address}`
    ];

    // Try to open in wallet app
    window.location.href = walletUrls[0];
  };

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-white">Bitcoin-Adresse wird generiert</h3>
            <p className="text-slate-400">Taproot-Adresse für maximale Privatsphäre</p>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Fehler bei der Adress-Generierung</h3>
        <p className="text-slate-400 mb-4">Bitte versuchen Sie es erneut</p>
        <button
          onClick={generatePaymentAddress}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="h-8 w-8 text-orange-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Bitcoin-Zahlung</h3>
        <p className="text-slate-400">Sichere und anonyme Zahlung mit Taproot</p>
      </div>

      {/* QR Code Section */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <div className="text-center space-y-4">
          {/* QR Code Placeholder - In production, use a QR library */}
          <div className="w-48 h-48 bg-white rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-slate-600">
            <QrCode className="h-16 w-16 text-slate-400" />
            <div className="absolute text-xs text-slate-500 mt-20">QR Code</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-slate-400">Adresse scannen oder kopieren:</div>
            <div className="flex items-center gap-2 p-3 bg-slate-700 rounded-lg">
              <code className="flex-1 text-sm text-white font-mono break-all">
                {paymentData.address}
              </code>
              <button
                onClick={() => copyToClipboard(paymentData.address, 'address')}
                className="p-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-300 transition-colors"
              >
                {copiedField === 'address' ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-blue-400" />
            <h4 className="font-semibold text-white">Zahlungsdetails</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Betrag (EUR)</span>
              <span className="font-semibold text-white">€{paymentData.eurAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Betrag (BTC)</span>
              <span className="font-semibold text-orange-400">{formatBtcAmount(Math.round(paymentData.btcAmount * 100000000))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Empfohlene Fee</span>
              <span className="font-semibold text-white">{paymentData.fee} sats/vByte</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Geschätzte Zeit</span>
              <span className="font-semibold text-white">{paymentData.estimatedTime}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-green-400" />
            <h4 className="font-semibold text-white">Privacy Features</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-300">Taproot-Adresse für maximale Privatsphäre</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-300">Keine KYC-Anforderungen</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-300">Automatisches Coin-Mixing verfügbar</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-slate-300">Einmalige Adresse pro Transaktion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="font-semibold text-blue-400 mb-3">Zahlungsanweisungen</h4>
        <div className="space-y-2 text-sm text-blue-300">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>Scannen Sie den QR-Code mit Ihrer Bitcoin-Wallet-App</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>Kopieren Sie die Adresse manuell in Ihre Wallet</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>Setzen Sie die empfohlene Fee für schnellere Bestätigung</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>Bestätigen Sie die Transaktion in Ihrer Wallet</span>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className={cn(
              "h-4 w-4",
              monitoring ? "text-green-400 animate-pulse" : "text-slate-400"
            )} />
            <span className="text-sm text-slate-400">
              {monitoring ? 'Zahlung wird überwacht...' : 'Warten auf Zahlung'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openInWallet(paymentData.address)}
              className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              In Wallet öffnen
            </button>

            <button
              onClick={generatePaymentAddress}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Aktualisieren
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="w-0 h-2 bg-orange-400 rounded-full transition-all duration-1000" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          Abbrechen
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-400 mb-1">Sicherheitshinweis</p>
            <p className="text-yellow-300">
              Diese Adresse ist einmalig für Ihre Transaktion generiert.
              Überprüfen Sie die Adresse sorgfältig vor dem Senden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};




