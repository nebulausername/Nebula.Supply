import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Calendar, Info } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

interface LandShippingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryRange?: string;
  message?: string;
}

export const LandShippingModal = memo(({
  isOpen,
  onClose,
  deliveryRange,
  message
}: LandShippingModalProps) => {
  if (typeof window === 'undefined') return null;

  const defaultMessage = "Aufgrund von Größe, Gewicht oder anderen Gründen wird dieser Artikel auf dem Landweg versandt. Wenn deine Bestellung andere Artikel enthält, die nicht auf dem Landweg verschickt werden, werden diese separat verschickt und ihre Lieferzeit wird nicht beeinträchtigt.";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Content */}
              <div className="space-y-4">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <Truck className="w-8 h-8 text-orange-600" />
                  </div>
                </div>

                {/* Message */}
                <p className="text-gray-800 text-center leading-relaxed">
                  {message || defaultMessage}
                </p>

                {/* Delivery Range */}
                {deliveryRange && (
                  <div className="flex items-center justify-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span className="text-orange-800 font-medium">
                      Versand auf dem Landweg, Lieferung: {deliveryRange}
                    </span>
                  </div>
                )}

                {/* OK Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-full transition-colors"
                >
                  OK
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
});

LandShippingModal.displayName = 'LandShippingModal';

