import { useState, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Edit2,
  Share2,
  Settings,
  Camera,
  Upload,
  X,
  Check,
  Star,
  Trophy,
  Crown,
  Flame,
  TrendingUp,
  Coins,
  Award
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useProfile } from '../../hooks/useProfile';
import { useShopStore } from '../../store/shop';
import { useDropsStore } from '../../store/drops';
import { useAchievementStore } from '../../store/achievementStore';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { useIsVip } from '../../hooks/useIsVip';
import { springConfigs } from '../../utils/springConfigs';

interface ProfileHeaderProps {
  onEditClick?: () => void;
  onShareClick?: () => void;
  onSettingsClick?: () => void;
}

export const ProfileHeader = memo(({
  onEditClick,
  onShareClick,
  onSettingsClick,
}: ProfileHeaderProps) => {
  const { profile, isLoading } = useProfile();
  const coinsBalance = useShopStore((state) => state.coinsBalance);
  const drops = useDropsStore((state: any) => state.drops);
  const achievements = useAchievementStore((state: any) => state.achievements);
  const invite = useShopStore((state) => state.invite);
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const { userRank } = useIsVip();
  
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = useCallback(() => {
    triggerHaptic('light');
    if (isMobile) {
      fileInputRef.current?.click();
    } else {
      setIsEditingAvatar(true);
    }
  }, [isMobile, triggerHaptic]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setIsEditingAvatar(true);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSaveAvatar = useCallback(async () => {
    // TODO: Implement avatar upload API call
    triggerHaptic('success');
    setIsEditingAvatar(false);
    setAvatarPreview(null);
  }, [triggerHaptic]);

  const handleCancelAvatar = useCallback(() => {
    triggerHaptic('light');
    setIsEditingAvatar(false);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [triggerHaptic]);

  // Calculate stats
  const stats = {
    drops: drops?.length || 0,
    achievements: achievements?.length || 0,
    referrals: invite?.referrals || 0,
    streak: 7, // TODO: Get from profile data
  };

  const displayName = profile?.name || 'Unbekannter User';
  const username = profile?.username || 'username';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-32 bg-white/10 rounded" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfigs.smooth}
    >
      {/* Main Profile Section */}
      <div className="flex items-start gap-4 mb-6">
        {/* Avatar */}
        <div className="relative group">
          <motion.button
            onClick={handleAvatarClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full",
              "bg-gradient-to-br from-accent via-purple-500 to-cyan-400",
              "flex items-center justify-center text-2xl sm:text-3xl font-bold text-black",
              "shadow-lg shadow-purple-500/50",
              "overflow-hidden",
              "cursor-pointer"
            )}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{avatarInitial}</span>
            )}
            
            {/* Edit overlay */}
            <motion.div
              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              initial={false}
            >
              <Camera className="w-6 h-6 text-white" />
            </motion.div>
          </motion.button>

          {/* VIP Badge */}
          {userRank && userRank !== 'Standard' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -bottom-1 -right-1",
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full",
                "bg-gradient-to-br from-yellow-400 to-orange-500",
                "flex items-center justify-center",
                "shadow-lg shadow-yellow-500/50",
                "border-2 border-black"
              )}
            >
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
            </motion.div>
          )}

          {/* Streak Indicator */}
          {stats.streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -top-1 -left-1",
                "px-2 py-0.5 rounded-full",
                "bg-gradient-to-r from-orange-500 to-red-500",
                "text-xs font-bold text-white",
                "flex items-center gap-1",
                "shadow-lg"
              )}
            >
              <Flame className="w-3 h-3" />
              <span>{stats.streak}</span>
            </motion.div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                {displayName}
              </h2>
              <p className="text-sm text-gray-400 truncate">@{username}</p>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {onEditClick && (
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    onEditClick();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "p-2 rounded-xl bg-white/5 border border-white/10",
                    "hover:bg-white/10 transition-colors",
                    "touch-target"
                  )}
                  aria-label="Profil bearbeiten"
                >
                  <Edit2 className="w-4 h-4 text-white" />
                </motion.button>
              )}
              {onShareClick && (
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    onShareClick();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "p-2 rounded-xl bg-white/5 border border-white/10",
                    "hover:bg-white/10 transition-colors",
                    "touch-target"
                  )}
                  aria-label="Profil teilen"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </motion.button>
              )}
              {onSettingsClick && (
                <motion.button
                  onClick={() => {
                    triggerHaptic('light');
                    onSettingsClick();
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "p-2 rounded-xl bg-white/5 border border-white/10",
                    "hover:bg-white/10 transition-colors",
                    "touch-target"
                  )}
                  aria-label="Einstellungen"
                >
                  <Settings className="w-4 h-4 text-white" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">{coinsBalance} Coins</span>
            </div>
            {userRank && (
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">{userRank}</span>
              </div>
            )}
            {stats.streak > 0 && (
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-white">{stats.streak} Tage Streak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <motion.div
          className={cn(
            "bg-white/5 rounded-2xl p-3 sm:p-4 text-center border border-white/10",
            "hover:bg-white/10 transition-colors"
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="text-xl sm:text-2xl font-bold text-accent mb-1">
            {stats.drops}
          </div>
          <div className="text-xs text-gray-400">Drops</div>
        </motion.div>
        <motion.div
          className={cn(
            "bg-white/5 rounded-2xl p-3 sm:p-4 text-center border border-white/10",
            "hover:bg-white/10 transition-colors"
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="text-xl sm:text-2xl font-bold text-green-400 mb-1">
            {stats.achievements}
          </div>
          <div className="text-xs text-gray-400">Achievements</div>
        </motion.div>
        <motion.div
          className={cn(
            "bg-white/5 rounded-2xl p-3 sm:p-4 text-center border border-white/10",
            "hover:bg-white/10 transition-colors"
          )}
          whileHover={{ scale: 1.02, y: -2 }}
          transition={springConfigs.gentle}
        >
          <div className="text-xl sm:text-2xl font-bold text-blue-400 mb-1">
            {stats.referrals}
          </div>
          <div className="text-xs text-gray-400">Referrals</div>
        </motion.div>
      </div>

      {/* Avatar Edit Modal */}
      <AnimatePresence>
        {isEditingAvatar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelAvatar}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
                "bg-slate-900 rounded-2xl border border-white/10 p-6",
                "w-full max-w-md mx-4"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Avatar ändern</h3>
                <button
                  onClick={handleCancelAvatar}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent to-cyan-400 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-black">{avatarInitial}</span>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <div className="flex gap-3 w-full">
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2",
                      "px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20",
                      "text-white font-medium transition-colors"
                    )}
                  >
                    <Upload className="w-5 h-5" />
                    Bild auswählen
                  </motion.button>
                  {avatarPreview && (
                    <motion.button
                      onClick={handleSaveAvatar}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex items-center justify-center gap-2",
                        "px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600",
                        "text-white font-medium hover:from-purple-500 hover:to-blue-500",
                        "transition-all"
                      )}
                    >
                      <Check className="w-5 h-5" />
                      Speichern
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';

