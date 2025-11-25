import { useState } from "react";
import { Trophy, Award } from "lucide-react";
import { useAchievements } from "../../hooks/useAchievements";
import { AchievementGrid } from "../Achievements/AchievementGrid";
import { AchievementPopup } from "../Achievements/AchievementPopup";

// Mock game state for demonstration
const mockGameState = {
  totalCookiesBaked: 150000,
  totalClicks: 5000,
  totalPlayTime: 7200, // 2 hours in seconds
  buildings: {
    farm: { count: 8 }
  },
  achievements: []
};

const CookieAchievements = () => {
  const [showAchievements, setShowAchievements] = useState(false);
  const [popupAchievement, setPopupAchievement] = useState<string | null>(null);

  const achievements = useAchievements(mockGameState);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Erfolge</h1>
              <p className="text-slate-400">
                {achievements.unlockedCount} / {achievements.totalCount} freigeschaltet
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors"
          >
            <Award className="h-5 w-5" />
            {showAchievements ? 'Liste ausblenden' : 'Liste anzeigen'}
          </button>
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-green-400">{achievements.unlockedCount}</div>
            <div className="text-sm text-slate-400">Freigeschaltet</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-yellow-400">
              {achievements.totalCount - achievements.unlockedCount}
            </div>
            <div className="text-sm text-slate-400">Verbleibend</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-blue-400">
              {achievements.getAchievementsByCategory('building').filter((a: any) => a.unlocked).length}
            </div>
            <div className="text-sm text-slate-400">Gebäude</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-purple-400">
              {achievements.getAchievementsByCategory('special').filter((a: any) => a.unlocked).length}
            </div>
            <div className="text-sm text-slate-400">Spezial</div>
          </div>
        </div>

        {/* Achievement Grid */}
        {showAchievements && (
          <AchievementGrid />
        )}

        {/* Achievement Popup */}
        <AchievementPopup
          achievementId={popupAchievement}
          onClose={() => setPopupAchievement(null)}
        />

        {/* Demo Controls */}
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-3">Demo-Steuerung</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPopupAchievement('baker-1')}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
            >
              Bäcker-Erfolg auslösen
            </button>
            <button
              onClick={() => setPopupAchievement('building-cursor-1')}
              className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors"
            >
              Cursor-Erfolg auslösen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieAchievements;
