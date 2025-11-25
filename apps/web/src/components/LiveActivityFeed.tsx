import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Activity, 
  ShoppingBag, 
  Zap, 
  Users, 
  Trophy,
  Gift,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useWebSocket, type WebSocketMessage } from '../hooks/useWebSocket';
import { useMobileOptimizations } from './MobileOptimizations';
import { useVirtualScroll } from '../hooks/useVirtualScroll';
import { ParticleSystem, CelebrationParticles } from './effects/ParticleSystem';

export interface LiveActivity {
  id: string;
  type: 'purchase' | 'drop' | 'invite' | 'achievement' | 'reward';
  user: string;
  message: string;
  timestamp: number;
  icon?: React.ReactNode;
}

const getActivityIcon = (type: LiveActivity['type']) => {
  switch (type) {
    case 'purchase':
      return <ShoppingBag className="h-4 w-4 text-green-400" />;
    case 'drop':
      return <Zap className="h-4 w-4 text-accent" />;
    case 'invite':
      return <Users className="h-4 w-4 text-blue-400" />;
    case 'achievement':
      return <Trophy className="h-4 w-4 text-yellow-400" />;
    case 'reward':
      return <Gift className="h-4 w-4 text-purple-400" />;
    default:
      return <Activity className="h-4 w-4 text-accent" />;
  }
};

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'gerade eben';
  if (seconds < 3600) return `vor ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)}h`;
  return `vor ${Math.floor(seconds / 86400)}d`;
};

// Mock activities for demo (will be replaced by real WebSocket data)
const generateMockActivity = (): LiveActivity => {
  const types: LiveActivity['type'][] = ['purchase', 'drop', 'invite', 'achievement', 'reward'];
  const users = ['@neo', '@luna', '@max', '@stella', '@kai', '@nova'];
  const messages = {
    purchase: ['hat einen Drop gekauft 🎯', 'hat 3 Produkte bestellt 🛍️', 'hat VIP freigeschaltet 👑'],
    drop: ['neuer Drop ist live! 🔥', 'Drop endet in 10 Min ⏰', 'Preorder gestartet 🚀'],
    invite: ['hat 5 Freunde eingeladen 🎉', 'Team Level aufgestiegen ⭐', 'Invite Code aktiviert ✨'],
    achievement: ['Erfolg freigeschaltet! 🏆', 'hat 100 Coins verdient 💰', 'ist jetzt Supernova 🌟'],
    reward: ['Tägliche Belohnung abgeholt 🎁', 'hat 50 Coins bekommen 💎', 'Bonus freigeschaltet ⚡']
  };

  const type = types[Math.floor(Math.random() * types.length)];
  const user = users[Math.floor(Math.random() * users.length)];
  const message = `${user} ${messages[type][Math.floor(Math.random() * messages[type].length)]}`;

  return {
    id: Math.random().toString(36).slice(2),
    type,
    user,
    message,
    timestamp: Date.now() - Math.random() * 300000 // Random time in last 5 min
  };
};

interface LiveActivityFeedProps {
  maxItems?: number;
  showMockData?: boolean;
  className?: string;
}

export const LiveActivityFeed = ({ 
  maxItems = 5,
  showMockData = true, // Enable in production when WebSocket is ready
  className = ''
}: LiveActivityFeedProps) => {
  const { isMobile } = useMobileOptimizations();
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isSticky, setIsSticky] = useState(true);
  const [autoHide, setAutoHide] = useState(false);
  const { scrollY } = useScroll();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Virtual scrolling for large lists
  const { containerRef, virtualData, handleScroll } = useVirtualScroll({
    items: activities,
    itemHeight: 80,
    containerHeight: isMobile ? 200 : 320,
    overscan: 2,
    enabled: activities.length > 10
  });

  // WebSocket connection (enabled for realtime features)
  const { lastMessage, isConnected } = useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
    enabled: true, // Enable WebSocket for realtime features
    onMessage: (message: WebSocketMessage) => {
      if (message.type === 'homepage:activity' && message.data) {
        const newActivity: LiveActivity = {
          id: Math.random().toString(36).slice(2),
          type: message.data.action || 'purchase',
          user: message.data.userHandle || '@anon',
          message: message.data.message || 'Neue Aktivität',
          timestamp: message.data.timestamp || Date.now()
        };
        
        setActivities(prev => [newActivity, ...prev].slice(0, maxItems));
        
        // Trigger particle effect for new activities
        setParticleTrigger(true);
        setTimeout(() => setParticleTrigger(false), 100);
        
        // Play sound if enabled (using Web Audio API for simple beep)
        if (soundEnabled && typeof window !== 'undefined' && window.AudioContext) {
          try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
          } catch (e) {
            // Ignore audio errors
          }
        }
        
        // Haptic feedback on mobile
        if (isMobile && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }
  });

  // Mock data generator for demo
  useEffect(() => {
    if (!showMockData) return;

    // Generate initial activities
    const initialActivities = Array.from({ length: 3 }, () => generateMockActivity())
      .sort((a, b) => b.timestamp - a.timestamp);
    setActivities(initialActivities);

    // Add new activity every 10-20 seconds
    const interval = setInterval(() => {
      const newActivity = generateMockActivity();
      setActivities(prev => [newActivity, ...prev].slice(0, maxItems));
      
      // Trigger particle effect for mock activities
      setParticleTrigger(true);
      setTimeout(() => setParticleTrigger(false), 100);
      
      // Play sound if enabled (using Web Audio API for simple beep)
      if (soundEnabled && typeof window !== 'undefined' && window.AudioContext) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
          // Ignore audio errors
        }
      }
      
      // Haptic feedback on mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, Math.random() * 10000 + 10000);

    return () => clearInterval(interval);
  }, [showMockData, maxItems]);

  const visibleActivities = useMemo(
    () => virtualData.enabled ? virtualData.visibleItems : activities.slice(0, maxItems),
    [activities, maxItems, virtualData]
  );
  
  // Auto-hide on scroll
  const opacity = useTransform(scrollY, [0, 200], [1, autoHide ? 0 : 1]);
  
  // Sticky position handling
  const y = useTransform(scrollY, [0, 100], [0, isSticky ? 0 : -100]);

  // Initialize audio for sound effects (simplified - can be enhanced later)
  useEffect(() => {
    // Audio will be handled via Web Audio API or external sound file if needed
    // For now, we'll use a simple beep via Web Audio API when sound is enabled
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [soundEnabled]);
  
  if (!isVisible) return null;

  // Mobile version: Compact top banner
  if (isMobile) {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`fixed top-16 left-0 right-0 z-30 ${className}`}
      >
        {/* Particle Effect */}
        <CelebrationParticles trigger={particleTrigger} />
        <div className="bg-black/90 backdrop-blur-xl border-b border-white/10 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <Activity className="h-4 w-4 text-accent animate-pulse flex-shrink-0" />
              <AnimatePresence mode="wait">
                {visibleActivities[0] && (
                  <motion.p
                    key={visibleActivities[0].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-xs text-text truncate"
                  >
                    {visibleActivities[0].message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
            >
              <X className="h-3 w-3 text-muted" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Desktop version: Enhanced Floating card
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      whileHover={{ scale: 1.02 }}
      style={{ y, opacity }}
      className={`fixed top-20 right-4 w-80 max-h-96 overflow-hidden z-40 ${className} ${!isSticky ? 'pointer-events-none' : ''}`}
    >
      {/* Particle Effect */}
      <CelebrationParticles trigger={particleTrigger} />
      <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl p-4 shadow-2xl relative overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-accent/10 via-purple-500/10 to-pink-500/10 opacity-50"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%']
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'linear'
          }}
          style={{
            backgroundSize: '200% 200%'
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Activity className="h-4 w-4 text-accent" />
              </motion.div>
              <h3 className="text-sm font-bold text-accent">
                Live Activity
              </h3>
              {isConnected && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-400"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label={soundEnabled ? "Sound ausschalten" : "Sound einschalten"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-3 w-3 text-accent" />
                ) : (
                  <VolumeX className="h-3 w-3 text-muted" />
                )}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                aria-label="Activity Feed schließen"
              >
                <X className="h-3 w-3 text-muted" />
              </button>
            </div>
          </div>
          
          <div 
            ref={containerRef}
            onScroll={handleScroll}
            className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide"
            style={virtualData.enabled ? { height: virtualData.containerHeight, position: 'relative' } : {}}
          >
            {virtualData.enabled && (
              <div style={{ height: virtualData.offsetY }} />
            )}
            <AnimatePresence mode="popLayout">
              {visibleActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ x: 300, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: -300, opacity: 0, scale: 0.8 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30,
                    delay: index * 0.05
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="group relative p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/30 transition-all cursor-pointer"
                >
                  {/* Activity type indicator bar */}
                  <motion.div
                    className={`
                      absolute left-0 top-0 bottom-0 w-1 rounded-l-xl
                      ${activity.type === 'purchase' ? 'bg-green-400' : ''}
                      ${activity.type === 'drop' ? 'bg-accent' : ''}
                      ${activity.type === 'invite' ? 'bg-blue-400' : ''}
                      ${activity.type === 'achievement' ? 'bg-yellow-400' : ''}
                      ${activity.type === 'reward' ? 'bg-purple-400' : ''}
                    `}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: index * 0.05 + 0.2 }}
                  />
                  
                  <div className="flex items-start gap-2 pl-1">
                    <motion.div 
                      className="flex-shrink-0 mt-0.5"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {activity.icon || getActivityIcon(activity.type)}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text leading-relaxed break-words group-hover:text-accent transition-colors">
                        {activity.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-muted">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                        <motion.div
                          className="w-1 h-1 rounded-full bg-accent"
                          animate={{
                            opacity: [1, 0.3, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {virtualData.enabled && (
              <div style={{ height: virtualData.totalHeight - (virtualData.endIndex + 1) * 80 }} />
            )}
          </div>

          {visibleActivities.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted text-sm"
            >
              Keine aktuellen Aktivitäten
            </motion.div>
          )}

          {/* Footer with stats */}
          {visibleActivities.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted">
              <span>{visibleActivities.length} Aktivitäten</span>
              <span className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span>Live</span>
                  </>
                ) : (
                  <span>Offline</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};


