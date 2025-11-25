import { ShoppingCart } from "lucide-react";
import { useGlobalCartStore } from "../../store/globalCart";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { cn } from "../../utils/cn";

export const CartFab = () => {
  const { totalItems, openCart } = useGlobalCartStore();
  const { triggerHaptic } = useEnhancedTouch();

  const handleClick = () => {
    triggerHaptic('medium');
    openCart();
  };

  if (totalItems === 0) return null;

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed bottom-24 right-4 z-40",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-br from-orange-500 to-orange-600",
        "text-white shadow-2xl",
        "flex items-center justify-center",
        "transition-all duration-300 ease-out",
        "hover:scale-110 active:scale-95",
        "touch-target"
      )}
      aria-label={`Warenkorb öffnen - ${totalItems} Artikel`}
    >
      {/* Icon */}
      <ShoppingCart className="h-6 w-6" />
      
      {/* Badge */}
      {totalItems > 0 && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-black">
          <span className="text-xs font-bold text-white">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        </div>
      )}
      
      {/* Pulse Animation */}
      <div className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-20" />
    </button>
  );
};
