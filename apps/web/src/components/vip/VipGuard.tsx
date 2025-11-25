import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsVip } from '../../hooks/useIsVip';
import { Crown, Sparkles, ArrowRight, Check, ShoppingBag, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRankInfo } from '../../hooks/useRankInfo';
import { useAuthStore } from '../../store/auth';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';

interface VipGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * Guard component that protects VIP-only features
 * Shows upgrade prompt if user is not VIP
 */
export const VipGuard = ({ 
  children, 
  fallback,
  showUpgradePrompt = true 
}: VipGuardProps) => {
  const { isVip, userRank } = useIsVip();
  const navigate = useNavigate();

  // If user is VIP, show protected content
  if (isVip) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt if enabled
  if (showUpgradePrompt) {
    return <VipUpgradePrompt userRank={userRank} />;
  }

  // Default: show nothing
  return null;
};

interface VipUpgradePromptProps {
  userRank: string | null;
}

const VipUpgradePrompt = ({ userRank }: VipUpgradePromptProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isNavigating, setIsNavigating] = useState(false);
  const { triggerHaptic } = useEnhancedTouch();

  // Use React Query hook for rank data with automatic caching and retry
  const {
    rankInfo: rankData,
    isLoading,
    isFetching,
    isError,
    errorMessage,
    refetch,
  } = useRankInfo(undefined, {
    enabled: !!user, // Only fetch if user is available
  });

  // VIP Requirements
  const VIP_REQUIREMENTS = {
    minInvites: 10,
    maxInvites: 15,
    minOrders: 9
  };

  // Calculate progress and requirements
  const getVipProgress = () => {
    if (!rankData) {
      return {
        currentRank: userRank || 'Nutzer',
        currentInvites: 0,
        currentOrders: 0,
        invitesProgress: 0,
        ordersProgress: 0,
        combinedProgress: 0,
        invitesNeeded: VIP_REQUIREMENTS.minInvites,
        ordersNeeded: VIP_REQUIREMENTS.minOrders,
        combinedNeeded: 0,
        canUnlockViaInvites: false,
        canUnlockViaOrders: false,
        canUnlockViaCombination: false,
        showCombination: false
      };
    }

    const currentInvites = rankData.invites || 0;
    const currentOrders = rankData.orders || 0;
    
    // Check if user can unlock via invites (at least 10, ideal range 10-15)
    // Mindestens 10 Einladungen reichen (auch wenn mehr als 15)
    const canUnlockViaInvites = currentInvites >= VIP_REQUIREMENTS.minInvites;
    const invitesNeeded = canUnlockViaInvites ? 0 : Math.max(0, VIP_REQUIREMENTS.minInvites - currentInvites);
    const invitesProgress = Math.min(100, (currentInvites / VIP_REQUIREMENTS.minInvites) * 100);
    
    // Check if user can unlock via orders (9+)
    const canUnlockViaOrders = currentOrders >= VIP_REQUIREMENTS.minOrders;
    const ordersNeeded = canUnlockViaOrders ? 0 : Math.max(0, VIP_REQUIREMENTS.minOrders - currentOrders);
    const ordersProgress = Math.min(100, (currentOrders / VIP_REQUIREMENTS.minOrders) * 100);

    // Check if user can unlock via combination (Einladungen + Bestellungen = 10+ Punkte)
    // Beispiel: 5 Einladungen + 5 Bestellungen = 10 Punkte
    const totalPoints = currentInvites + currentOrders;
    // Kombination funktioniert wenn man 10+ Punkte hat, aber nicht die einzelnen Anforderungen erfüllt
    const canUnlockViaCombination = totalPoints >= 10 && !canUnlockViaInvites && !canUnlockViaOrders;
    const combinedNeeded = canUnlockViaCombination ? 0 : Math.max(0, 10 - totalPoints);
    const combinedProgress = Math.min(100, (totalPoints / 10) * 100);
    
    // Zeige Kombination auch an, wenn sie relevant ist (nicht 0 Punkte und noch nicht erfüllt)
    const showCombination = totalPoints > 0 && (!canUnlockViaInvites && !canUnlockViaOrders);

    return {
      currentRank: rankData.rank || userRank || 'Nutzer',
      currentInvites,
      currentOrders,
      totalPoints,
      invitesProgress,
      ordersProgress,
      combinedProgress,
      invitesNeeded,
      ordersNeeded,
      combinedNeeded,
      canUnlockViaInvites,
      canUnlockViaOrders,
      canUnlockViaCombination,
      showCombination
    };
  };

  const progress = getVipProgress();
  // Overall progress: best of individual or combination
  const overallProgress = Math.max(
    progress.invitesProgress, 
    progress.ordersProgress, 
    progress.combinedProgress
  );
  const canUnlock = progress.canUnlockViaInvites || progress.canUnlockViaOrders || progress.canUnlockViaCombination;

  // Loading State with Skeleton
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center w-full max-w-2xl"
        >
          <div className="bg-gradient-to-br from-purple-900/40 via-black/60 to-pink-900/40 backdrop-blur-xl rounded-3xl border-2 border-purple-500/30 p-8 md:p-12 shadow-2xl">
            {/* Skeleton Loading */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full animate-pulse"></div>
            </div>
            <div className="h-8 bg-purple-500/20 rounded-lg w-3/4 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-purple-500/10 rounded-lg w-1/2 mx-auto mb-8 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-16 bg-purple-500/10 rounded-xl animate-pulse"></div>
              <div className="h-16 bg-purple-500/10 rounded-xl animate-pulse"></div>
              <div className="h-16 bg-purple-500/10 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error State with Retry Button
  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="bg-gradient-to-br from-red-900/40 via-black/60 to-pink-900/40 backdrop-blur-xl rounded-3xl border-2 border-red-500/30 p-8 md:p-12 shadow-2xl text-center">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="flex justify-center mb-6"
            >
              <AlertCircle className="w-16 h-16 text-red-400" />
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Fehler beim Laden
            </h2>
            
            <p className="text-lg text-red-200 mb-6">
              {errorMessage || 'Die Rang-Informationen konnten nicht geladen werden.'}
            </p>
            
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={() => {
                triggerHaptic('medium');
                refetch();
              }}
              disabled={isFetching}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isFetching ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                  <span>Wird geladen...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Erneut versuchen</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-gradient-to-br from-purple-900/40 via-black/60 to-pink-900/40 backdrop-blur-xl rounded-3xl border-2 border-purple-500/30 p-8 md:p-12 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
              <Crown className="w-20 h-20 text-purple-400 relative z-10" />
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            VIP-Zugang erforderlich
          </h2>

          {/* Description */}
          <p className="text-lg text-purple-200 text-center mb-8 max-w-xl mx-auto">
            Diese Funktion ist exklusiv für VIP-Mitglieder. Steige auf, um Zugang zu Premium-Features zu erhalten.
          </p>

          {/* Current Rank & Progress */}
          <div className="bg-black/40 rounded-2xl p-6 mb-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-purple-300 mb-1">Dein aktueller Status</p>
                <p className="text-2xl font-bold text-white">{progress.currentRank}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-300 mb-1">Nächster Status</p>
                <p className="text-2xl font-bold text-purple-400">VIP</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-purple-300 mb-2">
                <span>Fortschritt</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
            </div>

            {/* VIP Requirements */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-purple-300 mb-3">So erreichst du VIP:</p>
              
              {/* Option 1: Invitations */}
              <div className={`bg-black/30 rounded-xl p-4 border ${
                progress.canUnlockViaInvites 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-purple-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    progress.canUnlockViaInvites
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500/30 text-purple-400 border border-purple-500/50'
                  }`}>
                    {progress.canUnlockViaInvites ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">1</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-1 ${
                      progress.canUnlockViaInvites ? 'text-green-400' : 'text-white'
                    }`}>
                      {VIP_REQUIREMENTS.minInvites}-{VIP_REQUIREMENTS.maxInvites} erfolgreiche Einladungen
                    </p>
                    {progress.canUnlockViaInvites ? (
                      <p className="text-xs text-green-300">✓ Anforderung erfüllt!</p>
                    ) : (
                      <p className="text-xs text-purple-300">
                        Aktuell: {progress.currentInvites} von {VIP_REQUIREMENTS.minInvites}-{VIP_REQUIREMENTS.maxInvites} 
                        {progress.invitesNeeded > 0 && (
                          <span className="text-pink-400 ml-1">• Noch {progress.invitesNeeded} fehlen</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ODER Separator */}
              <div className="flex items-center justify-center py-1">
                <div className="flex-1 h-px bg-purple-500/30"></div>
                <span className="px-4 text-sm font-bold text-purple-400">ODER</span>
                <div className="flex-1 h-px bg-purple-500/30"></div>
              </div>

              {/* Option 2: Orders */}
              <div className={`bg-black/30 rounded-xl p-4 border ${
                progress.canUnlockViaOrders 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-purple-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    progress.canUnlockViaOrders
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500/30 text-purple-400 border border-purple-500/50'
                  }`}>
                    {progress.canUnlockViaOrders ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">2</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-1 ${
                      progress.canUnlockViaOrders ? 'text-green-400' : 'text-white'
                    }`}>
                      {VIP_REQUIREMENTS.minOrders}+ Bestellungen
                    </p>
                    {progress.canUnlockViaOrders ? (
                      <p className="text-xs text-green-300">✓ Anforderung erfüllt!</p>
                    ) : (
                      <p className="text-xs text-purple-300">
                        Aktuell: {progress.currentOrders} von {VIP_REQUIREMENTS.minOrders}+ 
                        {progress.ordersNeeded > 0 && (
                          <span className="text-pink-400 ml-1">• Noch {progress.ordersNeeded} fehlen</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ODER Separator */}
              {progress.showCombination && (
                <>
                  <div className="flex items-center justify-center py-1">
                    <div className="flex-1 h-px bg-purple-500/30"></div>
                    <span className="px-4 text-sm font-bold text-purple-400">ODER</span>
                    <div className="flex-1 h-px bg-purple-500/30"></div>
                  </div>

                  {/* Option 3: Combination */}
                  <div className={`bg-black/30 rounded-xl p-4 border ${
                    progress.canUnlockViaCombination 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : 'border-purple-500/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        progress.canUnlockViaCombination
                          ? 'bg-green-500 text-white'
                          : 'bg-purple-500/30 text-purple-400 border border-purple-500/50'
                      }`}>
                        {progress.canUnlockViaCombination ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">3</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium mb-1 ${
                          progress.canUnlockViaCombination ? 'text-green-400' : 'text-white'
                        }`}>
                          Kombination: Einladungen + Bestellungen = 10+ Punkte
                        </p>
                        {progress.canUnlockViaCombination ? (
                          <p className="text-xs text-green-300">✓ Anforderung erfüllt!</p>
                        ) : (
                          <p className="text-xs text-purple-300">
                            Aktuell: {progress.currentInvites} Einladungen + {progress.currentOrders} Bestellungen = {progress.totalPoints} Punkte
                            {progress.combinedNeeded > 0 && (
                              <span className="text-pink-400 ml-1">• Noch {progress.combinedNeeded} Punkte fehlen</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Info Text */}
              <p className="text-xs text-purple-400/80 mt-3 italic text-center">
                💡 Du kannst die Anforderungen kombinieren! Beispiel: 5 Einladungen + 5 Bestellungen = 10 Punkte
              </p>
            </div>
          </div>

          {/* VIP Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { icon: '⚡', title: 'Offline Einnahmen', desc: '30-75% CPS auch offline' },
              { icon: '🎁', title: 'Exklusive Drops', desc: 'Früher Zugang zu limitierten Items' },
              { icon: '👑', title: 'Premium Support', desc: 'Priorität bei Support-Anfragen' }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-black/30 rounded-xl p-4 border border-purple-500/20 text-center"
              >
                <div className="text-3xl mb-2">{benefit.icon}</div>
                <h3 className="text-white font-semibold mb-1">{benefit.title}</h3>
                <p className="text-xs text-purple-300">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                triggerHaptic('medium');
                setIsNavigating(true);
                
                // Smooth navigation with haptic feedback
                requestAnimationFrame(() => {
                  try {
                    navigate('/vip/tiers');
                    // Scroll to top after navigation
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setIsNavigating(false);
                    }, 100);
                  } catch (error) {
                    console.error('Navigation error:', error);
                    setIsNavigating(false);
                  }
                });
              }}
              disabled={isNavigating}
              className="flex-1 group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <motion.div 
                className="absolute inset-0 bg-white/20"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: 'left' }}
              />
              <span className="relative flex items-center justify-center gap-2 z-10">
                {isNavigating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isNavigating ? 'Wird geladen...' : 'Mehr über Ränge erfahren'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98, y: 0 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                triggerHaptic('medium');
                setIsNavigating(true);
                
                // Smooth navigation with haptic feedback
                requestAnimationFrame(() => {
                  try {
                    navigate('/shop');
                    // Scroll to top after navigation
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setIsNavigating(false);
                    }, 100);
                  } catch (error) {
                    console.error('Navigation error:', error);
                    setIsNavigating(false);
                  }
                });
              }}
              disabled={isNavigating}
              className="flex-1 group bg-black/40 hover:bg-black/60 active:bg-black/70 text-purple-300 hover:text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 border border-purple-500/30 hover:border-purple-500/50 active:border-purple-500/60 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="group-hover:translate-x-0.5 transition-transform">
                Zum Shop
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

