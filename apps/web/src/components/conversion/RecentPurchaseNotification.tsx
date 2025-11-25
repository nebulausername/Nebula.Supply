import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, MapPin, Clock } from "lucide-react";
import { cn } from "../../utils/cn";

interface Purchase {
  id: string;
  user: string;
  product: string;
  location: string;
  timeAgo: string;
}

const mockPurchases: Purchase[] = [
  { id: "1", user: "Max M.", product: "Supreme Box Logo", location: "Berlin", timeAgo: "vor 2 Min" },
  { id: "2", user: "Anna K.", product: "Nike Dunk Low", location: "München", timeAgo: "vor 5 Min" },
  { id: "3", user: "Tom S.", product: "Yeezy 350 V2", location: "Hamburg", timeAgo: "vor 8 Min" },
  { id: "4", user: "Lisa M.", product: "Jordan 1 High", location: "Köln", timeAgo: "vor 12 Min" },
  { id: "5", user: "Jan P.", product: "Travis Scott", location: "Frankfurt", timeAgo: "vor 15 Min" }
];

interface RecentPurchaseNotificationProps {
  enabled?: boolean;
  interval?: number;
  className?: string;
}

export const RecentPurchaseNotification = ({ 
  enabled = true,
  interval = 8000,
  className 
}: RecentPurchaseNotificationProps) => {
  const [currentPurchase, setCurrentPurchase] = useState<Purchase | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const showNotification = () => {
      const randomPurchase = mockPurchases[Math.floor(Math.random() * mockPurchases.length)];
      setCurrentPurchase(randomPurchase);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Show first notification after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000);

    // Then show periodically
    const intervalId = setInterval(showNotification, interval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [enabled, interval]);

  return (
    <AnimatePresence>
      {isVisible && currentPurchase && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: -20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className={cn(
            "fixed bottom-24 left-4 z-50",
            "max-w-sm w-full",
            className
          )}
        >
          <div className="bg-gradient-to-r from-black/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-accent/30 shadow-2xl shadow-accent/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white truncate">
                    {currentPurchase.user}
                  </span>
                  <span className="text-xs text-accent">✓</span>
                </div>
                
                <p className="text-sm text-muted mb-2">
                  hat gerade <span className="text-white font-semibold">{currentPurchase.product}</span> gekauft
                </p>
                
                <div className="flex items-center gap-3 text-xs text-muted">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{currentPurchase.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{currentPurchase.timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

