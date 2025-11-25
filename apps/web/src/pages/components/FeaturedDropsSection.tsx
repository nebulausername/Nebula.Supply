import { memo, Suspense, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, ArrowRight, Rocket, Share2 } from "lucide-react";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { EnhancedDropsButton } from "../../components/EnhancedDropsButton";
import { StatsSkeleton } from "../../components/skeletons/HomePageSkeleton";
import { LiveDropProgressBar } from "../../components/drops/LiveDropProgressBar";
import { useLiveDropUpdates } from "../../hooks/useLiveDropUpdates";
import { SwipeableCard } from "../../components/cards/SwipeableCard";
import { useMobileOptimizations } from "../../components/MobileOptimizations";

const listContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const listItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 }
};

export const FeaturedDropsSection = memo(({
  drops,
  reducedMotion
}: {
  drops: any[];
  reducedMotion: boolean;
}) => {
  const navigate = useNavigate();
  const { trackDropClick } = useUserPreferences();
  const { isMobile } = useMobileOptimizations();
  
  const handleInviteShare = useCallback(() => {
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Nebula Supply',
        text: 'Check out these amazing drops!',
        url: window.location.origin
      });
    }
  }, []);
  
  // Get drop IDs for live updates
  const dropIds = useMemo(() => drops.map(d => d.id), [drops]);
  
  // Live drop updates
  const { dropUpdates, getDropUpdate, isConnected } = useLiveDropUpdates({
    dropIds,
    enabled: true,
    onStockChange: (update) => {
      // Optional: Show toast notification for stock changes
      console.log(`Stock changed for ${update.dropName}: ${update.stock}`);
    }
  });
  
  // Merge live updates with drop data
  const dropsWithUpdates = useMemo(() => {
    return drops.map(drop => {
      const update = getDropUpdate(drop.id);
      if (update) {
        return {
          ...drop,
          stock: update.stock ?? drop.stock,
          maxStock: update.maxStock ?? drop.maxStock,
          progress: update.progress ?? drop.progress,
          status: update.status ?? drop.status,
          endDate: update.endDate ?? drop.endDate,
          releaseDate: update.releaseDate ?? drop.releaseDate
        };
      }
      return drop;
    });
  }, [drops, getDropUpdate]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text">🔥 Hot Drops</h2>
          <p className="text-sm text-muted mt-1">Live Releases mit hohem Hype</p>
        </div>
        <EnhancedDropsButton
          variant="default"
          showLiveIndicator={true}
          dropCount={drops.filter(d => d.status === 'available').length}
        />
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={listContainer}
          initial={reducedMotion ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {dropsWithUpdates.map((drop, index) => (
            <SwipeableCard
              key={drop.id}
              onSwipeLeft={() => {
                trackDropClick(drop.id);
                navigate('/drops');
              }}
              onSwipeRight={() => {
                handleInviteShare();
              }}
              leftAction={{
                icon: <Share2 className="h-4 w-4" />,
                label: 'Teilen',
                color: 'bg-gradient-to-r from-accent/80 to-purple-500/80',
                onClick: () => handleInviteShare()
              }}
              rightAction={{
                icon: <Eye className="h-4 w-4" />,
                label: 'Ansehen',
                color: 'bg-gradient-to-r from-blue-500/80 to-cyan-500/80',
                onClick: () => {
                  trackDropClick(drop.id);
                  navigate('/drops');
                }
              }}
              threshold={80}
              disabled={!isMobile}
            >
              <motion.div
                variants={listItem}
                initial={reducedMotion ? "visible" : "hidden"}
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover={reducedMotion ? {} : {
                  scale: 1.05,
                  rotateX: -3,
                  rotateY: 3,
                  z: 50,
                  transition: {
                    type: 'spring',
                    stiffness: 400,
                    damping: 25
                  }
                }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  duration: reducedMotion ? 0 : 0.4,
                  ease: "easeOut",
                  delay: index * 0.1
                }}
                className="group cursor-pointer"
                style={{
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
                onClick={() => {
                  trackDropClick(drop.id);
                  navigate('/drops');
                }}
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/40 via-gray-900/20 to-black/60 backdrop-blur-lg transition-all duration-500 group-hover:border-accent/40 group-hover:shadow-[0_0_60px_rgba(11,247,188,0.3)]">
                {/* Animated Background Glow */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${drop.access === 'free' ? 'from-green-500/10' : drop.access === 'vip' ? 'from-purple-500/10' : 'from-orange-500/10'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Floating Particles */}
                {!reducedMotion && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full bg-accent/60"
                        style={{
                          top: `${20 + i * 10}%`,
                          left: `${10 + i * 8}%`,
                        }}
                        animate={{
                          y: [0, -15, 0],
                          opacity: [0.3, 0.8, 0.3],
                          scale: [0.5, 1.2, 0.5],
                        }}
                        transition={{
                          duration: 3 + i * 0.5,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="relative z-10 p-8">
                  {/* Enhanced Badge */}
                  <motion.div
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <motion.span
                      className={`text-xs font-bold px-4 py-2 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                        drop.access === 'free' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        drop.access === 'vip' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        drop.access === 'limited' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }`}
                      whileHover={{
                        scale: 1.05,
                        boxShadow: `0 0 20px ${drop.access === 'free' ? 'rgba(34, 197, 94, 0.5)' : drop.access === 'vip' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(249, 115, 22, 0.5)'}`
                      }}
                    >
                      {drop.badge}
                    </motion.span>

                    <motion.div
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm"
                      whileHover={{ scale: 1.05 }}
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Eye className="h-4 w-4 text-accent" />
                      </motion.div>
                      <span className="text-sm font-bold text-accent">{drop.interestCount}</span>
                    </motion.div>
                  </motion.div>

                  {/* Drop Info */}
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  >
                    <motion.h3
                      className="text-2xl font-bold text-white mb-3 group-hover:text-accent transition-colors duration-300"
                      whileHover={{ x: 5 }}
                    >
                      {drop.name}
                    </motion.h3>
                    <p className="text-muted leading-relaxed">{drop.shortDescription}</p>
                  </motion.div>

                  {/* Price & CTA */}
                  <motion.div
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.6 }}
                  >
                    <div className="flex flex-col">
                      <motion.p
                        className={`text-3xl font-bold ${
                          drop.price === 0 ? 'text-green-400' : 'text-white'
                        }`}
                        animate={{
                          textShadow: drop.price === 0 ? [
                            '0 0 10px rgba(34, 197, 94, 0.5)',
                            '0 0 20px rgba(34, 197, 94, 0.8)',
                            '0 0 10px rgba(34, 197, 94, 0.5)'
                          ] : 'none'
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {drop.price === 0 ? 'GRATIS' : `€${drop.price.toFixed(2)}`}
                      </motion.p>
                      <motion.p
                        className="text-sm text-muted"
                        whileHover={{ scale: 1.05 }}
                      >
                        {drop.flavorTag}
                      </motion.p>
                    </div>

                    <motion.div
                      className="flex items-center gap-3 text-accent group-hover:text-white transition-colors duration-300"
                      whileHover={{ x: 5 }}
                    >
                      <motion.span
                        className="text-sm font-medium"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Ansehen
                      </motion.span>
                      <motion.div
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Hover Glow Effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${drop.access === 'free' ? 'from-green-500/5' : drop.access === 'vip' ? 'from-purple-500/5' : 'from-orange-500/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}
                  />
                </div>
              </div>
              
              {/* Live Progress Bar */}
              {isConnected && (
                <div className="mt-4">
                  <LiveDropProgressBar
                    dropId={drop.id}
                    dropName={drop.name}
                    currentStock={drop.stock ?? 0}
                    maxStock={drop.maxStock}
                    progress={drop.progress}
                    status={drop.status}
                    releaseDate={drop.releaseDate}
                    endDate={drop.endDate}
                    showCountdown={true}
                  />
                </div>
              )}
              </motion.div>
            </SwipeableCard>
          ))}
        </motion.div>
      </Suspense>
    </section>
  );
});
