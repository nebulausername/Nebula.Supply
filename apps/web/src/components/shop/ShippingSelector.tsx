import type { ShippingOption } from "@nebula/shared";
import { formatCurrency } from "../../utils/currency";
import { cn } from "../../utils/cn";

interface ShippingSelectorProps {
  options: ShippingOption[];
  selectedId: string | null;
  onSelect: (optionId: string) => void;
  accentColor: string;
}

const getAdjustment = (option: ShippingOption) => {
  const adjustment = option.priceAdjustment ?? 0;
  if (adjustment === 0) {
    return { label: "Inklusive", tone: "text-muted" };
  }
  const formatted = formatCurrency(Math.abs(adjustment), "de-DE", option.currency);
  return {
    label: `${adjustment > 0 ? "+" : "-"} ${formatted}`,
    tone: adjustment > 0 ? "text-amber-400" : "text-accent"
  };
};

export const ShippingSelector = ({ options, selectedId, onSelect, accentColor }: ShippingSelectorProps) => {
  if (!options.length) {
    return null;
  }

  return (
    <div className="w-full space-y-2 text-right md:text-left">
      <p className="text-xs uppercase tracking-wide text-muted">Versand</p>
      <div className="flex flex-col items-end gap-2 md:items-start">
        {options.map((option) => {
          const isActive = option.id === selectedId;
          const { label, tone } = getAdjustment(option);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "w-full min-w-[180px] rounded-xl border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                isActive
                  ? "bg-black/60 text-text"
                  : "border-white/10 bg-black/30 text-muted hover:border-accent/50 hover:text-text"
              )}
              style={
                isActive
                  ? { borderColor: accentColor, boxShadow: `0 0 0 1px ${accentColor}` }
                  : { borderColor: "rgba(255,255,255,0.12)" }
              }
              aria-pressed={isActive}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-text">{option.label}</span>
                <span className={cn("text-xs font-semibold", tone)}>{label}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>{formatCurrency(option.price, "de-DE", option.currency)}</span>
                <span>{option.leadTime}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
