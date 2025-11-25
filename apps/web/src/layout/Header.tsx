import type { ReactNode } from "react";
import nebulaMark from "../assets/nebula-mark.svg";
import coinsIcon from "../assets/coins.svg";

export interface HeaderHighlight {
  title: string;
  description: string;
  tone?: "accent" | "neutral";
  icon?: ReactNode;
}

interface HeaderProps {
  coins?: number;
  eyebrow: string;
  title: string;
  description: string;
  highlights?: HeaderHighlight[];
  coinLabel?: string;
}

const toneClassNames: Record<NonNullable<HeaderHighlight["tone"]>, string> = {
  accent: "border-accent/40 bg-accent/10 text-accent",
  neutral: "border-white/15 bg-black/30 text-text"
};

export const Header = ({
  coins = 0,
  eyebrow,
  title,
  description,
  highlights = [],
  coinLabel = "Coins"
}: HeaderProps) => {
  // Ensure coins is always a valid number
  const coinsValue = typeof coins === 'number' && !isNaN(coins) ? coins : 0;
  
  return (
    <header className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-[#041612] via-[#03211A] to-[#020b0a] px-6 py-10 text-sm text-muted shadow-[0_40px_120px_rgba(11,247,188,0.22)]">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[140px]" />
      <div className="pointer-events-none absolute right-[-10%] top-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-[160px]" />

      <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img src={nebulaMark} alt="Nebula Supply" className="h-12 w-auto" />
            <p className="text-[11px] uppercase tracking-[0.55em] text-emerald-200/70">{eyebrow}</p>
          </div>
          <div className="space-y-3 text-text">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
            <p className="max-w-2xl text-base text-emerald-100/80">{description}</p>
          </div>
        </div>

        <div className="flex min-w-[160px] items-center gap-3 self-start rounded-2xl border border-emerald-400/40 bg-black/30 px-4 py-3 text-xs text-emerald-100/80">
          <img src={coinsIcon} alt="Coins" className="h-8 w-8" />
          <div>
            <p className="text-[11px] uppercase tracking-wide">{coinLabel}</p>
            <p className="text-lg font-semibold text-text">{coinsValue.toLocaleString("de-DE")}</p>
          </div>
        </div>
      </div>

    {highlights.length > 0 && (
      <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-2">
        {highlights.map((card) => {
          const tone = card.tone ?? "neutral";
          return (
            <div
              key={card.title}
              className={`flex h-full flex-col gap-2 rounded-2xl border px-4 py-5 text-sm transition ${toneClassNames[tone]}`}
            >
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                {card.icon && <span className="text-lg">{card.icon}</span>}
                <span>{card.title}</span>
              </p>
              <p className="text-sm leading-relaxed text-emerald-50/80">{card.description}</p>
            </div>
          );
        })}
      </div>
    )}
    </header>
  );
};