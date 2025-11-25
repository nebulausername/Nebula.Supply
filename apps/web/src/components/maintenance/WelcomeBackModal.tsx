import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeBackModal = ({ isOpen, onClose }: WelcomeBackModalProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);
  
  const handleExplore = () => {
    onClose();
    navigate('/shop');
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              "relative w-full max-w-md rounded-2xl",
              "bg-gradient-to-br from-[#111827] to-[#0A0A0A]",
              "border border-white/10 backdrop-blur-xl",
              "shadow-2xl shadow-[#0BF7BC]/20"
            )}>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
              
              {/* Content */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#0BF7BC]/20 rounded-full blur-xl" />
                    <div className="relative bg-gradient-to-br from-[#0BF7BC] to-[#61F4F4] p-4 rounded-full">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Text */}
                <div className="text-center space-y-3">
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0BF7BC] to-white bg-clip-text text-transparent">
                    Willkommen zurück!
                  </h2>
                  <p className="text-white/70 text-sm md:text-base leading-relaxed">
                    Wir sind wieder online. Entdecke jetzt unseren vollständigen Shop mit allen Produkten und Drops.
                  </p>
                </div>
                
                {/* CTA Button */}
                <button
                  onClick={handleExplore}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl",
                    "bg-gradient-to-r from-[#0BF7BC] to-[#61F4F4]",
                    "text-black font-semibold",
                    "hover:scale-105 active:scale-95",
                    "transition-transform duration-200",
                    "shadow-lg shadow-[#0BF7BC]/30"
                  )}
                >
                  <span>Shop erkunden</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

