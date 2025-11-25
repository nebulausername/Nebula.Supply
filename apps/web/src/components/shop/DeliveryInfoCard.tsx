import { useMemo, useState } from "react";
import { AlarmClock, BadgeAlert, PackageCheck, Truck, Info } from "lucide-react";
import type { LeadTime, ShippingOption } from "@nebula/shared";
import { formatCurrency } from "../../utils/currency";
import { formatLeadTime } from "../../utils/leadTime";
import { LandShippingModal } from "./LandShippingModal";
import { motion } from "framer-motion";

interface DeliveryInfoCardProps {
  price: number;
  currency: string;
  leadTime: LeadTime;
  shippingOptions: ShippingOption[];
  deliveryEstimates?: Partial<Record<NonNullable<ShippingOption["region"]>, string>>;
  limitedUntil?: string;
  inventory?: number;
  dense?: boolean;
}

const formatLimitDate = (value: string) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

export const DeliveryInfoCard = ({
  price,
  currency,
  leadTime,
  shippingOptions,
  deliveryEstimates,
  limitedUntil,
  inventory,
  dense
}: DeliveryInfoCardProps) => {
  const [landShippingModalOpen, setLandShippingModalOpen] = useState(false);
  const leadTimeInfo = formatLeadTime(leadTime);
  const formattedPrice = useMemo(() => formatCurrency(price, "de-DE", currency), [price, currency]);
  const showInventory = typeof inventory === "number" && inventory > 0;

  const primaryOptions = shippingOptions.slice(0, 2);
  
  // Find land shipping option
  const landShippingOption = shippingOptions.find(
    (opt) => opt.landShipping && opt.showLandShippingBadge
  );
  const containerClasses = `${
    dense
      ? "space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4 shadow-inner"
      : "space-y-5 rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner"
  }`;
  const priceClasses = dense ? "text-2xl" : "text-3xl";
  const bodyText = dense ? "text-xs" : "text-sm";

  return (
    <section aria-labelledby="product-delivery-info" className={containerClasses}>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted">Preis</p>
          <p className={`${priceClasses} font-semibold text-text`} id="product-delivery-info">
            {formattedPrice}
          </p>
        </div>
        {limitedUntil && (
          <span className="flex items-center gap-2 rounded-full border border-[#FF5EDB]/40 bg-[#FF5EDB]/10 px-3 py-1 text-[11px] font-medium text-[#FF5EDB]">
            <BadgeAlert className="h-3.5 w-3.5" />
            Limit bis {formatLimitDate(limitedUntil)}
          </span>
        )}
      </header>

      <div className={`flex flex-col gap-4 ${bodyText} text-muted`}>
        <div className="flex items-start gap-3">
          <AlarmClock className="mt-0.5 h-4 w-4 text-accent" />
          <div>
            <p className="text-sm font-semibold text-text">{leadTimeInfo.title}</p>
            {leadTimeInfo.description ? <p className="text-[11px] text-muted">{leadTimeInfo.description}</p> : null}
          </div>
        </div>

        {primaryOptions.length ? (
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-4 w-4 text-accent" />
            <div className="w-full space-y-1 text-[11px]">
              {primaryOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted">{option.label}</span>
                  <span className="text-text">
                    {option.region ? deliveryEstimates?.[option.region] ?? option.leadTime : option.leadTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {showInventory && (
          <div className="flex items-start gap-3">
            <PackageCheck className="mt-0.5 h-4 w-4 text-accent" />
            <div className="w-full">
              <div className="flex items-center justify-between text-[11px]">
                <span>Verfügbar</span>
                <span className="text-text">{inventory} Stück</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${Math.min(100, (inventory / 50) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Landweg-Versand Section */}
        {landShippingOption && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 mt-4 p-3 rounded-lg border border-orange-500/30 bg-orange-500/10"
          >
            <Truck className="mt-0.5 h-4 w-4 text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold text-text">Versand auf dem Landweg</span>
                <button
                  onClick={() => setLandShippingModalOpen(true)}
                  className="w-4 h-4 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <Info className="w-3 h-3 text-orange-400" />
                </button>
              </div>
              {landShippingOption.landShippingDeliveryRange && (
                <p className="text-[11px] text-muted">
                  Lieferung: {landShippingOption.landShippingDeliveryRange}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Land Shipping Modal */}
      <LandShippingModal
        isOpen={landShippingModalOpen}
        onClose={() => setLandShippingModalOpen(false)}
        deliveryRange={landShippingOption?.landShippingDeliveryRange}
        message={landShippingOption?.landShippingMessage}
      />
    </section>
  );
};
