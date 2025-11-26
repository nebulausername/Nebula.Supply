import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, X, FileText, CheckCircle, AlertCircle, Loader, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ReplyTemplates } from './ReplyTemplates';
import { useTicketReply } from '../../lib/api/hooks';
import { useMobile } from '../../hooks/useMobile';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import { cn } from '../../utils/cn';

interface TicketReplyBoxProps {
  ticketId: string;
  onReplySent?: () => void;
}

const templateCategories = {
  general: [
    { id: 'greeting', name: 'Begrüßung', content: 'Hallo! Vielen Dank für Ihre Kontaktaufnahme. Wie kann ich Ihnen heute helfen?' },
    { id: 'closing', name: 'Abschluss', content: 'Falls Sie weitere Fragen haben, zögern Sie nicht, uns zu kontaktieren. Einen schönen Tag noch!' },
    { id: 'follow-up', name: 'Nachfrage', content: 'Ich wollte nachfragen, ob alles jetzt einwandfrei funktioniert?' },
  ],
  support: [
    { id: 'investigating', name: 'Untersuchung', content: 'Wir untersuchen derzeit dieses Problem und werden uns in Kürze bei Ihnen melden. Vielen Dank für Ihre Geduld.' },
    { id: 'resolved', name: 'Gelöst', content: 'Dieses Problem wurde behoben. Bitte lassen Sie uns wissen, falls Sie weitere Unterstützung benötigen.' },
    { id: 'escalation', name: 'Eskalation', content: 'Ich habe dieses Ticket an unser technisches Team weitergeleitet für eine weitere Untersuchung. Sie werden in Kürze informiert.' },
  ],
  issues: [
    { id: 'apology', name: 'Entschuldigung', content: 'Wir entschuldigen uns aufrichtig für die Unannehmlichkeiten. Wir arbeiten daran, dies so schnell wie möglich zu lösen.' },
    { id: 'payment', name: 'Zahlung', content: 'Vielen Dank für Ihre Zahlung. Ihre Bestellung wird in Kürze bearbeitet.' },
    { id: 'shipping', name: 'Versand', content: 'Ihr Paket wurde versendet. Die Tracking-Informationen finden Sie in Ihrer Bestellbestätigung.' },
  ],
};

const MAX_MESSAGE_LENGTH = 5000;

export const TicketReplyBox = memo(function TicketReplyBox({ ticketId, onReplySent }: TicketReplyBoxProps) {
  const { isMobile } = useMobile();
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showReplyTemplates, setShowReplyTemplates] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<keyof typeof templateCategories>('general');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyMutation = useTicketReply();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { setTyping, clearTyping } = useTypingIndicator();

  // Auto-save draft to localStorage
  useEffect(() => {
    const draftKey = `ticket_reply_draft_${ticketId}`;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      setMessage(saved);
    }
  }, [ticketId]);

  useEffect(() => {
    const draftKey = `ticket_reply_draft_${ticketId}`;
    if (message) {
      localStorage.setItem(draftKey, message);
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [message, ticketId]);

  const handleSend = async () => {
    if (!message.trim() || message.length > MAX_MESSAGE_LENGTH) return;

    setSendStatus('sending');
    
    try {
      await replyMutation.mutateAsync({
        ticketId,
        message: message.trim(),
        isPrivate,
        attachments,
      });

      // Clear message and draft
      setMessage('');
      setAttachments([]);
      localStorage.removeItem(`ticket_reply_draft_${ticketId}`);
      setSendStatus('sent');
      clearTyping('admin');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      logger.logUserAction('ticket_reply_sent', { ticketId });
      
      // Success animation with haptic feedback
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(50); // Short vibration for success
      }
      
      toast.success(
        isPrivate ? 'Internal note sent' : 'Reply sent',
        isPrivate ? 'The note was added to the ticket' : 'Your reply has been sent successfully'
      );
      onReplySent?.();

      // Reset status after 2 seconds
      setTimeout(() => setSendStatus('idle'), 2000);
    } catch (error) {
      setSendStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reply';
      logger.error('Failed to send reply', error);
      toast.error('Failed to send reply', errorMessage);
      
      // Reset error status after 3 seconds
      setTimeout(() => setSendStatus('idle'), 3000);
    }
  };

  const handleTemplateSelect = (template: { id: string; name: string; content: string }) => {
    setMessage(template.content);
    setShowTemplates(false);
    textareaRef.current?.focus();
  };

  const handleReplyTemplateSelect = (template: any) => {
    // Replace template variables with actual values
    let content = template.content;
    // TODO: Replace variables like {{customer_name}}, {{agent_name}}, etc.
    setMessage(content);
    setShowReplyTemplates(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach(file => {
      if (file.size > maxSize) {
        invalidFiles.push(file.name);
        logger.warn('File too large', { fileName: file.name, size: file.size });
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      toast.warning(
        'Some files were skipped',
        `${invalidFiles.length} file(s) exceeded the 10MB limit`
      );
    }
    
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
      toast.success('Files attached', `${validFiles.length} file(s) added`);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* Templates */}
      {showTemplates && (
        <Card
          variant="glassmorphic"
          className={cn(
            'p-3',
            'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
            'backdrop-blur-xl border border-white/10',
            'shadow-xl'
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text">Schnellantworten</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplates(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Category Tabs */}
          <div className="flex gap-1 mb-3 pb-2 border-b border-white/10">
            {(Object.keys(templateCategories) as Array<keyof typeof templateCategories>).map(category => (
              <button
                key={category}
                onClick={() => setTemplateCategory(category)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg transition-all',
                  templateCategory === category
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'text-muted hover:text-text hover:bg-surface/30'
                )}
              >
                {category === 'general' ? 'Allgemein' : category === 'support' ? 'Support' : 'Probleme'}
              </button>
            ))}
          </div>
          
          {/* Templates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {templateCategories[templateCategory].map(template => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect(template)}
                className={cn(
                  'text-xs justify-start h-auto py-2 px-3',
                  'bg-surface/30 border-white/10',
                  'hover:bg-surface/50 hover:border-accent/30',
                  'transition-all duration-200'
                )}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <Card
          variant="glassmorphic"
          className={cn(
            'p-3',
            'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
            'backdrop-blur-xl border border-white/10'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Paperclip className="h-3.5 w-3.5 text-muted" />
            <span className="text-xs font-medium text-text">Anhänge ({attachments.length})</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {attachments.map((file, index) => {
              const isImage = file.type.startsWith('image/');
              const fileSize = file.size < 1024 * 1024 
                ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
              
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg',
                    'bg-surface/50 border border-white/10',
                    'hover:bg-surface/70 hover:border-accent/30',
                    'transition-all duration-200'
                  )}
                >
                  {isImage ? (
                    <div className="w-8 h-8 rounded bg-surface/50 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-muted" />
                    </div>
                  ) : (
                    <FileText className="h-4 w-4 text-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text truncate max-w-[150px]" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-[10px] text-muted">{fileSize}</div>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="ml-1 hover:bg-red-500/20 rounded-full p-1 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Reply Input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= MAX_MESSAGE_LENGTH) {
              setMessage(value);
              
              // Debounced typing indicator
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              
              if (value.trim().length > 0) {
                setTyping('admin', 'Admin');
                typingTimeoutRef.current = setTimeout(() => {
                  clearTyping('admin');
                }, 2000);
              } else {
                clearTyping('admin');
              }
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Antwort eingeben... (Cmd/Ctrl + Enter zum Senden)"
          className={cn(
            'min-h-[120px] pr-20',
            'bg-gradient-to-br from-surface/40 via-surface/30 to-surface/20',
            'backdrop-blur-sm border border-white/10',
            'focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
            'transition-all duration-200',
            message.length > MAX_MESSAGE_LENGTH * 0.9 && 'border-yellow-500/50',
            message.length >= MAX_MESSAGE_LENGTH && 'border-red-500/50'
          )}
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {/* Character Counter */}
          {message.length > 0 && (
            <span className={cn(
              'text-xs px-2',
              message.length > MAX_MESSAGE_LENGTH * 0.9 
                ? 'text-yellow-400' 
                : message.length >= MAX_MESSAGE_LENGTH
                ? 'text-red-400'
                : 'text-muted'
            )}>
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            id={`file-input-${ticketId}`}
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 p-0"
            title="Attach file"
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            className="h-8 w-8 p-0"
            title="Quick reply templates"
            aria-label="Templates"
          >
            <Smile className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyTemplates(!showReplyTemplates)}
            className={cn(
              'h-8 w-8 p-0',
              showReplyTemplates && 'bg-accent/20 text-accent'
            )}
            title="Advanced reply templates"
            aria-label="Reply Templates"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        'flex items-center justify-between',
        isMobile && 'flex-col gap-2 items-stretch'
      )}>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded border-white/20"
            aria-label="Internal note"
          />
          <span className="text-muted">Internal note (not visible to customer)</span>
        </label>
        <div className="flex items-center gap-2">
          {/* Send Status Indicator */}
          {sendStatus === 'sent' && (
            <div className="flex items-center gap-1 text-green-400 text-xs">
              <CheckCircle className="h-3 w-3" />
              <span>Sent</span>
            </div>
          )}
          {sendStatus === 'error' && (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>Failed</span>
            </div>
          )}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || replyMutation.isPending || message.length > MAX_MESSAGE_LENGTH}
            size="sm"
            className={cn(
              'min-w-[100px]',
              sendStatus === 'sending' && 'opacity-75'
            )}
          >
            {sendStatus === 'sending' || replyMutation.isPending ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Reply Templates Modal */}
      <AnimatePresence>
        {showReplyTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowReplyTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <ReplyTemplates
                onSelect={handleReplyTemplateSelect}
                onClose={() => setShowReplyTemplates(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});


