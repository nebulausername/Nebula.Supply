// Quick Actions Menu mit Floating Action Button
import React, { useState, useMemo } from 'react';
import { Plus, X, Ticket, ShoppingBag, UserPlus, Package, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useMobile } from '../../hooks/useMobile';
import { logger } from '../../lib/logger';
import { useSearchParams } from 'react-router-dom';
import { ViewType } from '../../lib/types/common';
import { CreateTicketModal } from '../modals/CreateTicketModal';
import { CreateOrderModal } from '../modals/CreateOrderModal';
import { CreateCustomerModal } from '../modals/CreateCustomerModal';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

interface QuickActionsProps {
  actions?: QuickAction[];
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
  onViewChange?: (view: ViewType) => void;
}

export function QuickActions({ 
  actions,
  position = 'bottom-right',
  className,
  onViewChange
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const { isMobile } = useMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleViewChange = (view: ViewType) => {
    setSearchParams({ view }, { replace: true });
    onViewChange?.(view);
    logger.info('QuickAction: Navigated to view', { view });
  };

  const defaultActions: QuickAction[] = useMemo(() => [
    {
      id: 'new-ticket',
      label: 'New Ticket',
      icon: Ticket,
      onClick: () => {
        setShowCreateTicketModal(true);
        setIsOpen(false);
        logger.info('QuickAction: Opening create ticket modal');
      },
      color: 'blue'
    },
    {
      id: 'new-order',
      label: 'New Order',
      icon: ShoppingBag,
      onClick: () => {
        setShowCreateOrderModal(true);
        setIsOpen(false);
        logger.info('QuickAction: Opening create order modal');
      },
      color: 'green'
    },
    {
      id: 'new-customer',
      label: 'New Customer',
      icon: UserPlus,
      onClick: () => {
        setShowCreateCustomerModal(true);
        setIsOpen(false);
        logger.info('QuickAction: Opening create customer modal');
      },
      color: 'purple'
    },
    {
      id: 'new-product',
      label: 'New Product',
      icon: Package,
      onClick: () => {
        handleViewChange('shop');
        setIsOpen(false);
        logger.info('QuickAction: New Product - Navigated to shop view');
      },
      color: 'orange'
    }
  ], [searchParams, onViewChange]);

  const finalActions = actions || defaultActions;

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
  };

  if (!isMobile) {
    return null; // Only show on mobile
  }

  return (
    <div className={cn("fixed z-50", positionClasses[position], className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3 mb-4"
          >
            {finalActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-full shadow-lg",
                  "text-white font-medium min-h-touch",
                  colorClasses[action.color || 'blue']
                )}
              >
                <action.icon className="w-5 h-5" />
                <span>{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center",
          "bg-neon hover:bg-neon-dark text-black font-bold",
          "min-h-touch min-w-touch"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Modals */}
      <CreateTicketModal
        isOpen={showCreateTicketModal}
        onClose={() => setShowCreateTicketModal(false)}
        onSuccess={() => {
          handleViewChange('tickets');
        }}
      />
      <CreateOrderModal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
        onSuccess={() => {
          handleViewChange('orders');
        }}
      />
      <CreateCustomerModal
        isOpen={showCreateCustomerModal}
        onClose={() => setShowCreateCustomerModal(false)}
        onSuccess={() => {
          handleViewChange('customers');
        }}
      />
    </div>
  );
}

