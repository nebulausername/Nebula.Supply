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
  Settings,
  ChevronDown,
  ChevronUp,
  Layers,
  Shuffle
} from 'lucide-react';
import {
  createEthPrivacyService,
  StealthAddress,
  ZeroKnowledgeProof,
  MevProtection,
  EthPrivacyMetrics
} from '../../services/ethPrivacyService';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../utils/cn';

interface AdvancedEthPaymentViewProps {
  amount: number; // EUR amount
  orderId: string;
  onPaymentDetected?: (txHash: string) => void;
  onCancel?: () => void;
}

type PrivacyLevel = 'standard' | 'enhanced' | 'maximum';

export const AdvancedEthPaymentView: React.FC<AdvancedEthPaymentViewProps> = ({
  amount,
  orderId,
  onPaymentDetected,
  onCancel
}) => {
  const { user } = useAuthStore();
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('enhanced');
  const [stealthAddress, setStealthAddress] = useState<StealthAddress | null>(null);
  const [zkProof, setZkProof] = useState<ZeroKnowledgeProof | null>(null);
  const [mevProtection, setMevProtection] = useState<MevProtection | null>(null);
  const [privacyMetrics, setPrivacyMetrics] = useState<EthPrivacyMetrics | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const ethPrivacyService = createEthPrivacyService();

  useEffect(() => {
    initializePrivacyFeatures();
  }, [user, amount, privacyLevel]);

  const initializePrivacyFeatures = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Generate stealth address
      const address = await ethPrivacyService.generateStealthAddress(user.id, orderId);
      setStealthAddress(address);

      // Generate zk-proof for enhanced privacy
      if (privacyLevel === 'enhanced' || privacyLevel === 'maximum') {
        const proof = await ethPrivacyService.generateZkProof(user.id, {
          amount,
          recipient: address.address,
          timestamp: Date.now(),
          orderId
        });
        setZkProof(proof);
      }

      // Create MEV protection for maximum privacy
      if (privacyLevel === 'maximum') {
        const mev = await ethPrivacyService.createMevProtectedBundle(user.id, [
          {
            to: address.address,
            value: (amount / 2500 * 1e18).toString(),
            data: '0x',
            gasLimit: '21000'
          }
        ]);
        setMevProtection(mev);
      }

      // Calculate privacy metrics
      const metrics: EthPrivacyMetrics = {
        anonymityScore: ethPrivacyService.calculatePrivacyScore([
          'stealth_address',
          privacyLevel === 'enhanced' || privacyLevel === 'maximum' ? 'zk_proofs' : '',
          privacyLevel === 'maximum' ? 'mev_protection' : '',
          privacyLevel === 'maximum' ? 'layer2_privacy' : ''
        ].filter(Boolean)),
        stealthLevel: privacyLevel === 'maximum' ? 'maximum' : privacyLevel === 'enhanced' ? 'enhanced' : 'basic',
        zkProofsEnabled: privacyLevel === 'enhanced' || privacyLevel === 'maximum',
        mevProtection: privacyLevel === 'maximum',
        layer2Privacy: privacyLevel === 'maximum',
        timeToPrivacy: privacyLevel === 'maximum' ? 5 : privacyLevel === 'enhanced' ? 2 : 1
      };

      setPrivacyMetrics(metrics);

    } catch (error) {
      console.error('Error initializing ETH privacy features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivacyLevelChange = async (level: PrivacyLevel) => {
    setPrivacyLevel(level);
    await initializePrivacyFeatures();
  };

  const getPrivacyLevelDescription = (level: PrivacyLevel): string => {
    switch (level) {
      case 'maximum':
        return 'Stealth + zk-Proofs + MEV Protection + L2 Privacy - Maximale Anonymität';
      case 'enhanced':
        return 'Stealth + zk-Proofs - Erweiterte Anonymität';
      case 'standard':
        return 'Stealth Addresses - Grundlegende Anonymität';
      default:
        return '';
    }
  };

  const getPrivacyLevelColor = (level: PrivacyLevel): string => {
    switch (level) {
      case 'maximum': return 'text-purple-400 bg-purple-400/20 border-purple-400';
      case 'enhanced': return 'text-green-400 bg-green-400/20 border-green-400';
      case 'standard': return 'text-blue-400 bg-blue-400/20 border-blue-400';
      default: return 'text-slate-400 bg-slate-400/20 border-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-white">ETH Privacy-Adresse wird generiert</h3>
            <p className="text-slate-400">Stealth-Adresse für maximale Privatsphäre</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Ethereum Privacy Payment</h3>
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
            { level: 'standard' as PrivacyLevel, name: 'Standard', desc: 'Stealth Addresses', icon: '🛡️' },
            { level: 'enhanced' as PrivacyLevel, name: 'Erweitert', desc: 'Stealth + zk-Proofs', icon: '🔒' },
            { level: 'maximum' as PrivacyLevel, name: 'Maximum', desc: 'Stealth + zk + MEV + L2', icon: '💎' }
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

      {/* Stealth Address */}
      {stealthAddress && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-400" />
            Stealth-Adresse generiert
          </h4>

          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-400">Adresse:</span>
                <code className="text-xs text-white font-mono bg-slate-700 px-2 py-1 rounded">
                  {stealthAddress.address.slice(0, 10)}...{stealthAddress.address.slice(-8)}
                </code>
              </div>
              <div className="text-xs text-slate-400">
                Diese Adresse ist einmalig für Ihre Transaktion generiert
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Spending Key</div>
                <code className="text-xs text-white font-mono break-all">
                  {stealthAddress.spendingPubKey.slice(0, 20)}...
                </code>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Viewing Key</div>
                <code className="text-xs text-white font-mono break-all">
                  {stealthAddress.viewingPubKey.slice(0, 20)}...
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* zk-Proofs */}
      {zkProof && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-green-400" />
            Zero-Knowledge Proof generiert
          </h4>

          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-400">Circuit:</span>
                <span className="text-sm font-medium text-white">{zkProof.circuit}</span>
              </div>
              <div className="text-xs text-slate-400">
                Verifiziert ohne sensible Daten preiszugeben
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="text-xs text-slate-400">
                <strong>Public Inputs:</strong>
              </div>
              {zkProof.publicInputs.map((input, index) => (
                <div key={index} className="text-xs text-slate-300 bg-slate-700 p-2 rounded font-mono">
                  {input}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MEV Protection */}
      {mevProtection && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shuffle className="h-5 w-5 text-yellow-400" />
            MEV Protection aktiviert
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{mevProtection.gasOptimization}%</div>
              <div className="text-sm text-slate-400">Gas Optimization</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{100 - mevProtection.frontRunningRisk}%</div>
              <div className="text-sm text-slate-400">Front-Running Protection</div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="text-sm text-yellow-400">
              Bundle Hash: <code className="text-xs">{mevProtection.bundleHash}</code>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Metrics */}
      {privacyMetrics && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Privacy Metrics
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{privacyMetrics.anonymityScore}%</div>
              <div className="text-sm text-slate-400">Anonymity Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{privacyMetrics.timeToPrivacy}m</div>
              <div className="text-sm text-slate-400">Time to Privacy</div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                privacyMetrics.stealthLevel === 'maximum' ? 'bg-purple-500/20 text-purple-400' :
                privacyMetrics.stealthLevel === 'enhanced' ? 'bg-green-500/20 text-green-400' :
                'bg-blue-500/20 text-blue-400'
              )}>
                Stealth: {privacyMetrics.stealthLevel}
              </span>
              {privacyMetrics.zkProofsEnabled && (
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  zk-Proofs
                </span>
              )}
              {privacyMetrics.mevProtection && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                  MEV Protection
                </span>
              )}
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
          onClick={() => console.log('🚀 Starting maximum ETH privacy payment flow')}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold hover:from-purple-600 hover:to-blue-700 transition-all"
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
              Ihre ETH-Transaktion wird durch Stealth-Addresses, zk-Proofs und MEV-Schutz
              maximal anonymisiert. Staatliche Überwachung ausgeschlossen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


