import React, { useState, useEffect } from 'react';
import {
  Shield,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  TrendingUp,
  Lock,
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  createBtcPrivacyService,
  HdWallet,
  CoinJoinSession,
  LightningInvoice,
  PrivacyMetrics
} from '../../services/btcPrivacyService';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../utils/cn';

interface AdvancedBtcPaymentViewProps {
  amount: number; // EUR amount
  orderId: string;
  onPaymentDetected?: (txHash: string) => void;
  onCancel?: () => void;
}

type PrivacyLevel = 'standard' | 'high' | 'maximum';

export const AdvancedBtcPaymentView: React.FC<AdvancedBtcPaymentViewProps> = ({
  amount,
  orderId,
  onPaymentDetected,
  onCancel
}) => {
  const { user } = useAuthStore();
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('high');
  const [hdWallet, setHdWallet] = useState<HdWallet | null>(null);
  const [coinJoinSession, setCoinJoinSession] = useState<CoinJoinSession | null>(null);
  const [lightningInvoice, setLightningInvoice] = useState<LightningInvoice | null>(null);
  const [privacyMetrics, setPrivacyMetrics] = useState<PrivacyMetrics | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const btcPrivacyService = createBtcPrivacyService();

  useEffect(() => {
    initializePrivacyFeatures();
  }, [user, amount, privacyLevel]);

  const initializePrivacyFeatures = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Create or get HD wallet for user
      let wallet = await btcPrivacyService.getUserHdWallet(user.id);
      if (!wallet) {
        wallet = await btcPrivacyService.createHdWallet(user.id);
        setHdWallet(wallet);
      }

      // Initialize privacy features based on selected level
      switch (privacyLevel) {
        case 'maximum':
          await initializeMaximumPrivacy();
          break;
        case 'high':
          await initializeHighPrivacy();
          break;
        case 'standard':
          await initializeStandardPrivacy();
          break;
      }

    } catch (error) {
      console.error('Error initializing privacy features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMaximumPrivacy = async () => {
    if (!user) return;

    // Create HD wallet if not exists
    const wallet = await btcPrivacyService.createHdWallet(user.id);

    // Generate fresh address
    const address = await btcPrivacyService.generateChildAddress(user.id);

    // Start CoinJoin session
    const cjSession = await btcPrivacyService.initiateCoinJoin(user.id, amount / 42000);

    setHdWallet(wallet);
    setCoinJoinSession(cjSession);
  };

  const initializeHighPrivacy = async () => {
    if (!user) return;

    // Generate fresh Taproot address
    const address = await btcPrivacyService.generateChildAddress(user.id);

    // Optional: Create Lightning invoice for small amounts
    if (amount < 100) {
      const invoice = await btcPrivacyService.createLightningInvoice(user.id, Math.floor(amount / 42000 * 100000000));
      setLightningInvoice(invoice);
    }
  };

  const initializeStandardPrivacy = async () => {
    // Standard Taproot address (already implemented in btcService)
    console.log('📋 Using standard Taproot privacy');
  };

  const handlePrivacyLevelChange = async (level: PrivacyLevel) => {
    setPrivacyLevel(level);
    await initializePrivacyFeatures();
  };

  const getPrivacyLevelDescription = (level: PrivacyLevel): string => {
    switch (level) {
      case 'maximum':
        return 'HD-Wallet + CoinJoin + Lightning Network - Maximale Anonymität';
      case 'high':
        return 'Taproot + Fresh Addresses + Optional Lightning - Hohe Anonymität';
      case 'standard':
        return 'Taproot Addresses - Grundlegende Anonymität';
      default:
        return '';
    }
  };

  const getPrivacyLevelColor = (level: PrivacyLevel): string => {
    switch (level) {
      case 'maximum': return 'text-purple-400 bg-purple-400/20 border-purple-400';
      case 'high': return 'text-green-400 bg-green-400/20 border-green-400';
      case 'standard': return 'text-blue-400 bg-blue-400/20 border-blue-400';
      default: return 'text-slate-400 bg-slate-400/20 border-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Bitcoin Privacy Payment</h3>
        <p className="text-slate-400">Maximale Anonymität mit erweiterten Privacy-Features</p>
      </div>

      {/* Privacy Level Selector */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-400" />
          Privacy Level auswählen
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { level: 'standard' as PrivacyLevel, name: 'Standard', desc: 'Taproot Addresses', icon: '🛡️' },
            { level: 'high' as PrivacyLevel, name: 'Hoch', desc: 'Fresh Addresses + Lightning', icon: '🔒' },
            { level: 'maximum' as PrivacyLevel, name: 'Maximum', desc: 'HD-Wallet + CoinJoin', icon: '💎' }
          ].map((option) => (
            <button
              key={option.level}
              onClick={() => handlePrivacyLevelChange(option.level)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left",
                privacyLevel === option.level
                  ? getPrivacyLevelColor(option.level)
                  : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{option.icon}</span>
                <span className="font-semibold text-white">{option.name}</span>
              </div>
              <p className="text-sm text-slate-300">{option.desc}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-300">
            {getPrivacyLevelDescription(privacyLevel)}
          </p>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700">
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" />
            <span className="font-semibold text-white">Erweiterte Privacy-Optionen</span>
          </div>
          {showAdvancedOptions ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showAdvancedOptions && (
          <div className="p-4 border-t border-slate-700 space-y-4">
            {/* HD Wallet Info */}
            {hdWallet && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <h5 className="font-medium text-purple-400 mb-2">HD-Wallet Status</h5>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>Network: {hdWallet.network}</div>
                  <div>Derivation Path: {hdWallet.derivationPath}</div>
                  <div>Address Index: {hdWallet.addressIndex}</div>
                </div>
              </div>
            )}

            {/* CoinJoin Session */}
            {coinJoinSession && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h5 className="font-medium text-blue-400 mb-2">CoinJoin Session</h5>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>Status: {coinJoinSession.status}</div>
                  <div>Participants: {coinJoinSession.participants}</div>
                  <div>Fee: {coinJoinSession.fee} sats</div>
                  <div>ETA: {coinJoinSession.estimatedTime}</div>
                </div>
              </div>
            )}

            {/* Lightning Invoice */}
            {lightningInvoice && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h5 className="font-medium text-yellow-400 mb-2">Lightning Invoice</h5>
                <div className="text-sm text-slate-300 space-y-1">
                  <div>Amount: {lightningInvoice.amount} sats</div>
                  <div>Expires: {new Date(lightningInvoice.expiry).toLocaleString()}</div>
                  <div className="font-mono text-xs bg-slate-700 p-2 rounded mt-2 break-all">
                    {lightningInvoice.invoice}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Privacy Metrics */}
      {privacyMetrics && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Privacy Metrics
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{privacyMetrics.anonymitySet}</div>
              <div className="text-sm text-slate-400">Anonymity Set</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{privacyMetrics.mixingRounds}</div>
              <div className="text-sm text-slate-400">Mixing Rounds</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{privacyMetrics.timeToMix}m</div>
              <div className="text-sm text-slate-400">Mixing Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{privacyMetrics.privacyScore}%</div>
              <div className="text-sm text-slate-400">Privacy Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
        >
          Abbrechen
        </button>

        <button
          onClick={() => console.log('🚀 Starting maximum privacy payment flow')}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-600 hover:to-purple-700 transition-all"
        >
          Mit Maximum Privacy zahlen
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-green-400 mb-1">Maximum Privacy aktiviert</p>
            <p className="text-green-300">
              Ihre Transaktion wird durch HD-Wallets, CoinJoin und Lightning Network
              maximal anonymisiert. Keine Rückverfolgung möglich.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


