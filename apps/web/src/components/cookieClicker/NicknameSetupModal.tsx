import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { X, User, Check, AlertCircle, Crown, Star, Sparkles } from 'lucide-react';
import { setNickname, checkNicknameSet } from '../../api/cookieClicker';
import { useProfile } from '../../hooks/useProfile';
import { useIsVip } from '../../hooks/useIsVip';
import { showToast } from '../../store/toast';
import { cn } from '../../utils/cn';

interface NicknameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Particle Effect Component
const ParticleBurst = ({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    angle: (360 / 30) * i,
    distance: 80 + Math.random() * 60,
    delay: i * 0.02,
    color: ['#a855f7', '#3b82f6', '#ec4899', '#f59e0b'][Math.floor(Math.random() * 4)]
  }));

  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]" style={{ left: x, top: y }}>
      <AnimatePresence>
        {particles.map((particle) => {
          const radians = (particle.angle * Math.PI) / 180;
          const translateX = Math.cos(radians) * particle.distance;
          const translateY = Math.sin(radians) * particle.distance;

          return (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: particle.color,
                boxShadow: `0 0 10px ${particle.color}`
              }}
              initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              animate={{
                opacity: [1, 1, 0],
                scale: [1, 1.5, 0],
                x: translateX,
                y: translateY,
                rotate: 360
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
                delay: particle.delay
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const NicknameSetupModal = ({ isOpen, onClose, onSuccess }: NicknameSetupModalProps) => {
  const [nickname, setNicknameState] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canChange, setCanChange] = useState(false);
  const [hasNickname, setHasNickname] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particleBurst, setParticleBurst] = useState<{ x: number; y: number } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const { profile } = useProfile();
  const { isVip, userRank } = useIsVip();
  const isStammkunde = userRank === 'Stammkunde';

  // Check if nickname is already set
  useEffect(() => {
    if (isOpen) {
      checkNicknameSet()
        .then((result) => {
          setHasNickname(result.hasNickname);
          setCanChange(result.canChange || isVip || isStammkunde);
          if (result.nickname) {
            setNicknameState(result.nickname);
          }
        })
        .catch((error) => {
          // Silently handle error - user can still set nickname
          if (import.meta.env.DEV) {
            console.warn('Failed to check nickname status:', error);
          }
        });
    }
  }, [isOpen, isVip, isStammkunde]);

  // Validate nickname with memoization
  const validateNickname = useCallback((value: string): string | null => {
    const trimmed = value.trim();
    
    if (trimmed.length < 3) {
      return 'Nickname muss mindestens 3 Zeichen lang sein';
    }
    
    if (trimmed.length > 20) {
      return 'Nickname darf maximal 20 Zeichen lang sein';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return 'Nickname darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten';
    }
    
    return null;
  }, []);

  // Memoized validation state
  const validationState = useMemo(() => {
    if (nickname.length === 0) return 'empty';
    const error = validateNickname(nickname);
    if (error) return 'error';
    return 'valid';
  }, [nickname, validateNickname]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNicknameState(value);
    setError(null);
    
    // Real-time validation
    if (value.length > 0) {
      const validationError = validateNickname(value);
      if (validationError) {
        setError(validationError);
      }
    }
  }, [validateNickname]);

  // Handle submit
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedNickname = nickname.trim();
    const validationError = validateNickname(trimmedNickname);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if user can change nickname
    if (hasNickname && !canChange) {
      setError('Nickname kann nur von VIP oder Stammkunde geändert werden');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await setNickname(trimmedNickname);
      
      // Success animation with particles
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setParticleBurst({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
      
      setShowSuccess(true);
      showToast.success('Nickname erfolgreich gesetzt!');
      
      // Close after animation
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setShowSuccess(false);
      }, 1500);
    } catch (err: any) {
      // Extract error message from different possible formats
      let errorMessage = 'Fehler beim Setzen des Nicknames';
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.error) {
        errorMessage = err.error;
      }
      
      // Log for debugging in dev mode
      if (import.meta.env.DEV) {
        console.error('Nickname set error:', err);
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [nickname, hasNickname, canChange, validateNickname, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-0 outline-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotateX: -15 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.8, opacity: 0, rotateX: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-gradient-to-br from-black via-[#0a0a0a] to-[#050505] border-2 border-white/20 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Animated Background Gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear'
              }}
              style={{
                backgroundSize: '200% 200%'
              }}
            />
            
            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl" />
            
            {/* Sparkle Effects */}
            {showSuccess && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-white"
                    style={{
                      left: `${20 + (i % 4) * 20}%`,
                      top: `${20 + Math.floor(i / 4) * 30}%`,
                    }}
                    animate={{
                      scale: [0, 2, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            )}
            
            <div className="relative z-10">
            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-white/10">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <Dialog.Close className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-20">
                  <X className="w-5 h-5" />
                </Dialog.Close>
              </motion.div>
              
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border-2 border-white/20 backdrop-blur-sm"
                  animate={showSuccess ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  } : {}}
                  transition={{ duration: 0.6 }}
                  style={{
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
                  }}
                >
                  {showSuccess ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-6 h-6 text-green-400" />
                    </motion.div>
                  ) : (
                    <User className="w-6 h-6 text-purple-400" />
                  )}
                  {!showSuccess && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </motion.div>
                <div>
                  <Dialog.Title className="text-xl font-bold text-white">
                    {showSuccess ? 'Erfolgreich!' : hasNickname ? 'Nickname ändern' : 'Nickname wählen'}
                  </Dialog.Title>
                  <p className="text-sm text-white/60 mt-1">
                    {showSuccess 
                      ? 'Dein Nickname wurde gesetzt!'
                      : hasNickname 
                        ? canChange 
                          ? 'Du kannst deinen Nickname ändern' 
                          : 'Nur VIP oder Stammkunde können den Nickname ändern'
                        : 'Wähle einen einmaligen Nickname für das Leaderboard'
                    }
                  </p>
                </div>
              </div>

              {/* VIP/Stammkunde Badge */}
              {(isVip || isStammkunde) && (
                <motion.div
                  className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-blue-500/20 border border-white/10 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {isVip ? (
                    <>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Crown className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                      <span className="text-yellow-400 font-medium">VIP - Nickname änderbar</span>
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Star className="w-4 h-4 text-blue-400" />
                      </motion.div>
                      <span className="text-blue-400 font-medium">Stammkunde - Nickname änderbar</span>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* Avatar Preview */}
            {profile?.avatar && (
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <img
                    src={profile.avatar}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full border-2 border-white/20"
                  />
                  <div>
                    <p className="text-sm text-white/80">Avatar wird synchronisiert</p>
                    <p className="text-xs text-white/50">Vom Profil übernommen</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label htmlFor="nickname" className="block text-sm font-medium text-white/80 mb-2">
                  Nickname
                </label>
                <div className="relative">
                  <motion.input
                    ref={inputRef}
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="z.B. CookieMaster"
                    className={cn(
                      "w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-white/40 transition-all backdrop-blur-sm",
                      isFocused 
                        ? "border-purple-500/50 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20" 
                        : "border-white/10",
                      validationState === 'valid' && "border-green-500/50",
                      validationState === 'error' && "border-red-500/50"
                    )}
                    disabled={isSubmitting || (hasNickname && !canChange) || showSuccess}
                    maxLength={20}
                    pattern="[a-zA-Z0-9_-]+"
                    style={{
                      boxShadow: isFocused ? '0 0 20px rgba(168, 85, 247, 0.2)' : 'none'
                    }}
                  />
                  {isFocused && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                  {validationState === 'valid' && (
                    <motion.div
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Check className="w-5 h-5 text-green-400" />
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <motion.p
                    className="text-xs text-white/40"
                    animate={{
                      color: validationState === 'valid' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(255, 255, 255, 0.4)'
                    }}
                  >
                    {nickname.length}/20 Zeichen • Nur Buchstaben, Zahlen, _ und -
                  </motion.p>
                  {validationState === 'valid' && (
                    <motion.div
                      className="flex items-center gap-1 text-xs text-green-400"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Gültig</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info */}
              {!hasNickname && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-xs text-blue-400">
                    ⚠️ Der Nickname kann nur einmal gewählt werden. VIP und Stammkunde können ihn später ändern.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Dialog.Close
                    type="button"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all backdrop-blur-sm"
                  >
                    Abbrechen
                  </Dialog.Close>
                </motion.div>
                <motion.button
                  ref={buttonRef}
                  type="submit"
                  disabled={isSubmitting || !!error || nickname.trim().length === 0 || (hasNickname && !canChange) || showSuccess}
                  className="relative flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 overflow-hidden backdrop-blur-sm"
                  whileHover={!isSubmitting && !showSuccess ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!isSubmitting && !showSuccess ? { scale: 0.98 } : {}}
                  style={{
                    boxShadow: showSuccess 
                      ? '0 0 30px rgba(168, 85, 247, 0.8)' 
                      : '0 4px 15px rgba(168, 85, 247, 0.3)'
                  }}
                >
                  {/* Animated gradient background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                    style={{
                      backgroundSize: '200% 100%'
                    }}
                  />
                  
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: 'easeInOut'
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center gap-2">
                    {isSubmitting ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Speichern...
                      </>
                    ) : showSuccess ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                        Erfolgreich!
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {hasNickname ? 'Ändern' : 'Setzen'}
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </form>
            </div>
          </motion.div>
          
          {/* Particle Burst Effect */}
          <AnimatePresence>
            {particleBurst && (
              <ParticleBurst
                x={particleBurst.x}
                y={particleBurst.y}
                onComplete={() => setParticleBurst(null)}
              />
            )}
          </AnimatePresence>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

