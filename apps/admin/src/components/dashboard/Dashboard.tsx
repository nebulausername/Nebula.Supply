import React, { useEffect, useState, Suspense, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Sidebar } from "../Sidebar";
import { MobileSidebar } from "../mobile/MobileSidebar";
import { MobileBottomNav } from "../mobile/MobileBottomNav";
import { Header } from "./Header";
// Lazy load widget components for better code splitting
const KPIDashboard = React.lazy(() => import("./KPIDashboard").then(m => ({ default: m.KPIDashboard })));
const EcommerceKPIs = React.lazy(() => import("./EcommerceKPIs").then(m => ({ default: m.EcommerceKPIs })));
const TicketCommand = React.lazy(() => import("./TicketCommand").then(m => ({ default: m.TicketCommand })));
const TrendFeed = React.lazy(() => import("./TrendFeed").then(m => ({ default: m.TrendFeed })));
const QueueByPriority = React.lazy(() => import("./QueueByPriority").then(m => ({ default: m.QueueByPriority })));
const Automations = React.lazy(() => import("./Automations").then(m => ({ default: m.Automations })));
const ShopCategories = React.lazy(() => import("./ShopCategories").then(m => ({ default: m.ShopCategories })));
const KnowledgeHighlights = React.lazy(() => import("./KnowledgeHighlights").then(m => ({ default: m.KnowledgeHighlights })));
const CoinRewards = React.lazy(() => import("./CoinRewards").then(m => ({ default: m.CoinRewards })));
const ActivityFeed = React.lazy(() => import("./ActivityFeed").then(m => ({ default: m.ActivityFeed })));
const InviteStatus = React.lazy(() => import("./InviteStatus").then(m => ({ default: m.InviteStatus })));

// Preload widget components when hovering over dashboard area
export const preloadWidget = (widgetId: WidgetId) => {
  switch (widgetId) {
    case 'kpi-dashboard':
      import("./KPIDashboard");
      break;
    case 'ecommerce-kpis':
      import("./EcommerceKPIs");
      break;
    case 'ticket-command':
      import("./TicketCommand");
      break;
    case 'trend-feed':
      import("./TrendFeed");
      break;
    case 'queue-by-priority':
      import("./QueueByPriority");
      break;
    case 'automations':
      import("./Automations");
      break;
    case 'shop-categories':
      import("./ShopCategories");
      break;
    case 'knowledge-highlights':
      import("./KnowledgeHighlights");
      break;
    case 'coin-rewards':
      import("./CoinRewards");
      break;
    case 'activity-feed':
      import("./ActivityFeed");
      break;
    case 'invite-status':
      import("./InviteStatus");
      break;
    case 'quick-stats':
      import("./QuickStats");
      break;
  }
};
import { PerformanceMonitor } from "./PerformanceMonitor";
import { LiveBotStats } from "./LiveBotStats";
import { LiveVerificationQueue } from "./LiveVerificationQueue";
import { CashPaymentVerificationQueue } from "./CashPaymentVerificationQueue";
import { LiveInviteCodeManager } from "./LiveInviteCodeManager";
import { LiveBotActivityFeed } from "./LiveBotActivityFeed";
import { useDashboardUI } from "../../lib/store/dashboard";
import { performanceMonitor } from "../../lib/performance";
import { useNotifications } from "../../hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette } from "../CommandPalette";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { useMobile } from "../../hooks/useMobile";
import { cn } from "../../utils/cn";
import { routeLoaders, getRoutePreloader } from "../../lib/utils/routePreloader";
import { ToastContainer, useToast } from "../ui/Toast";
import { QuickActions } from "./QuickActions";
import { ErrorNotificationCenter } from "../error/ErrorNotificationCenter";
import { TabErrorBoundary } from "../ecommerce/TabErrorBoundary";
import { ComponentErrorBoundary } from "../error/ComponentErrorBoundary";
import { ErrorCategory, ErrorSeverity } from "../../lib/error";
import { useRealtimeKPIs } from "../../lib/realtime/hooks/useRealtimeKPIs";
import { useLiveUpdates } from "../../lib/store/dashboard";
import { ViewType, VALID_VIEW_TYPES } from "../../lib/types/common";
import { DashboardLayout } from "./DashboardLayout";
import { WidgetId } from "../../lib/store/dashboardLayout";

// Lazy load components with route-based code splitting
const TicketManagement = React.lazy(routeLoaders.tickets);
const OrderManagement = React.lazy(routeLoaders.orders);
const ShopManagement = React.lazy(routeLoaders.shop);
const DropManagementPage = React.lazy(routeLoaders.drops);
const CustomerManagement = React.lazy(routeLoaders.customers);
const ImageLibraryPage = React.lazy(routeLoaders.images);
const ShippingManagement = React.lazy(routeLoaders.shipping);
const UserManagement = React.lazy(routeLoaders.users);
const SecurityCenter = React.lazy(routeLoaders.security);
const SystemConfig = React.lazy(routeLoaders.settings);
const ContestAdminPanel = React.lazy(routeLoaders.contests);
const CookieClickerAdmin = React.lazy(routeLoaders.cookieClicker);
const MaintenanceControl = React.lazy(routeLoaders.maintenance);
const InviteCodeAdminPage = React.lazy(routeLoaders['invite-codes']);

export function Dashboard() {
  const startTime = performance.now();
  const { sidebarOpen } = useDashboardUI();
  const { isMobile } = useMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const { liveUpdates } = useLiveUpdates();
  
  // Initialize activeView from URL or default to overview
  const activeView = useMemo<ViewType>(() => {
    const urlView = searchParams.get('view');
    // Clean up malformed URLs like "overview/tickets"
    if (urlView && urlView.includes('/')) {
      const cleanView = urlView.split('/')[0] as ViewType;
      if (cleanView && VALID_VIEW_TYPES.includes(cleanView)) {
        return cleanView;
      }
    }
    if (urlView && VALID_VIEW_TYPES.includes(urlView as ViewType)) {
      return urlView as ViewType;
    }
    return 'overview';
  }, [searchParams]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { toasts, removeToast } = useToast();
  
  // Update URL when view changes (only if different)
  const setActiveView = (view: ViewType) => {
    const currentView = searchParams.get('view');
    if (currentView !== view) {
      setSearchParams({ view }, { replace: true });
    }
  };
  
  // Initialize notification polling
  useNotifications();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Real-time KPI updates for Mission Control
  useRealtimeKPIs({
    enabled: liveUpdates && activeView === 'overview',
    onKPIUpdated: () => {
      // KPI updates will trigger query invalidation automatically
    }
  });

  // Preload route when view changes
  useEffect(() => {
    if (activeView !== 'overview') {
      getRoutePreloader().preloadRoute(activeView);
    }
  }, [activeView]);

  // Performance monitoring for the entire dashboard - only on mount
  useEffect(() => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.recordMetrics({
      renderTime,
      componentName: 'Dashboard',
      operation: 'full_render'
    });
  }, []); // Only run once on mount

  const getWidgetTitle = useCallback((widgetId: WidgetId): string => {
    const titles: Record<string, string> = {
      'quick-stats': 'Quick Stats',
      'kpi-dashboard': 'Live Metrics',
      'ecommerce-kpis': 'E-Commerce Metrics',
      'ticket-command': 'Ticket Command',
      'trend-feed': 'Trend Feed',
      'queue-by-priority': 'Queue by Priority',
      'automations': 'Automations',
      'shop-categories': 'Shop Categories',
      'knowledge-highlights': 'Knowledge Highlights',
      'coin-rewards': 'Coin Rewards',
      'activity-feed': 'Activity Feed',
      'invite-status': 'Invite Status'
    };
    return titles[widgetId] || widgetId;
  }, []);

  const renderWidget = useCallback((widgetId: WidgetId) => {
    const WidgetComponent = (() => {
      switch (widgetId) {
        case 'quick-stats':
          return React.lazy(() => import('./QuickStats').then(m => ({ default: m.QuickStats })));
        case 'kpi-dashboard':
          return KPIDashboard;
        case 'ecommerce-kpis':
          return EcommerceKPIs;
        case 'ticket-command':
          return TicketCommand;
        case 'trend-feed':
          return TrendFeed;
        case 'queue-by-priority':
          return QueueByPriority;
        case 'automations':
          return Automations;
        case 'shop-categories':
          return ShopCategories;
        case 'knowledge-highlights':
          return KnowledgeHighlights;
        case 'coin-rewards':
          return CoinRewards;
        case 'activity-feed':
          return ActivityFeed;
        case 'invite-status':
          return InviteStatus;
        default:
          return null;
      }
    })();

    if (!WidgetComponent) return null;

    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-32 bg-black/20 rounded-lg border border-white/10">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-neon"></div>
              <div className="text-xs text-muted-foreground">Loading widget...</div>
            </div>
          </div>
        }
      >
        <WidgetComponent />
      </Suspense>
    );
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'shop':
        return (
          <TabErrorBoundary 
            tabName="Shop Management" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="ShopManagement">
              <ShopManagement />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'drops':
        return (
          <TabErrorBoundary 
            tabName="Drop Management" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="DropManagement">
              <DropManagementPage />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'orders':
        return (
          <TabErrorBoundary 
            tabName="Order Management" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="OrderManagement">
              <OrderManagement />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'customers':
        return (
          <TabErrorBoundary 
            tabName="Customer Management" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="CustomerManagement">
              <CustomerManagement />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'images':
        return (
          <TabErrorBoundary 
            tabName="Image Library" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="ImageLibraryPage">
              <ImageLibraryPage />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'shipping':
        return (
          <TabErrorBoundary 
            tabName="Shipping Management" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="ShippingManagement">
              <ShippingManagement />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'tickets':
        return (
          <TabErrorBoundary 
            tabName="Support Tickets" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="TicketManagement">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-neon"></div>
                      <div className="text-sm text-muted-foreground">Loading ticket system...</div>
                    </div>
                  </div>
                }
              >
                <TicketManagement />
              </Suspense>
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'automation':
        return (
          <TabErrorBoundary 
            tabName="Automation" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="Automations">
              <Automations />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'users':
        return (
          <TabErrorBoundary 
            tabName="User Management" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="UserManagement">
              <UserManagement />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'security':
        return (
          <TabErrorBoundary 
            tabName="Security Center" 
            category={ErrorCategory.SECURITY}
            severity={ErrorSeverity.HIGH}
          >
            <ComponentErrorBoundary componentName="SecurityCenter">
              <SecurityCenter />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'settings':
        return (
          <TabErrorBoundary 
            tabName="System Settings" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="SystemConfig">
              <SystemConfig />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'contests':
        return (
          <TabErrorBoundary 
            tabName="Contest Management" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="ContestAdminPanel">
              <ContestAdminPanel />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'cookieClicker':
        return (
          <TabErrorBoundary 
            tabName="Cookie Clicker Admin" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.LOW}
          >
            <ComponentErrorBoundary componentName="CookieClickerAdmin">
              <CookieClickerAdmin />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'maintenance':
        return (
          <TabErrorBoundary 
            tabName="Maintenance Control" 
            category={ErrorCategory.SYSTEM}
            severity={ErrorSeverity.HIGH}
          >
            <ComponentErrorBoundary componentName="MaintenanceControl">
              <MaintenanceControl />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'invite-codes':
        return (
          <TabErrorBoundary 
            tabName="Invite Code Management" 
            category={ErrorCategory.API}
            severity={ErrorSeverity.MEDIUM}
          >
            <ComponentErrorBoundary componentName="InviteCodeAdminPage">
              <InviteCodeAdminPage />
            </ComponentErrorBoundary>
          </TabErrorBoundary>
        );
      case 'bot':
        return (
          <div className="space-y-8">
            {/* Bot Overview */}
            <div className="grid gap-6 lg:grid-cols-2">
              <LiveBotStats />
              <LiveVerificationQueue />
            </div>

            {/* Payment Verifications */}
            <div className="grid gap-6 lg:grid-cols-2">
              <CashPaymentVerificationQueue />
            </div>

            {/* Bot Management */}
            <div className="grid gap-6 lg:grid-cols-2">
              <LiveInviteCodeManager />
              <LiveBotActivityFeed />
            </div>
          </div>
        );
      default:
        return (
          <TabErrorBoundary 
            tabName="Mission Control" 
            category={ErrorCategory.RUNTIME}
            severity={ErrorSeverity.LOW}
          >
            <DashboardLayout
              renderWidget={renderWidget}
              getWidgetTitle={getWidgetTitle}
            />
          </TabErrorBoundary>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-[#0B0B12] to-[#050509] text-text">
      {/* Desktop Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <div className={cn(
        "flex flex-1 flex-col gap-8 transition-all duration-300",
        isMobile ? "px-4 py-4 pb-20" : "px-6 py-8",
        !isMobile && (sidebarOpen ? 'ml-64' : 'ml-16')
      )}>
        <Header onMobileMenuClick={() => setMobileSidebarOpen(true)} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
              mass: 1
            }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-neon"></div>
                  <div className="text-muted-foreground">Lade Komponente...</div>
                </div>
              </div>
            }>
              {renderView()}
            </Suspense>
          </motion.div>
        </AnimatePresence>

        {/* Performance Monitor - Floating (Desktop only) */}
        {!isMobile && (
          <div className="fixed bottom-4 right-4 z-50">
            <PerformanceMonitor />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          activeItem={activeView}
          onItemChange={setActiveView}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Quick Actions FAB (Mobile only) */}
      <QuickActions onViewChange={setActiveView} />

      {/* Error Notification Center */}
      <ErrorNotificationCenter />
    </div>
  );
}
