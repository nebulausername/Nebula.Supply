import { useState } from "react";
import type { VipTier } from "../../types/vip";

interface TierInfo {
  tier: VipTier;
  name: string;
  description: string;
  icon: string;
  color: string;
  benefits: string[];
  requirements: {
    minInvites: number;
    minPurchases: number;
    minScore: number;
  };
  isUnlocked: boolean;
  isCurrent: boolean;
}

const tierData: TierInfo[] = [
  {
    tier: "Comet",
    name: "Comet",
    description: "Dein Einstieg in die VIP-Welt",
    icon: "🌟",
    color: "blue",
    benefits: [
      "Priority Support",
      "Early Access zu limitierten Drops",
      "VIP Badge in Community"
    ],
    requirements: {
      minInvites: 3,
      minPurchases: 1,
      minScore: 500
    },
    isUnlocked: true,
    isCurrent: false
  },
  {
    tier: "Nova",
    name: "Nova",
    description: "Erleuchte deine Community-Präsenz",
    icon: "💫",
    color: "purple",
    benefits: [
      "Alle Comet-Benefits",
      "Exklusive VIP-Drops",
      "Community-Spotlight-Möglichkeiten",
      "Beta-Feature-Zugang"
    ],
    requirements: {
      minInvites: 8,
      minPurchases: 3,
      minScore: 1500
    },
    isUnlocked: true,
    isCurrent: true
  },
  {
    tier: "Supernova",
    name: "Supernova",
    description: "Explodiere in der VIP-Elite",
    icon: "✨",
    color: "orange",
    benefits: [
      "Alle Nova-Benefits",
      "Persönlicher Shopping-Assistent",
      "VIP-Event-Einladungen",
      "Exklusive Preisnachlässe",
      "Custom Product Requests"
    ],
    requirements: {
      minInvites: 15,
      minPurchases: 8,
      minScore: 3000
    },
    isUnlocked: false,
    isCurrent: false
  },
  {
    tier: "Galaxy",
    name: "Galaxy",
    description: "Erreiche die höchste VIP-Ebene",
    icon: "🌌",
    color: "yellow",
    benefits: [
      "Alle Supernova-Benefits",
      "Brand Ambassador Status",
      "VIP Concierge Service",
      "Exclusive Meet & Greets",
      "Lifetime VIP Benefits",
      "Custom Product Development"
    ],
    requirements: {
      minInvites: 25,
      minPurchases: 15,
      minScore: 5000
    },
    isUnlocked: false,
    isCurrent: false
  }
];

const colorClasses = {
  blue: {
    bg: "from-blue-900/20 to-cyan-900/20",
    border: "border-blue-400/30",
    glow: "shadow-blue-500/20",
    text: "text-blue-300",
    accent: "bg-blue-500"
  },
  purple: {
    bg: "from-purple-900/20 to-pink-900/20",
    border: "border-purple-400/30",
    glow: "shadow-purple-500/20",
    text: "text-purple-300",
    accent: "bg-purple-500"
  },
  orange: {
    bg: "from-orange-900/20 to-red-900/20",
    border: "border-orange-400/30",
    glow: "shadow-orange-500/20",
    text: "text-orange-300",
    accent: "bg-orange-500"
  },
  yellow: {
    bg: "from-yellow-900/20 to-amber-900/20",
    border: "border-yellow-400/30",
    glow: "shadow-yellow-500/20",
    text: "text-yellow-300",
    accent: "bg-yellow-500"
  }
};

interface VipTiersShowcaseProps {
  currentTier: VipTier;
  className?: string;
}

export const VipTiersShowcase = ({ currentTier, className = "" }: VipTiersShowcaseProps) => {
  const [hoveredTier, setHoveredTier] = useState<VipTier | null>(null);
  const [expandedTier, setExpandedTier] = useState<VipTier | null>(null);

  const currentTierIndex = tierData.findIndex(t => t.tier === currentTier);

  return (
    <div className={`w-full ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          VIP Tier Übersicht
        </h2>
        <p className="text-purple-300">
          Entdecke die Vorteile jedes VIP-Levels und deinen Weg nach oben
        </p>
      </div>

      {/* Desktop Layout - Horizontal Timeline */}
      <div className="hidden lg:block">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-yellow-500/30 transform -translate-y-1/2" />

          {/* Tier Cards */}
          <div className="flex justify-between items-center relative z-10">
            {tierData.map((tierInfo, index) => {
              const colors = colorClasses[tierInfo.color as keyof typeof colorClasses];
              const isPast = index < currentTierIndex;
              const isCurrent = index === currentTierIndex;
              const isFuture = index > currentTierIndex;

              return (
                <div
                  key={tierInfo.tier}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    isCurrent ? 'scale-110' : 'hover:scale-105'
                  }`}
                  onMouseEnter={() => setHoveredTier(tierInfo.tier)}
                  onMouseLeave={() => setHoveredTier(null)}
                  onClick={() => setExpandedTier(expandedTier === tierInfo.tier ? null : tierInfo.tier)}
                >
                  {/* Tier Card */}
                  <div className={`
                    relative w-64 p-6 rounded-2xl border-2 backdrop-blur-xl transition-all duration-300
                    ${colors.bg} ${colors.border}
                    ${isCurrent ? `${colors.glow} border-4` : ''}
                    ${hoveredTier === tierInfo.tier ? 'scale-105' : ''}
                    ${isPast ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-60'}
                  `}>
                    {/* Status Indicator */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className={`
                        w-8 h-8 rounded-full ${colors.accent} flex items-center justify-center text-white text-sm font-bold
                        ${isCurrent ? 'animate-pulse' : ''}
                      `}>
                        {isPast ? '✓' : isCurrent ? tierInfo.icon : '🔒'}
                      </div>
                    </div>

                    {/* Tier Info */}
                    <div className="text-center mt-4">
                      <h3 className={`text-xl font-bold text-white mb-2 ${isCurrent ? 'animate-pulse' : ''}`}>
                        {tierInfo.name}
                      </h3>
                      <p className={`text-sm ${colors.text} mb-4`}>
                        {tierInfo.description}
                      </p>

                      {/* Requirements */}
                      <div className="space-y-1 text-xs text-center">
                        <div className={`${colors.text}`}>
                          {tierInfo.requirements.minInvites} Invites • {tierInfo.requirements.minPurchases} Käufe
                        </div>
                        <div className={`${colors.text}`}>
                          {tierInfo.requirements.minScore.toLocaleString('de-DE')} Punkte
                        </div>
                      </div>
                    </div>

                    {/* Expanded Benefits */}
                    {expandedTier === tierInfo.tier && (
                      <div className="mt-4 pt-4 border-t border-white/20">
                        <div className="space-y-2">
                          {tierInfo.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <div className={`w-2 h-2 ${colors.accent} rounded-full mt-2 flex-shrink-0`} />
                              <span className="text-white text-sm">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Layout - Vertical Cards */}
      <div className="lg:hidden space-y-6">
        {tierData.map((tierInfo, index) => {
          const colors = colorClasses[tierInfo.color as keyof typeof colorClasses];
          const isPast = index < currentTierIndex;
          const isCurrent = index === currentTierIndex;
          const isFuture = index > currentTierIndex;

          return (
            <div
              key={tierInfo.tier}
              className={`relative cursor-pointer transition-all duration-300 ${
                isCurrent ? 'scale-105' : 'hover:scale-102'
              }`}
              onClick={() => setExpandedTier(expandedTier === tierInfo.tier ? null : tierInfo.tier)}
            >
              <div className={`
                relative p-6 rounded-2xl border-2 backdrop-blur-xl
                ${colors.bg} ${colors.border}
                ${isCurrent ? `${colors.glow} border-4` : ''}
                ${isPast ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-60'}
              `}>
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`text-3xl ${isCurrent ? 'animate-pulse' : ''}`}>
                      {isPast ? '✓' : isCurrent ? tierInfo.icon : '🔒'}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold text-white ${isCurrent ? 'animate-pulse' : ''}`}>
                        {tierInfo.name}
                      </h3>
                      <p className={`text-sm ${colors.text}`}>
                        {tierInfo.description}
                      </p>
                    </div>
                  </div>

                  <div className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${isPast ? 'bg-green-500 text-white' :
                      isCurrent ? `${colors.accent} text-white animate-pulse` :
                      'bg-gray-600 text-gray-300'}
                  `}>
                    {isPast ? 'Erreicht' : isCurrent ? 'Aktuell' : 'Gesperrt'}
                  </div>
                </div>

                {/* Requirements */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className={`${colors.text} text-sm`}>Invites</div>
                    <div className="text-white font-semibold">
                      {tierInfo.requirements.minInvites}
                    </div>
                  </div>
                  <div>
                    <div className={`${colors.text} text-sm`}>Käufe</div>
                    <div className="text-white font-semibold">
                      {tierInfo.requirements.minPurchases}
                    </div>
                  </div>
                  <div>
                    <div className={`${colors.text} text-sm`}>Punkte</div>
                    <div className="text-white font-semibold">
                      {tierInfo.requirements.minScore.toLocaleString('de-DE')}
                    </div>
                  </div>
                </div>

                {/* Benefits Preview */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {tierInfo.benefits.slice(0, 2).map((benefit, idx) => (
                    <span key={idx} className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {benefit}
                    </span>
                  ))}
                  {tierInfo.benefits.length > 2 && (
                    <span className={`text-xs px-2 py-1 rounded-full bg-black/20 text-gray-300`}>
                      +{tierInfo.benefits.length - 2} weitere
                    </span>
                  )}
                </div>

                {/* Expanded Benefits */}
                {expandedTier === tierInfo.tier && (
                  <div className="pt-4 border-t border-white/20">
                    <h4 className="text-white font-semibold mb-3">Alle Vorteile:</h4>
                    <div className="space-y-2">
                      {tierInfo.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <div className={`w-2 h-2 ${colors.accent} rounded-full mt-2 flex-shrink-0`} />
                          <span className="text-white text-sm">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};




