import { useState } from "react";
import type { VipTier } from "../../types/vip";

interface VipGalaxyFeaturesProps {
  currentTier: VipTier;
  className?: string;
}

interface GalaxyFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'available' | 'coming-soon' | 'locked';
  estimatedDate?: string;
  action?: {
    label: string;
    type: 'modal' | 'external' | 'navigate';
    target?: string;
  };
}

const galaxyFeatures: GalaxyFeature[] = [
  {
    id: 'concierge-service',
    title: 'Persönlicher Concierge',
    description: '24/7 persönlicher Shopping-Assistent für alle deine Bedürfnisse',
    icon: '🎯',
    status: 'available',
    action: {
      label: 'Concierge kontaktieren',
      type: 'modal',
      target: 'concierge-modal'
    }
  },
  {
    id: 'custom-products',
    title: 'Custom Product Development',
    description: 'Entwickle individuelle Produkte mit unserem Design-Team',
    icon: '⚡',
    status: 'available',
    action: {
      label: 'Produkt vorschlagen',
      type: 'modal',
      target: 'custom-product-modal'
    }
  },
  {
    id: 'vip-events',
    title: 'Exklusive VIP Events',
    description: 'Zugang zu virtuellen und physischen Premium-Veranstaltungen',
    icon: '🎉',
    status: 'coming-soon',
    estimatedDate: 'Q2 2024',
    action: {
      label: 'Event-Kalender',
      type: 'navigate',
      target: '/vip/events'
    }
  },
  {
    id: 'brand-ambassador',
    title: 'Brand Ambassador Programm',
    description: 'Werde offizieller Nebula-Markenbotschafter mit exklusiven Vorteilen',
    icon: '👑',
    status: 'coming-soon',
    estimatedDate: 'Q3 2024',
    action: {
      label: 'Bewerbung öffnen',
      type: 'external',
      target: 'https://nebula.supply/ambassador'
    }
  },
  {
    id: 'lifetime-vip',
    title: 'Lifetime VIP Status',
    description: 'Ewiger VIP-Status ohne monatliche Beiträge oder Aktivitätsanforderungen',
    icon: '♾️',
    status: 'coming-soon',
    estimatedDate: 'Q4 2024'
  },
  {
    id: 'vip-marketplace',
    title: 'VIP Marketplace',
    description: 'Exklusiver Marktplatz für VIP-zu-VIP-Handel und Services',
    icon: '🏪',
    status: 'coming-soon',
    estimatedDate: 'Q1 2025'
  }
];

const featureStatusColors = {
  'available': {
    bg: 'from-green-900/20 to-emerald-900/20',
    border: 'border-green-400/30',
    text: 'text-green-300',
    badge: 'bg-green-500 text-white'
  },
  'coming-soon': {
    bg: 'from-yellow-900/20 to-orange-900/20',
    border: 'border-yellow-400/30',
    text: 'text-yellow-300',
    badge: 'bg-yellow-500 text-black'
  },
  'locked': {
    bg: 'from-gray-900/20 to-gray-800/20',
    border: 'border-gray-400/30',
    text: 'text-gray-400',
    badge: 'bg-gray-500 text-white'
  }
};

export const VipGalaxyFeatures = ({ currentTier, className = "" }: VipGalaxyFeaturesProps) => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showConciergeModal, setShowConciergeModal] = useState(false);

  const handleFeatureAction = (feature: GalaxyFeature) => {
    if (feature.action) {
      switch (feature.action.type) {
        case 'modal':
          if (feature.action.target === 'concierge-modal') {
            setShowConciergeModal(true);
          }
          break;
        case 'navigate':
          if (feature.action.target) {
            window.location.href = feature.action.target;
          }
          break;
        case 'external':
          if (feature.action.target) {
            window.open(feature.action.target, '_blank');
          }
          break;
      }
    }
  };

  // Only show Galaxy features for Galaxy tier
  if (currentTier !== 'Galaxy') {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🌌</div>
        <h3 className="text-2xl font-bold text-white mb-4">
          Galaxy-Tier Features
        </h3>
        <p className="text-purple-300 mb-6 max-w-2xl mx-auto">
          Diese exklusiven Features sind nur für Galaxy-VIPs verfügbar.
          Steige zum höchsten VIP-Level auf, um Zugang zu erhalten.
        </p>
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-400/20 max-w-md mx-auto">
          <h4 className="text-lg font-semibold text-white mb-3">
            Dein aktueller Status: {currentTier}
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-300">Bis Galaxy:</span>
              <span className="text-white font-semibold">
                {currentTier === 'Comet' ? '3 Stufen' : currentTier === 'Nova' ? '2 Stufen' : '1 Stufe'}
              </span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-yellow-400 rounded-full transition-all duration-500"
                style={{
                  width: currentTier === 'Comet' ? '25%' : currentTier === 'Nova' ? '50%' : '75%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-8 ${className}`}>
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🌌</div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Galaxy-Tier Exklusiv-Features
          </h2>
          <p className="text-purple-300 max-w-3xl mx-auto text-lg">
            Als höchstes VIP-Mitglied hast du Zugang zu ultimativen Premium-Features,
            die speziell für Elite-Kunden entwickelt wurden.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galaxyFeatures.map((feature) => {
            const statusColors = featureStatusColors[feature.status];
            const isDisabled = feature.status === 'locked' || feature.status === 'coming-soon';

            return (
              <div
                key={feature.id}
                className={`
                  relative group cursor-pointer transition-all duration-300
                  ${isDisabled ? 'opacity-60' : 'hover:scale-105'}
                `}
                onClick={() => !isDisabled && handleFeatureAction(feature)}
              >
                <div className={`
                  relative p-6 rounded-2xl border-2 backdrop-blur-xl h-full
                  ${statusColors.bg} ${statusColors.border}
                  ${!isDisabled ? 'hover:shadow-lg hover:shadow-purple-500/20' : ''}
                `}>
                  {/* Status Badge */}
                  <div className="absolute -top-3 left-4">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors.badge}`}>
                      {feature.status === 'available' ? 'Verfügbar' :
                       feature.status === 'coming-soon' ? 'Bald verfügbar' : 'Gesperrt'}
                    </div>
                  </div>

                  {/* Feature Icon */}
                  <div className="text-4xl mb-4 text-center">
                    {feature.icon}
                  </div>

                  {/* Feature Info */}
                  <div className="text-center mb-6">
                    <h3 className={`text-xl font-bold text-white mb-2`}>
                      {feature.title}
                    </h3>
                    <p className={`${statusColors.text} text-sm mb-4`}>
                      {feature.description}
                    </p>

                    {feature.estimatedDate && (
                      <p className={`text-xs ${statusColors.text}`}>
                        Verfügbar ab {feature.estimatedDate}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
                  {feature.action && (
                    <button
                      disabled={isDisabled}
                      className={`
                        w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 text-center
                        ${isDisabled
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black hover:scale-105 shadow-lg'
                        }
                      `}
                    >
                      {feature.action.label}
                    </button>
                  )}

                  {/* Coming Soon Overlay */}
                  {feature.status === 'coming-soon' && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🚧</div>
                        <p className="text-yellow-300 font-semibold">Bald verfügbar</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Galaxy Member Stats */}
        <div className="bg-gradient-to-r from-yellow-900/20 to-amber-900/20 backdrop-blur-xl rounded-2xl p-8 border border-yellow-400/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl mb-2">👑</div>
              <div className="text-3xl font-bold text-white mb-2">Elite Status</div>
              <p className="text-yellow-300">
                Höchste VIP-Stufe erreicht
              </p>
            </div>

            <div>
              <div className="text-4xl mb-2">🎁</div>
              <div className="text-3xl font-bold text-white mb-2">Premium Perks</div>
              <p className="text-yellow-300">
                Alle Features freigeschaltet
              </p>
            </div>

            <div>
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-3xl font-bold text-white mb-2">Exklusiv-Zugang</div>
              <p className="text-yellow-300">
                Einmalige Erlebnisse warten
              </p>
            </div>
          </div>
        </div>

        {/* VIP Concierge Modal */}
        {showConciergeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl rounded-2xl p-8 border border-yellow-400/30 max-w-2xl w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>

                <h3 className="text-3xl font-bold text-white mb-4">
                  VIP Concierge Service
                </h3>

                <p className="text-yellow-300 mb-8 text-lg">
                  Dein persönlicher Shopping-Assistent steht rund um die Uhr zur Verfügung.
                  Stelle alle Fragen oder teile deine Wünsche mit.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="bg-black/30 rounded-xl p-4 text-left">
                    <h4 className="text-white font-semibold mb-2">Wie können wir helfen?</h4>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p>• Produktempfehlungen basierend auf deinen Vorlieben</p>
                      <p>• Individuelle Angebote und Bundle-Deals</p>
                      <p>• Priority-Support für alle Anfragen</p>
                      <p>• Exklusiver Zugang zu limitierten Releases</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105">
                    Concierge kontaktieren
                  </button>

                  <button
                    onClick={() => setShowConciergeModal(false)}
                    className="px-6 py-4 bg-black/30 hover:bg-black/50 text-yellow-300 hover:text-white rounded-xl transition-all duration-300 border border-yellow-400/30"
                  >
                    Später
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};




