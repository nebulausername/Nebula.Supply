import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  ChevronRight, 
  User, 
  Bot,
  CheckCircle,
  Loader2,
  X,
  Image as ImageIcon,
  Paperclip,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { categories, type TicketData, type Message } from './types';
import { cn } from '../../utils/cn';
import { useMobileOptimizations } from '../MobileOptimizations';
import { useEnhancedTouch } from '../../hooks/useEnhancedTouch';
import { useTicketRealtime } from '../../hooks/useTicketRealtime';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import { generateTicketShareLink } from '../../api/tickets';
import { showToast } from '../../store/toast';

const statusConfig = {
  open: { label: 'Offen', color: 'bg-green-500' },
  in_progress: { label: 'In Bearbeitung', color: 'bg-yellow-500' },
  waiting: { label: 'Wartet', color: 'bg-orange-500' },
  done: { label: 'Erledigt', color: 'bg-blue-500' }
};

const priorityConfig = {
  low: { label: 'Niedrig', color: 'text-gray-400' },
  medium: { label: 'Mittel', color: 'text-yellow-400' },
  high: { label: 'Hoch', color: 'text-orange-400' },
  critical: { label: 'Kritisch', color: 'text-red-400' }
};

interface TicketDetailProps {
  ticket: TicketData;
  onBack: () => void;
  onSendMessage: (message: string) => Promise<void> | void;
  onMarkDone: () => Promise<void> | void;
}

const QUICK_REPLIES = [
  'Vielen Dank für deine Nachricht!',
  'Ich schaue mir das gerne an.',
  'Das Problem wurde behoben.',
  'Kannst du mir mehr Details geben?',
  'Ich melde mich bald zurück.',
];

export const TicketDetail = ({ ticket: initialTicket, onBack, onSendMessage, onMarkDone }: TicketDetailProps) => {
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<TicketData>(initialTicket);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Update ticket when initialTicket changes
  useEffect(() => {
    setTicket(initialTicket);
  }, [initialTicket]);

  // Realtime updates for this ticket
  const ticketRealtime = useTicketRealtime({
    userId: ticket.userId || user?.id,
    enabled: !!ticket.id && (!!ticket.userId || !!user?.id),
    onNewMessage: useCallback((ticketId: string, message) => {
      if (ticketId === ticket.id) {
        setTicket(prev => {
          // Check if message already exists to prevent duplicates
          const existingMessage = prev.messages?.find(m => m.id === message.id);
          if (existingMessage) {
            return prev;
          }
          return {
            ...prev,
            messages: [...(prev.messages || []), message],
            updatedAt: new Date().toISOString()
          };
        });
        // Scroll to bottom when new message arrives
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 100);
      }
    }, [ticket.id]),
    onTicketUpdate: useCallback((update) => {
      if (update.ticketId === ticket.id && update.ticket) {
        setTicket(update.ticket);
      }
    }, [ticket.id])
  });

  // Send typing indicator when user types
  useEffect(() => {
    if (newMessage.trim() && ticketRealtime.sendTyping) {
      ticketRealtime.sendTyping(ticket.id, true);
      const timeout = setTimeout(() => {
        ticketRealtime.sendTyping(ticket.id, false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [newMessage, ticket.id, ticketRealtime.sendTyping]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is near bottom (within 100px)
      if (isNearBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [ticket.messages?.length]);

  // Scroll to bottom on mount
  useEffect(() => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, []);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    triggerHaptic('medium');
    
    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic update: Add message immediately to UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      from: 'user',
      timestamp: new Date().toISOString()
    };

    setTicket(prev => ({
      ...prev,
      messages: [...(prev.messages || []), optimisticMessage],
      updatedAt: new Date().toISOString()
    }));

    // Scroll to bottom
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);

    try {
      await onSendMessage(messageText);
      triggerHaptic('success');
      
      // Remove optimistic message and let realtime hook update with actual message
      setTicket(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== optimisticMessage.id)
      }));
    } catch (error) {
      triggerHaptic('error');
      
      // Rollback optimistic update on error
      setTicket(prev => ({
        ...prev,
        messages: prev.messages.filter(m => m.id !== optimisticMessage.id)
      }));
      
      // Restore message text
      setNewMessage(messageText);
      
      if (import.meta.env.DEV) {
        console.warn('[TicketDetail] Failed to send message', error);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkDone = async () => {
    if (isClosing) return;
    setIsClosing(true);
    triggerHaptic('medium');
    try {
      await onMarkDone();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[TicketDetail] Failed to mark ticket as done', error);
      }
    } finally {
      setIsClosing(false);
    }
  };

  const handleShare = async () => {
    if (isGeneratingShare) return;
    setIsGeneratingShare(true);
    triggerHaptic('light');
    
    try {
      const shareData = await generateTicketShareLink(ticket.id);
      setShareLink(shareData.shareLink);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareData.shareLink);
      setCopied(true);
      showToast.success('Link kopiert', 'Link wurde in die Zwischenablage kopiert!');
      triggerHaptic('success');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast.error('Fehler', 'Fehler beim Erstellen des Share-Links');
      triggerHaptic('error');
      if (import.meta.env.DEV) {
        console.warn('[TicketDetail] Failed to generate share link', error);
      }
    } finally {
      setIsGeneratingShare(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
      className={cn(
        "space-y-4",
        isMobile ? "h-full flex flex-col" : "max-w-5xl mx-auto space-y-6"
      )}
    >
      {/* Ticket Header */}
      <div className={cn(
        "relative w-full overflow-hidden border border-emerald-500/20 bg-gradient-to-r from-[#041612] via-[#03211A] to-[#020b0a] text-sm text-muted shadow-[0_40px_120px_rgba(11,247,188,0.22)]",
        isMobile ? "rounded-t-3xl px-4 py-4" : "rounded-3xl px-6 py-8"
      )}>
        <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-[140px]" />
        <div className="pointer-events-none absolute right-[-10%] top-1/3 h-72 w-72 rounded-full bg-emerald-300/10 blur-[160px]" />
        
        <div className="relative z-10">
          {/* Mobile Back Button */}
          {isMobile && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onBack();
              }}
              className="mb-3 flex items-center gap-2 text-muted hover:text-text transition-colors touch-target"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              <span className="text-sm font-medium">Zurück</span>
            </button>
          )}
        
          <div className={cn(
            "flex items-start justify-between",
            isMobile ? "flex-col gap-3" : "flex-row"
          )}>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "flex items-center gap-2 mb-2 flex-wrap",
                isMobile && "gap-1.5"
              )}>
                <span className={cn(isMobile ? "text-xl" : "text-2xl")}>
                  {categories.find(c => c.name === ticket.category || c.id === ticket.category)?.icon || '📋'}
                </span>
                <span className={cn(
                  "font-mono text-muted",
                  isMobile ? "text-[10px]" : "text-xs"
                )}>{ticket.id}</span>
                <span className={cn(
                  "px-2 py-1 rounded-full font-bold text-white",
                  isMobile ? "text-[10px]" : "text-xs",
                  statusConfig[ticket.status].color
                )}>
                  {statusConfig[ticket.status].label}
                </span>
              </div>
              
              <h2 className={cn(
                "font-semibold tracking-tight text-text mb-2",
                isMobile ? "text-xl" : "text-4xl"
              )}>{ticket.subject}</h2>
              
              <div className={cn(
                "flex items-center gap-3 text-muted flex-wrap",
                isMobile ? "text-xs gap-2" : "text-sm gap-4"
              )}>
                <span className="flex items-center gap-1">
                  <Clock className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                  {(() => {
                    const date = new Date(ticket.createdAt);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffDays = Math.floor(diffMs / 86400000);
                    
                    if (diffDays === 0) {
                      return date.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    } else if (diffDays < 7) {
                      return `Vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
                    } else {
                      return date.toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: isMobile ? undefined : 'numeric'
                      });
                    }
                  })()}
                </span>
                <span className={priorityConfig[ticket.priority].color}>
                  ⚡ {priorityConfig[ticket.priority].label}
                </span>
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "flex-col w-full" : "flex-row"
            )}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                disabled={isGeneratingShare}
                className={cn(
                  "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold rounded-2xl hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed touch-target",
                  isMobile ? "px-3 py-2 text-xs w-full justify-center" : "px-4 py-2 text-sm"
                )}
              >
                {isGeneratingShare ? (
                  <Loader2 className={cn(isMobile ? "w-3 h-3" : "w-4 h-4", "animate-spin")} />
                ) : copied ? (
                  <Check className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                ) : (
                  <Share2 className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                )}
                {isGeneratingShare ? 'Erstelle...' : copied ? 'Kopiert!' : isMobile ? 'Teilen' : 'Ticket teilen'}
              </motion.button>
              
              {ticket.status !== 'done' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkDone}
                disabled={isClosing}
                className={cn(
                  "bg-gradient-to-r from-accent to-emerald-400 text-black font-semibold rounded-2xl hover:shadow-[0_0_20px_rgba(11,247,188,0.3)] transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed touch-target",
                  isMobile ? "px-3 py-2 text-xs w-full justify-center" : "px-4 py-2 text-sm"
                )}
              >
                {isClosing ? <Loader2 className={cn(isMobile ? "w-3 h-3" : "w-4 h-4", "animate-spin")} /> : <CheckCircle className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />}
                {isClosing ? 'Schließe...' : isMobile ? 'Erledigt' : 'Als erledigt markieren'}
              </motion.button>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container - Flex grow on mobile */}
      <div className={cn(
        "rounded-2xl border border-white/10 bg-black/30 flex flex-col",
        isMobile ? "flex-1 min-h-0 p-4" : "p-6"
      )}>
        <div className={cn(
          "flex items-center justify-between mb-4",
          isMobile ? "mb-4" : "mb-6"
        )}>
          <h3 className={cn(
            "font-semibold text-text flex items-center gap-2",
            isMobile ? "text-base" : "text-xl"
          )}>
            <MessageSquare className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
            Nachrichten ({ticket.messages.length})
          </h3>
          {ticketRealtime.isTyping(ticket.id) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-emerald-400 text-sm"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Agent tippt...</span>
            </motion.div>
          )}
        </div>
        
        <div
          ref={messagesContainerRef}
          className={cn(
            "space-y-3 mb-4 overflow-y-auto pr-2 custom-scrollbar flex-1",
            isMobile ? "max-h-none" : "max-h-[500px]"
          )}
        >
          <AnimatePresence>
            {ticket.messages.map((message, index) => {
              const isUser = message.from === 'user';
              const isAgent = message.from === 'agent';
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "flex gap-2",
                    isUser ? 'flex-row-reverse' : '',
                    isMobile && "gap-2"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 rounded-full flex items-center justify-center",
                    isUser ? 'bg-gradient-to-r from-accent to-emerald-400' :
                    isAgent ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                    'bg-gradient-to-r from-gray-500 to-slate-500',
                    isMobile ? "w-8 h-8" : "w-10 h-10"
                  )}>
                    {isUser ? (
                      <User className={cn(isMobile ? "w-4 h-4 text-black" : "w-5 h-5 text-black")} />
                    ) : (
                      <Bot className={cn(isMobile ? "w-4 h-4 text-white" : "w-5 h-5 text-white")} />
                    )}
                  </div>
                  
                  <div className={cn(
                    "flex-1",
                    isUser ? 'text-right' : '',
                    isMobile ? "max-w-[85%]" : "max-w-[80%]"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2 mb-1",
                      isUser ? 'justify-end' : '',
                      isMobile && "gap-1"
                    )}>
                      <span className={cn(
                        "font-semibold",
                        isUser ? 'text-accent' : isAgent ? 'text-emerald-400' : 'text-muted',
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        {message.senderName || (isUser ? 'Du' : 'System')}
                      </span>
                      <span className={cn(
                        "text-muted",
                        isMobile ? "text-[10px]" : "text-xs"
                      )}>
                        {(() => {
                          const date = new Date(message.timestamp);
                          const now = new Date();
                          const diffMs = now.getTime() - date.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          const diffDays = Math.floor(diffMs / 86400000);
                          
                          if (diffMins < 1) return 'Gerade eben';
                          if (diffMins < 60) return `Vor ${diffMins}min`;
                          if (diffHours < 24) return `Vor ${diffHours}h`;
                          if (diffDays < 7) return `Vor ${diffDays}d`;
                          return date.toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          });
                        })()}
                      </span>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "inline-block rounded-2xl break-words",
                        isUser ? 'bg-gradient-to-r from-accent/20 to-emerald-400/20 text-text border border-accent/30 rounded-br-sm' :
                        isAgent ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-text border border-emerald-500/30 rounded-bl-sm' :
                        'bg-black/30 text-muted border border-white/10 rounded-bl-sm',
                        isMobile ? "px-3 py-2 text-sm" : "px-4 py-3"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {ticket.status !== 'done' && (
          <AnimatePresence>
            {showQuickReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/40"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-medium">Schnellantworten</span>
                  <button
                    onClick={() => setShowQuickReplies(false)}
                    className="text-gray-500 hover:text-gray-300 transition-colors touch-target"
                    aria-label="Schnellantworten ausblenden"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((reply, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        triggerHaptic('light');
                        setNewMessage(reply);
                        setShowQuickReplies(false);
                      }}
                      className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30 rounded-lg text-xs text-gray-300 transition-colors touch-target"
                    >
                      {reply}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Message Input */}
        {ticket.status !== 'done' ? (
          <div className={cn(
            "flex gap-2",
            isMobile && "gap-2"
          )}>
            {!showQuickReplies && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowQuickReplies(true);
                }}
                className={cn(
                  "bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/30 rounded-2xl text-gray-300 transition-colors touch-target",
                  isMobile ? "px-3 py-2.5" : "px-4 py-3"
                )}
                aria-label="Schnellantworten anzeigen"
              >
                <Paperclip className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
              </button>
            )}
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isMobile ? "Nachricht..." : "Nachricht schreiben..."}
                className={cn(
                  "w-full rounded-2xl border border-white/10 bg-black/20 text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 touch-target",
                  isMobile ? "px-3 py-2.5 text-sm" : "px-4 py-3 text-sm"
                )}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className={cn(
                "bg-gradient-to-r from-accent to-emerald-400 text-black font-semibold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(11,247,188,0.3)] transition-all flex items-center gap-2 justify-center touch-target",
                isMobile ? "px-4 py-2.5" : "px-6 py-3"
              )}
            >
              {isSending ? (
                <Loader2 className={cn(isMobile ? "w-4 h-4" : "w-5 h-5", "animate-spin")} />
              ) : (
                <Send className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
              )}
              {!isMobile && (isSending ? 'Senden...' : 'Senden')}
            </motion.button>
          </div>
        ) : (
          <div className={cn(
            "text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl",
            isMobile ? "py-4 px-3" : "py-6"
          )}>
            <CheckCircle className={cn(
              "text-emerald-400 mx-auto mb-2",
              isMobile ? "w-8 h-8" : "w-12 h-12"
            )} />
            <p className={cn(
              "text-emerald-200 font-semibold",
              isMobile ? "text-sm" : "text-base"
            )}>Ticket wurde als erledigt markiert</p>
            <p className={cn(
              "text-muted mt-1",
              isMobile ? "text-xs" : "text-sm"
            )}>Vielen Dank für deine Rückmeldung!</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(11, 247, 188, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(11, 247, 188, 0.6);
        }
      `}</style>
    </motion.div>
  );
};