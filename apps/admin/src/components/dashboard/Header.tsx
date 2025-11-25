import { useDashboardUI, useLiveUpdates } from '../../lib/store/dashboard';
import { useAuthUser } from '../../lib/store/auth';
import { logger } from '../../lib/logger';
import { NotificationPanel } from './NotificationPanel';
import { useMobile } from '../../hooks/useMobile';
import { cn } from '../../utils/cn';
import { Breadcrumb } from '../navigation/Breadcrumb';
import { useLocation } from 'react-router-dom';
import { useBreadcrumbs } from '../navigation/Breadcrumb';

interface HeaderProps {
  onMobileMenuClick?: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { sidebarOpen, setSidebarOpen } = useDashboardUI();
  const { liveUpdates, connectionStatus } = useLiveUpdates();
  const { user } = useAuthUser();
  const { isMobile } = useMobile();
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs(location.pathname);

  const handleSidebarToggle = () => {
    if (isMobile && onMobileMenuClick) {
      onMobileMenuClick();
    } else {
      setSidebarOpen(!sidebarOpen);
      logger.logUserAction('sidebar_toggle', { open: !sidebarOpen });
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live';
      case 'connecting': return 'Verbinden...';
      case 'error': return 'Fehler';
      default: return 'Offline';
    }
  };

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSidebarToggle}
            className={cn(
              "rounded-lg bg-white/5 hover:bg-white/10 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-neon/50",
              isMobile ? "min-w-touch min-h-touch p-2" : "p-2"
            )}
            aria-label={isMobile ? "Open menu" : "Toggle sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

        <div>
          <p className={cn(
            "uppercase tracking-[0.4em] text-neon font-space-grotesk font-medium",
            isMobile ? "text-[10px]" : "text-xs"
          )}>NEBULA SUPPLY</p>
          <h1 className={cn(
            "font-bold font-orbitron text-white bg-gradient-to-r from-neon via-white to-neon bg-clip-text text-transparent",
            isMobile ? "text-2xl" : "text-4xl"
          )}>
            ADMIN DASHBOARD
          </h1>
        </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Connection Status */}
          {!isMobile && (
            <div className="flex items-center gap-4">
              {/* Performance Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Live</span>
              </div>

              {/* Connection Status (Mock) */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' :
                  'bg-yellow-400 animate-pulse'
                }`} />
                <span className={`text-sm ${getConnectionStatusColor()}`}>
                  {connectionStatus === 'connected' ? 'Live' : 'Mock'}
                </span>
              </div>
            </div>
          )}

          {/* Mobile Connection Status */}
          {isMobile && (
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                'bg-yellow-400 animate-pulse'
              }`} />
            </div>
          )}

          {/* Live Updates Toggle */}
          {!isMobile && (
            <button
              onClick={() => {
                // Toggle live updates würde hier implementiert werden
                logger.logUserAction('live_updates_toggle', { enabled: !liveUpdates });
              }}
              className={`px-3 py-1 rounded-full text-sm transition-colors min-h-touch ${
                liveUpdates
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
              }`}
            >
              {liveUpdates ? 'Live' : 'Statisch'}
            </button>
          )}

          {/* Notification Bell */}
          <NotificationPanel />

          {/* User Info */}
          {user && (
            <div className={cn(
              "flex items-center gap-2 rounded-lg bg-white/5",
              isMobile ? "px-2 py-1.5" : "px-3 py-2"
            )}>
              <div className={cn(
                "rounded-full bg-blue-500/20 flex items-center justify-center",
                isMobile ? "w-7 h-7" : "w-8 h-8"
              )}>
                <span className={cn(
                  "font-medium text-blue-400",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              {!isMobile && (
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-text">{user.email}</p>
                  <p className="text-xs text-muted capitalize">{user.role}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isMobile && location.pathname !== '/' && (
        <Breadcrumb items={breadcrumbs} className="py-2" />
      )}

      {!isMobile && (
        <div className="flex items-center gap-2 text-sm text-muted font-inter">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Real-time Operations Control
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Live KPI Monitoring
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Smart Ticket Management
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-neon rounded-full animate-pulse" />
            Neural Network Analytics
          </span>
        </div>
      )}
    </header>
  );
}
