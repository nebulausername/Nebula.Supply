import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDevModeStore } from '../../store/devMode';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../utils/cn';
import {
  X,
  Settings,
  Code2,
  Zap,
  Database,
  Activity,
  Cookie,
  TrendingUp,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface DevModePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevModePanel = ({ isOpen, onClose }: DevModePanelProps) => {
  const { deactivate } = useDevModeStore();
  const cookies = useCookieClickerStore(state => state.cookies);
  const totalCookies = useCookieClickerStore(state => state.totalCookies);
  const cookiesPerSecond = useCookieClickerStore(state => state.cookiesPerSecond);
  const level = useCookieClickerStore(state => state.level);
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'cookie-clicker' | 'debug' | 'performance'>('overview');
  const [copied, setCopied] = useState<string | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    memory: 0,
    renderTime: 0,
  });

  // Performance monitoring
  useEffect(() => {
    if (!isOpen || activeTab !== 'performance') return;

    let frameCount = 0;
    let lastTime = performance.now();
    const interval = setInterval(() => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        setPerformanceMetrics(prev => ({
          ...prev,
          fps: frameCount,
        }));
        frameCount = 0;
        lastTime = currentTime;
      }

      // Memory usage (if available)
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        setPerformanceMetrics(prev => ({
          ...prev,
          memory: Math.round(mem.usedJSHeapSize / 1048576), // MB
        }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const addTestCookies = () => {
    useCookieClickerStore.setState((state) => {
      state.cookies += 1000000;
      state.totalCookies += 1000000;
    });
  };

  const resetCookieClicker = () => {
    if (confirm('Cookie Clicker wirklich zurücksetzen?')) {
      useCookieClickerStore.setState((state) => {
        state.cookies = 0;
        state.totalCookies = 0;
        state.level = 1;
        state.xp = 0;
        state.buildings = {};
        state.upgrades = {};
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
        
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-full max-w-md bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl pointer-events-auto overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">Dev Mode</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'cookie-clicker', label: 'Cookies', icon: Cookie },
                { id: 'debug', label: 'Debug', icon: Code2 },
                { id: 'performance', label: 'Perf', icon: Zap },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-muted hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <a
                      href="/admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </a>
                    <button
                      onClick={() => deactivate()}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Dev Mode deaktivieren</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">User Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">User ID:</span>
                      <span className="text-white font-mono text-xs">{user?.id || 'Guest'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Email:</span>
                      <span className="text-white">{user?.email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Role:</span>
                      <span className="text-white">{user?.role || 'guest'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Environment</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Mode:</span>
                      <span className="text-white">{import.meta.env.MODE}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Dev:</span>
                      <span className="text-white">{import.meta.env.DEV ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">API URL:</span>
                      <span className="text-white font-mono text-xs truncate max-w-[200px]">
                        {import.meta.env.VITE_API_URL || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cookie Clicker Tab */}
            {activeTab === 'cookie-clicker' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Cookie Clicker Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Cookies:</span>
                      <span className="text-white">{cookies.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Total Cookies:</span>
                      <span className="text-white">{totalCookies.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">CPS:</span>
                      <span className="text-white">{cookiesPerSecond.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Level:</span>
                      <span className="text-white">{level}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Cheats</h3>
                  <div className="space-y-2">
                    <button
                      onClick={addTestCookies}
                      className="w-full px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 transition-colors text-sm"
                    >
                      +1M Cookies
                    </button>
                    <button
                      onClick={resetCookieClicker}
                      className="w-full px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-colors text-sm"
                    >
                      Reset Cookie Clicker
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Tab */}
            {activeTab === 'debug' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Store States</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Cookie Clicker', data: useCookieClickerStore.getState() },
                      { name: 'Auth', data: useAuthStore.getState() },
                    ].map((store) => (
                      <div key={store.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted">{store.name}</span>
                          <button
                            onClick={() => {
                              const json = JSON.stringify(store.data, null, 2);
                              copyToClipboard(json, store.name);
                            }}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                          >
                            {copied === store.name ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3 text-muted" />
                            )}
                          </button>
                        </div>
                        <pre className="text-xs text-muted bg-black/30 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                          {JSON.stringify(store.data, null, 2).slice(0, 200)}...
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Performance Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">FPS:</span>
                      <span className="text-white">{performanceMetrics.fps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Memory:</span>
                      <span className="text-white">{performanceMetrics.memory} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Render Time:</span>
                      <span className="text-white">{performanceMetrics.renderTime.toFixed(2)} ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};







































