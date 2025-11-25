import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Flame, ArrowRight, Sparkles } from "lucide-react";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { getPersonalizedRecommendations, getRecommendationReason, calculateRecommendationScore } from "../../utils/recommendationEngine";
import { useShopStore } from "../../store/shop";

export const PersonalizedRecommendations = memo(({
  products,
  reducedMotion
}: {
  products: any[];
  reducedMotion: boolean;
}) => {
  const navigate = useNavigate();
  const { trackProductView } = useUserPreferences();
  const { interests } = useShopStore();

  // Enhanced ML-based recommendations
  const recommendedProducts = useMemo(() => {
    if (products.length === 0) return [];

    const preferences = {
      interests: interests || {},
      viewedProducts: [], // Could be tracked in user preferences
      purchasedProducts: [], // Could be tracked in user preferences
      favoriteCategories: [] // Could be derived from interests
    };

    const scored = products
      .map(product => calculateRecommendationScore(product, preferences))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return scored.map(item => ({
      ...item.product,
      recommendationScore: item.score,
      recommendationReason: getRecommendationReason(item)
    }));
  }, [products, interests]);

  if (recommendedProducts.length === 0) return null;

  return (
    <section className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-text flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              Für dich empfohlen
            </h2>
            <p className="text-sm text-muted mt-1">KI-basierte Empfehlungen basierend auf deinen Interessen</p>
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors"
          >
            <span>Alle anzeigen</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {recommendedProducts.map((product) => {
            const interestCount = product.interest || 0;
            const score = product.recommendationScore || 0;
            const reason = product.recommendationReason || 'Empfohlen für dich';

            return (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={reducedMotion ? {} : { 
                  y: -8,
                  scale: 1.02,
                  rotateX: -2,
                  rotateY: 2
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  trackProductView(product.id);
                  navigate('/shop');
                }}
                className="cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20
                }}
              >
                <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 transition-all duration-300 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/20 block">
                  {/* Animated background glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/5 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
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
                  
                  <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                    <motion.span 
                      className="text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-accent to-emerald-400 text-black"
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.3 }}
                    >
                      ✨ {Math.round(score)}% Match
                    </motion.span>
                    <motion.span 
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {reason}
                    </motion.span>
                  </div>

                  <div className="relative z-10 p-6 pt-12">
                    <motion.div 
                      className="flex items-center gap-1 mb-4"
                      whileHover={{ scale: 1.05 }}
                    >
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
                        <Flame className="h-4 w-4 text-orange-400" />
                      </motion.div>
                      <span className="text-sm text-orange-400 font-semibold">{interestCount} Interessenten</span>
                    </motion.div>

                    <motion.h3 
                      className="text-xl font-bold text-text mb-2"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {product.name}
                    </motion.h3>
                    <p className="text-sm text-muted line-clamp-2 mb-4">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <motion.p 
                          className="text-2xl font-bold text-text"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          €{product.price}
                        </motion.p>
                        <p className="text-xs text-muted">
                          {product.leadTime === 'same_day' ? '📦 Same Day' : product.leadTime === '2_days' ? '📦 2 Tage' : '⏰ Preorder'}
                        </p>
                      </div>
                      <motion.div 
                        className="flex items-center gap-2 text-accent"
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <span className="text-sm font-medium">Ansehen</span>
                        <motion.div
                          animate={{
                            x: [0, 4, 0]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
});
