import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Trophy, Filter, Search, Sparkles } from "lucide-react";
import { useAchievementStore } from "../../store/achievementStore";
import { AchievementCard } from "./AchievementCard";
import { cn } from "../../utils/cn";

type CategoryFilter = 'all' | 'building' | 'milestone' | 'special';

export const AchievementGrid = () => {
  const { achievements, unlockedCount, totalCount } = useAchievementStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [isMounted, setIsMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const filteredAchievements = achievements.filter(achievement => {
    // Category filter
    if (filter !== 'all' && achievement.category !== filter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        achievement.name.toLowerCase().includes(searchLower) ||
        achievement.description.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: reducedMotion ? 0 : 0.05,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: reducedMotion ? 0 : 20,
      scale: reducedMotion ? 1 : 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-slate-500">Lade Erfolge...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Animated background particles */}
      <div className="fixed inset-0 -z-10 opacity-10 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-yellow-400"
            style={{
              width: Math.random() * 8 + 4 + 'px',
              height: Math.random() * 8 + 4 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            Erfolge
          </h2>
          <p className="text-slate-400 mt-1">
            {unlockedCount} / {totalCount} freigeschaltet
          </p>
        </div>

        {/* Progress Ring */}
        <div className="relative">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 42 42">
            <circle
              cx="21"
              cy="21"
              r="18"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-slate-700"
            />
            <motion.circle
              cx="21"
              cy="21"
              r="18"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 18}
              initial={{
                strokeDashoffset: 2 * Math.PI * 18,
                rotate: -90,
                transformOrigin: '50% 50%'
              }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 18 * (1 - unlockedCount / totalCount),
                rotate: -90,
                transformOrigin: '50% 50%'
              }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 100,
                mass: 0.5
              }}
              className="text-yellow-400"
              style={{
                filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.5))'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Alle' },
              { key: 'building', label: 'Gebäude' },
              { key: 'milestone', label: 'Meilensteine' },
              { key: 'special', label: 'Spezial' }
            ].map(({ key, label }, index) => (
              <motion.button
                key={key}
                onClick={() => setFilter(key as CategoryFilter)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent",
                  filter === key
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-400/40"
                    : "bg-slate-700/80 text-slate-300 hover:bg-slate-600/80 hover:text-white"
                )}
                whileHover={reducedMotion ? {} : { scale: 1.05 }}
                whileTap={reducedMotion ? {} : { scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 10,
                  delay: 0.1 * index 
                }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Achievement Grid */}
      <AnimatePresence mode="wait">
        {filteredAchievements.length === 0 ? (
          <motion.div 
            className="text-center py-12 glass-card rounded-2xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Trophy className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Keine Erfolge gefunden</h3>
            <p className="text-slate-400 mb-4">Versuche deine Such- oder Filterkriterien anzupassen</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/70 text-slate-200 rounded-lg transition-colors border border-slate-600/50"
            >
              Filter zurücksetzen
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`grid-${filter}-${searchTerm}`}
          >
            <AnimatePresence>
              {filteredAchievements.map((achievement) => (
                <motion.div 
                  key={achievement.id} 
                  variants={itemVariants}
                  layout
                  transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 200
                  }}
                >
                  <AchievementCard
                    achievement={achievement}
                    showProgress={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Unlocks */}
      {unlockedAchievements.length > 0 && (
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">Zuletzt freigeschaltet</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {unlockedAchievements
                .slice(0, 6)
                .map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <AchievementCard
                      achievement={achievement}
                      className="opacity-90 hover:opacity-100 transition-opacity"
                    />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};
