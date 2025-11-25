import { useMemo, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Rocket,
  Zap,
  TrendingUp,
  Crown,
  ShoppingBag,
  Flame,
  Gift
} from "lucide-react";
import { shallow } from "zustand/shallow";

import { useMobileOptimizations } from "../components/MobileOptimizations";
import { DailyRewardPopup } from "../components/DailyRewardPopup";
import { HomePageSkeleton } from "../components/skeletons/HomePageSkeleton";
import { useHomepageBootstrap } from "../hooks/useHomepageBootstrap";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { trackEvent } from "../utils/analytics";
import { useShopStore } from "../store/shop";
import { useDropsStore } from "../store/drops";
import { useHomepageRealtime } from "../hooks/useHomepageRealtime";
import { LiveActivityFeed } from "../components/LiveActivityFeed";
import { WebSocketStatus } from "../components/WebSocketStatus";
import { useNotifications } from "../hooks/useNotifications";
import { ToastContainer } from "../components/notifications/ToastContainer";
import { NotificationCenter } from "../components/notifications/NotificationCenter";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { useScrollTracking } from "../hooks/useScrollTracking";
import { useClickTracking } from "../hooks/useClickTracking";
import { DiscountProgressTracker } from "../components/cookieClicker/DiscountProgressTracker";
import { useGamingDiscountStore } from "../store/gamingDiscounts";
import { useCookieClickerStore } from "../store/cookieClicker";
import { useBotCommandHandler } from "../utils/botCommandHandler";
import { WelcomeBackModal } from "../components/maintenance/WelcomeBackModal";


// Import sub-components
import { HeroSection } from "./components/HeroSection";
import { UltraInviteCard } from "./components/UltraInviteCard";
import { VerifiedInvitesShowcase } from "./components/VerifiedInvitesShowcase";
import { StatsCard } from "./components/StatsCard";
import { LimitedOffersSection } from "./components/LimitedOffersSection";
import { FeaturedDropsSection } from "./components/FeaturedDropsSection";
import { PersonalizedRecommendations } from "./components/PersonalizedRecommendations";
import { QuickActionsFAB } from "./components/QuickActionsFAB";
import { ScrollReveal } from "../components/ScrollReveal";
import { LazySection } from "../components/LazySection";
import { PullToRefresh } from "../components/mobile/PullToRefresh";
import { BottomSheet } from "../components/mobile/BottomSheet";
import { lazy, Suspense } from "react";
import { GamificationPanel } from "./components/GamificationPanel";

// Lazy load heavy components
const TrendingNowSection = lazy(() => 
  import("./components/TrendingNowSection").then(module => ({ default: module.TrendingNowSection }))
);
const InsiderHighlightsSection = lazy(() => 
  import("./components/InsiderHighlightsSection").then(module => ({ default: module.InsiderHighlightsSection }))
);

const selectHomepageShop = (state: ReturnType<typeof useShopStore.getState>) => ({
  coinsBalance: state.coinsBalance,
  invite: state.invite,
  products: state.products,
  interests: state.interests
});

const selectHomepageDrops = (state: ReturnType<typeof useDropsStore.getState>) => ({
  drops: state.drops
});

const limitedOffers = [
  {
    title: "Flash Sale",
    description: "50% auf ausgewaehlte Drops",
    timeLeft: "2h 34m",
    badge: "Live",
    color: "from-red-500 to-orange-500",
    icon: Flame
  },
  {
    title: "VIP Early Access",
    description: "Exklusiver Zugang zu neuen Releases",
    timeLeft: "48h",
    badge: "VIP",
    color: "from-purple-500 to-pink-500",
    icon: Crown
  },
  {
    title: "Bundle Deal",
    description: "3 kaufen, 1 gratis plus 150 Coins",
    timeLeft: "5 Tage",
    badge: "Hot",
    color: "from-yellow-500 to-orange-500",
    icon: Gift
  }
];

const InviteErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <section className="mx-auto mb-8 w-full max-w-4xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
    <h2 className="text-lg font-semibold text-red-200">Homepage konnte nicht geladen werden</h2>
    <p className="mt-2 text-sm text-red-100">
      {message}
    </p>
    <button
      type="button"
      className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black transition hover:bg-accent/80"
      onClick={onRetry}
    >
      Erneut versuchen
    </button>
  </section>
);

// Simplified Homepage Component
export const HomePageOptimized = () => {
  const { isMobile } = useMobileOptimizations();
  const { isReturningUser } = useUserPreferences();
  const { executeCommand } = useBotCommandHandler();
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  // Check for welcome back flag
  useEffect(() => {
    const shouldShow = sessionStorage.getItem('showWelcomeBack') === 'true';
    if (shouldShow) {
      setShowWelcomeBack(true);
      sessionStorage.removeItem('showWelcomeBack');
    }
  }, []);

  // Analytics Tracking
  useScrollTracking();
  useClickTracking(true);

  // Check for bot commands in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command && executeCommand) {
      try {
        const result = executeCommand(command);
        if (result?.success && result?.message) {
          console.log('Bot command executed:', result.message);
          // Execute action if available
          if (result.action) {
            result.action();
          }
        }
      } catch (error) {
        console.error('Error executing bot command:', error);
      }
    }
  }, [executeCommand]);
  
  const { loading, error, ready, retry } = useHomepageBootstrap();
  
  // Realtime data
  const { liveStats, recentActivity, isConnected } = useHomepageRealtime();
  
  // Notifications
  const { toasts, removeToast, success, error: showError } = useNotifications({ maxToasts: 5 });
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const { showNotification: showPushNotification, requestPermission: requestPushPermission } = usePushNotifications();
  
  // Request push notification permission on mount
  useEffect(() => {
    if (isReturningUser) {
      requestPushPermission();
    }
  }, [isReturningUser, requestPushPermission]);

  const { coinsBalance, invite, products, interests } = useShopStore(selectHomepageShop, shallow);
  const { drops } = useDropsStore(selectHomepageDrops, shallow);
  const hasAvailableDiscounts = useGamingDiscountStore(state => state.hasAvailableDiscounts());
  const totalCookies = useCookieClickerStore(state => state.totalCookies);

  const featuredDrops = useMemo(() => {
    return drops.filter((drop) => drop.status === "available").slice(0, 3);
  }, [drops]);

  const recommendedProducts = useMemo(() => {
    if (!isReturningUser) return [];
    return products
      .filter((product) => product.onRequest && (interests[product.id] || product.interest || 0) > 30)
      .sort((a, b) => (interests[b.id] || b.interest || 0) - (interests[a.id] || a.interest || 0))
      .slice(0, 3);
  }, [products, interests, isReturningUser]);
  
  // Memoize stats calculations
  const statsData = useMemo(() => ({
    activeDrops: drops.filter((drop) => drop.status === "available").length,
    activeUsers: 523,
    totalProducts: products.length,
    liveOrders: 15
  }), [drops, products]);

  const handleInviteShare = useCallback(() => {
    trackEvent("homepage_invite_share", {
      hasInvite: Boolean(invite?.inviteCode)
    });

    if (!invite?.inviteCode) {
      return;
    }

    navigator.share?.({
      title: "Nebula Invite",
      text: `Tritt Nebula bei mit meinem Invite Code: ${invite.inviteCode}`,
      url: window.location.origin
    });
  }, [invite?.inviteCode]);

  const handleInviteCopy = useCallback(async () => {
    trackEvent("homepage_invite_copy", {
      hasInvite: Boolean(invite?.inviteCode)
    });

    if (!invite?.inviteCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(invite.inviteCode);
      success('Invite Code kopiert!', 'Der Code wurde in die Zwischenablage kopiert.');
      showPushNotification?.('Invite Code kopiert!', {
        body: 'Der Code wurde in die Zwischenablage kopiert.',
        tag: 'invite-copy'
      });
    } catch (err) {
      showError('Fehler', 'Code konnte nicht kopiert werden.');
    }
  }, [invite?.inviteCode, success, showError, showPushNotification]);

  const handleDropsCta = useCallback(() => {
    trackEvent("homepage_cta_click", { cta: "drops" });
  }, []);

  const handleVipCta = useCallback(() => {
    trackEvent("homepage_cta_click", { cta: "vip" });
  }, []);
  
  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    trackEvent("homepage_pull_refresh", {});
    // Refresh all data
    await retry();
    success('Aktualisiert!', 'Die Homepage wurde erfolgreich aktualisiert.');
  }, [retry, success]);
  
  // Quick Actions Bottom Sheet
  const [showQuickActions, setShowQuickActions] = useState(false);

  if (loading && !ready) {
    return <HomePageSkeleton />;
  }

  return (
    <>
      <DailyRewardPopup />
      <WelcomeBackModal isOpen={showWelcomeBack} onClose={() => setShowWelcomeBack(false)} />
      
      {/* WebSocket Status Indicator */}
      <WebSocketStatus />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Notification Center */}
      <NotificationCenter
        notifications={toasts.map(t => ({ ...t, read: false, category: 'system' }))}
        onMarkAsRead={(id) => {}}
        onRemove={removeToast}
        onClearAll={() => {}}
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {error && <InviteErrorState message={error} onRetry={retry} />}

      <PullToRefresh onRefresh={handleRefresh} threshold={80}>
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-24">
        <ScrollReveal direction="fade" duration={0.8}>
          <HeroSection reducedMotion={false} />
        </ScrollReveal>

        {/* Gaming-Rabatte Teaser */}
        {(hasAvailableDiscounts || totalCookies > 1000) && (
          <ScrollReveal direction="up" delay={0.2}>
            <DiscountProgressTracker
              variant="full"
              onClick={() => window.location.href = '/cookie-clicker'}
            />
          </ScrollReveal>
        )}

        {isReturningUser && (
          <ScrollReveal direction="down" delay={0.1}>
            <motion.div
              className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 to-purple-500/10 p-4"
            >
              <p className="text-sm text-text">Willkommen zurueck! Du hast {coinsBalance} Coins.</p>
            </motion.div>
          </ScrollReveal>
        )}

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-text">Invite System</h2>
              <p className="mt-1 text-sm text-muted">Baue dein Team auf und verdiene Belohnungen</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-accent">
              <Zap className="h-4 w-4 animate-pulse" />
              <span>Live Rewards</span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <UltraInviteCard
                invite={invite}
                coinsBalance={coinsBalance}
                onShare={handleInviteShare}
                onCopy={handleInviteCopy}
                reducedMotion={false}
              />
            </div>

            <VerifiedInvitesShowcase
              verifiedCount={12}
              pendingCount={3}
              recentVerifications={[
                { id: 1, userName: "Anna M.", method: "telegram", timeAgo: "2 Std", reward: 150 },
                { id: 2, userName: "Max K.", method: "selfie", timeAgo: "5 Std", reward: 200 },
                { id: 3, userName: "Lisa S.", method: "telegram", timeAgo: "1 Tag", reward: 150 }
              ]}
              reducedMotion={false}
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            stat={{
              label: "Aktive Drops",
              value: drops.filter((drop) => drop.status === "available").length,
              icon: Rocket,
              change: "+3",
              color: "from-emerald-500 to-teal-600"
            }}
            index={0}
            reducedMotion={false}
            liveValue={liveStats?.activeDrops}
            showPulse={isConnected}
          />

          <StatsCard
            stat={{
              label: "Aktive Nutzer",
              value: 523,
              icon: Zap,
              change: "+42",
              color: "from-purple-500 to-pink-600"
            }}
            index={1}
            reducedMotion={false}
            liveValue={liveStats?.activeUsers}
            showPulse={isConnected}
          />

          <StatsCard
            stat={{
              label: "Produkte",
              value: products.length,
              icon: ShoppingBag,
              change: "+8",
              color: "from-blue-500 to-cyan-600"
            }}
            index={2}
            reducedMotion={false}
            liveValue={liveStats?.totalProducts}
            showPulse={isConnected}
          />

          <StatsCard
            stat={{
              label: "Live Bestellungen",
              value: 15,
              icon: Flame,
              change: "+3",
              color: "from-orange-500 to-red-600"
            }}
            index={3}
            reducedMotion={false}
            liveValue={liveStats?.liveOrders}
            showPulse={isConnected}
          />
        </section>

        <LazySection>
          <LimitedOffersSection offers={limitedOffers} reducedMotion={false} />
        </LazySection>

        <LazySection>
          <Suspense fallback={<div className="h-64 animate-pulse bg-black/30 rounded-2xl" />}>
            <TrendingNowSection reducedMotion={false} />
          </Suspense>
        </LazySection>

        <LazySection>
          <FeaturedDropsSection drops={featuredDrops} reducedMotion={false} />
        </LazySection>

        {recommendedProducts.length > 0 && (
          <LazySection>
            <PersonalizedRecommendations products={recommendedProducts} reducedMotion={false} />
          </LazySection>
        )}

        <LazySection>
          <Suspense fallback={<div className="h-64 animate-pulse bg-black/30 rounded-2xl" />}>
            <InsiderHighlightsSection reducedMotion={false} />
          </Suspense>
        </LazySection>

        <LazySection>
          <GamificationPanel reducedMotion={false} />
        </LazySection>

        <section className="rounded-3xl border border-accent/20 bg-gradient-to-r from-accent/10 to-emerald-500/10 p-8 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold text-text">Bereit fuer deinen ersten Drop?</h2>
            <p className="mb-6 text-muted">
              Aktiviere deinen Invite-Code im Telegram Bot und sichere dir Zugang zu exklusiven Drops und VIP Features.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/drops"
                  onClick={handleDropsCta}
                  className="flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-black shadow-lg"
                >
                  <Rocket className="h-5 w-5" />
                  <span>Drops entdecken</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/vip"
                  onClick={handleVipCta}
                  className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-8 py-4 text-sm font-semibold text-purple-400"
                >
                  <Crown className="h-5 w-5" />
                  <span>VIP Lounge</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <QuickActionsFAB 
          isMobile={isMobile} 
          onQuickActionsClick={() => setShowQuickActions(true)}
        />
        </div>
      </PullToRefresh>
      
      {/* Quick Actions Bottom Sheet */}
      <BottomSheet
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
        title="Quick Actions"
        snapPoints={[50, 85]}
        showDragHandle={true}
      >
        <div className="space-y-4 p-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              handleInviteShare();
              setShowQuickActions(false);
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-accent/20 to-purple-500/20 border border-accent/30 hover:from-accent/30 hover:to-purple-500/30 transition-all"
          >
            <Rocket className="h-5 w-5 text-accent" />
            <span className="font-semibold text-text">Invite teilen</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              handleDropsCta();
              window.location.href = '/drops';
              setShowQuickActions(false);
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all"
          >
            <Flame className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-text">Zu Drops</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              handleVipCta();
              window.location.href = '/vip';
              setShowQuickActions(false);
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
          >
            <Crown className="h-5 w-5 text-purple-400" />
            <span className="font-semibold text-text">VIP Lounge</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowNotificationCenter(true);
              setShowQuickActions(false);
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 hover:from-gray-500/30 hover:to-slate-500/30 transition-all"
          >
            <Gift className="h-5 w-5 text-gray-400" />
            <span className="font-semibold text-text">Benachrichtigungen</span>
          </motion.button>
        </div>
      </BottomSheet>
    </>
  );
};
