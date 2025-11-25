import { useState } from "react";
import type { VipAnalytics as VipAnalyticsType, VipTier } from "../../types/vip";

interface VipAnalyticsProps {
  analytics: VipAnalyticsType;
  currentTier: VipTier;
  className?: string;
}

export const VipAnalytics = ({ analytics, currentTier, className = "" }: VipAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'goals'>('overview');

  // Mock chart data based on time range
  const chartData = {
    '7d': [
      { date: 'Mo', score: analytics.vipScoreHistory[analytics.vipScoreHistory.length - 7]?.score || 0 },
      { date: 'Di', score: analytics.vipScoreHistory[analytics.vipScoreHistory.length - 6]?.score || 0 },
      { date: 'Mi', score: analytics.vipScoreHistory[analytics.vipScoreHistory.length - 5]?.score || 0 },
      { date: 'Do', score: analytics.vipScoreHistory[analytics.vipScoreHistory.length - 4]?.score || 0 },
      { date: 'Fr', score: analytics.vipScoreHistory[analytics.vipScoreHistory.length - 3]?.score || 0 },
      { date: 'Sa', score: analytics.vipScoreHistory[analytics.vipScoreHistory.length - 2]?.score || 0 },
      { date: 'So', score: analytics.vipScoreHistory[analytics.vipScoreHistory.length - 1]?.score || 0 }
    ],
    '30d': analytics.vipScoreHistory.slice(-30),
    '90d': analytics.vipScoreHistory.slice(-90)
  };

  const currentChartData = chartData[timeRange];

  const maxScore = Math.max(...currentChartData.map(d => d.score));

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          VIP Analytics
        </h2>
        <p className="text-purple-300">
          Verfolge deine VIP-Performance und vergleiche dich mit anderen Mitgliedern
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Time Range Selector */}
        <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
          {[
            { id: '7d', label: '7 Tage' },
            { id: '30d', label: '30 Tage' },
            { id: '90d', label: '90 Tage' }
          ].map(range => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id as any)}
              className={`
                px-4 py-2 rounded-xl font-semibold transition-all duration-300
                ${timeRange === range.id
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-300 hover:text-white hover:bg-purple-600/20'
                }
              `}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Tab Selector */}
        <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
          {[
            { id: 'overview', label: 'Übersicht', icon: '📊' },
            { id: 'comparison', label: 'Vergleich', icon: '⚖️' },
            { id: 'goals', label: 'Ziele', icon: '🎯' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-2 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-300 hover:text-white hover:bg-purple-600/20'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score Chart */}
          <div className="bg-gradient-to-br from-black/40 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20">
            <h3 className="text-xl font-bold text-white mb-4">
              VIP Score Entwicklung
            </h3>

            <div className="h-64 flex items-end justify-between space-x-2">
              {currentChartData.map((data, index) => {
                const height = maxScore > 0 ? (data.score / maxScore) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg transition-all duration-500 hover:opacity-80"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                    />
                    <div className="text-xs text-purple-300 mt-2">
                      {data.date}
                    </div>
                    <div className="text-xs text-white font-semibold">
                      {data.score.toLocaleString('de-DE')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30">
              <div className="text-center">
                <div className="text-3xl mb-2">🛒</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.totalDrops}
                </div>
                <div className="text-green-300 text-sm">
                  VIP Drops erhalten
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
              <div className="text-center">
                <div className="text-3xl mb-2">💰</div>
                <div className="text-2xl font-bold text-white mb-1">
                  €{analytics.totalSpent.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-blue-300 text-sm">
                  Bei VIP-Käufen gespart
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30">
              <div className="text-center">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.communityActivity.challengesCompleted}
                </div>
                <div className="text-purple-300 text-sm">
                  Challenges gemeistert
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/30">
              <div className="text-center">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.communityActivity.referralCount}
                </div>
                <div className="text-orange-300 text-sm">
                  Neue Mitglieder geworben
                </div>
              </div>
            </div>
          </div>

          {/* Tier Progression Timeline */}
          <div className="bg-gradient-to-br from-black/40 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Tier-Aufstieg Historie
            </h3>

            <div className="space-y-4">
              {analytics.tierProgression.map((progression, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    progression.tier === 'Galaxy' ? 'bg-yellow-500 text-black' :
                    progression.tier === 'Supernova' ? 'bg-orange-500 text-white' :
                    progression.tier === 'Nova' ? 'bg-purple-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {progression.tier === 'Comet' ? '🌟' : progression.tier === 'Nova' ? '💫' : progression.tier === 'Supernova' ? '✨' : '🌌'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-white">
                        {progression.tier} VIP erreicht!
                      </h4>
                      <span className="text-purple-300 text-sm">
                        {new Date(progression.date).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <p className="text-purple-400 text-sm">
                      Herzlichen Glückwunsch zum Aufstieg in die {progression.tier}-Liga!
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-black/40 to-blue-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Community Vergleich
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-3xl font-bold text-white mb-2">
                  Top {analytics.comparison.percentileRank}%
                </div>
                <div className="text-blue-300">
                  Dein Ranking unter allen VIPs
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">🛒</div>
                <div className="text-3xl font-bold text-white mb-2">
                  +{analytics.comparison.dropsAboveAverage}
                </div>
                <div className="text-blue-300">
                  Mehr Drops als Durchschnitt
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">⭐</div>
                <div className="text-3xl font-bold text-white mb-2">
                  +{analytics.comparison.scoreAboveAverage}
                </div>
                <div className="text-blue-300">
                  VIP-Punkte über Durchschnitt
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="bg-gradient-to-br from-black/40 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20">
            <h3 className="text-xl font-bold text-white mb-4">
              VIP Leaderboard (Ausschnitt)
            </h3>

            <div className="space-y-3">
              {[
                { rank: 1, handle: 'NebulaPioneer', tier: 'Galaxy', score: 8750 },
                { rank: 2, handle: 'DropMaster', tier: 'Supernova', score: 6420 },
                { rank: 3, handle: 'CommunityHelper', tier: 'Nova', score: 3980 },
                { rank: 4, handle: 'Du', tier: currentTier, score: analytics.vipScoreHistory[analytics.vipScoreHistory.length - 1]?.score || 0, isCurrentUser: true },
                { rank: 5, handle: 'ShopVeteran', tier: 'Nova', score: 2850 }
              ].map(member => (
                <div key={member.rank} className={`flex items-center space-x-4 p-3 rounded-xl ${
                  member.isCurrentUser ? 'bg-purple-600/20 border border-purple-400/30' : 'bg-black/20'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    member.rank === 1 ? 'bg-yellow-500 text-black' :
                    member.rank === 2 ? 'bg-gray-400 text-black' :
                    member.rank === 3 ? 'bg-orange-600 text-white' :
                    'bg-purple-600 text-white'
                  }`}>
                    {member.rank}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">{member.handle}</span>
                      {member.isCurrentUser && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                          Du
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${
                      member.tier === 'Galaxy' ? 'text-yellow-400' :
                      member.tier === 'Supernova' ? 'text-orange-400' :
                      'text-purple-400'
                    }`}>
                      {member.tier} VIP
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-bold">
                      {member.score.toLocaleString('de-DE')}
                    </div>
                    <div className="text-purple-300 text-sm">
                      Punkte
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-black/40 to-green-900/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/20">
            <h3 className="text-xl font-bold text-white mb-4">
              VIP-Ziele & Fortschritt
            </h3>

            {/* Next Tier Goal */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-white">
                  Nächstes Ziel: Supernova VIP
                </h4>
                <span className="text-green-300 text-sm">
                  78% erreicht
                </span>
              </div>

              <div className="w-full bg-black/30 rounded-full h-3 mb-3">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: '78%' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-green-300">Invites</div>
                  <div className="text-white font-semibold">12/15</div>
                </div>
                <div className="text-center">
                  <div className="text-green-300">Käufe</div>
                  <div className="text-white font-semibold">6/8</div>
                </div>
                <div className="text-center">
                  <div className="text-green-300">Punkte</div>
                  <div className="text-white font-semibold">2340/3000</div>
                </div>
              </div>
            </div>

            {/* Monthly Goals */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">
                Monatliche Ziele (März 2024)
              </h4>

              {[
                { title: '3 neue Invites senden', current: 2, target: 3, icon: '👥' },
                { title: '2 VIP-Drops kaufen', current: 1, target: 2, icon: '🛒' },
                { title: '1 Community-Challenge meistern', current: 0, target: 1, icon: '🏆' },
                { title: '500 VIP-Punkte sammeln', current: 340, target: 500, icon: '⭐' }
              ].map((goal, index) => {
                const percentage = (goal.current / goal.target) * 100;
                return (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-black/20 rounded-xl">
                    <div className="text-2xl">{goal.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-semibold">{goal.title}</span>
                        <span className="text-green-300 text-sm">
                          {goal.current}/{goal.target}
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage >= 100 ? 'bg-green-400' :
                            percentage >= 50 ? 'bg-yellow-400' : 'bg-blue-400'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Current Tier Highlight */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl border border-purple-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`text-3xl ${
              currentTier === 'Comet' ? 'text-blue-400' :
              currentTier === 'Nova' ? 'text-purple-400' :
              currentTier === 'Supernova' ? 'text-orange-400' : 'text-yellow-400'
            }`}>
              {currentTier === 'Comet' ? '🌟' : currentTier === 'Nova' ? '💫' : currentTier === 'Supernova' ? '✨' : '🌌'}
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">
                Aktuelle Performance: {currentTier} VIP
              </h4>
              <p className="text-purple-300">
                Deine VIP-Statistiken zeigen starke Aktivität - weiter so!
              </p>
            </div>
          </div>

          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105">
            Ziele setzen
          </button>
        </div>
      </div>
    </div>
  );
};




