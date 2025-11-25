import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { motion, useAnimation, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { CheckCircle, Copy, QrCode, Share2, Edit2, Sparkles, Download, X } from "lucide-react";
import { InviteCodeEditor } from "../../components/InviteCodeEditor";

interface UltraInviteCardProps {
  invite: any;
  coinsBalance: number;
  onShare: () => void;
  onCopy: () => void;
  reducedMotion: boolean;
}

export const UltraInviteCard = memo(({ invite, coinsBalance, onShare, onCopy, reducedMotion }: UltraInviteCardProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const controls = useAnimation();
  const cardRef = useRef<HTMLDivElement>(null);
  const resetTimerRef = useRef<number | null>(null);
  
  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0));
  const rotateY = useSpring(useMotionValue(0));
  
  // Use personal invite code if available, otherwise fallback to inviteCode
  const displayCode = invite?.personalInviteCode || invite?.inviteCode || 'LOADING';
  const canEdit = invite?.rank === 'VIP' || invite?.rank === 'Stammkunde';
  
  // Generate QR Code URL
  const inviteUrl = useMemo(() => {
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'NebulaOrderBot';
    return `https://t.me/${botUsername.toLowerCase()}?start=${displayCode}`;
  }, [displayCode]);
  
  const qrCodeUrl = useMemo(() => 
    `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(inviteUrl)}&bgcolor=ffffff&color=000000&margin=1`,
    [inviteUrl]
  );
  
  const handleDownloadQR = useCallback(() => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `nebula-invite-${displayCode}.png`;
    link.click();
  }, [qrCodeUrl, displayCode]);

  const handleCopy = useCallback(async () => {
    await onCopy();
    setCopied(true);
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, 2000);
  }, [onCopy]);

  const handleShare = useCallback(() => {
    onShare();
  }, [onShare]);

  useEffect(() => () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
  }, []);

  // Pulsierende Animation fuer aktive Einladungen
  useEffect(() => {
    if (invite?.hasInvite && !reducedMotion) {
      controls.start({
        scale: [1, 1.02, 1],
        transition: { duration: 2, repeat: Infinity }
      });
    }
  }, [invite?.hasInvite, controls, reducedMotion]);

  // 3D Tilt Handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const rotateXValue = (e.clientY - centerY) / 10;
    const rotateYValue = (centerX - e.clientX) / 10;
    
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  }, [reducedMotion, rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  // Real-time updates for personal invite code
  useEffect(() => {
    if (!invite?.personalInviteCode && invite?.hasInvite) {
      // Could trigger a refresh here if needed
    }
  }, [invite?.personalInviteCode, invite?.hasInvite]);

  return (
    <>
      <motion.div
        ref={cardRef}
        animate={controls}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl transition-shadow hover:shadow-2xl hover:shadow-accent/20"
      >
      {/* Hintergrund-Effekte */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-purple-500/10" />
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-accent/20 blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-purple-500/20 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative z-10 p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <motion.h3
              className="gradient-text mb-2 text-2xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Dein Invite-System
            </motion.h3>
            <p className="text-muted">Baue dein Team auf und verdiene Belohnungen</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-green-400"
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-sm font-medium">Live</span>
          </motion.div>
        </div>

        <div className="mb-8">
          <AnimatePresence mode="wait">
            {invite?.hasInvite ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-2xl border border-green-500/20 bg-green-500/10 p-6 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"
                >
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </motion.div>
                <h4 className="mb-2 text-xl font-bold text-green-400">Invite aktiv</h4>
                <p className="mb-4 text-sm text-muted">Dein Code ist bereit zum Teilen.</p>
                <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {invite?.personalInviteCode && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 rounded-full bg-gradient-to-r from-accent/20 to-purple-500/20 px-2 py-1 border border-accent/30"
                      >
                        <Sparkles className="h-3 w-3 text-accent" />
                        <span className="text-xs font-semibold text-accent">Personal</span>
                      </motion.div>
                    )}
                    <span className="font-mono text-2xl font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                      {displayCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopy}
                      className={`rounded-lg p-2 transition-colors ${
                        copied ? "bg-green-500/20 text-green-400" : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </motion.button>
                    {canEdit && (
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowEditor(true)}
                        className="rounded-lg p-2 bg-gradient-to-r from-accent/20 to-purple-500/20 hover:from-accent/30 hover:to-purple-500/30 border border-accent/30 transition-all"
                        title="Code bearbeiten"
                      >
                        <Edit2 className="h-4 w-4 text-accent" />
                      </motion.button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted">
                  Rang {invite?.rank || '-'} / {invite?.availableInvites || 0} Einladungen verfügbar
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="inactive"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-6 text-center"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20"
                >
                  <QrCode className="h-8 w-8 text-orange-400" />
                </motion.div>
                <h4 className="mb-2 text-xl font-bold text-orange-400">Invite aktivieren</h4>
                <p className="mb-4 text-sm text-muted">Verbinde dich mit dem Telegram Bot fuer vollen Zugang.</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-full bg-accent px-6 py-3 font-semibold text-black"
                  onClick={() => window.open("https://t.me/nebulabot", "_blank")}
                >
                  Bot starten
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/20 p-4 transition-all hover:bg-accent/30"
          >
            <Share2 className="h-5 w-5 text-accent" />
            <span className="font-medium">Teilen</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQR((value) => !value)}
            className="flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/20 p-4 transition-all hover:bg-purple-500/30"
          >
            <QrCode className="h-5 w-5 text-purple-400" />
            <span className="font-medium">QR</span>
          </motion.button>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-muted">
          <div className="flex items-center justify-between">
            <span>Coins</span>
            <span className="font-semibold text-text">{coinsBalance.toLocaleString('de-DE')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Geteilte Invites</span>
            <span className="font-semibold text-text">{invite?.totalReferrals ?? 0}</span>
          </div>
        </div>

        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={() => setShowQR(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="w-full max-w-sm rounded-2xl bg-black/80 p-8"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">QR Code teilen</h3>
                  <button
                    onClick={() => setShowQR(false)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    aria-label="Schließen"
                  >
                    <X className="h-5 w-5 text-muted" />
                  </button>
                </div>
                <div className="mx-auto mb-4 w-fit rounded-xl bg-white p-4">
                  <img 
                    src={qrCodeUrl} 
                    alt="Invite QR Code" 
                    className="w-48 h-48"
                    onError={(e) => {
                      // Fallback to icon if QR fails to load
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="hidden h-48 w-48 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-purple-500">
                    <QrCode className="h-16 w-16 text-white" />
                  </div>
                </div>
                <p className="text-center text-sm text-muted mb-4">
                  Scanne den Code oder teile den Link direkt.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadQR}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 border border-accent/30 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm font-medium">Download</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Teilen</span>
                  </motion.button>
                </div>
                <p className="text-center text-xs text-muted mt-4 font-mono">
                  {displayCode}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>

    {/* Invite Code Editor Modal */}
    <InviteCodeEditor
      isOpen={showEditor}
      onClose={() => setShowEditor(false)}
      currentCode={displayCode}
      userRank={invite?.rank || ''}
    />
    </>
  );
});
