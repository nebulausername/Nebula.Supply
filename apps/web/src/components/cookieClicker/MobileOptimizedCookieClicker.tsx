import { useState } from 'react';
import { useCookieClickerStore } from '../../store/cookieClicker';
import { 
  BottomNavigation, 
  MobileCookieButton, 
  CookieButtonStats,
  BottomSheet,
  PullToRefresh,
  PWAInstallPrompt
} from '../mobile';
import { Cookie, Star, Building, TrendingUp, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

// 🎯 Mobile-Optimized Cookie Clicker mit allen neuen Features
export const MobileOptimizedCookieClicker = () => {
  const [activeTab, setActiveTab] = useState('game');
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    cookies,
    totalCookies,
    cookiesPerClick,
    cookiesPerSecond,
    level,
    clicks,
    streak,
    clickCookie,
    tick
  } = useCookieClickerStore();

  // 🎯 Handle Refresh
  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    tick();
  };

  // 🎯 Render Content Based on Active Tab
  const renderContent = () => {
    switch (activeTab) {
      case 'game':
        return <GameView />;
      case 'shop':
        return <ShopView />;
      case 'buildings':
        return <BuildingsView />;
      case 'stats':
        return <StatsView />;
      case 'settings':
        setShowSettings(true);
        return <GameView />;
      default:
        return <GameView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] text-white safe-area-full">
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Main Content with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pb-20">
          {renderContent()}
        </div>
      </PullToRefresh>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeItem={activeTab}
        onItemChange={setActiveTab}
      />

      {/* Settings Bottom Sheet */}
      <BottomSheet
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          setActiveTab('game');
        }}
        title="Settings"
        snapPoints={[60, 85]}
      >
        <SettingsContent />
      </BottomSheet>
    </div>
  );
};

// 🎯 Game View Component
const GameView = () => {
  const { cookies, cookiesPerClick, cookiesPerSecond, level, clicks, streak, clickCookie } = useCookieClickerStore();

  const handleCookieClick = (x: number, y: number) => {
    clickCookie(x, y);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Stats */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
          🍪 Cookie Clicker
        </h1>
        
        {/* Cookie Count */}
        <div className="glass-effect rounded-2xl p-4 mb-4">
          <div className="text-sm text-gray-400 mb-1">Cookies</div>
          <div className="text-3xl sm:text-4xl font-black gradient-text">
            {Math.floor(cookies).toLocaleString()}
          </div>
        </div>

        {/* Level & CPS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass-effect rounded-xl p-3">
            <div className="text-xs text-gray-400">Level</div>
            <div className="text-xl font-bold text-[#0BF7BC]">{level}</div>
          </div>
          <div className="glass-effect rounded-xl p-3">
            <div className="text-xs text-gray-400">Per Second</div>
            <div className="text-xl font-bold text-[#61F4F4]">
              {cookiesPerSecond.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Button */}
      <div className="flex flex-col items-center justify-center my-12">
        <MobileCookieButton
          onClick={handleCookieClick}
          cookiesPerClick={cookiesPerClick}
          size="lg"
        />
        
        <CookieButtonStats
          totalClicks={clicks}
          streak={streak}
          multiplier={cookiesPerClick / 1}
        />
      </div>

      {/* Quick Stats */}
      <div className="mt-8 space-y-3">
        <StatCard
          label="Total Cookies"
          value={Math.floor(totalCookies || 0).toLocaleString()}
          icon="🍪"
        />
        <StatCard
          label="Total Clicks"
          value={clicks.toLocaleString()}
          icon="👆"
        />
        <StatCard
          label="Per Click"
          value={cookiesPerClick.toLocaleString()}
          icon="⚡"
        />
      </div>
    </div>
  );
};

// 🎯 Shop View
const ShopView = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Shop</h2>
      <div className="space-y-3">
        <ShopItem
          name="Auto Clicker"
          cost={100}
          description="+1 Cookie per second"
          icon="🤖"
        />
        <ShopItem
          name="Cookie Farm"
          cost={500}
          description="+5 Cookies per second"
          icon="🌾"
        />
        <ShopItem
          name="Cookie Factory"
          cost={2000}
          description="+20 Cookies per second"
          icon="🏭"
        />
      </div>
    </div>
  );
};

// 🎯 Buildings View
const BuildingsView = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Buildings</h2>
      <p className="text-gray-400">Your buildings will appear here</p>
    </div>
  );
};

// 🎯 Stats View
const StatsView = () => {
  const { totalCookies, clicks, timePlayed } = useCookieClickerStore();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Statistics</h2>
      <div className="space-y-3">
        <StatCard
          label="Total Cookies"
          value={Math.floor(totalCookies || 0).toLocaleString()}
          icon="🍪"
        />
        <StatCard
          label="Total Clicks"
          value={clicks.toLocaleString()}
          icon="👆"
        />
        <StatCard
          label="Time Played"
          value={`${Math.floor(timePlayed / 60)}m ${timePlayed % 60}s`}
          icon="⏱️"
        />
      </div>
    </div>
  );
};

// 🎯 Settings Content
const SettingsContent = () => {
  const { soundEnabled, animationsEnabled, performanceMode, toggleSound, toggleAnimations, togglePerformanceMode } = useCookieClickerStore();
  
  return (
    <div className="space-y-4">
      <SettingToggle
        label="Sound Effects"
        description="Enable audio feedback"
        enabled={soundEnabled}
        onToggle={toggleSound}
      />
      <SettingToggle
        label="Animations"
        description="Enable visual animations"
        enabled={animationsEnabled}
        onToggle={toggleAnimations}
      />
      <SettingToggle
        label="Performance Mode"
        description="Reduce effects for better performance"
        enabled={performanceMode}
        onToggle={togglePerformanceMode}
      />
    </div>
  );
};

// 🎯 Helper Components
const StatCard = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="glass-effect rounded-xl p-4 flex items-center gap-4">
    <div className="text-3xl">{icon}</div>
    <div className="flex-1">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  </div>
);

const ShopItem = ({ name, cost, description, icon }: { name: string; cost: number; description: string; icon: string }) => (
  <button className="w-full glass-effect rounded-xl p-4 flex items-center gap-4 active-feedback">
    <div className="text-3xl">{icon}</div>
    <div className="flex-1 text-left">
      <div className="font-bold">{name}</div>
      <div className="text-sm text-gray-400">{description}</div>
    </div>
    <div className="text-right">
      <div className="text-sm text-gray-400">Cost</div>
      <div className="font-bold text-[#0BF7BC]">{cost}</div>
    </div>
  </button>
);

const SettingToggle = ({ 
  label, 
  description, 
  enabled, 
  onToggle 
}: { 
  label: string; 
  description: string; 
  enabled: boolean; 
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors active-feedback"
  >
    <div className="text-left">
      <div className="font-medium">{label}</div>
      <div className="text-sm text-gray-400">{description}</div>
    </div>
    <div className={cn(
      "w-12 h-6 rounded-full transition-colors relative",
      enabled ? "bg-[#0BF7BC]" : "bg-gray-600"
    )}>
      <div className={cn(
        "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
        enabled ? "right-1" : "left-1"
      )} />
    </div>
  </button>
);


