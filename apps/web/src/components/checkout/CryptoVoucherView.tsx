import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Shield,
  Zap,
  Search,
  Filter
} from 'lucide-react';
import {
  createVoucherService,
  VoucherProvider,
  VoucherValidationResult,
  formatVoucherCode,
  validateVoucherFormat
} from '../../services/voucherService';
import { cn } from '../../utils/cn';

interface CryptoVoucherViewProps {
  amount: number;
  onVoucherValidated?: (result: VoucherValidationResult) => void;
  onCancel?: () => void;
}

export const CryptoVoucherView: React.FC<CryptoVoucherViewProps> = ({
  amount,
  onVoucherValidated,
  onCancel
}) => {
  const voucherService = createVoucherService();
  const [voucherCode, setVoucherCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<VoucherValidationResult | null>(null);
  const [providers, setProviders] = useState<VoucherProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<VoucherProvider | null>(null);
  const [showProviders, setShowProviders] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadProviders();
  }, [amount]);

  const loadProviders = () => {
    const availableProviders = voucherService.getProvidersForAmount(amount);
    setProviders(availableProviders);

    if (availableProviders.length > 0 && !selectedProvider) {
      setSelectedProvider(availableProviders[0]);
    }
  };

  const handleVoucherSubmit = async () => {
    if (!voucherCode.trim()) {
      setValidationResult({
        isValid: false,
        error: 'Bitte geben Sie einen Voucher-Code ein'
      });
      return;
    }

    if (!validateVoucherFormat(voucherCode)) {
      setValidationResult({
        isValid: false,
        error: 'Ungültiges Voucher-Format'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await voucherService.validateVoucherCode(voucherCode);

      setValidationResult(result);

      if (result.isValid && onVoucherValidated) {
        onVoucherValidated(result);
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: 'Validierung fehlgeschlagen'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getProviderIcon = (providerId: string) => {
    const icons: Record<string, string> = {
      dundle: '🛒',
      bitnovo: '₿',
      coinsbee: '🪙',
      recharge: '⚡',
      offgamers: '🎮'
    };
    return icons[providerId] || '🎫';
  };

  const openProviderWebsite = (provider: VoucherProvider) => {
    // In production, open the provider's website
    window.open(`https://${provider.id}.com`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Crypto Voucher</h3>
        <p className="text-slate-400">Kaufen Sie einen Voucher und lösen Sie ihn hier ein</p>
      </div>

      {/* Amount Display */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">€{amount.toFixed(2)}</div>
          <div className="text-sm text-slate-400">Zu zahlender Betrag</div>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-white">Empfohlene Anbieter</h4>
          <button
            onClick={() => setShowProviders(!showProviders)}
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
          >
            <Filter className="h-4 w-4" />
            {providers.length} verfügbar
          </button>
        </div>

        {showProviders && (
          <div className="space-y-3 mb-4">
            {providers.slice(0, 3).map((provider) => (
              <div
                key={provider.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  selectedProvider?.id === provider.id
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-lg">
                    {getProviderIcon(provider.id)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{provider.name}</div>
                    <div className="text-sm text-slate-400">
                      {provider.minAmount}€ - {provider.maxAmount}€
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-slate-400">Fee: {provider.fees}%</div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    provider.privacyLevel === 'high' ? 'bg-green-500/20 text-green-400' :
                    provider.privacyLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  )}>
                    {provider.privacyLevel} Privacy
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedProvider && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getProviderIcon(selectedProvider.id)}</span>
                <span className="font-medium text-white">{selectedProvider.name}</span>
              </div>
              <button
                onClick={() => openProviderWebsite(selectedProvider)}
                className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Website öffnen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Voucher Input */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <h4 className="font-semibold text-white mb-4">Voucher-Code eingeben</h4>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="VOUCHER-CODE-HIER-EINGEBEN"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              disabled={isValidating}
            />
          </div>

          <button
            onClick={handleVoucherSubmit}
            disabled={isValidating || !voucherCode.trim()}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
              isValidating || !voucherCode.trim()
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
            )}
          >
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Validierung läuft...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Voucher einlösen
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div className={cn(
          "rounded-xl border p-4",
          validationResult.isValid
            ? "bg-green-500/10 border-green-500/20"
            : "bg-red-500/10 border-red-500/20"
        )}>
          <div className="flex items-start gap-3">
            {validationResult.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className={cn(
                  "font-semibold",
                  validationResult.isValid ? "text-green-400" : "text-red-400"
                )}>
                  {validationResult.isValid ? 'Voucher gültig!' : 'Voucher ungültig'}
                </h4>
                {validationResult.isValid && validationResult.amount && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      €{validationResult.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-400">Wert</div>
                  </div>
                )}
              </div>

              {validationResult.error ? (
                <p className="text-sm text-slate-300">{validationResult.error}</p>
              ) : validationResult.isValid ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-300">
                    Der Voucher wurde erfolgreich validiert und der Betrag gutgeschrieben.
                  </p>
                  {validationResult.provider && (
                    <p className="text-sm text-slate-400">
                      Anbieter: {validationResult.provider}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="font-semibold text-blue-400 mb-3">Anleitung</h4>
        <div className="space-y-2 text-sm text-blue-300">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>Wählen Sie einen der empfohlenen Anbieter aus</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>Kaufen Sie einen Voucher im Wert von €{amount.toFixed(2)}</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>Geben Sie den Voucher-Code oben ein</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <span>Wir validieren den Code automatisch</span>
          </div>
        </div>
      </div>

      {/* Provider Info */}
      {selectedProvider && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <h4 className="font-semibold text-white mb-3">Über {selectedProvider.name}</h4>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-400 mb-1">Unterstützte Beträge</div>
              <div className="text-white">
                €{selectedProvider.minAmount} - €{selectedProvider.maxAmount}
              </div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Bearbeitungszeit</div>
              <div className="text-white">{selectedProvider.processingTime}</div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Gebühren</div>
              <div className="text-white">{selectedProvider.fees}%</div>
            </div>
            <div>
              <div className="text-slate-400 mb-1">Datenschutz</div>
              <div className={cn(
                "font-medium",
                selectedProvider.privacyLevel === 'high' ? 'text-green-400' :
                selectedProvider.privacyLevel === 'medium' ? 'text-yellow-400' :
                'text-red-400'
              )}>
                {selectedProvider.privacyLevel === 'high' ? 'Hoch' :
                 selectedProvider.privacyLevel === 'medium' ? 'Mittel' : 'Niedrig'}
              </div>
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
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-400 mb-1">Sicherheitshinweis</p>
            <p className="text-yellow-300">
              Voucher-Codes werden nur einmal akzeptiert und können nicht zurückgegeben werden.
              Stellen Sie sicher, dass Sie den korrekten Betrag kaufen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};




