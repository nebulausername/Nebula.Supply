import { useEffect, memo } from 'react';
import { demoUser } from "@nebula/shared";
import { TelegramLoginButton } from "./TelegramLoginButton";
import { useBotCommandHandler } from '../utils/botCommandHandler';
import { Rocket, Eye, ShoppingCart, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn';
import '../styles/landing.css';

// 🎯 Feature Card Component (Memoized)
const FeatureCard = memo(({ title, text, icon: Icon, index }: { title: string; text: string; icon: typeof Rocket; index: number }) => (
  <div 
    className="space-y-2 text-sm text-muted group transition-all duration-300 hover:translate-y-[-2px]"
    style={{
      animationDelay: `${index * 100}ms`,
      willChange: 'transform'
    }}
  >
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent/70 group-hover:text-accent transition-colors" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-wide text-accent/90 group-hover:text-accent transition-colors">
        {title}
      </p>
    </div>
    <p className="leading-relaxed">{text}</p>
  </div>
));
FeatureCard.displayName = 'FeatureCard';

// 🎯 Demo Login Card Component (Memoized)
const DemoLoginCard = memo(() => (
  <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-sm text-muted transition-all duration-300 hover:border-white/20">
    <p className="text-xs uppercase tracking-wide text-purple-400/80 mb-4">Demo Login (DEV)</p>
    <dl className="space-y-2">
      <div>
        <dt className="sr-only">Handle</dt>
        <dd>Handle: <span className="text-text font-medium">{demoUser.handle}</span></dd>
      </div>
      <div>
        <dt className="sr-only">Rank</dt>
        <dd>Rank: <span className="text-text font-medium">{demoUser.rank}</span></dd>
      </div>
      <div>
        <dt className="sr-only">Coins</dt>
        <dd>Coins: <span className="text-yellow-400 font-medium">{demoUser.coins}</span></dd>
      </div>
    </dl>
    <p className="mt-4 text-xs text-muted/70">In Production erfolgt die Auth via Bot-JWT.</p>
  </div>
));
DemoLoginCard.displayName = 'DemoLoginCard';

export const Landing = () => {
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

  const features = [
    {
      title: "Invite aktivieren",
      text: "Bot starten, Zugang claimen und Drop-Alerts sichern.",
      icon: Rocket
    },
    {
      title: "Drops beobachten",
      text: "Progress, Hype und Varianten laufen live mit deinem Profil.",
      icon: Eye
    },
    {
      title: "Checkout kontrollieren",
      text: "Coins einloesen, Versand fixen und Reminder sauber setzen.",
      icon: ShoppingCart
    }
  ];

  return (
  <div className="flex min-h-screen flex-col bg-gradient-to-b from-black via-[#06060A] to-[#050505] text-text landing-scrollbar cosmic-bg safe-area-top safe-area-bottom">
    <header className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center safe-area-left safe-area-right">
      <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-muted">
        <Sparkles className="h-4 w-4 text-accent/70" aria-hidden="true" />
        <span>Nebula Supply</span>
        <span>// Cosmic Drops</span>
        <Sparkles className="h-4 w-4 text-accent/70" aria-hidden="true" />
      </div>
      <h1 className="text-4xl font-semibold md:text-6xl lg:text-7xl bg-gradient-to-r from-white via-accent/90 to-white bg-clip-text text-transparent animate-shimmer leading-tight">
        Invite-only Drops,<br className="hidden md:block" /> gesteuert aus deinem Orbit
      </h1>
      <p className="max-w-2xl text-base md:text-lg text-muted leading-relaxed">
        Melde dich mit Telegram an, sichere Drops in Echtzeit und verwalte Coins sowie Versand direkt hier.
      </p>
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <TelegramLoginButton className="mt-4 w-full" />
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <span className="text-xs text-muted/70 uppercase tracking-wider">oder</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>
        <a
          href="tg://resolve?domain=NebulaOrderBot"
          className={cn(
            "group relative w-full rounded-full bg-gradient-to-r from-accent/20 via-accent/15 to-accent/10",
            "border border-accent/50 px-6 py-4 text-sm font-semibold text-accent",
            "transition-all duration-300 hover:from-accent/30 hover:via-accent/25 hover:to-accent/20",
            "hover:border-accent hover:shadow-lg hover:shadow-accent/25",
            "hover:scale-[1.02] active:scale-[0.98] tap-target",
            "focus-visible-ring overflow-hidden glow-effect"
          )}
          aria-label="Nebula Bot in Telegram öffnen"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>Nebula Bot öffnen</span>
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </a>
      </div>
    </header>

    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 pb-16 safe-area-left safe-area-right">
      <section 
        className="grid gap-6 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-sm p-6 md:grid-cols-3 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-accent/10"
        aria-label="Features"
      >
        {features.map((feature, index) => (
          <FeatureCard 
            key={feature.title} 
            title={feature.title}
            text={feature.text}
            icon={feature.icon}
            index={index}
          />
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2" aria-label="Information">
        <DemoLoginCard />
        <div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-sm text-muted transition-all duration-300 hover:border-white/20">
          <p className="text-xs uppercase tracking-wide text-blue-400/80 mb-4">Telegram Commands</p>
          <ul className="mt-2 space-y-2" role="list">
            <li className="flex items-start gap-2">
              <code className="bg-white/5 px-2 py-1 rounded text-xs font-mono text-accent">/start</code>
              <span className="flex-1">– Invite aktivieren & WebView öffnen</span>
            </li>
            <li className="flex items-start gap-2">
              <code className="bg-white/5 px-2 py-1 rounded text-xs font-mono text-accent">/drops</code>
              <span className="flex-1">– Aktuelle Drops anzeigen</span>
            </li>
            <li className="flex items-start gap-2">
              <code className="bg-white/5 px-2 py-1 rounded text-xs font-mono text-accent">/shop</code>
              <span className="flex-1">– Kategorien & Coins</span>
            </li>
            <li className="flex items-start gap-2">
              <code className="bg-white/5 px-2 py-1 rounded text-xs font-mono text-accent">/pay &lt;drop&gt;</code>
              <span className="flex-1">– Payment Reminder</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </div>
  );
};
Landing.displayName = 'Landing';
