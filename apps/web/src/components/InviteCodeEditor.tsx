import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useShopStore } from '../store/shop';
import { useAuthStore } from '../store/auth';
import { useMobileOptimizations } from './MobileOptimizations';
import { BottomSheet } from './mobile/BottomSheet';
import { useEnhancedTouch } from '../hooks/useEnhancedTouch';

interface InviteCodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode?: string;
  userRank: string;
}

export const InviteCodeEditor = ({ 
  isOpen, 
  onClose, 
  currentCode = '',
  userRank 
}: InviteCodeEditorProps) => {
  const [code, setCode] = useState(currentCode);
  const [isValidating, setIsValidating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  const { updatePersonalInviteCode, validatePersonalInviteCode } = useShopStore();
  const { user } = useAuthStore();
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  
  // Get telegramId from localStorage (set during Telegram login)
  const telegramId = user?.id ? parseInt(user.id.replace('tg:', ''), 10) : 
    (typeof window !== 'undefined' ? parseInt(localStorage.getItem('telegram_id') || '0', 10) : 0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCode(currentCode);
      setValidationError(null);
      setIsAvailable(null);
    }
  }, [isOpen, currentCode]);

  // Validate code format
  const validateFormat = useCallback((value: string): string | null => {
    if (!value || value.length < 6 || value.length > 20) {
      return 'Code muss zwischen 6 und 20 Zeichen lang sein';
    }
    
    if (!/^[A-Z0-9-]+$/.test(value)) {
      return 'Code darf nur Großbuchstaben, Zahlen und Bindestriche enthalten';
    }
    
    const upperCode = value.toUpperCase();
    const reservedPrefixes = ['ADMIN', 'SYSTEM', 'TEST'];
    const reservedWords = ['ADMIN', 'SYSTEM', 'TEST', 'ROOT', 'API'];
    
    for (const prefix of reservedPrefixes) {
      if (upperCode.startsWith(prefix) && prefix !== 'NEB-') {
        return `Code darf nicht mit "${prefix}" beginnen`;
      }
    }
    
    for (const word of reservedWords) {
      if (upperCode.includes(word)) {
        return `Code darf das reservierte Wort "${word}" nicht enthalten`;
      }
    }
    
    return null;
  }, []);

  // Check availability with debounce
  useEffect(() => {
    if (!code || code.length < 6) {
      setIsAvailable(null);
      setValidationError(null);
      return;
    }

    const formatError = validateFormat(code);
    if (formatError) {
      setValidationError(formatError);
      setIsAvailable(false);
      return;
    }

    setValidationError(null);
    setIsValidating(true);

    const timeoutId = setTimeout(async () => {
      try {
        const available = await validatePersonalInviteCode(code.toUpperCase());
        setIsAvailable(available);
      } catch (error) {
        setIsAvailable(false);
        setValidationError('Fehler beim Prüfen der Verfügbarkeit');
      } finally {
        setIsValidating(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [code, validateFormat, validatePersonalInviteCode]);

  const handleUpdate = async () => {
    if (!telegramId) {
      setValidationError('Telegram ID nicht gefunden');
      triggerHaptic('error');
      return;
    }

    const formatError = validateFormat(code);
    if (formatError) {
      setValidationError(formatError);
      triggerHaptic('error');
      return;
    }

    if (isAvailable === false) {
      setValidationError('Dieser Code ist bereits vergeben');
      triggerHaptic('error');
      return;
    }

    setIsUpdating(true);
    setValidationError(null);
    triggerHaptic('light');

    try {
      await updatePersonalInviteCode(telegramId, code.toUpperCase());
      triggerHaptic('success');
      onClose();
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Codes');
      triggerHaptic('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const canEdit = userRank === 'VIP' || userRank === 'Stammkunde';

  if (!canEdit) {
    return null;
  }

  // Mobile Bottom Sheet Content
  const editorContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="p-2 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20"
          >
            <Sparkles className="h-5 w-5 text-accent" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold gradient-text">Invite Code ändern</h2>
            <p className="text-sm text-muted">Personalisiere deinen Code</p>
          </div>
        </div>
        {!isMobile && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </motion.button>
        )}
      </div>

      {/* Input Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text mb-2">
          Neuer Invite Code
        </label>
        <div className="relative">
          <motion.input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              triggerHaptic('light');
            }}
            placeholder="NEB-XXXXXX"
            maxLength={20}
            disabled={isUpdating}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-accent/30 text-text placeholder:text-muted font-mono text-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all disabled:opacity-50"
          />
          {isValidating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Loader2 className="h-5 w-5 text-accent animate-spin" />
            </motion.div>
          )}
          {!isValidating && isAvailable !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {isAvailable ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
            </motion.div>
          )}
        </div>
        
        {/* Validation Status */}
        <AnimatePresence>
          {validationError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-sm text-red-400 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </motion.p>
          )}
          {!validationError && isAvailable === true && code.length >= 6 && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 text-sm text-green-400 flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Code ist verfügbar
            </motion.p>
          )}
        </AnimatePresence>

        {/* Format Hints */}
        <p className="mt-2 text-xs text-muted">
          Min. 6, Max. 20 Zeichen • Großbuchstaben, Zahlen, Bindestriche
        </p>
      </div>

      {/* Rank Badge */}
      <div className="mb-6 flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent/20 to-purple-500/20 p-3 border border-accent/30">
        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-medium text-text">
          {userRank === 'VIP' ? 'VIP' : 'Stammkunde'} Berechtigung aktiv
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          disabled={isUpdating}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-text font-medium transition-colors disabled:opacity-50"
        >
          Abbrechen
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpdate}
          disabled={isUpdating || !code || isAvailable === false || isValidating || !!validationError}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-black font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird aktualisiert...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Code speichern
            </>
          )}
        </motion.button>
      </div>
    </>
  );

  // Mobile: Bottom Sheet
  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Invite Code ändern"
        snapPoints={[85]}
        className="bg-gradient-to-br from-black/95 via-purple-900/30 to-black/95 backdrop-blur-xl"
      >
        <div className="p-6">
          {editorContent}
        </div>
      </BottomSheet>
    );
  }

  // Desktop: Modal
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl border border-accent/30 bg-gradient-to-br from-black/90 via-purple-900/20 to-black/90 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-purple-500/10 to-pink-500/10" />
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl animate-pulse" />
              <div className="absolute -bottom-20 -left-20 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

              {/* Content */}
              <div className="relative z-10 p-6">
                {editorContent}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

