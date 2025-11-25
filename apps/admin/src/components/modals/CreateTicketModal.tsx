import { useState, useCallback } from 'react';
import { X, Ticket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useCreateTicket } from '../../lib/api/hooks';
import { logger } from '../../lib/logger';
import { useToast } from '../ui/Toast';
import { cn } from '../../utils/cn';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
] as const;

const CATEGORIES = [
  { value: 'support', label: 'Support' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account' },
  { value: 'other', label: 'Other' }
] as const;

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState<string>('support');
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  
  const createTicketMutation = useCreateTicket();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      showToast({ type: 'error', title: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketData = {
        subject: subject.trim(),
        summary: description.trim(), // API expects 'summary' not 'description'
        priority,
        category,
        tags: []
      };

      await createTicketMutation.mutateAsync(ticketData);
      
      logger.info('Ticket created successfully', { subject, priority, category });
      showToast({ type: 'success', title: 'Ticket created successfully' });
      
      // Reset form
      setSubject('');
      setDescription('');
      setPriority('medium');
      setCategory('support');
      setUserId('');
      
      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('Failed to create ticket', { error });
      showToast({ type: 'error', title: 'Failed to create ticket', message: 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [subject, description, priority, category, userId, createTicketMutation, showToast, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setSubject('');
      setDescription('');
      setPriority('medium');
      setCategory('support');
      setUserId('');
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Create New Ticket
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Subject <span className="text-red-400">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter ticket subject"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue or request..."
            rows={6}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Priority and Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              disabled={isSubmitting}
              className={cn(
                'flex h-10 w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className={cn(
                'flex h-10 w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* User ID (Optional) */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            User ID <span className="text-muted-foreground text-xs">(Optional)</span>
          </label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID or Telegram ID"
            disabled={isSubmitting}
          />
        </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !description.trim()}
            >
              <Ticket className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

