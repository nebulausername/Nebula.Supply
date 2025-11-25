import { useState, useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import { useCreateCustomer } from '../../lib/api/hooks';
import { cn } from '../../utils/cn';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CUSTOMER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'vip', label: 'VIP' },
] as const;

export function CreateCustomerModal({ isOpen, onClose, onSuccess }: CreateCustomerModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'vip'>('active');
  
  const { showToast } = useToast();
  const createCustomerMutation = useCreateCustomer();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showToast({ type: 'error', title: 'Email is required' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast({ type: 'error', title: 'Please enter a valid email address' });
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      showToast({ type: 'error', title: 'First name and last name are required' });
      return;
    }

    try {
      const customerData = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        status,
      };

      await createCustomerMutation.mutateAsync(customerData);
      
      logger.info('Customer created successfully', { email, firstName, lastName, status });
      showToast({ type: 'success', title: 'Customer created successfully' });
      
      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setStatus('active');
      
      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('Failed to create customer', { error });
      showToast({ 
        type: 'error', 
        title: 'Failed to create customer', 
        message: error instanceof Error ? error.message : 'Please try again.' 
      });
    }
  }, [email, firstName, lastName, phone, status, createCustomerMutation, showToast, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!createCustomerMutation.isPending) {
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setStatus('active');
      onClose();
    }
  }, [createCustomerMutation.isPending, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Create New Customer
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              required
              disabled={createCustomerMutation.isPending}
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                First Name <span className="text-red-400">*</span>
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                disabled={createCustomerMutation.isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Last Name <span className="text-red-400">*</span>
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                disabled={createCustomerMutation.isPending}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Phone <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 123 456789"
              disabled={createCustomerMutation.isPending}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Status <span className="text-red-400">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              disabled={createCustomerMutation.isPending}
              className={cn(
                'flex h-10 w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {CUSTOMER_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCustomerMutation.isPending || !email.trim() || !firstName.trim() || !lastName.trim()}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
