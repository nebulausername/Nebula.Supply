import { memo } from "react";
import { motion } from "framer-motion";
import { Trophy, Award, Users, TrendingUp, Star } from "lucide-react";
import { ScrollReveal } from "../../components/ScrollReveal";

interface Contributor {
  id: string;
  name: string;
  rank: string;
  contributions: number;
  avatar?: string;
  badge?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  user: string;
  timeAgo: string;
}

interface InsiderHighlightsSectionProps {
  topContributors?: Contributor[];
  recentAchievements?: Achievement[];
  reducedMotion?: boolean;
}

const mockContributors: Contributor[] = [
  { id: '1', name: 'Max M.', rank: 'VIP', contributions: 234, badge: '👑' },
  { id: '2', name: 'Anna K.', rank: 'Stammkunde', contributions: 189, badge: '⭐' },
  { id: '3', name: 'Tom S.', rank: 'VIP', contributions: 156, badge: '🔥' }
];

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: '100 Invites',
    description: 'Hat 100 erfolgreiche Invites generiert',
    icon: Trophy,
    user: 'Max M.',
    timeAgo: '2 Std'
  },
  {
    id: '2',
    title: 'Top Seller',
    description: 'Meiste Verkäufe diesen Monat',
    icon: Award,
    user: 'Anna K.',
    timeAgo: '5 Std'
  },
  {
    id: '3',
    title: 'Insider Star',
    description: 'Aktiver Insider',
    icon: Star,
    user: 'Tom S.',
    timeAgo: '1 Tag'
  }
];

export const InsiderHighlightsSection = memo(({
  topContributors = mockContributors,
  recentAchievements = mockAchievements,
  reducedMotion = false
}: InsiderHighlightsSectionProps) => {
  return (
    <ScrollReveal direction="up" delay={0.3} reducedMotion={reducedMotion}>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text flex items-center gap-2">
              <Users className="h-6 w-6 text-accent" />
              Insider Highlights
            </h2>
            <p className="text-sm text-muted mt-1">Top Contributors & Achievements</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Contributors */}
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-text">Top Contributors</h3>
            </div>
            <div className="space-y-3">
              {topContributors.map((contributor, index) => (
                <motion.div
                  key={contributor.id}
                  initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={reducedMotion ? {} : { x: 4, scale: 1.02 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-lg">
                        {contributor.badge || '👤'}
                      </div>
                      {index === 0 && (
                        <motion.div
                          className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
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
                    <div>
                      <div className="font-semibold text-text group-hover:text-accent transition-colors">
                        {contributor.name}
                      </div>
                      <div className="text-xs text-muted">{contributor.rank}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-bold text-green-400">
                      {contributor.contributions}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Achievements */}
          <motion.div
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-text">Recent Achievements</h3>
            </div>
            <div className="space-y-3">
              {recentAchievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={reducedMotion ? {} : { x: -4, scale: 1.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Icon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text group-hover:text-accent transition-colors">
                        {achievement.title}
                      </div>
                      <div className="text-xs text-muted">{achievement.description}</div>
                      <div className="text-xs text-muted mt-1">
                        {achievement.user} • {achievement.timeAgo}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>
    </ScrollReveal>
  );
});

InsiderHighlightsSection.displayName = 'InsiderHighlightsSection';

