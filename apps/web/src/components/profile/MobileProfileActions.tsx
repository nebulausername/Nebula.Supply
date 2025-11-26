import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Share2,
  Settings,
  Camera,
  QrCode,
  Download,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { springConfigs } from '../../utils/springConfigs';
import { memo } from 'react';

interface MobileProfileActionsProps {
  onEdit?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onQRCode?: () => void;
  onDownload?: () => void;
}

export const MobileProfileActions = memo(({
  onEdit,
  onShare,
  onSettings,
  onQRCode,
  onDownload,
}: MobileProfileActionsProps) => {
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    triggerHaptic('light');
    setIsOpen((prev) => !prev);
  }, [triggerHaptic]);

  const handleAction = useCallback((action: () => void | undefined) => {
    if (action) {
      triggerHaptic('medium');
      action();
      setIsOpen(false);
    }
  }, [triggerHaptic]);

  if (!isMobile) return null;

  const actions = [
    { icon: Edit2, label: 'Bearbeiten', action: onEdit, color: 'from-blue-500 to-cyan-500' },
    { icon: Share2, label: 'Teilen', action: onShare, color: 'from-purple-500 to-pink-500' },
    { icon: Settings, label: 'Einstellungen', action: onSettings, color: 'from-gray-500 to-slate-500' },
    { icon: QrCode, label: 'QR-Code', action: onQRCode, color: 'from-green-500 to-emerald-500' },
    { icon: Download, label: 'Exportieren', action: onDownload, color: 'from-orange-500 to-red-500' },
  ].filter((item) => item.action);

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={toggleMenu}
        className={cn(
          "fixed bottom-24 right-4 z-40",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-r from-purple-600 to-blue-600",
          "shadow-lg shadow-purple-500/50",
          "flex items-center justify-center",
          "touch-target"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={false}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={springConfigs.smooth}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMenu}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            />

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={springConfigs.smooth}
              className="fixed bottom-32 right-4 z-40 space-y-3"
            >
              {actions.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    onClick={() => handleAction(item.action)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-2xl",
                      "bg-slate-900/95 backdrop-blur-xl border border-white/10",
                      "shadow-lg",
                      "touch-target",
                      "min-w-[160px]"
                    )}
                    whileHover={{ scale: 1.05, x: -4 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      `bg-gradient-to-r ${item.color}`
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium text-sm">{item.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

MobileProfileActions.displayName = 'MobileProfileActions';

