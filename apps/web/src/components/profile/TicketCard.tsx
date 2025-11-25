import { useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MessageCircle, 
  ChevronDown, 
  Eye, 
  ExternalLink,
  Archive,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMobileOptimizations } from '../MobileOptimizations';
import type { TicketData } from '../support/types';

interface TicketCardProps {
  ticket: TicketData;
  isExpanded: boolean;
  onExpand: () => void;
  onSelect: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMarkDone?: () => void;
  formatDate: (date: string) => string;
  formatCategoryLabel: (category?: string) => string;
  getCategoryIcon: (category?: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getPriorityText: (priority: string) => string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

const TicketCardComponent = ({
  ticket,
  isExpanded,
  onExpand,
  onSelect,
  onArchive,
  onDelete,
  onMarkDone,
  formatDate,
  formatCategoryLabel,
  getCategoryIcon,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityText,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
}: TicketCardProps) => {
  const { isMobile } = useMobileOptimizations();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (event: any, info: any) => {
    if (!isMobile) return;
    
    const threshold = 50;
    const velocity = Math.abs(info.velocity.x);
    
    // Use velocity for better UX - fast swipe triggers action even with less distance
    if (info.offset.x < -threshold || (info.offset.x < -30 && velocity > 500)) {
      setSwipeOffset(-80);
    } else {
      setSwipeOffset(0);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe Actions Background */}
      {isMobile && swipeOffset < 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4 z-0"
        >
          {onMarkDone && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onMarkDone?.();
                setSwipeOffset(0);
              }}
              className="w-16 h-16 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center touch-target shadow-lg shadow-green-500/20"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
            </motion.button>
          )}
          {onArchive && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onArchive?.();
                setSwipeOffset(0);
              }}
              className="w-16 h-16 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center touch-target shadow-lg shadow-blue-500/20"
            >
              <Archive className="w-5 h-5 text-blue-400" />
            </motion.button>
          )}
          {onDelete && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
                setSwipeOffset(0);
              }}
              className="w-16 h-16 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center touch-target shadow-lg shadow-red-500/20"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Ticket Card */}
      <motion.div
        ref={cardRef}
        data-ticket-id={ticket.id}
        drag={isMobile && !isSelectionMode ? 'x' : false}
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={{ x: swipeOffset }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
          "bg-gradient-to-br from-slate-900/80 to-slate-800/40 border-slate-600/30",
          "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10",
          "focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:outline-none",
          isMobile && "touch-manipulation",
          isSelected && "ring-2 ring-purple-500/50 bg-purple-900/20"
        )}
        tabIndex={0}
        role="button"
        aria-label={`Ticket ${ticket.id}: ${ticket.subject}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onExpand();
          }
        }}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection?.();
              }}
              className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all touch-target",
                isSelected
                  ? "bg-purple-600 border-purple-500"
                  : "bg-slate-800/50 border-slate-600 hover:border-purple-500/50"
              )}
            >
              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
            </button>
          </div>
        )}
        
        {/* Ticket Header */}
        <div 
          className={cn(
            "cursor-pointer",
            isMobile ? "p-4" : "p-6",
            isSelectionMode && "pl-12"
          )}
          onClick={isSelectionMode ? onToggleSelection : onExpand}
        >
          <div className={cn(
            "flex items-center justify-between",
            isMobile ? "gap-2" : "gap-4"
          )}>
            <div className={cn(
              "flex items-center gap-3 flex-1 min-w-0",
              isMobile && "gap-2"
            )}>
              <div className={cn(
                "rounded-xl bg-slate-800/50 flex-shrink-0",
                isMobile ? "p-2" : "p-3"
              )}>
                <span className={cn(
                  isMobile ? "text-xl" : "text-2xl"
                )}>{getCategoryIcon(ticket.category)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "flex items-center gap-2 mb-1 flex-wrap",
                  isMobile && "gap-1"
                )}>
                  <h3 className={cn(
                    "font-semibold text-white truncate",
                    isMobile ? "text-sm" : "text-base"
                  )}>#{ticket.id}</h3>
                  <span className={cn(
                    "text-gray-400 flex-shrink-0",
                    isMobile ? "text-[10px]" : "text-xs"
                  )}>{formatCategoryLabel(ticket.category)}</span>
                </div>
                <p className={cn(
                  "text-gray-300 mb-2 line-clamp-1",
                  isMobile ? "text-xs" : "text-sm"
                )}>{ticket.subject}</p>
                <div className={cn(
                  "flex items-center gap-3 text-gray-400 flex-wrap",
                  isMobile ? "gap-2 text-[10px]" : "gap-4 text-sm"
                )}>
                  <div className="flex items-center gap-1">
                    <Calendar className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                    <span className="truncate">{formatDate(ticket.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                    <span>{ticket.messages?.length || 0}</span>
                    {(ticket as any).unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "ml-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center min-w-[18px]",
                          "animate-pulse"
                        )}
                      >
                        {(ticket as any).unreadCount}
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className={cn(
              "flex items-center gap-2 flex-shrink-0",
              isMobile && "flex-col gap-1"
            )}>
              <div className={cn(
                "flex items-center gap-1",
                isMobile && "flex-col"
              )}>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                  getStatusColor(ticket.status)
                )}>
                  {getStatusText(ticket.status)}
                </span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                  getPriorityColor(ticket.priority)
                )}>
                  {getPriorityText(ticket.priority)}
                </span>
              </div>
              <ChevronDown className={cn(
                "text-gray-400 transition-transform flex-shrink-0",
                isMobile ? "w-4 h-4" : "w-5 h-5",
                isExpanded && "rotate-180"
              )} />
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-600/30 bg-slate-800/20"
            >
              <div className={cn(
                "space-y-4",
                isMobile ? "p-4" : "p-6"
              )}>
                {/* Ticket Description */}
                <div>
                  <h4 className={cn(
                    "font-semibold text-white mb-2",
                    isMobile ? "text-sm" : "text-base"
                  )}>Beschreibung</h4>
                  <p className={cn(
                    "text-gray-300 leading-relaxed",
                    isMobile ? "text-xs" : "text-sm"
                  )}>{ticket.description}</p>
                </div>

                {/* Messages Count */}
                <div className={cn(
                  "flex items-center gap-2 text-gray-400",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  <MessageCircle className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                  <span>{ticket.messages?.length || 0} Nachrichten in diesem Ticket</span>
                </div>

                {/* Action Buttons */}
                <div className={cn(
                  "flex gap-2 pt-4",
                  isMobile && "flex-col"
                )}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg transition-colors touch-target",
                      "bg-slate-700/50 text-white hover:bg-slate-600/50",
                      isMobile ? "px-4 py-3 text-sm flex-1" : "px-4 py-2 flex-1"
                    )}
                  >
                    <Eye className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
                    Details anzeigen
                  </button>
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg transition-colors touch-target",
                      "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30",
                      isMobile ? "px-4 py-3 text-sm" : "px-4 py-2"
                    )}
                  >
                    <ExternalLink className={cn(isMobile ? "w-4 h-4" : "w-4 h-4")} />
                    {!isMobile && "Support"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export const TicketCard = memo(TicketCardComponent);
TicketCard.displayName = 'TicketCard';

