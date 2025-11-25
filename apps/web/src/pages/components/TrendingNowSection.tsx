import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Flame, Eye, ShoppingBag, Rocket } from "lucide-react";
import { ScrollReveal } from "../../components/ScrollReveal";

interface TrendingItem {
  id: string;
  name: string;
  type: 'drop' | 'product';
  views: number;
  purchases: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  image?: string;
}

interface TrendingNowSectionProps {
  items?: TrendingItem[];
  reducedMotion?: boolean;
}

const mockTrendingItems: TrendingItem[] = [
  {
    id: '1',
    name: 'Nike Dunk Low Panda',
    type: 'drop',
    views: 1523,
    purchases: 89,
    trend: 'up',
    change: 23,
    image: undefined
  },
  {
    id: '2',
    name: 'Supreme Box Logo Tee',
    type: 'product',
    views: 1245,
    purchases: 67,
    trend: 'up',
    change: 15,
    image: undefined
  },
  {
    id: '3',
    name: 'Yeezy 350 V2',
    type: 'drop',
    views: 987,
    purchases: 45,
    trend: 'stable',
    change: 2,
    image: undefined
  }
];

export const TrendingNowSection = memo(({
  items = mockTrendingItems,
  reducedMotion = false
}: TrendingNowSectionProps) => {
  const navigate = useNavigate();

  return (
    <ScrollReveal direction="up" delay={0.2} reducedMotion={reducedMotion}>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-accent" />
              Trending Now
            </h2>
            <p className="text-sm text-muted mt-1">Was gerade angesagt ist</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-accent">
            <Flame className="h-4 w-4 animate-pulse" />
            <span>Live</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.1 }}
              whileHover={reducedMotion ? {} : {
                scale: 1.02,
                y: -4,
                transition: { type: 'spring', stiffness: 300 }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.type === 'drop' ? '/drops' : '/shop')}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/10"
            >
              {/* Trend Indicator */}
              <div className="absolute top-3 right-3 z-10">
                <motion.div
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold
                    ${item.trend === 'up' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                    ${item.trend === 'down' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                    ${item.trend === 'stable' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : ''}
                  `}
                  animate={item.trend === 'up' ? {
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                >
                  {item.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                  <span>+{item.change}%</span>
                </motion.div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {item.type === 'drop' ? (
                    <Rocket className="h-4 w-4 text-accent" />
                  ) : (
                    <ShoppingBag className="h-4 w-4 text-purple-400" />
                  )}
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {item.type === 'drop' ? 'Drop' : 'Product'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-text mb-3 group-hover:text-accent transition-colors">
                  {item.name}
                </h3>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted">
                      <Eye className="h-3 w-3" />
                      <span>{item.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted">
                      <Flame className="h-3 w-3 text-orange-400" />
                      <span>{item.purchases}</span>
                    </div>
                  </div>
                </div>

                {/* Social Proof Bar */}
                <div className="mt-4 h-1 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent to-purple-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(item.purchases / item.views) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Hover Glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%']
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
            </motion.div>
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
});

TrendingNowSection.displayName = 'TrendingNowSection';

