import { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useCookieClickerStore, ACHIEVEMENTS, Achievement, mapLegacyRarity } from '../../store/cookieClicker';
import { 
  Trophy, 
  Star, 
  Crown, 
  Zap, 
  Sparkles,
  Award,
  Target,
  TrendingUp,
  Search,
  Filter,
  X,
  CheckCircle,
  Lock,
  Sparkle,
  Gift,
  Rocket,
  Diamond,
  Clock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber } from '../../utils/cookieFormatters';
import { ProgressRing } from './ProgressRing';
import { AchievementDetailModal } from './AchievementDetailModal';

// 🎯 MILESTONE RARITY CONFIG - EPISCHE STYLES AUF DEUTSCH!
const MILESTONE_RARITY_CONFIG = {
  common: {
    label: 'Gewöhnlich',
    gradient: 'from-gray-500/40 via-gray-400/30 to-gray-500/40',
    borderColor: 'border-gray-400/50',
    textColor: 'text-gray-200',
    iconColor: 'text-gray-300',
    glowColor: 'rgba(156, 163, 175, 0.5)',
    bgColor: 'bg-gray-500/10',
    shadow: 'shadow-[0_0_30px_rgba(156,163,175,0.4)]'
  },
  uncommon: {
    label: 'Ungewöhnlich',
    gradient: 'from-green-500/40 via-emerald-400/30 to-green-500/40',
    borderColor: 'border-green-400/50',
    textColor: 'text-green-200',
    iconColor: 'text-green-300',
    glowColor: 'rgba(34, 197, 94, 0.6)',
    bgColor: 'bg-green-500/10',
    shadow: 'shadow-[0_0_35px_rgba(34,197,94,0.5)]'
  },
  rare: {
    label: 'Selten',
    gradient: 'from-blue-500/40 via-cyan-400/30 to-blue-500/40',
    borderColor: 'border-blue-400/50',
    textColor: 'text-blue-200',
    iconColor: 'text-blue-300',
    glowColor: 'rgba(59, 130, 246, 0.7)',
    bgColor: 'bg-blue-500/10',
    shadow: 'shadow-[0_0_40px_rgba(59,130,246,0.6)]'
  },
  epic: {
    label: 'Episch',
    gradient: 'from-purple-500/40 via-pink-400/30 to-purple-500/40',
    borderColor: 'border-purple-400/50',
    textColor: 'text-purple-200',
    iconColor: 'text-purple-300',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    bgColor: 'bg-purple-500/10',
    shadow: 'shadow-[0_0_50px_rgba(168,85,247,0.7)]'
  },
  legendary: {
    label: 'Legendär',
    gradient: 'from-orange-500/40 via-yellow-400/30 to-orange-500/40',
    borderColor: 'border-orange-400/50',
    textColor: 'text-orange-200',
    iconColor: 'text-orange-300',
    glowColor: 'rgba(251, 146, 60, 0.9)',
    bgColor: 'bg-orange-500/10',
    shadow: 'shadow-[0_0_60px_rgba(251,146,60,0.8)]'
  },
  nebula: {
    label: 'Nebula',
    gradient: 'from-indigo-500/40 via-purple-500/30 via-pink-500/30 to-rose-500/40',
    borderColor: 'border-indigo-400/60',
    textColor: 'text-indigo-200',
    iconColor: 'text-indigo-300',
    glowColor: 'rgba(99, 102, 241, 1.0)',
    bgColor: 'bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20',
    shadow: 'shadow-[0_0_80px_rgba(99,102,241,0.9),0_0_120px_rgba(168,85,247,0.6)]'
  }
} as const;

// 🎆 ENHANCED PARTICLE SYSTEM - Verbesserter Konfetti-Effekt!
const ParticleBurst = memo(({ x, y, rarity }: { x: number; y: number; rarity: keyof typeof MILESTONE_RARITY_CONFIG }) => {
  const config = MILESTONE_RARITY_CONFIG[rarity];
  const particleCount = 40; // Mehr Partikel für besseren Effekt
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    angle: (360 / particleCount) * i + Math.random() * 10,
    distance: 80 + Math.random() * 120,
    size: 3 + Math.random() * 4,
    delay: Math.random() * 0.3
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50" style={{ left: x, top: y }}>
      <AnimatePresence>
        {particles.map((particle) => {
          const radians = (particle.angle * Math.PI) / 180;
          const translateX = Math.cos(radians) * particle.distance;
          const translateY = Math.sin(radians) * particle.distance + (Math.random() * 50 - 25); // Gravity effect

          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: config.glowColor,
                boxShadow: `0 0 ${particle.size * 3}px ${config.glowColor}, 0 0 ${particle.size * 6}px ${config.glowColor}`
              }}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [1, 1, 0.8, 0],
                scale: [0, 1.2, 1, 0.5],
                x: translateX,
                y: translateY,
                rotate: [0, 180, 360, 540]
              }}
              transition={{
                duration: 2,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: particle.delay,
                times: [0, 0.3, 0.7, 1]
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
});
ParticleBurst.displayName = 'ParticleBurst';

// 🌟 MILESTONE NOTIFICATION - EPISCHE BENACHRICHTIGUNG!
const MilestoneNotification = memo(({ notification, onClose }: { 
  notification: any; 
  onClose: () => void;
}) => {
  const milestone = ACHIEVEMENTS.find(a => a.id === notification.achievementId);
  const [isVisible, setIsVisible] = useState(true);
  const rarity = mapLegacyRarity(notification.rarity || milestone?.rarity || 'common');
  const config = MILESTONE_RARITY_CONFIG[rarity];
  const soundEnabled = useCookieClickerStore(state => state.soundEnabled);
  const soundPoolRef = useRef<any>(null);

  // Initialize sound pool and play unlock sound
  useEffect(() => {
    if (soundEnabled) {
      if (!soundPoolRef.current) {
        import('./EnhancedSoundSystem').then((module) => {
          soundPoolRef.current = new module.SoundPool();
          // Play unlock sound based on rarity
          const soundId = `milestone_unlock_${rarity}`;
          const volume = rarity === 'common' ? 0.5 : rarity === 'uncommon' ? 0.6 : rarity === 'rare' ? 0.7 : rarity === 'epic' ? 0.8 : rarity === 'legendary' ? 0.9 : 1.0;
          soundPoolRef.current.playSound(soundId, volume);
        }).catch(() => {});
      } else {
        const soundId = `milestone_unlock_${rarity}`;
        const volume = rarity === 'genesis' ? 0.5 : rarity === 'ascension' ? 0.6 : rarity === 'transcendence' ? 0.7 : rarity === 'divinity' ? 0.8 : 0.9;
        soundPoolRef.current.playSound(soundId, volume);
      }
    }
  }, [rarity, soundEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!milestone) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0, scale: 0.8, rotateY: -90 }}
          animate={{ 
            x: 0, 
            opacity: 1, 
            scale: 1,
            rotateY: 0,
            transition: {
              type: "spring",
              damping: 20,
              stiffness: 300
            }
          }}
          exit={{ 
            x: 400, 
            opacity: 0, 
            scale: 0.8,
            rotateY: 90,
            transition: { duration: 0.3 }
          }}
          className={cn(
            "fixed top-6 right-6 z-50 max-w-sm rounded-3xl border-2 backdrop-blur-xl overflow-hidden",
            config.borderColor,
            config.shadow
          )}
          style={{
            background: `linear-gradient(135deg, ${config.bgColor}, transparent)`,
            boxShadow: `0 8px 32px ${config.glowColor}`
          }}
        >
          {/* Animated Background Gradient */}
          <motion.div 
            className={cn("absolute inset-0 bg-gradient-to-br", config.gradient)}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Sparkle Effects für höhere Raritäten */}
          {['rare', 'epic', 'legendary', 'nebula'].includes(rarity) && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-white"
                  style={{
                    left: `${20 + i * 10}%`,
                    top: `${15 + (i % 3) * 30}%`,
                  }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          )}

          <div className="relative z-10 p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <motion.div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm border-2",
                  config.borderColor,
                  config.bgColor
                )}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {milestone.icon}
              </motion.div>

              {/* Content */}
              <div className="flex-1">
                <div className={cn("text-xs font-bold uppercase mb-1", config.textColor)}>
                  {config.label} Milestone
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{milestone.name}</h3>
                <p className="text-sm text-white/70">{milestone.description}</p>
                
                {/* Reward */}
                <div className="flex items-center gap-2 mt-3">
                  <Diamond className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">
                    +{formatNumber(milestone.reward)} Coins
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 500);
                }}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
MilestoneNotification.displayName = 'MilestoneNotification';

// 🎴 MILESTONE CARD - 3D GLASSMORPHISM DESIGN!
const MilestoneCard = memo(({ 
  milestone, 
  isUnlocked, 
  progress, 
  onClick 
}: { 
  milestone: Achievement;
  isUnlocked: boolean;
  progress: number;
  onClick?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedValue, setAnimatedValue] = useState(0);
  const rarity = milestone.rarity;
  const config = MILESTONE_RARITY_CONFIG[rarity];
  const progressPercentage = Math.min(100, (progress / milestone.requirement) * 100);
  const remaining = Math.max(0, milestone.requirement - progress);
  const soundEnabled = useCookieClickerStore(state => state.soundEnabled);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const soundPoolRef = useRef<any>(null);

  // Animated progress value - Fixed cleanup
  useEffect(() => {
    const duration = 800;
    const steps = 60;
    const increment = progressPercentage / steps;
    let currentStep = 0;
    let timer: NodeJS.Timeout | null = null;
    
    timer = setInterval(() => {
      currentStep++;
      setAnimatedProgress(prev => {
        const newVal = prev + increment;
        if (currentStep >= steps) return progressPercentage;
        return Math.min(progressPercentage, newVal);
      });
      if (currentStep >= steps && timer) {
        clearInterval(timer);
        timer = null;
        setAnimatedProgress(progressPercentage);
      }
    }, duration / steps);
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [progressPercentage]);

  // Animated count-up for progress value - Fixed cleanup
  useEffect(() => {
    const duration = 800;
    const steps = 60;
    const increment = progress / steps;
    let currentStep = 0;
    let timer: NodeJS.Timeout | null = null;
    
    timer = setInterval(() => {
      currentStep++;
      setAnimatedValue(prev => {
        const newVal = prev + increment;
        if (currentStep >= steps) return progress;
        return Math.min(progress, newVal);
      });
      if (currentStep >= steps && timer) {
        clearInterval(timer);
        timer = null;
        setAnimatedValue(progress);
      }
    }, duration / steps);
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [progress]);

  // Calculate ETA (estimated time to unlock)
  const calculateETA = () => {
    if (isUnlocked || cookiesPerSecond === 0) return null;
    if (milestone.id.includes('cookie') || milestone.id.includes('cookies')) {
      const seconds = remaining / cookiesPerSecond;
      if (seconds > 86400) return `${Math.floor(seconds / 86400)}d`;
      if (seconds > 3600) return `${Math.floor(seconds / 3600)}h`;
      if (seconds > 60) return `${Math.floor(seconds / 60)}m`;
      return `${Math.floor(seconds)}s`;
    }
    return null;
  };

  const eta = calculateETA();

  // Initialize sound pool
  useEffect(() => {
    if (soundEnabled && !soundPoolRef.current) {
      import('./EnhancedSoundSystem').then((module) => {
        soundPoolRef.current = new module.SoundPool();
      }).catch(() => {});
    }
  }, [soundEnabled]);

  // Sound on hover
  useEffect(() => {
    if (isHovered && soundEnabled && soundPoolRef.current && onClick) {
      soundPoolRef.current.playSound('milestone_hover', 0.3);
    }
  }, [isHovered, soundEnabled, onClick]);

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 backdrop-blur-xl transition-all duration-300 cursor-pointer",
        config.borderColor,
        isUnlocked ? "opacity-100" : "opacity-60 grayscale-[30%]"
      )}
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20, rotateX: -15 }}
      animate={{ 
        opacity: isUnlocked ? 1 : 0.6, 
        y: 0,
        rotateX: 0,
        scale: isHovered ? 1.05 : 1,
        z: isHovered ? 50 : 0
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Animated Background */}
      <motion.div 
        className={cn("absolute inset-0 bg-gradient-to-br", config.gradient)}
        animate={isHovered ? {
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        } : {}}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />

      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

      {/* Shine Effect on Hover */}
      {isUnlocked && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%', opacity: 0 }}
          animate={isHovered ? { x: '100%', opacity: 1 } : { x: '-100%', opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      )}

      {/* Sparkles for higher rarities */}
      {isUnlocked && ['transcendence', 'divinity', 'cosmos'].includes(rarity) && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 2) * 60}%`,
              }}
              animate={{
                scale: [0, 2, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Icon & Rarity Badge */}
        <div className="flex items-start justify-between mb-4">
          <motion.div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-md border-2",
              config.borderColor,
              config.bgColor
            )}
            animate={isUnlocked && isHovered ? {
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{
              duration: 0.5,
              ease: "easeInOut"
            }}
          >
            {milestone.icon}
          </motion.div>

          {!isUnlocked && (
            <Lock className="w-5 h-5 text-white/40" />
          )}
          {isUnlocked && (
            <CheckCircle className={cn("w-5 h-5", config.iconColor)} />
          )}
        </div>

        {/* Title & Description */}
        <h3 className={cn("text-lg font-bold mb-2", config.textColor)}>
          {milestone.name}
        </h3>
        <p className="text-sm text-white/70 mb-4 line-clamp-2">
          {milestone.description}
        </p>

        {/* Enhanced Progress Display */}
        {!isUnlocked && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/60 mb-2">
              <span>Fortschritt</span>
              <span className="font-bold text-white">{Math.round(animatedProgress)}%</span>
            </div>
            
            {/* Progress Ring & Bar Combined */}
            <div className="flex items-center gap-3">
              <ProgressRing
                progress={animatedProgress}
                size={60}
                strokeWidth={6}
                color={config.glowColor}
                animated={true}
                showLabel={false}
              />
              <div className="flex-1">
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", config.bgColor)}
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-white/70">
                    {formatNumber(Math.round(animatedValue))} / {formatNumber(milestone.requirement)}
                  </span>
                  {eta && (
                    <span className="text-white/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{eta}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reward */}
        <div className="flex items-center gap-2">
          <Diamond className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">
            {formatNumber(milestone.reward)} Coins
          </span>
        </div>
      </div>

      {/* Glow Effect */}
      {isUnlocked && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 60px ${config.glowColor}`
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
});
MilestoneCard.displayName = 'MilestoneCard';

// 🏆 MILESTONE SYSTEM - HAUPTPAGE!
export const AchievementSystem = memo(() => {
  const {
    unlockedAchievements,
    achievementNotifications,
    clearAchievementNotifications,
    cookies,
    totalCookies,
    clicks,
    level,
    streak,
    buildings,
    upgrades
  } = useCookieClickerStore();

  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [rarityFilter, setRarityFilter] = useState<keyof typeof MILESTONE_RARITY_CONFIG | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rarity' | 'progress' | 'name' | 'requirement'>('rarity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRarities, setSelectedRarities] = useState<Set<keyof typeof MILESTONE_RARITY_CONFIG>>(new Set());
  const [selectedMilestone, setSelectedMilestone] = useState<Achievement | null>(null);
  const [particleBursts, setParticleBursts] = useState<Array<{ id: string; x: number; y: number; rarity: keyof typeof MILESTONE_RARITY_CONFIG }>>([]);

  // Calculate progress for each milestone
  const milestoneProgress = useMemo(() => {
    const progress: Record<string, number> = {};
    
    ACHIEVEMENTS.forEach(milestone => {
      if (milestone.id.includes('click')) {
        progress[milestone.id] = clicks;
      } else if (milestone.id.includes('cookie') || milestone.id.includes('cookies')) {
        progress[milestone.id] = totalCookies;
      } else if (milestone.id.includes('level')) {
        progress[milestone.id] = level;
      } else if (milestone.id.includes('combo') || milestone.id.includes('streak')) {
        progress[milestone.id] = streak;
      } else if (milestone.id.includes('building')) {
        progress[milestone.id] = Object.values(buildings).reduce((sum, count) => sum + count, 0);
      } else if (milestone.id.includes('prestige')) {
        // Will be calculated from store if prestige exists
        progress[milestone.id] = 0;
      } else {
        progress[milestone.id] = 0;
      }
    });
    
    return progress;
  }, [clicks, totalCookies, level, streak, buildings]);

  // Filter and sort milestones - Optimized with Set for faster lookups
  const unlockedSet = useMemo(() => new Set(unlockedAchievements), [unlockedAchievements]);
  
  const filteredMilestones = useMemo(() => {
    let filtered = ACHIEVEMENTS.filter(milestone => {
      const isUnlocked = unlockedSet.has(milestone.id);
      
      // Filter by lock status
      if (filter === 'unlocked' && !isUnlocked) return false;
      if (filter === 'locked' && isUnlocked) return false;
      
      // Filter by rarity (multi-select)
      if (selectedRarities.size > 0 && !selectedRarities.has(milestone.rarity)) return false;
      if (rarityFilter !== 'all' && milestone.rarity !== rarityFilter) return false;
      
      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!milestone.name.toLowerCase().includes(query) &&
            !milestone.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      return true;
    });

    // Sort milestones
    filtered.sort((a, b) => {
      const aUnlocked = unlockedSet.has(a.id);
      const bUnlocked = unlockedSet.has(b.id);
      const aProgress = milestoneProgress[a.id] || 0;
      const bProgress = milestoneProgress[b.id] || 0;
      const aProgressPercent = aProgress / a.requirement;
      const bProgressPercent = bProgress / b.requirement;

      let comparison = 0;

      switch (sortBy) {
        case 'rarity': {
          const rarityOrder: Record<string, number> = {
            'common': 1,
            'uncommon': 2,
            'rare': 3,
            'epic': 4,
            'legendary': 5,
            'nebula': 6
          };
          comparison = rarityOrder[a.rarity] - rarityOrder[b.rarity];
          break;
        }
        case 'progress':
          comparison = aProgressPercent - bProgressPercent;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'requirement':
          comparison = a.requirement - b.requirement;
          break;
      }

      // Unlocked achievements first when sorting by progress
      if (sortBy === 'progress') {
        if (aUnlocked && !bUnlocked) return -1;
        if (!aUnlocked && bUnlocked) return 1;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [unlockedSet, filter, rarityFilter, searchQuery, sortBy, sortOrder, selectedRarities, milestoneProgress]);

  // Handle notification close with particle burst - Optimized
  const handleNotificationClose = useCallback((notificationId: string) => {
    const notification = achievementNotifications.find(n => n.id === notificationId);
    if (notification) {
      const milestone = ACHIEVEMENTS.find(a => a.id === notification.achievementId);
      if (milestone) {
        const rarity = mapLegacyRarity(notification.rarity || milestone.rarity);
        // Add particle burst (center of screen for now)
        const burstId = Math.random().toString(36).substring(2, 11);
        setParticleBursts(prev => {
          // Limit particle bursts to prevent memory issues
          const newBursts = [...prev, {
            id: burstId,
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            rarity
          }];
          return newBursts.slice(-5); // Max 5 bursts at once
        });
        setTimeout(() => {
          setParticleBursts(prev => prev.filter(b => b.id !== burstId));
        }, 2000);
      }
    }
    clearAchievementNotifications();
  }, [achievementNotifications, clearAchievementNotifications]);

  // Optimized milestone click handler
  const handleMilestoneClick = useCallback((milestone: Achievement) => {
    setSelectedMilestone(milestone);
  }, []);

  // Stats - Optimized with better memoization
  const stats = useMemo(() => {
    const total = ACHIEVEMENTS.length;
    const unlocked = unlockedAchievements.length;
    const locked = total - unlocked;
    const completion = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    
    // Use Set for faster lookups
    const unlockedSet = new Set(unlockedAchievements);
    
    const byRarity = Object.keys(MILESTONE_RARITY_CONFIG).reduce((acc, rarity) => {
      const milestones = ACHIEVEMENTS.filter(m => m.rarity === rarity);
      const unlockedInRarity = milestones.filter(m => unlockedSet.has(m.id)).length;
      acc[rarity as keyof typeof MILESTONE_RARITY_CONFIG] = {
        total: milestones.length,
        unlocked: unlockedInRarity
      };
      return acc;
    }, {} as Record<keyof typeof MILESTONE_RARITY_CONFIG, { total: number; unlocked: number }>);

    return { total, unlocked, locked, completion, byRarity };
  }, [unlockedAchievements]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Milestones</h2>
          <p className="text-white/60">
            {stats.unlocked} von {stats.total} erreicht ({stats.completion}%)
          </p>
        </div>
        
        {/* Stats Cards - Responsive */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          {Object.entries(MILESTONE_RARITY_CONFIG).map(([rarity, config]) => {
            const rarityStats = stats.byRarity[rarity as keyof typeof MILESTONE_RARITY_CONFIG];
            return (
              <motion.div
                key={rarity}
                className={cn(
                  "px-3 md:px-4 py-2 rounded-xl border-2 backdrop-blur-sm",
                  config.borderColor,
                  config.bgColor
                )}
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Object.keys(MILESTONE_RARITY_CONFIG).indexOf(rarity) * 0.1 }}
              >
                <div className={cn("text-xs md:text-sm font-bold mb-1", config.textColor)}>
                  {config.label}
                </div>
                <div className="text-base md:text-lg font-bold text-white">
                  {rarityStats.unlocked}/{rarityStats.total}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="space-y-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Milestones durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'unlocked', 'locked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filter === f
                    ? "bg-accent text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {f === 'all' ? 'Alle' : f === 'unlocked' ? 'Erreicht' : 'Gesperrt'}
              </button>
            ))}
          </div>

          {/* Rarity Filter - Multi-Select */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setRarityFilter('all');
                setSelectedRarities(new Set());
              }}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                rarityFilter === 'all' && selectedRarities.size === 0
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              )}
            >
              Alle Rarities
            </button>
            {Object.entries(MILESTONE_RARITY_CONFIG).map(([rarity, config]) => {
              const isSelected = selectedRarities.has(rarity as keyof typeof MILESTONE_RARITY_CONFIG);
              return (
                <button
                  key={rarity}
                  onClick={() => {
                    const newSet = new Set(selectedRarities);
                    if (isSelected) {
                      newSet.delete(rarity as keyof typeof MILESTONE_RARITY_CONFIG);
                    } else {
                      newSet.add(rarity as keyof typeof MILESTONE_RARITY_CONFIG);
                    }
                    setSelectedRarities(newSet);
                    if (newSet.size === 0) {
                      setRarityFilter('all');
                    } else {
                      setRarityFilter(rarity as keyof typeof MILESTONE_RARITY_CONFIG);
                    }
                  }}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                    isSelected
                      ? config.borderColor + " " + config.bgColor + " " + config.textColor
                      : "border-transparent bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  {config.label} {isSelected && '✓'}
                </button>
              );
            })}
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-white/60">Sortieren:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
            >
              <option value="rarity">Seltenheit</option>
              <option value="progress">Fortschritt</option>
              <option value="name">Name</option>
              <option value="requirement">Anforderung</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium transition-all",
                "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              )}
              title={sortOrder === 'asc' ? 'Aufsteigend' : 'Absteigend'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Milestones Grid with Stagger Animation - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMilestones.map((milestone, index) => {
            const isUnlocked = unlockedAchievements.includes(milestone.id);
            const progress = milestoneProgress[milestone.id] || 0;
            
            return (
              <motion.div
                key={milestone.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.8, rotateY: -15 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  rotateY: 0
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  rotateY: 15,
                  transition: { duration: 0.2 }
                }}
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                transition={{ 
                  duration: 0.5,
                  delay: Math.min(index * 0.03, 0.5),
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                <MilestoneCard
                  milestone={milestone}
                  isUnlocked={isUnlocked}
                  progress={progress}
                  onClick={() => handleMilestoneClick(milestone)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredMilestones.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">Keine Milestones gefunden</p>
        </motion.div>
      )}

      {/* Notifications */}
      <AnimatePresence>
        {achievementNotifications.map((notification) => (
          <MilestoneNotification
            key={notification.id}
            notification={notification}
            onClose={() => handleNotificationClose(notification.id)}
          />
        ))}
      </AnimatePresence>

      {/* Particle Bursts */}
      <AnimatePresence>
        {particleBursts.map((burst) => (
          <ParticleBurst
            key={burst.id}
            x={burst.x}
            y={burst.y}
            rarity={burst.rarity}
          />
        ))}
      </AnimatePresence>

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        achievement={selectedMilestone}
        isOpen={!!selectedMilestone}
        onClose={() => setSelectedMilestone(null)}
        progress={selectedMilestone ? (milestoneProgress[selectedMilestone.id] || 0) : 0}
        isUnlocked={selectedMilestone ? unlockedAchievements.includes(selectedMilestone.id) : false}
      />
    </div>
  );
});
AchievementSystem.displayName = 'AchievementSystem';

