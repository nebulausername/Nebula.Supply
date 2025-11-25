import { memo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Rocket, ShoppingBag, Users, Command } from "lucide-react";
import { BottomSheet } from "../../components/mobile/BottomSheet";
import { CommandPalette, useCommandPalette } from "../../components/CommandPalette";

export const QuickActionsFAB = memo(({
  isMobile,
  onQuickActionsClick
}: {
  isMobile: boolean;
  onQuickActionsClick?: () => void;
}) => {
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const commandPalette = useCommandPalette();

  // Desktop: Show Command Palette button
  if (!isMobile) {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={commandPalette.open}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-accent to-purple-500 shadow-2xl flex items-center justify-center group"
          aria-label="Command Palette öffnen (Cmd+K)"
        >
          <Command className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-black/80 text-xs text-white border border-white/20">
            ⌘K
          </div>
        </motion.button>
        <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
      </>
    );
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (onQuickActionsClick) {
            onQuickActionsClick();
          } else {
            setShowQuickActions(true);
          }
        }}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-accent to-emerald-400 shadow-2xl flex items-center justify-center touch-target"
        style={{ boxShadow: '0 0 30px rgba(11, 247, 188, 0.5)' }}
      >
        <Zap className="h-6 w-6 text-black" />
      </motion.button>

      {!onQuickActionsClick && (
        <BottomSheet isOpen={showQuickActions} onClose={() => setShowQuickActions(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-text mb-4">⚡ Quick Actions</h3>
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigate('/drops');
                setShowQuickActions(false);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-accent/20 to-emerald-400/20 border border-accent/30 text-left transition-all hover:scale-105"
            >
              <Rocket className="h-5 w-5 text-accent" />
              <div>
                <p className="font-semibold text-text">Neue Drops checken</p>
                <p className="text-xs text-muted">Live Releases & Limited Drops</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigate('/shop');
                setShowQuickActions(false);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-left transition-all hover:bg-white/10"
            >
              <ShoppingBag className="h-5 w-5 text-blue-400" />
              <div>
                <p className="font-semibold text-text">Shop durchstöbern</p>
                <p className="text-xs text-muted">Alle Produkte & Kategorien</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigate('/profile');
                setShowQuickActions(false);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-left transition-all hover:bg-white/10"
            >
              <Users className="h-5 w-5 text-purple-400" />
              <div>
                <p className="font-semibold text-text">Mein Profil</p>
                <p className="text-xs text-muted">Stats, Coins & Invites</p>
              </div>
            </motion.button>
          </div>
        </div>
      </BottomSheet>
      )}
    </>
  );
});
