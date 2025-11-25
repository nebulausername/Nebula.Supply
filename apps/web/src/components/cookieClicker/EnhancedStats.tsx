import { useState, useMemo, memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCookieClickerStore, BUILDINGS } from '../../store/cookieClicker';
import {
  TrendingUp,
  Cookie,
  Zap,
  Trophy,
  Clock,
  MousePointerClick,
  Building2,
  Coins,
  Award,
  BarChart3,
  PieChart,
  Download,
  Share2,
  Target,
  Flame,
  Star
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatNumber, formatTime } from '../../utils/cookieFormatters';
import { AnimatedStatCard } from './AnimatedStatCard';
import { TrendIndicator } from './TrendIndicator';

// 📊 STAT CATEGORIES
const STAT_CATEGORIES = {
  production: { id: 'production', label: 'Produktion', icon: TrendingUp, color: 'green' },
  clicking: { id: 'clicking', label: 'Klicks', icon: MousePointerClick, color: 'blue' },
  economy: { id: 'economy', label: 'Wirtschaft', icon: Coins, color: 'yellow' },
  achievements: { id: 'achievements', label: 'Erfolge', icon: Trophy, color: 'purple' },
  time: { id: 'time', label: 'Zeit', icon: Clock, color: 'orange' }
} as const;

// 📊 STAT CARD COMPONENT
const StatCard = memo(({ icon: Icon, label, value, trend, color = 'blue' }: {
  icon: any;
  label: string;
  value: string | number;
  trend?: number;
  color?: string;
}) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30'
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm p-4",
        colorClasses[color as keyof typeof colorClasses]
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          `bg-${color}-500/20`
        )}>
          <Icon className={cn("w-5 h-5", `text-${color}-400`)} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-bold",
            trend > 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-white/60">{label}</div>
    </motion.div>
  );
});
StatCard.displayName = 'StatCard';

// 📊 SIMPLE BAR CHART COMPONENT - Enhanced with Hover
const SimpleBarChart = memo(({ data, title }: {
  data: { label: string; value: number; color: string }[];
  title: string;
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <motion.div
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="text-white/70">{item.label}</span>
              <motion.span
                className="text-white font-bold"
                animate={hoveredIndex === index ? { scale: 1.1 } : { scale: 1 }}
              >
                {formatNumber(item.value)}
              </motion.span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div
                className={cn("h-full rounded-full relative", `bg-${item.color}-500`)}
                initial={{ width: 0 }}
                animate={{ width: `${(item.value / maxValue) * 100}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                whileHover={{ opacity: 0.8 }}
              >
                {hoveredIndex === index && (
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {formatNumber(item.value)} ({((item.value / maxValue) * 100).toFixed(1)}%)
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
SimpleBarChart.displayName = 'SimpleBarChart';

// 📈 LINE CHART COMPONENT - For Time Series Data
const LineChart = memo(({ data, title, color = 'blue' }: {
  data: { label: string; value: number }[];
  title: string;
  color?: string;
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  const width = 400;
  const height = 200;
  const padding = 20;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((item.value - minValue) / range) * (height - padding * 2);
    return { x, y, value: item.value, label: item.label };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - padding - ratio * (height - padding * 2);
            return (
              <line
                key={ratio}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Line path */}
          <motion.path
            d={pathData}
            fill="none"
            stroke={`var(--color-${color}-400)`}
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Area under curve */}
          <motion.path
            d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`}
            fill={`var(--color-${color}-400)`}
            fillOpacity="0.2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <g key={index}>
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === index ? 6 : 4}
                fill={`var(--color-${color}-400)`}
                stroke="white"
                strokeWidth={hoveredPoint === index ? 2 : 0}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring" }}
              />
              {hoveredPoint === index && (
                <motion.g
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <rect
                    x={point.x - 30}
                    y={point.y - 35}
                    width="60"
                    height="25"
                    fill="rgba(0, 0, 0, 0.8)"
                    rx="4"
                  />
                  <text
                    x={point.x}
                    y={point.y - 20}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    {formatNumber(point.value)}
                  </text>
                </motion.g>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
});
LineChart.displayName = 'LineChart';

// 📊 PIE CHART (Simple SVG Implementation)
const SimplePieChart = memo(({ data, title }: {
  data: { label: string; value: number; color: string }[];
  title: string;
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(50, 50, 40, endAngle);
    const end = polarToCartesian(50, 50, 40, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return `M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 100 100" className="w-32 h-32">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const angle = (percentage / 100) * 360;
            const path = createArc(currentAngle, currentAngle + angle);
            currentAngle += angle;
            
            return (
              <motion.path
                key={index}
                d={path}
                className={`fill-${item.color}-500/60 hover:fill-${item.color}-500/80 cursor-pointer`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            );
          })}
        </svg>
        <div className="flex-1 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", `bg-${item.color}-500`)} />
                <span className="text-white/70">{item.label}</span>
              </div>
              <span className="text-white font-bold">{((item.value / total) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
SimplePieChart.displayName = 'SimplePieChart';

// 📊 MILESTONES COMPONENT
const MilestonesPanel = memo(({ totalCookies, clicks, achievements }: {
  totalCookies: number;
  clicks: number;
  achievements: number;
}) => {
  const milestones = [
    { label: '1,000 Cookies', value: 1000, current: totalCookies, icon: Cookie, color: 'yellow' },
    { label: '10,000 Cookies', value: 10000, current: totalCookies, icon: Cookie, color: 'yellow' },
    { label: '100,000 Cookies', value: 100000, current: totalCookies, icon: Cookie, color: 'yellow' },
    { label: '1,000,000 Cookies', value: 1000000, current: totalCookies, icon: Cookie, color: 'orange' },
    { label: '1,000 Klicks', value: 1000, current: clicks, icon: MousePointerClick, color: 'blue' },
    { label: '10,000 Klicks', value: 10000, current: clicks, icon: MousePointerClick, color: 'blue' },
    { label: '5 Achievements', value: 5, current: achievements, icon: Trophy, color: 'purple' },
    { label: '10 Achievements', value: 10, current: achievements, icon: Trophy, color: 'purple' },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-yellow-400" />
        Meilensteine
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {milestones.map((milestone, index) => {
          const Icon = milestone.icon;
          const progress = Math.min((milestone.current / milestone.value) * 100, 100);
          const isComplete = progress >= 100;

          return (
            <motion.div
              key={index}
              className={cn(
                "p-3 rounded-lg border transition-all",
                isComplete 
                  ? "border-green-500/50 bg-green-500/10" 
                  : "border-white/10 bg-white/5"
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn(
                  "w-4 h-4",
                  isComplete ? "text-green-400" : "text-white/60"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isComplete ? "text-green-400" : "text-white/70"
                )}>
                  {milestone.label}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    isComplete ? "bg-green-500" : `bg-${milestone.color}-500`
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="text-xs text-white/50 mt-1">
                {isComplete ? '✓ Abgeschlossen' : `${progress.toFixed(1)}%`}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
MilestonesPanel.displayName = 'MilestonesPanel';

// 📊 MAIN ENHANCED STATS COMPONENT
export const EnhancedStats = memo(() => {
  const {
    cookies,
    totalCookies,
    cookiesPerClick,
    cookiesPerSecond,
    clicks,
    timePlayed,
    maxStreak,
    level,
    prestigeLevel,
    prestigePoints,
    coins,
    buildings,
    upgrades,
    unlockedAchievements
  } = useCookieClickerStore();

  const [activeCategory, setActiveCategory] = useState<keyof typeof STAT_CATEGORIES>('production');
  
  // Previous values for trend calculation
  const previousValuesRef = useRef({
    cookies: 0,
    totalCookies: 0,
    cookiesPerSecond: 0,
    clicks: 0,
    coins: 0
  });

  // Track history for sparklines (last 20 values)
  const [history, setHistory] = useState<{
    cookies: number[];
    cps: number[];
    clicks: number[];
  }>({
    cookies: [],
    cps: [],
    clicks: []
  });

  // Update history every second - Optimized
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => ({
        cookies: [...prev.cookies.slice(-19), cookies],
        cps: [...prev.cps.slice(-19), cookiesPerSecond],
        clicks: [...prev.clicks.slice(-19), clicks]
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [cookies, cookiesPerSecond, clicks]);

  // Calculate trends
  const trends = useMemo(() => {
    const prev = previousValuesRef.current;
    return {
      cookies: cookies > prev.cookies ? 'up' : cookies < prev.cookies ? 'down' : 'neutral' as const,
      totalCookies: totalCookies > prev.totalCookies ? 'up' : totalCookies < prev.totalCookies ? 'down' : 'neutral' as const,
      cps: cookiesPerSecond > prev.cookiesPerSecond ? 'up' : cookiesPerSecond < prev.cookiesPerSecond ? 'down' : 'neutral' as const,
      clicks: clicks > prev.clicks ? 'up' : clicks < prev.clicks ? 'down' : 'neutral' as const,
      coins: coins > prev.coins ? 'up' : coins < prev.coins ? 'down' : 'neutral' as const
    };
  }, [cookies, totalCookies, cookiesPerSecond, clicks, coins]);

  // Update previous values
  useEffect(() => {
    previousValuesRef.current = {
      cookies,
      totalCookies,
      cookiesPerSecond,
      clicks,
      coins
    };
  }, [cookies, totalCookies, cookiesPerSecond, clicks, coins]);

  // 📊 Calculate Building Distribution
  const buildingData = useMemo(() => {
    const colors = ['blue', 'green', 'yellow', 'purple', 'orange', 'red', 'pink', 'indigo'];
    return BUILDINGS.map((building, index) => ({
      label: building.name,
      value: buildings[building.id] || 0,
      color: colors[index % colors.length]
    })).filter(b => b.value > 0);
  }, [buildings]);

  // 📊 Calculate Production by Building
  const productionByBuilding = useMemo(() => {
    const colors = ['blue', 'green', 'yellow', 'purple', 'orange', 'red', 'pink', 'indigo'];
    return BUILDINGS.map((building, index) => {
      const count = buildings[building.id] || 0;
      return {
        label: building.name,
        value: building.baseCps * count,
        color: colors[index % colors.length]
      };
    }).filter(b => b.value > 0);
  }, [buildings]);

  // 📊 Export Stats as JSON
  const exportStats = () => {
    const stats = {
      cookies,
      totalCookies,
      cookiesPerClick,
      cookiesPerSecond,
      clicks,
      timePlayed,
      maxStreak,
      level,
      prestigeLevel,
      prestigePoints,
      coins,
      buildings,
      upgrades: Object.keys(upgrades).length,
      achievements: unlockedAchievements.length,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie-clicker-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 📊 Export Stats as CSV
  const exportStatsCSV = () => {
    const headers = ['Stat', 'Wert'];
    const rows = [
      ['Cookies', cookies],
      ['Gesamt Cookies', totalCookies],
      ['Cookies/Klick', cookiesPerClick],
      ['Cookies/Sek', cookiesPerSecond],
      ['Klicks', clicks],
      ['Spielzeit (Sek)', timePlayed],
      ['Max Streak', maxStreak],
      ['Level', level],
      ['Prestige Level', prestigeLevel],
      ['Prestige Punkte', prestigePoints],
      ['Coins', coins],
      ['Gebäude', Object.values(buildings).reduce((a, b) => a + b, 0)],
      ['Upgrades', Object.keys(upgrades).length],
      ['Achievements', unlockedAchievements.length]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie-clicker-stats-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 📊 Share Stats
  const shareStats = async () => {
    const statsText = `🍪 Cookie Clicker Stats:
📊 Cookies: ${formatNumber(cookies)}
📈 Gesamt: ${formatNumber(totalCookies)}
⚡ CPS: ${formatNumber(cookiesPerSecond)}
👆 Klicks: ${formatNumber(clicks)}
🏆 Level: ${level}
⭐ Prestige: ${prestigeLevel}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cookie Clicker Stats',
          text: statsText
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(statsText);
      alert('Stats in Zwischenablage kopiert!');
    }
  };

  return (
    <div className="space-y-6">
      {/* 📊 HEADER */}
      <motion.div
        className="relative overflow-hidden rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 backdrop-blur-xl p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BarChart3 className="w-10 h-10 text-blue-400" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">📊 Statistiken</h2>
              <p className="text-white/70 text-sm">Detaillierte Einblicke in deinen Fortschritt</p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              onClick={exportStats}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-2 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Als JSON exportieren"
            >
              <Download className="w-4 h-4" />
              JSON
            </motion.button>
            <motion.button
              onClick={exportStatsCSV}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-2 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Als CSV exportieren"
            >
              <Download className="w-4 h-4" />
              CSV
            </motion.button>
            <motion.button
              onClick={shareStats}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-2 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Stats teilen"
            >
              <Share2 className="w-4 h-4" />
              Teilen
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 📊 CATEGORY TABS - Responsive */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        {Object.values(STAT_CATEGORIES).map((category) => {
          const Icon = category.icon;
          return (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={cn(
                "px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-1 md:gap-2 whitespace-nowrap",
                activeCategory === category.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              {category.label}
            </motion.button>
          );
        })}
      </div>

      {/* 📊 STAT CARDS GRID */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeCategory === 'production' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatedStatCard
                  icon={Cookie}
                  label="Cookies/Sek"
                  value={cookiesPerSecond}
                  previousValue={previousValuesRef.current.cookiesPerSecond}
                  trend={trends.cps}
                  color="green"
                  sparkline={history.cps}
                />
                <AnimatedStatCard
                  icon={Zap}
                  label="Cookies/Klick"
                  value={cookiesPerClick}
                  color="blue"
                />
                <AnimatedStatCard
                  icon={TrendingUp}
                  label="Gesamt produziert"
                  value={totalCookies}
                  previousValue={previousValuesRef.current.totalCookies}
                  trend={trends.totalCookies}
                  color="purple"
                />
                <AnimatedStatCard
                  icon={Coins}
                  label="Aktuell"
                  value={cookies}
                  previousValue={previousValuesRef.current.cookies}
                  trend={trends.cookies}
                  color="yellow"
                  sparkline={history.cookies}
                />
              </div>
              {buildingData.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <SimplePieChart data={buildingData} title="Gebäude-Verteilung" />
                  <SimpleBarChart data={productionByBuilding} title="Produktion nach Gebäude" />
                </div>
              )}
              {/* Time Series Charts */}
              {history.cookies.length > 1 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <LineChart
                    data={history.cookies.map((val, i) => ({ label: `${i}s`, value: val }))}
                    title="Cookies über Zeit"
                    color="yellow"
                  />
                  <LineChart
                    data={history.cps.map((val, i) => ({ label: `${i}s`, value: val }))}
                    title="CPS Trend"
                    color="green"
                  />
                </div>
              )}
            </div>
          )}

          {activeCategory === 'clicking' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatedStatCard
                  icon={MousePointerClick}
                  label="Gesamt Klicks"
                  value={clicks}
                  previousValue={previousValuesRef.current.clicks}
                  trend={trends.clicks}
                  color="blue"
                  sparkline={history.clicks}
                />
                <AnimatedStatCard
                  icon={Flame}
                  label="Max Streak"
                  value={maxStreak}
                  color="orange"
                />
                <AnimatedStatCard
                  icon={Zap}
                  label="Power/Klick"
                  value={cookiesPerClick}
                  color="yellow"
                />
                <AnimatedStatCard
                  icon={Target}
                  label="Avg Klicks/Min"
                  value={timePlayed > 0 ? (clicks / (timePlayed / 60)) : 0}
                  color="green"
                />
              </div>
            </div>
          )}

          {activeCategory === 'economy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatedStatCard
                  icon={Coins}
                  label="Coins"
                  value={coins}
                  previousValue={previousValuesRef.current.coins}
                  trend={trends.coins}
                  color="yellow"
                />
                <AnimatedStatCard
                  icon={Building2}
                  label="Gebäude"
                  value={Object.values(buildings).reduce((a, b) => a + b, 0)}
                  color="blue"
                />
                <AnimatedStatCard
                  icon={Award}
                  label="Upgrades"
                  value={Object.keys(upgrades).length}
                  color="purple"
                />
                <AnimatedStatCard
                  icon={Star}
                  label="Prestige Level"
                  value={prestigeLevel}
                  color="orange"
                />
              </div>
              {buildingData.length > 0 && (
                <SimpleBarChart data={buildingData} title="Gebäude-Anzahl" />
              )}
            </div>
          )}

          {activeCategory === 'achievements' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <AnimatedStatCard
                  icon={Trophy}
                  label="Freigeschaltet"
                  value={unlockedAchievements.length}
                  color="purple"
                />
                <AnimatedStatCard
                  icon={Target}
                  label="Gesamt"
                  value={16}
                  color="blue"
                />
                <AnimatedStatCard
                  icon={Star}
                  label="Fortschritt"
                  value={`${Math.round((unlockedAchievements.length / 16) * 100)}%`}
                  color="yellow"
                />
                <AnimatedStatCard
                  icon={Flame}
                  label="Streak"
                  value={maxStreak}
                  color="orange"
                />
              </div>
              <MilestonesPanel 
                totalCookies={totalCookies} 
                clicks={clicks} 
                achievements={unlockedAchievements.length}
              />
            </div>
          )}

          {activeCategory === 'time' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Clock} label="Spielzeit" value={formatTime(timePlayed)} color="blue" />
                <StatCard icon={TrendingUp} label="Level" value={level} color="green" />
                <StatCard icon={Zap} label="Cookies/Min" value={formatNumber(cookiesPerSecond * 60)} color="yellow" />
                <StatCard icon={Star} label="Prestige Punkte" value={prestigePoints} color="purple" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Zeitbasierte Statistiken</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Durchschn. Cookies/Stunde</span>
                    <span className="text-white font-bold">{formatNumber(timePlayed > 0 ? (totalCookies / (timePlayed / 3600)) : 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Durchschn. Klicks/Minute</span>
                    <span className="text-white font-bold">{formatNumber(timePlayed > 0 ? (clicks / (timePlayed / 60)) : 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Effizienz (Cookies/Klick)</span>
                    <span className="text-white font-bold">{formatNumber(clicks > 0 ? (totalCookies / clicks) : 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

EnhancedStats.displayName = 'EnhancedStats';

