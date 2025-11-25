import { useState } from "react";
import type { VipCommunityData, VipTier } from "../../types/vip";
import { VipLiveActivityFeed } from "./VipLiveActivityFeed";

interface VipCommunityHubProps {
  community: VipCommunityData;
  currentTier: VipTier;
  className?: string;
}

const tierColors: Record<VipTier, string> = {
  Comet: "text-blue-400",
  Nova: "text-purple-400",
  Supernova: "text-orange-400",
  Galaxy: "text-yellow-400"
};

export const VipCommunityHub = ({ community, currentTier, className = "" }: VipCommunityHubProps) => {
  const [activeTab, setActiveTab] = useState<'featured' | 'challenges' | 'achievements' | 'live'>('featured');

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          VIP Insider-Netzwerk
        </h2>
        <p className="text-purple-300">
          Verbinde dich mit anderen VIP-Mitgliedern und nimm an exklusiven Challenges teil
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-black/20 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
          {[
            { id: 'featured', label: 'Featured VIPs', icon: '👑' },
            { id: 'challenges', label: 'Challenges', icon: '🏆' },
            { id: 'achievements', label: 'Erfolge', icon: '🎖️' },
            { id: 'live', label: 'Live Feed', icon: '📡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2
                ${activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
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

      {/* Featured VIPs Tab */}
      {activeTab === 'featured' && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white text-center mb-6">
            VIPs des Monats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {community.featuredMembers.map(member => (
              <div key={member.id} className="group">
                <div className="relative bg-gradient-to-br from-black/40 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
                  {/* Avatar placeholder */}
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white">
                    {member.handle.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-center">
                    <h4 className="text-xl font-bold text-white mb-1">
                      {member.handle}
                    </h4>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-3 ${
                      member.tier === 'Galaxy' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                      member.tier === 'Supernova' ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30' :
                      member.tier === 'Nova' ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                    }`}>
                      {member.tier} VIP
                    </div>
                    <p className="text-purple-300 text-sm mb-4">
                      "{member.achievement}"
                    </p>

                    {/* Follow/Connect button */}
                    <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                      Profil anschauen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              Aktive VIP Challenges
            </h3>
            <p className="text-purple-300">
              Nimm an exklusiven Challenges teil und verdiene zusätzliche VIP-Punkte
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {community.activeChallenges.map(challenge => (
              <div key={challenge.id} className="group">
                <div className="relative bg-gradient-to-br from-black/40 to-orange-900/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-400/20 hover:border-orange-400/40 transition-all duration-300 hover:scale-105">
                  {/* Challenge Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">
                        {challenge.title}
                      </h4>
                      <p className="text-orange-200 text-sm mb-3">
                        {challenge.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl mb-1">🏆</div>
                      <div className="text-orange-400 text-sm font-semibold">
                        {challenge.reward}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-orange-300 text-sm">Teilnehmer</span>
                      <span className="text-orange-200 text-sm">
                        {challenge.participants} aktiv
                      </span>
                    </div>
                    <div className="w-full bg-black/30 rounded-full h-2">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((challenge.participants / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Time remaining */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      <span className="text-red-300 text-sm">
                        Endet in {Math.ceil((new Date(challenge.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Tagen
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-3">
                    <button className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105">
                      Teilnehmen
                    </button>
                    <button className="px-4 py-3 bg-black/30 hover:bg-black/50 text-orange-300 hover:text-white rounded-xl transition-all duration-300 border border-orange-400/30">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">
              VIP Achievements
            </h3>
            <p className="text-purple-300">
              Feiere die Erfolge des VIP-Insider-Netzwerks
            </p>
          </div>

          <div className="space-y-4">
            {community.recentAchievements.map(achievement => (
              <div key={achievement.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-black/40 to-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-400/20">
                {/* Achievement Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                  🎖️
                </div>

                {/* Achievement Details */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-lg font-bold text-white">
                      {achievement.member}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      achievement.achievement.includes('Galaxy') ? 'bg-yellow-500/20 text-yellow-400' :
                      achievement.achievement.includes('100') ? 'bg-purple-500/20 text-purple-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {achievement.achievement}
                    </span>
                  </div>
                  <p className="text-purple-300 text-sm">
                    Verdient am {new Date(achievement.earnedAt).toLocaleDateString('de-DE')}
                  </p>
                </div>

                {/* Celebration animation */}
                <div className="text-2xl animate-bounce">
                  ✨
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Activity Feed Tab */}
      {activeTab === 'live' && (
        <VipLiveActivityFeed currentTier={currentTier} />
      )}

      {/* Current Tier Highlight */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl border border-purple-400/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`text-3xl ${tierColors[currentTier]}`}>
              {currentTier === 'Comet' ? '🌟' : currentTier === 'Nova' ? '💫' : currentTier === 'Supernova' ? '✨' : '🌌'}
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">
                Du bist {currentTier} VIP
              </h4>
              <p className="text-purple-300">
                Genieße alle exklusiven Vorteile deines aktuellen VIP-Status
              </p>
            </div>
          </div>

          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105">
            Insider-Netzwerk beitreten
          </button>
        </div>
      </div>
    </div>
  );
};
