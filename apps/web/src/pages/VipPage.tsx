import { useState, useEffect, lazy, Suspense } from "react";
import { useVipStore } from "../store/vip";
import { VipStatusCard } from "../components/vip/VipStatusCard";
import { VipNotifications } from "../components/vip/VipNotifications";
import { VipDropsEnhanced } from "../components/vip/VipDropsEnhanced";
import { VipGalaxyFeatures } from "../components/vip/VipGalaxyFeatures";
import { VipAchievements } from "../components/vip/VipAchievements";
import { DropsPage } from "./DropsPage";
import { useBotCommandHandler } from "../utils/botCommandHandler";
import { VipGuard } from "../components/vip/VipGuard";
import { useIsVip } from "../hooks/useIsVip";

// Lazy load heavy components for better performance
const VipTiersShowcase = lazy(() => import("../components/vip/VipTiersShowcase").then(module => ({ default: module.VipTiersShowcase })));
const VipCommunityHub = lazy(() => import("../components/vip/VipCommunityHub").then(module => ({ default: module.VipCommunityHub })));
const VipBenefitsCenter = lazy(() => import("../components/vip/VipBenefitsCenter").then(module => ({ default: module.VipBenefitsCenter })));
const VipAnalytics = lazy(() => import("../components/vip/VipAnalytics").then(module => ({ default: module.VipAnalytics })));

// Loading skeleton component
const VipSectionSkeleton = ({ title }: { title: string }) => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    <div className="text-center">
      <div className="h-6 sm:h-8 bg-gray-800/50 rounded-lg w-48 sm:w-64 mx-auto mb-2"></div>
      <div className="h-3 sm:h-4 bg-gray-800/50 rounded w-72 sm:w-96 mx-auto"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-40 sm:h-48 bg-gray-800/50 rounded-2xl"></div>
      ))}
    </div>
  </div>
);

export const VipPage = () => {
  const { isLoading, refreshData } = useVipStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-purple-300">Lade VIP-Daten...</p>
        </div>
      </div>
    );
  }

  // 🎯 VIP GUARD: Nur VIP-User können die Seite sehen
  return (
    <VipGuard>
      <VipPageContent />
    </VipGuard>
  );
};

// Separate content component for better organization
const VipPageContent = () => {
  const { currentTier, vipScore, tierProgress, benefits, analytics, community, refreshData } = useVipStore();
  const [activeSection, setActiveSection] = useState<'dashboard' | 'tiers' | 'community' | 'benefits' | 'analytics' | 'drops' | 'galaxy' | 'achievements'>('dashboard');
  const { executeCommand } = useBotCommandHandler();

  // Calculate progress to next tier
  const progressToNext = tierProgress.next > 0 ? tierProgress.current / tierProgress.next : 0;

  // Next tier requirements for current tier
  const nextTierRequirements = tierProgress.requirements.length > 0
    ? tierProgress.requirements[0]
    : { invitesNeeded: 0, purchasesNeeded: 0, communityPoints: 0 };

  // Rank benefits based on current tier
  const rankBenefits = [
    "Priority Support",
    "Early Access zu limitierten Drops",
    "VIP Badge im Insider-Netzwerk",
    ...(currentTier === 'Nova' ? ["Insider-Spotlight-Möglichkeiten", "Beta-Feature-Zugang"] : []),
    ...(currentTier === 'Supernova' ? ["Persönlicher Shopping-Assistent", "VIP-Event-Einladungen", "Exklusive Preisnachlässe"] : []),
    ...(currentTier === 'Galaxy' ? ["Brand Ambassador Status", "VIP Concierge Service", "Exclusive Meet & Greets"] : [])
  ];

  useEffect(() => {
    // Refresh VIP data when component mounts
    refreshData();
    
    // Check for bot commands in URL
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        // Auto-navigate based on command
        if (command.includes('tier') || command.includes('rank')) {
          setActiveSection('tiers');
        } else if (command.includes('community')) {
          setActiveSection('community');
        } else if (command.includes('benefit')) {
          setActiveSection('benefits');
        } else if (command.includes('analytics') || command.includes('stats')) {
          setActiveSection('analytics');
        } else if (command.includes('drop')) {
          setActiveSection('drops');
        } else if (command.includes('galaxy')) {
          setActiveSection('galaxy');
        } else if (command.includes('achievement')) {
          setActiveSection('achievements');
        }
      }
    }
  }, [refreshData, executeCommand]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 px-3 sm:px-4 md:px-6 lg:px-8 pb-20 sm:pb-24 safe-area-bottom">
      {/* VIP Notifications */}
      <VipNotifications />

      {/* VIP Header with Navigation */}
      <div className="relative">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
            VIP Control Center
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-purple-300 max-w-3xl mx-auto leading-relaxed px-2">
            Willkommen in deiner exklusiven VIP-Lounge. Hier findest du alle Premium-Features,
            Insider-Events und deine persönlichen Vorteile als {currentTier}-Mitglied.
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
            { id: 'tiers', label: 'VIP Tiers', icon: '🌟' },
            { id: 'benefits', label: 'Benefits', icon: '🎁' },
            { id: 'community', label: 'Insider-Netzwerk', icon: '👥' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'drops', label: 'VIP Drops', icon: '🛒' },
            { id: 'achievements', label: 'Achievements', icon: '🏆' },
            ...(currentTier === 'Galaxy' ? [{ id: 'galaxy', label: 'Galaxy Features', icon: '🌌' }] : [])
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`
                px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2
                min-h-[44px] touch-target
                ${activeSection === section.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-black/20 text-purple-300 hover:text-white hover:bg-purple-600/20 border border-purple-400/20 active:bg-purple-600/30'
                }
              `}
            >
              <span className="text-base sm:text-lg">{section.icon}</span>
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Section */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6 sm:space-y-8">
          {/* VIP Status Card */}
          <VipStatusCard
            currentTier={currentTier}
            progressToNext={progressToNext}
            nextTierRequirements={nextTierRequirements}
            vipScore={vipScore}
            rankBenefits={rankBenefits}
          />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-green-400/30">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2">🎯</div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {benefits.filter(b => b.available > 0).length}
                </div>
                <div className="text-green-300 text-xs sm:text-sm">
                  Verfügbare Benefits
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-blue-400/30">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2">🏆</div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {analytics.communityActivity.challengesCompleted}
                </div>
                <div className="text-blue-300 text-xs sm:text-sm">
                  Challenges gemeistert
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-purple-400/30">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2">📈</div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                  Top {analytics.comparison.percentileRank}%
                </div>
                <div className="text-purple-300 text-xs sm:text-sm">
                  Insider Ranking
                </div>
              </div>
            </div>
          </div>

          {/* Active Challenges Preview */}
          {community.activeChallenges.length > 0 && (
            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-orange-400/30">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                Aktive Challenges
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {community.activeChallenges.slice(0, 2).map(challenge => (
                  <div key={challenge.id} className="bg-black/20 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold text-sm sm:text-base">{challenge.title}</h4>
                      <div className="text-orange-400 text-xs sm:text-sm">
                        {challenge.participants} Teilnehmer
                      </div>
                    </div>
                    <p className="text-orange-200 text-xs sm:text-sm mb-3">
                      {challenge.description}
                    </p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                      <span className="text-orange-300 text-xs sm:text-sm font-semibold">
                        Belohnung: {challenge.reward}
                      </span>
                      <button className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs sm:text-sm px-3 py-2 sm:py-1 rounded-lg transition-colors min-h-[44px] touch-target w-full sm:w-auto">
                        Teilnehmen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIP Tiers Section */}
      {activeSection === 'tiers' && (
        <Suspense fallback={<VipSectionSkeleton title="VIP Tiers werden geladen..." />}>
          <VipTiersShowcase currentTier={currentTier} />
        </Suspense>
      )}

      {/* VIP Insider Section */}
      {activeSection === 'community' && (
        <Suspense fallback={<VipSectionSkeleton title="VIP Insider-Netzwerk wird geladen..." />}>
          <VipCommunityHub community={community} currentTier={currentTier} />
        </Suspense>
      )}

      {/* VIP Benefits Section */}
      {activeSection === 'benefits' && (
        <Suspense fallback={<VipSectionSkeleton title="VIP Benefits werden geladen..." />}>
          <VipBenefitsCenter benefits={benefits} currentTier={currentTier} />
        </Suspense>
      )}

      {/* VIP Analytics Section */}
      {activeSection === 'analytics' && (
        <Suspense fallback={<VipSectionSkeleton title="VIP Analytics werden geladen..." />}>
          <VipAnalytics analytics={analytics} currentTier={currentTier} />
        </Suspense>
      )}

      {/* VIP Drops Section */}
      {activeSection === 'drops' && (
        <VipDropsEnhanced />
      )}

      {/* Galaxy Features Section */}
      {activeSection === 'galaxy' && (
        <VipGalaxyFeatures currentTier={currentTier} />
      )}

      {/* Achievements Section */}
      {activeSection === 'achievements' && (
        <VipAchievements currentTier={currentTier} vipScore={vipScore} />
      )}

      {/* VIP Footer */}
      <div className="text-center py-6 sm:py-8 border-t border-white/10">
        <p className="text-purple-300 mb-3 sm:mb-4 text-sm sm:text-base px-2">
          Fragen zu deinem VIP-Status? Kontaktiere unser VIP-Support-Team
        </p>
        <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:from-purple-800 active:to-pink-800 text-white font-semibold py-3 px-6 sm:px-8 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/25 min-h-[44px] touch-target">
          VIP Support kontaktieren
        </button>
      </div>
    </div>
  );
};