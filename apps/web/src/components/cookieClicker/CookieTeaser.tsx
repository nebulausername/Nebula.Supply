import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { fetchLeaderboard } from '../../api/cookieClicker';
import { formatNumber } from '../../utils/cookieFormatters';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { Cookie, Trophy, Zap, TrendingUp, ArrowRight, Medal } from 'lucide-react';

interface LeaderboardPlayer {
  userId: string;
  nickname: string | null;
  rank: number;
  totalCookies: number;
  cookiesPerSecond: number;
  timePlayed: number;
  avatarUrl: string | null;
}

export const CookieTeaser = () => {
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const level = useCookieClickerStore(state => state.level);
  const streak = useCookieClickerStore(state => state.streak);
  const coins = useCookieClickerStore(state => state.coins);

  const [topPlayers, setTopPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLeaderboard('totalCookies');
        setTopPlayers(data.slice(0, 3)); // Top 3
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setTopPlayers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-400" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 2:
        return 'from-gray-400/20 to-gray-500/10 border-gray-400/30';
      case 3:
        return 'from-orange-500/20 to-orange-600/10 border-orange-500/30';
      default:
        return 'from-white/10 to-white/5 border-white/20';
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative py-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500">
                <Cookie className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
                  Cookie Clicker
                </h2>
                <p className="text-muted">Spiele jetzt und verdiene Coins!</p>
              </div>
            </div>

            {/* Your Stats */}
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-sm p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Deine Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Cookie className="h-4 w-4" />
                    <span>Cookies</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatNumber(totalCookies)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <TrendingUp className="h-4 w-4" />
                    <span>Level</span>
                  </div>
                  <div className="text-2xl font-bold text-accent">
                    {level}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Zap className="h-4 w-4" />
                    <span>Pro Sekunde</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {cookiesPerSecond.toFixed(1)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Trophy className="h-4 w-4" />
                    <span>Coins</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {formatNumber(coins)}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              to="/cookie-clicker"
              className={cn(
                "group relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl",
                "bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500",
                "text-white font-bold text-lg",
                "transition-all duration-300",
                "hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50",
                "active:scale-95"
              )}
            >
              <Cookie className="h-6 w-6" />
              <span>Jetzt spielen</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
            </Link>
          </motion.div>

          {/* Right Side - Leaderboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-400" />
                Top Spieler
              </h3>
              <Link
                to="/cookie-clicker?tab=leaderboard"
                className="text-sm text-accent hover:text-accent/80 transition-colors"
              >
                Alle ansehen →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-white/5 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : topPlayers.length > 0 ? (
              <div className="space-y-3">
                {topPlayers.map((player, index) => (
                  <motion.div
                    key={player.userId}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className={cn(
                      "relative rounded-xl border p-4 backdrop-blur-sm",
                      `bg-gradient-to-r ${getRankColor(player.rank)}`
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black/30 flex items-center justify-center border border-white/10">
                        {getRankIcon(player.rank) || (
                          <span className="text-lg font-bold text-white">
                            #{player.rank}
                          </span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-white truncate">
                            {player.nickname || 'Anonym'}
                          </h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted">
                          <span className="flex items-center gap-1">
                            <Cookie className="h-3 w-3" />
                            {formatNumber(player.totalCookies)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {player.cookiesPerSecond.toFixed(1)}/s
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm p-8 text-center">
                <Trophy className="h-12 w-12 text-muted mx-auto mb-4" />
                <p className="text-muted">
                  Noch keine Spieler im Leaderboard
                </p>
                <p className="text-sm text-muted mt-2">
                  Sei der Erste!
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};








































