import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Phone, MapPin, Settings, Bell, Shield, Star, Trophy, Heart, Users, Gift, BarChart3, Package, Award, Share2, Crown, Activity, MessageCircle, Image } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { useShopStore } from "../store/shop";
import { useDropsStore } from "../store/drops";
import { useAchievementStore } from "../store/achievementStore";
import { MobileBottomNav } from "../components/mobile/MobileBottomNav";
import { useMobileOptimizations } from "../components/MobileOptimizations";
import { useEnhancedTouch } from "../hooks/useEnhancedTouch";
import { useBotCommandHandler } from "../utils/botCommandHandler";
import { springConfigs } from "../utils/springConfigs";
import { cn } from "../utils/cn";
import { TabNavigation } from "../components/profile/TabNavigation";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { StatsDashboard } from "../components/profile/StatsDashboard";
import { ActivityTimeline } from "../components/profile/ActivityTimeline";
import { OverviewDashboard } from "../components/profile/OverviewDashboard";

export const MobileProfilePage = () => {
  const { profile, isLoading: isProfileLoading, updateProfile, isUpdating } = useProfile();
  const coinsBalance = useShopStore((state) => state.coinsBalance);
  const invite = useShopStore((state) => state.invite);
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const { executeCommand } = useBotCommandHandler();

  // Get additional data from stores
  const drops = useDropsStore((state: any) => state.drops);
  const achievements = useAchievementStore((state: any) => state.achievements);

  // New hierarchical tab system
  type MainTabId = 'dashboard' | 'orders' | 'tickets' | 'achievements' | 'invite' | 'loyalty';
  type SubTabId = 'overview' | 'stats' | 'activity' | 'orders-list' | 'interests' | 'achievements-list' | 'rank';
  
  const [activeMainTab, setActiveMainTab] = useState<MainTabId>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>('overview');
  
  // Legacy activeTab for content rendering
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'interests' | 'invite' | 'rank' | 'tickets' | 'stats' | 'achievements' | 'activity' | 'gallery' | 'loyalty'>('overview');

  // Define main tabs with sub-tabs
  const mainTabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: BarChart3,
      subTabs: [
        { id: 'overview' as const, label: 'Übersicht', icon: User },
        { id: 'stats' as const, label: 'Statistiken', icon: BarChart3 },
        { id: 'activity' as const, label: 'Aktivität', icon: Activity },
      ]
    },
    {
      id: 'orders' as const,
      label: 'Bestellungen',
      icon: Package,
      subTabs: [
        { id: 'orders-list' as const, label: 'Bestellungen', icon: Package },
        { id: 'interests' as const, label: 'Interessen', icon: Heart },
      ]
    },
    {
      id: 'tickets' as const,
      label: 'Tickets',
      icon: MessageCircle,
      subTabs: [] // Tickets ist jetzt ein eigenständiger Haupt-Tab
    },
    {
      id: 'achievements' as const,
      label: 'Erfolge',
      icon: Award,
      subTabs: [
        { id: 'achievements-list' as const, label: 'Erfolge', icon: Award },
        { id: 'rank' as const, label: 'Rang', icon: Trophy },
      ]
    },
    {
      id: 'invite' as const,
      label: 'InviteSystem',
      icon: Share2,
      subTabs: [] // InviteSystem ist jetzt ein eigenständiger Haupt-Tab
    },
    {
      id: 'loyalty' as const,
      label: 'Treueprogramm',
      icon: Crown,
      subTabs: []
    },
  ];

  // Map new tab system to legacy tab system
  const mapToLegacyTab = (mainTab: MainTabId, subTab?: SubTabId) => {
    // If main tab has no sub-tabs, map directly
    if (mainTab === 'tickets') {
      setActiveTab('tickets');
      return;
    }
    if (mainTab === 'loyalty') {
      setActiveTab('loyalty');
      return;
    }
    if (mainTab === 'invite') {
      setActiveTab('invite');
      return;
    }
    
    if (!subTab) return;
    
    const mapping: Record<string, typeof activeTab> = {
      'overview': 'overview',
      'stats': 'stats',
      'activity': 'activity',
      'orders-list': 'orders',
      'interests': 'interests',
      'achievements-list': 'achievements',
      'rank': 'rank',
    };
    const legacyTab = mapping[subTab] || 'overview';
    setActiveTab(legacyTab);
  };

  const handleMainTabChange = (mainTabId: MainTabId) => {
    triggerHaptic('light');
    setActiveMainTab(mainTabId);
    const mainTab = mainTabs.find(t => t.id === mainTabId);
    if (mainTab && mainTab.subTabs.length > 0) {
      setActiveSubTab(mainTab.subTabs[0].id);
      mapToLegacyTab(mainTabId, mainTab.subTabs[0].id);
    } else {
      // Tabs without sub-tabs (tickets, loyalty)
      setActiveSubTab('overview'); // fallback
      mapToLegacyTab(mainTabId);
    }
  };

  const handleSubTabChange = (subTabId: SubTabId) => {
    triggerHaptic('light');
    setActiveSubTab(subTabId);
    mapToLegacyTab(activeMainTab, subTabId);
  };

  // Check for bot commands in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  // Legacy handler kept for backward compatibility if needed
  const handleTabChange = (tab: typeof activeTab) => {
    triggerHaptic('light');
    setActiveTab(tab);
    // Map legacy tab to new system
    const mainTabMapping: Record<typeof tab, MainTabId> = {
      'overview': 'dashboard',
      'stats': 'dashboard',
      'activity': 'dashboard',
      'orders': 'orders',
      'tickets': 'tickets', // Tickets ist jetzt eigenständig
      'achievements': 'achievements',
      'rank': 'achievements',
      'gallery': 'achievements', // Legacy support
      'invite': 'invite', // InviteSystem ist jetzt eigenständig
      'interests': 'orders', // Interessen zu Bestellungen verschoben
      'loyalty': 'loyalty',
    };
    const subTabMapping: Record<typeof tab, SubTabId> = {
      'overview': 'overview',
      'stats': 'stats',
      'activity': 'activity',
      'orders': 'orders-list',
      'tickets': 'overview', // fallback für tickets (hat keine sub-tabs)
      'achievements': 'achievements-list',
      'rank': 'rank',
      'gallery': 'achievements-list', // Legacy: Galerie zu achievements-list
      'invite': 'overview', // fallback für invite (hat keine sub-tabs)
      'interests': 'interests',
      'loyalty': 'overview', // fallback
    };
    setActiveMainTab(mainTabMapping[tab]);
    setActiveSubTab(subTabMapping[tab]);
  };


  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-[#06060A] to-[#050505] text-white">
        <div className="flex items-center justify-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#06060A] to-[#050505] text-white">
      {/* Header */}
      <motion.div
        className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={springConfigs.smooth}
      >
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Profil</h1>
          <button
            onClick={() => triggerHaptic('light')}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="pb-20">
        {/* Profile Header */}
        <ProfileHeader
          onSettingsClick={() => {
            triggerHaptic('light');
            // TODO: Open settings modal
          }}
        />

        {/* New Hierarchical Tab Navigation */}
        <div className="px-4 mb-6">
          <TabNavigation
            mainTabs={mainTabs}
            activeMainTab={activeMainTab}
            activeSubTab={activeSubTab}
            onMainTabChange={handleMainTabChange}
            onSubTabChange={handleSubTabChange}
            achievementsCount={achievements?.length}
          />
        </div>

        {/* Tab Content */}
        <motion.div
          className="px-4"
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={springConfigs.smooth}
        >
          {activeTab === 'overview' && (
            <OverviewDashboard />
          )}

          {activeTab === 'orders' && (
            <div className={cn(
              "text-center",
              "py-12 sm:py-16 md:py-20",
              "px-4"
            )}>
              <Package className={cn(
                "text-gray-400 mx-auto mb-4",
                "w-12 h-12 sm:w-16 sm:h-16"
              )} />
              <h3 className={cn(
                "font-semibold text-gray-300 mb-2",
                "text-lg sm:text-xl"
              )}>Keine Bestellungen</h3>
              <p className="text-gray-400 text-sm sm:text-base">Deine Bestellungen werden hier angezeigt</p>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className={cn(
              "text-center",
              "py-12 sm:py-16 md:py-20",
              "px-4"
            )}>
              <MessageCircle className={cn(
                "text-gray-400 mx-auto mb-4",
                "w-12 h-12 sm:w-16 sm:h-16"
              )} />
              <h3 className={cn(
                "font-semibold text-gray-300 mb-2",
                "text-lg sm:text-xl"
              )}>Keine Tickets</h3>
              <p className="text-gray-400 text-sm sm:text-base">Deine Support-Tickets werden hier angezeigt</p>
            </div>
          )}

          {activeTab === 'stats' && (
            <StatsDashboard />
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline />
          )}

          {activeTab === 'achievements' && (
            <div className={cn(
              "text-center",
              "py-12 sm:py-16 md:py-20",
              "px-4"
            )}>
              <Award className={cn(
                "text-gray-400 mx-auto mb-4",
                "w-12 h-12 sm:w-16 sm:h-16"
              )} />
              <h3 className={cn(
                "font-semibold text-gray-300 mb-2",
                "text-lg sm:text-xl"
              )}>Erfolge</h3>
              <p className="text-gray-400 text-sm sm:text-base">Deine gesammelten Achievements</p>
            </div>
          )}

          {activeTab === 'interests' && (
            <div className={cn(
              "text-center",
              "py-12 sm:py-16 md:py-20",
              "px-4"
            )}>
              <Heart className={cn(
                "text-gray-400 mx-auto mb-4",
                "w-12 h-12 sm:w-16 sm:h-16"
              )} />
              <h3 className={cn(
                "font-semibold text-gray-300 mb-2",
                "text-lg sm:text-xl"
              )}>Keine Interessen</h3>
              <p className="text-gray-400 text-sm sm:text-base">Deine Interessen werden hier angezeigt</p>
            </div>
          )}

          {activeTab === 'invite' && (
            <div className={cn(
              "space-y-6",
              "py-8 sm:py-10 md:py-12",
              "px-4"
            )}>
              {/* Premium InviteSystem Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative overflow-hidden rounded-3xl backdrop-blur-2xl",
                  "bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-purple-900/40",
                  "border border-purple-500/30 shadow-2xl",
                  "p-6 sm:p-8",
                  "text-center"
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className={cn(
                    "bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/50",
                    "w-20 h-20 sm:w-24 sm:h-24"
                  )}
                >
                  <Share2 className={cn(
                    "text-white",
                    "w-10 h-10 sm:w-12 sm:h-12"
                  )} />
                </motion.div>
                <h2 className={cn(
                  "font-bold text-white mb-2",
                  "text-2xl sm:text-3xl"
                )}>InviteSystem</h2>
                <p className={cn(
                  "text-gray-300 mb-4",
                  "text-sm sm:text-base"
                )}>Verdiene Coins und Belohnungen für jeden Freund</p>
              </motion.div>

              {/* Invite Benefits */}
              <div className={cn(
                "grid gap-4",
                "grid-cols-1",
                "sm:grid-cols-2",
                "md:grid-cols-3"
              )}>
                {[
                  { step: 1, title: "Einladung senden", description: "Teile deinen Code", icon: Share2 },
                  { step: 2, title: "Freund registriert", description: "Dein Freund meldet sich an", icon: User },
                  { step: 3, title: "Belohnung erhalten", description: "Du bekommst Coins", icon: Gift }
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className={cn(
                      "relative overflow-hidden rounded-2xl backdrop-blur-xl",
                      "bg-gradient-to-br from-slate-900/50 to-purple-900/30",
                      "border border-purple-500/20",
                      "p-4 sm:p-5",
                      "text-center",
                      "touch-target"
                    )}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="font-semibold text-white mb-1 text-sm sm:text-base">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-400">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rank' && (
            <div className={cn(
              "text-center",
              "py-12 sm:py-16 md:py-20",
              "px-4"
            )}>
              <Trophy className={cn(
                "text-gray-400 mx-auto mb-4",
                "w-12 h-12 sm:w-16 sm:h-16"
              )} />
              <h3 className={cn(
                "font-semibold text-gray-300 mb-2",
                "text-lg sm:text-xl"
              )}>Rang System</h3>
              <p className="text-gray-400 text-sm sm:text-base">Deine Ränge und Achievements</p>
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div className={cn(
              "text-center",
              "py-12 sm:py-16 md:py-20",
              "px-4"
            )}>
              <Crown className={cn(
                "text-gray-400 mx-auto mb-4",
                "w-12 h-12 sm:w-16 sm:h-16"
              )} />
              <h3 className={cn(
                "font-semibold text-gray-300 mb-2",
                "text-lg sm:text-xl"
              )}>Treueprogramm</h3>
              <p className="text-gray-400 text-sm sm:text-base">Deine Treuepunkte und Belohnungen</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Mobile Bottom Navigation - Use correct navigation items */}
      <MobileBottomNav
        activeItem="profile"
        onItemChange={(item) => {
          triggerHaptic('light');
          // Navigate to correct route
          const routes: Record<string, string> = {
            'home': '/',
            'shop': '/shop',
            'drops': '/drops',
            'cookie-clicker': '/cookie-clicker',
            'profile': '/profile'
          };
          if (routes[item]) {
            window.location.href = routes[item];
          }
        }}
      />
    </div>
  );
};




