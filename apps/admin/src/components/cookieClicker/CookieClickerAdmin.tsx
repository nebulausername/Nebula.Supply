import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, BarChart3, Settings, Cookie, Activity, Keyboard, Map } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PlayerManagement } from './PlayerManagement';
import { LeaderboardManagement } from './LeaderboardManagement';
import { CookieAnalytics } from './CookieAnalytics';
import { CookieMonitoring } from './CookieMonitoring';
import { GameConfiguration } from './GameConfiguration';
import { PlayerActivityTracker } from './PlayerActivityTracker';
import { useCookieClickerShortcuts } from '../../hooks/useKeyboardShortcuts';

type TabType = 'players' | 'leaderboard' | 'analytics' | 'monitoring' | 'activity' | 'config';

export const CookieClickerAdmin = () => {
  const [activeTab, setActiveTab] = useState<TabType>('players');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // 🚀 Keyboard Shortcuts
  useCookieClickerShortcuts({
    onRefresh: () => {
      // Refresh current tab data
      window.location.reload();
    },
    onExport: () => {
      // Trigger export
      const exportBtn = document.querySelector('[data-export-btn]') as HTMLButtonElement;
      exportBtn?.click();
    },
    onSearch: () => {
      searchInputRef.current?.focus();
    },
    onSave: () => {
      const saveBtn = document.querySelector('[data-save-btn]') as HTMLButtonElement;
      saveBtn?.click();
    }
  });

  const tabs: Array<{ id: TabType; label: string; icon: typeof Trophy }> = [
    { id: 'players', label: 'Player Management', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'monitoring', label: 'System Monitoring', icon: Activity },
    { id: 'activity', label: 'Player Activity', icon: Map },
    { id: 'config', label: 'Game Configuration', icon: Settings }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center border border-orange-500/30">
            <Cookie className="w-8 h-8 text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Cookie Clicker Admin</h1>
            <p className="text-gray-400">Manage players, leaderboard, and analytics</p>
          </div>
        </div>

        {/* Tabs - Responsive */}
        <div className="flex flex-wrap gap-2 border-b border-slate-700/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 md:px-6 py-3 font-medium transition-all text-sm md:text-base",
                  isActive
                    ? "text-orange-400 border-b-2 border-orange-400"
                    : "text-gray-400 hover:text-white"
                )}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-orange-500/10 -z-10"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="ml-auto px-4 py-3 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
            <span className="hidden md:inline">Shortcuts</span>
          </button>
        </div>
        
        {/* 🚀 Keyboard Shortcuts Help */}
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
          >
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Refresh</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-white">Ctrl+R</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Export</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-white">Ctrl+E</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Search</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-white">Ctrl+F</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Save</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded text-white">Ctrl+S</kbd>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'players' && <PlayerManagement />}
        {activeTab === 'leaderboard' && <LeaderboardManagement />}
        {activeTab === 'analytics' && <CookieAnalytics />}
        {activeTab === 'monitoring' && <CookieMonitoring />}
        {activeTab === 'activity' && <PlayerActivityTracker />}
        {activeTab === 'config' && <GameConfiguration />}
      </motion.div>
    </div>
  );
};

