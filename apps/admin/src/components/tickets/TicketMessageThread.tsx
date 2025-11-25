import { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, Clock, Paperclip, Check, CheckCheck } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TypingIndicator } from './TypingIndicator';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { cn } from '../../utils/cn';
import { useMobile } from '../../hooks/useMobile';

interface TicketMessage {
  id: string;
  text: string;
  from: 'user' | 'agent' | 'bot' | 'system';
  timestamp: string;
  senderName?: string;
  attachments?: Array<{
    id?: string;
    url: string;
    name: string;
    type?: string;
  }>;
  read?: boolean;
}

interface TicketMessageThreadProps {
  messages: TicketMessage[];
  isLoading?: boolean;
  onMessageRead?: (messageId: string) => void;
}

const getSenderInfo = (from: string, senderName?: string) => {
  switch (from) {
    case 'agent':
      return { name: senderName || 'Agent', icon: User, color: 'bg-blue-500/10 text-blue-400' };
    case 'bot':
      return { name: 'Bot', icon: Bot, color: 'bg-purple-500/10 text-purple-400' };
    case 'system':
      return { name: 'System', icon: Bot, color: 'bg-gray-500/10 text-gray-400' };
    default:
      return { name: senderName || 'Customer', icon: User, color: 'bg-green-500/10 text-green-400' };
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
};

const groupMessagesByDate = (messages: TicketMessage[]) => {
  const groups: { [key: string]: TicketMessage[] } = {};
  
  messages.forEach(msg => {
    const date = new Date(msg.timestamp);
    const dateKey = date.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
  });
  
  return groups;
};

export const TicketMessageThread = memo(function TicketMessageThread({
  messages,
  isLoading,
  onMessageRead,
}: TicketMessageThreadProps) {
  const { isMobile } = useMobile();
  const { typingUsers } = useTypingIndicator();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!onMessageRead) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId) {
              onMessageRead(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const messageElements = containerRef.current?.querySelectorAll('[data-message-id]');
    messageElements?.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [messages, onMessageRead]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-muted border-t-accent rounded-full animate-spin" />
          <span className="text-sm text-muted">Loading messages...</span>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-surface/50 flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted" />
        </div>
        <p className="text-sm text-muted">No messages yet</p>
        <p className="text-xs text-muted mt-1">Start the conversation by sending a reply</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'space-y-4 overflow-y-auto',
        isMobile ? 'max-h-[60vh]' : 'max-h-[500px]'
      )}
    >
      {sortedDates.map((dateKey, dateIndex) => (
        <div key={dateKey} className="space-y-3">
          {/* Date Separator */}
          {sortedDates.length > 1 && (
            <div className="flex items-center gap-2 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-muted px-2">{dateKey}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          )}

          {/* Messages for this date */}
          {groupedMessages[dateKey].map((message, msgIndex) => {
            const senderInfo = getSenderInfo(message.from, message.senderName);
            const SenderIcon = senderInfo.icon;
            const isAgent = message.from === 'agent' || message.from === 'bot' || message.from === 'system';
            const isLastInGroup = msgIndex === groupedMessages[dateKey].length - 1;
            const showSenderInfo = isLastInGroup || 
              (msgIndex < groupedMessages[dateKey].length - 1 && 
               groupedMessages[dateKey][msgIndex + 1].from !== message.from);

            return (
              <motion.div
                key={message.id}
                data-message-id={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex gap-3',
                  isAgent ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                {showSenderInfo ? (
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    senderInfo.color,
                    isMobile && 'w-6 h-6'
                  )}>
                    <SenderIcon className={cn('h-4 w-4', isMobile && 'h-3 w-3')} />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-8" />
                )}

                {/* Message Content */}
                <div className={cn(
                  'flex-1 space-y-1',
                  isAgent ? 'items-end' : 'items-start'
                )}>
                  {/* Sender Name & Timestamp */}
                  {showSenderInfo && (
                    <div className={cn(
                      'flex items-center gap-2 text-xs text-muted mb-1',
                      isAgent && 'flex-row-reverse'
                    )}>
                      <span>{senderInfo.name}</span>
                      <span>•</span>
                      <span>{formatTimestamp(message.timestamp)}</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn(
                      'inline-block rounded-2xl px-4 py-2 max-w-[80%] shadow-lg',
                      isAgent
                        ? 'bg-primary/20 text-text border border-primary/30 shadow-primary/10'
                        : 'bg-surface/70 text-text border border-white/10 shadow-black/10',
                      isMobile && 'max-w-[85%] px-3 py-2 text-sm'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.attachments.map((attachment, idx) => (
                          <div
                            key={attachment.id || idx}
                            className="flex items-center gap-2 p-2 bg-surface/50 rounded-lg border border-white/10"
                          >
                            <Paperclip className="h-4 w-4 text-muted flex-shrink-0" />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-accent hover:underline truncate flex-1"
                            >
                              {attachment.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Read Receipt */}
                    {isAgent && message.read !== undefined && (
                      <div className="flex items-center justify-end mt-1">
                        {message.read ? (
                          <CheckCheck className="h-3 w-3 text-blue-400" />
                        ) : (
                          <Check className="h-3 w-3 text-muted" />
                        )}
                      </div>
                    )}
                  </motion.div>

                  {/* Timestamp (if not showing sender info) */}
                  {!showSenderInfo && (
                    <div className={cn(
                      'text-xs text-muted px-2',
                      isAgent && 'text-right'
                    )}>
                      {formatTimestamp(message.timestamp)}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}

      {/* Typing Indicators */}
      <AnimatePresence>
        {typingUsers.map(user => (
          <TypingIndicator
            key={user.userId}
            userName={user.userName}
          />
        ))}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
});

