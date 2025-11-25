import { memo } from "react";
import { motion } from "framer-motion";
import { Clock, Flame, Crown, Gift, Timer } from "lucide-react";

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

export const LimitedOffersSection = memo(({
  offers,
  reducedMotion
}: {
  offers: any[];
  reducedMotion: boolean;
}) => {
  return (
    <section className="space-y-6" aria-labelledby="limited-offers-heading">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="limited-offers-heading" className="text-2xl font-semibold text-text">Limited Time Offers</h2>
          <p className="text-sm text-muted mt-1">Schnapp dir die besten Deals bevor sie weg sind</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-accent">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Läuft ab</span>
        </div>
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-3"
        variants={listContainer}
        initial={reducedMotion ? "visible" : "hidden"}
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {offers.map((offer, index) => (
          <motion.article
            key={index}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md bg-gradient-to-br ${offer.color} p-6 text-white shadow-[0_0_40px_rgba(0,0,0,0.3)] cursor-pointer`}
            role="article"
            aria-label={`${offer.title}: ${offer.description}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Handle keyboard interaction
              }
            }}
          
            variants={listItem}
            initial={reducedMotion ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={reducedMotion ? {} : { 
              scale: 1.05, 
              rotateX: -2, 
              rotateY: 2,
              y: -4,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ 
              duration: reducedMotion ? 0 : 0.35, 
              ease: "easeOut",
              type: 'spring',
              stiffness: 300,
              damping: 20
            }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Animated gradient overlay on hover */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear'
              }}
              style={{
                backgroundSize: '200% 200%'
              }}
            />
            <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:bg-black/10" />
            
            {/* Glow effect on hover */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${offer.color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`}
              animate={reducedMotion ? {} : {
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <motion.div 
                  className="p-2 rounded-xl bg-white/20"
                  whileHover={{ 
                    rotate: [0, -10, 10, 0],
                    scale: 1.1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <offer.icon className="h-6 w-6" />
                </motion.div>
                <motion.span 
                  className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full"
                  animate={{
                    opacity: [1, 0.7, 1],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  {offer.badge}
                </motion.span>
              </div>
              <motion.h3 
                className="text-xl font-semibold mb-2"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {offer.title}
              </motion.h3>
              <p className="text-sm opacity-90 mb-4">{offer.description}</p>
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                >
                  <Timer className="h-4 w-4" />
                </motion.div>
                <span className="text-sm font-semibold">{offer.timeLeft} verbleibend</span>
              </motion.div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
});
