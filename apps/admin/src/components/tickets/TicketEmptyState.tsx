import { memo } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Search, Filter, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface TicketEmptyStateProps {
  hasFilters?: boolean;
  onCreateTicket?: () => void;
  onClearFilters?: () => void;
}

export const TicketEmptyState = memo(function TicketEmptyState({ 
  hasFilters = false,
  onCreateTicket,
  onClearFilters 
}: TicketEmptyStateProps) {
  return (
    <Card 
      variant="glassmorphic"
      className={cn(
        'p-8 sm:p-12 md:p-16 text-center',
        'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
        'backdrop-blur-xl border border-white/10',
        'shadow-2xl shadow-black/30',
        'relative overflow-hidden'
      )}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {/* Icon - Enhanced with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-accent/30 via-accent/20 to-primary/30 mb-6 backdrop-blur-xl border-2 border-accent/40 shadow-lg shadow-accent/20"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            {hasFilters ? (
              <Filter className="h-10 w-10 sm:h-12 sm:w-12 text-accent" />
            ) : (
              <Ticket className="h-10 w-10 sm:h-12 sm:w-12 text-accent" />
            )}
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl md:text-3xl font-bold text-text mb-3"
        >
          {hasFilters ? 'Keine Tickets gefunden' : 'Noch keine Tickets'}
        </motion.h3>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm sm:text-base text-muted mb-6 max-w-md mx-auto leading-relaxed"
        >
          {hasFilters ? (
            <>
              Es gibt derzeit keine Tickets, die deinen Filtern entsprechen.
              <br />
              Versuche deine Filter anzupassen oder erstelle ein neues Ticket.
            </>
          ) : (
            <>
              Es sind noch keine Tickets im System vorhanden.
              <br />
              Erstelle dein erstes Ticket oder warte auf neue Anfragen.
            </>
          )}
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          {hasFilters && onClearFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="min-w-[160px] bg-surface/50 border-white/20 hover:bg-surface/70 hover:border-white/30"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter zurücksetzen
            </Button>
          )}
          {onCreateTicket && (
            <Button
              onClick={onCreateTicket}
              className="min-w-[160px] bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 shadow-lg shadow-accent/20"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Neues Ticket erstellen
            </Button>
          )}
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 pt-6 border-t border-white/10"
        >
          <p className="text-xs text-muted/80">
            <Search className="h-3 w-3 inline mr-1" />
            Tipp: Verwende die Suchfunktion oder Filter, um Tickets zu finden
          </p>
        </motion.div>
      </motion.div>
    </Card>
  );
});

