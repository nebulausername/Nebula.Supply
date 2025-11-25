import { useState } from "react";
import type { VipBenefit, VipTier } from "../../types/vip";

interface VipBenefitsCenterProps {
  benefits: VipBenefit[];
  currentTier: VipTier;
  className?: string;
}

const categoryIcons = {
  shopping: '🛒',
  support: '🎯',
  community: '👥',
  rewards: '🎁'
};

const categoryColors = {
  shopping: {
    bg: 'from-green-900/20 to-emerald-900/20',
    border: 'border-green-400/30',
    text: 'text-green-300',
    accent: 'bg-green-500'
  },
  support: {
    bg: 'from-blue-900/20 to-cyan-900/20',
    border: 'border-blue-400/30',
    text: 'text-blue-300',
    accent: 'bg-blue-500'
  },
  community: {
    bg: 'from-purple-900/20 to-pink-900/20',
    border: 'border-purple-400/30',
    text: 'text-purple-300',
    accent: 'bg-purple-500'
  },
  rewards: {
    bg: 'from-orange-900/20 to-red-900/20',
    border: 'border-orange-400/30',
    text: 'text-orange-300',
    accent: 'bg-orange-500'
  }
};

export const VipBenefitsCenter = ({ benefits, currentTier, className = "" }: VipBenefitsCenterProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBenefit, setSelectedBenefit] = useState<VipBenefit | null>(null);

  // Group benefits by category
  const benefitsByCategory = benefits.reduce((acc, benefit) => {
    if (!acc[benefit.category]) {
      acc[benefit.category] = [];
    }
    acc[benefit.category].push(benefit);
    return acc;
  }, {} as Record<string, VipBenefit[]>);

  const categories = [
    { id: 'all', name: 'Alle Benefits', icon: '✨', count: benefits.length },
    { id: 'shopping', name: 'Shopping', icon: '🛒', count: benefitsByCategory.shopping?.length || 0 },
    { id: 'support', name: 'Support', icon: '🎯', count: benefitsByCategory.support?.length || 0 },
    { id: 'community', name: 'Community', icon: '👥', count: benefitsByCategory.community?.length || 0 },
    { id: 'rewards', name: 'Rewards', icon: '🎁', count: benefitsByCategory.rewards?.length || 0 }
  ];

  const filteredBenefits = selectedCategory === 'all'
    ? benefits
    : benefits.filter(benefit => benefit.category === selectedCategory);

  const handleUseBenefit = (benefit: VipBenefit) => {
    if (benefit.available > 0) {
      // In a real implementation, this would call the store action
      console.log(`Using benefit: ${benefit.title}`);
      setSelectedBenefit(null);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          VIP Benefits Center
        </h2>
        <p className="text-purple-300">
          Verwalte deine exklusiven VIP-Vorteile und löse sie ein
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2
              ${selectedCategory === category.id
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-black/20 text-purple-300 hover:text-white hover:bg-purple-600/20 border border-purple-400/20'
              }
            `}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              selectedCategory === category.id
                ? 'bg-white/20 text-white'
                : 'bg-purple-500/20 text-purple-300'
            }`}>
              {category.count}
            </span>
          </button>
        ))}
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBenefits.map(benefit => {
          const categoryColor = categoryColors[benefit.category as keyof typeof categoryColors];
          const isAvailable = benefit.available > 0;
          const usagePercentage = benefit.maxPerMonth
            ? ((benefit.maxPerMonth - benefit.available) / benefit.maxPerMonth) * 100
            : 0;

          return (
            <div
              key={benefit.id}
              className={`group cursor-pointer transition-all duration-300 ${
                isAvailable ? 'hover:scale-105' : 'opacity-60'
              }`}
              onClick={() => setSelectedBenefit(benefit)}
            >
              <div className={`
                relative p-6 rounded-2xl border-2 backdrop-blur-xl h-full
                ${categoryColor.bg} ${categoryColor.border}
                ${isAvailable ? 'hover:shadow-lg hover:shadow-purple-500/20' : ''}
              `}>
                {/* Benefit Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-3xl ${categoryColor.text}`}>
                    {benefit.icon}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    benefit.tier === 'Galaxy' ? 'bg-yellow-500/20 text-yellow-400' :
                    benefit.tier === 'Supernova' ? 'bg-orange-500/20 text-orange-400' :
                    benefit.tier === 'Nova' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {benefit.tier} VIP
                  </div>
                </div>

                {/* Benefit Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className={`${categoryColor.text} text-sm mb-4`}>
                    {benefit.description}
                  </p>
                </div>

                {/* Usage Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`${categoryColor.text} text-sm`}>
                      Verfügbar
                    </span>
                    <span className="text-white font-semibold">
                      {benefit.available} / {benefit.maxPerMonth || '∞'}
                    </span>
                  </div>

                  {/* Usage Progress Bar */}
                  {benefit.maxPerMonth && (
                    <div className="w-full bg-black/30 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          usagePercentage > 80 ? 'bg-red-400' :
                          usagePercentage > 50 ? 'bg-yellow-400' :
                          'bg-green-400'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Usage Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isAvailable ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <span className={`text-sm ${
                      isAvailable ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {isAvailable ? 'Verfügbar' : 'Aufgebraucht'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  disabled={!isAvailable}
                  className={`
                    w-full mt-4 py-3 px-4 rounded-xl font-semibold transition-all duration-300
                    ${isAvailable
                      ? `${categoryColor.accent} text-white hover:scale-105`
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {isAvailable ? 'Einlösen' : 'Nicht verfügbar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Benefit Usage Modal/Overlay */}
      {selectedBenefit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-black/80 to-purple-900/40 backdrop-blur-xl rounded-2xl p-8 border border-purple-400/30 max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">
                {selectedBenefit.icon}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                {selectedBenefit.title}
              </h3>

              <p className="text-purple-300 mb-6">
                {selectedBenefit.description}
              </p>

              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-300">Verfügbar</span>
                  <span className="text-white font-semibold">
                    {selectedBenefit.available} verbleibend
                  </span>
                </div>

                {selectedBenefit.maxPerMonth && (
                  <div className="text-sm text-purple-400">
                    Max. {selectedBenefit.maxPerMonth} pro Monat
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleUseBenefit(selectedBenefit)}
                  disabled={selectedBenefit.available === 0}
                  className={`
                    flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300
                    ${selectedBenefit.available > 0
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:scale-105'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {selectedBenefit.available > 0 ? 'Jetzt einlösen' : 'Nicht verfügbar'}
                </button>

                <button
                  onClick={() => setSelectedBenefit(null)}
                  className="px-6 py-3 bg-black/30 hover:bg-black/50 text-purple-300 hover:text-white rounded-xl transition-all duration-300 border border-purple-400/30"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 border border-green-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-white mb-1">
              {benefits.filter(b => b.available > 0).length}
            </div>
            <div className="text-green-300 text-sm">
              Verfügbare Benefits
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-white mb-1">
              {benefits.reduce((sum, b) => sum + b.used, 0)}
            </div>
            <div className="text-blue-300 text-sm">
              Diesen Monat genutzt
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/30">
          <div className="text-center">
            <div className="text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold text-white mb-1">
              {currentTier}
            </div>
            <div className="text-purple-300 text-sm">
              Aktueller VIP-Status
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




