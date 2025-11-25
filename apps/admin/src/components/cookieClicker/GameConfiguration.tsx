import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Zap, Calendar, FlaskConical, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface GameBalance {
  cookiesPerClick: number;
  baseCPS: number;
  buildingCostMultiplier: number;
  upgradeCostMultiplier: number;
  xpGainMultiplier: number;
}

interface GameEvent {
  id: string;
  name: string;
  type: 'double_cookies' | 'double_cps' | 'half_cost' | 'bonus_xp';
  startDate: string;
  endDate: string;
  active: boolean;
  multiplier: number;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

// 🚀 Game Configuration - Dynamic Balancing, Events, A/B Testing, Feature Flags
export const GameConfiguration = () => {
  // 🎯 Dynamic Balancing
  const [balance, setBalance] = useState<GameBalance>({
    cookiesPerClick: 1,
    baseCPS: 1,
    buildingCostMultiplier: 1.2,
    upgradeCostMultiplier: 1.5,
    xpGainMultiplier: 1.0
  });

  // 🎯 Event Management
  const [events, setEvents] = useState<GameEvent[]>([
    {
      id: '1',
      name: 'Double Cookie Day',
      type: 'double_cookies',
      startDate: '2024-12-25',
      endDate: '2024-12-26',
      active: false,
      multiplier: 2.0
    }
  ]);
  const [showEventModal, setShowEventModal] = useState(false);

  // 🎯 Feature Flags
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([
    { id: '1', name: 'VIP Passive Income', description: 'Enable VIP offline progress', enabled: true },
    { id: '2', name: 'Golden Cookies', description: 'Enable golden cookie spawns', enabled: true },
    { id: '3', name: 'Achievement System', description: 'Enable achievement unlocks', enabled: true },
    { id: '4', name: 'Prestige System', description: 'Enable prestige mechanics', enabled: true }
  ]);

  // 🎯 A/B Testing
  const [abTests, setAbTests] = useState<Array<{
    id: string;
    name: string;
    variantA: GameBalance;
    variantB: GameBalance;
    active: boolean;
    split: number; // Percentage for variant A
  }>>([]);

  const saveBalance = async () => {
    // TODO: API call to save balance
    alert('Game balance saved!');
  };

  const toggleFeatureFlag = (id: string) => {
    setFeatureFlags(prev => prev.map(flag =>
      flag.id === id ? { ...flag, enabled: !flag.enabled } : flag
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Game Configuration</h2>
          <p className="text-gray-400">Dynamic balancing, events, and feature flags</p>
        </div>
      </div>

      {/* 🎯 Dynamic Balancing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-400" />
          Dynamic Balancing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Cookies Per Click</label>
            <input
              type="number"
              value={balance.cookiesPerClick}
              onChange={(e) => setBalance({ ...balance, cookiesPerClick: parseFloat(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Base CPS</label>
            <input
              type="number"
              value={balance.baseCPS}
              onChange={(e) => setBalance({ ...balance, baseCPS: parseFloat(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Building Cost Multiplier</label>
            <input
              type="number"
              value={balance.buildingCostMultiplier}
              onChange={(e) => setBalance({ ...balance, buildingCostMultiplier: parseFloat(e.target.value) || 1.2 })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Upgrade Cost Multiplier</label>
            <input
              type="number"
              value={balance.upgradeCostMultiplier}
              onChange={(e) => setBalance({ ...balance, upgradeCostMultiplier: parseFloat(e.target.value) || 1.5 })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              step="0.1"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">XP Gain Multiplier</label>
            <input
              type="number"
              value={balance.xpGainMultiplier}
              onChange={(e) => setBalance({ ...balance, xpGainMultiplier: parseFloat(e.target.value) || 1.0 })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              step="0.1"
            />
          </div>
        </div>
        <button
          onClick={saveBalance}
          className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white transition-colors"
        >
          Save Balance Changes
        </button>
      </motion.div>

      {/* 🎯 Event Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Event Management
          </h3>
          <button
            onClick={() => setShowEventModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            New Event
          </button>
        </div>
        <div className="space-y-2">
          {events.map(event => (
            <div
              key={event.id}
              className={cn(
                "p-4 rounded-lg border flex items-center justify-between",
                event.active
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-slate-700/50 border-slate-600"
              )}
            >
              <div>
                <div className="font-semibold text-white">{event.name}</div>
                <div className="text-sm text-gray-400">
                  {event.type.replace('_', ' ')} - {event.multiplier}x multiplier
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                </div>
              </div>
              {event.active && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Active
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* 🎯 Feature Flags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ToggleRight className="w-5 h-5 text-blue-400" />
          Feature Flags
        </h3>
        <div className="space-y-3">
          {featureFlags.map(flag => (
            <div
              key={flag.id}
              className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-white">{flag.name}</div>
                <div className="text-sm text-gray-400">{flag.description}</div>
              </div>
              <button
                onClick={() => toggleFeatureFlag(flag.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                  flag.enabled
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-slate-600 hover:bg-slate-500 text-gray-300"
                )}
              >
                {flag.enabled ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    Disabled
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 🎯 A/B Testing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 bg-slate-800/50 rounded-xl border border-slate-700"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-yellow-400" />
          A/B Testing
        </h3>
        {abTests.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No active A/B tests
          </div>
        ) : (
          <div className="space-y-3">
            {abTests.map(test => (
              <div
                key={test.id}
                className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
              >
                <div className="font-semibold text-white mb-2">{test.name}</div>
                <div className="text-sm text-gray-400">
                  Split: {test.split}% Variant A, {100 - test.split}% Variant B
                </div>
                {test.active && (
                  <span className="mt-2 inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

