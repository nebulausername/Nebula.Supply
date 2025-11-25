import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCookieStore } from '../store/cookieStore';
import { useGameLoop } from '../hooks/useGameLoop';
import { StatsBar } from '../components/UI/StatsBar';
import { CookieButton } from '../components/Cookie/CookieButton';
import { FloatingNumber } from '../components/Cookie/FloatingNumber';
import { ShopPanel } from '../components/shop/ShopPanel';
import { useBotCommandHandler } from '../utils/botCommandHandler';

// 🎮 Cookie Clicker V2 – Mobile-first, performant, sexy
export const CookieClickerV2 = () => {
  const { touchEffects } = useCookieStore();
  const [isShopOpen, setIsShopOpen] = useState(false);
  const { executeCommand } = useBotCommandHandler();

  // Check for bot commands in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const command = urlParams.get('command');
    if (command) {
      const result = executeCommand(command);
      if (result.success) {
        console.log('Bot command executed:', result.message);
      }
    }
  }, [executeCommand]);

  // Start passive generation loop
  useGameLoop();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-[#0A0A0A] to-[#050505] text-white">
      {/* Top stats overlay */}
      <StatsBar />

      {/* Main area */}
      <div className="container mx-auto flex flex-col items-center px-4 pt-20 pb-28">
        <CookieButton />
      </div>

      {/* Floating +X numbers */}
      {touchEffects.map((effect) => (
        <FloatingNumber key={effect.id} effect={effect} />
      ))}

      {/* Shop FAB */}
      <button
        onClick={() => setIsShopOpen(true)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-2xl transition-all hover:scale-110 active:scale-95 touch-target"
        aria-label="Shop öffnen"
      >
        <ShoppingBag className="h-6 w-6" />
      </button>

      {/* Bottom Sheet Shop */}
      <ShopPanel isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} />

      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.25),transparent_70%)]" />
    </div>
  );
};
