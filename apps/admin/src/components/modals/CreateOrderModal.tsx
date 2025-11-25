import { useState, useCallback, useMemo } from 'react';
import { ShoppingBag, Plus, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { useToast } from '../ui/Toast';
import { logger } from '../../lib/logger';
import { useCreateOrder } from '../../lib/api/hooks';
import { useProducts } from '../../lib/api/hooks';
import { useCustomers } from '../../lib/api/hooks';
import { cn } from '../../utils/cn';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OrderItem {
  id: string;
  type: 'shop' | 'drop';
  name: string;
  variant: string;
  price: number;
  quantity: number;
}

const PAYMENT_METHODS = [
  { value: 'btc_chain', label: 'Bitcoin (Chain)' },
  { value: 'btc_lightning', label: 'Bitcoin (Lightning)' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'paypal', label: 'PayPal' },
] as const;

export function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const [userId, setUserId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('btc_chain');
  const [currency, setCurrency] = useState('EUR');
  
  // Shipping Address
  const [shippingFirstName, setShippingFirstName] = useState('');
  const [shippingLastName, setShippingLastName] = useState('');
  const [shippingAddress1, setShippingAddress1] = useState('');
  const [shippingAddress2, setShippingAddress2] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCountry, setShippingCountry] = useState('DE');
  
  // Billing Address (optional)
  const [useBillingAddress, setUseBillingAddress] = useState(false);
  const [billingFirstName, setBillingFirstName] = useState('');
  const [billingLastName, setBillingLastName] = useState('');
  const [billingAddress1, setBillingAddress1] = useState('');
  const [billingAddress2, setBillingAddress2] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingPostalCode, setBillingPostalCode] = useState('');
  const [billingCountry, setBillingCountry] = useState('DE');

  const { showToast } = useToast();
  const createOrderMutation = useCreateOrder();
  const { data: productsData } = useProducts({ limit: 100 });
  const { data: customersData } = useCustomers({ limit: 100 });

  const products = productsData?.data || [];
  const customers = customersData?.data || [];

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const handleAddItem = useCallback(() => {
    if (!selectedProductId || !selectedVariant || itemQuantity < 1) {
      showToast({ type: 'error', title: 'Please select a product and variant' });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const variant = product.variants?.find((v: any) => v.id === selectedVariant || v.label === selectedVariant);
    const price = variant?.basePrice || product.price || 0;
    const variantLabel = variant?.label || 'Standard';

    const newItem: OrderItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: product.type || 'shop',
      name: product.name,
      variant: variantLabel,
      price,
      quantity: itemQuantity,
    };

    setItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setSelectedVariant('');
    setItemQuantity(1);
  }, [selectedProductId, selectedVariant, itemQuantity, products, showToast]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      showToast({ type: 'error', title: 'User ID is required' });
      return;
    }

    if (items.length === 0) {
      showToast({ type: 'error', title: 'Please add at least one item' });
      return;
    }

    if (!shippingFirstName.trim() || !shippingLastName.trim() || !shippingAddress1.trim() || 
        !shippingCity.trim() || !shippingPostalCode.trim() || !shippingCountry.trim()) {
      showToast({ type: 'error', title: 'Please fill in all required shipping address fields' });
      return;
    }

    try {
      const orderData = {
        userId: userId.trim(),
        items: items.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          variant: item.variant,
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress: {
          firstName: shippingFirstName.trim(),
          lastName: shippingLastName.trim(),
          address1: shippingAddress1.trim(),
          address2: shippingAddress2.trim() || undefined,
          city: shippingCity.trim(),
          postalCode: shippingPostalCode.trim(),
          country: shippingCountry.trim(),
        },
        billingAddress: useBillingAddress && billingFirstName.trim() ? {
          firstName: billingFirstName.trim(),
          lastName: billingLastName.trim(),
          address1: billingAddress1.trim(),
          address2: billingAddress2.trim() || undefined,
          city: billingCity.trim(),
          postalCode: billingPostalCode.trim(),
          country: billingCountry.trim(),
        } : undefined,
        paymentMethod,
        totalAmount,
        currency,
      };

      await createOrderMutation.mutateAsync(orderData);
      
      logger.info('Order created successfully', { userId, itemCount: items.length, totalAmount });
      showToast({ type: 'success', title: 'Order created successfully' });
      
      // Reset form
      setUserId('');
      setItems([]);
      setShippingFirstName('');
      setShippingLastName('');
      setShippingAddress1('');
      setShippingAddress2('');
      setShippingCity('');
      setShippingPostalCode('');
      setShippingCountry('DE');
      setUseBillingAddress(false);
      setBillingFirstName('');
      setBillingLastName('');
      setBillingAddress1('');
      setBillingAddress2('');
      setBillingCity('');
      setBillingPostalCode('');
      setBillingCountry('DE');
      setPaymentMethod('btc_chain');
      setCurrency('EUR');
      
      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('Failed to create order', { error });
      showToast({ 
        type: 'error', 
        title: 'Failed to create order', 
        message: error instanceof Error ? error.message : 'Please try again.' 
      });
    }
  }, [
    userId, items, shippingFirstName, shippingLastName, shippingAddress1, shippingCity,
    shippingPostalCode, shippingCountry, useBillingAddress, billingFirstName, billingLastName,
    billingAddress1, billingCity, billingPostalCode, billingCountry, paymentMethod, totalAmount,
    currency, createOrderMutation, showToast, onSuccess, onClose
  ]);

  const handleClose = useCallback(() => {
    if (!createOrderMutation.isPending) {
      setUserId('');
      setItems([]);
      setShippingFirstName('');
      setShippingLastName('');
      setShippingAddress1('');
      setShippingAddress2('');
      setShippingCity('');
      setShippingPostalCode('');
      setShippingCountry('DE');
      onClose();
    }
  }, [createOrderMutation.isPending, onClose]);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const availableVariants = selectedProduct?.variants || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Create New Order
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              User ID <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID or select customer"
                required
                disabled={createOrderMutation.isPending}
                className="flex-1"
              />
              {customers.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const customer = customers.find(c => c.id === e.target.value);
                      if (customer) {
                        setUserId(customer.id);
                        setShippingFirstName(customer.firstName || '');
                        setShippingLastName(customer.lastName || '');
                      }
                    }
                  }}
                  className={cn(
                    'flex h-10 w-48 rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                >
                  <option value="">Select Customer...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} ({customer.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Order Items <span className="text-red-400">*</span>
            </label>
            <div className="space-y-4">
              {/* Add Item */}
              <div className="flex gap-2 p-4 border border-white/10 rounded-lg bg-black/20">
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setSelectedVariant('');
                  }}
                  disabled={createOrderMutation.isPending}
                  className={cn(
                    'flex h-10 flex-1 rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                >
                  <option value="">Select Product...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.type || 'shop'})
                    </option>
                  ))}
                </select>
                {selectedProduct && availableVariants.length > 0 && (
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    disabled={createOrderMutation.isPending}
                    className={cn(
                      'flex h-10 w-40 rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  >
                    <option value="">Select Variant...</option>
                    {availableVariants.map((variant: any) => (
                      <option key={variant.id || variant.label} value={variant.id || variant.label}>
                        {variant.label} - {variant.basePrice || product.price}€
                      </option>
                    ))}
                  </select>
                )}
                <Input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  disabled={createOrderMutation.isPending}
                  className="w-20"
                  placeholder="Qty"
                />
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={createOrderMutation.isPending || !selectedProductId}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-black/20">
                      <div className="flex-1">
                        <div className="font-medium text-text">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.variant} × {item.quantity} = {(item.price * item.quantity).toFixed(2)}€
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={createOrderMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right pt-2 border-t border-white/10">
                    <div className="text-lg font-semibold text-text">
                      Total: {totalAmount.toFixed(2)}€
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Shipping Address <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                value={shippingFirstName}
                onChange={(e) => setShippingFirstName(e.target.value)}
                placeholder="First Name"
                required
                disabled={createOrderMutation.isPending}
              />
              <Input
                value={shippingLastName}
                onChange={(e) => setShippingLastName(e.target.value)}
                placeholder="Last Name"
                required
                disabled={createOrderMutation.isPending}
              />
              <Input
                value={shippingAddress1}
                onChange={(e) => setShippingAddress1(e.target.value)}
                placeholder="Address Line 1"
                required
                disabled={createOrderMutation.isPending}
                className="col-span-2"
              />
              <Input
                value={shippingAddress2}
                onChange={(e) => setShippingAddress2(e.target.value)}
                placeholder="Address Line 2 (Optional)"
                disabled={createOrderMutation.isPending}
                className="col-span-2"
              />
              <Input
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                placeholder="City"
                required
                disabled={createOrderMutation.isPending}
              />
              <Input
                value={shippingPostalCode}
                onChange={(e) => setShippingPostalCode(e.target.value)}
                placeholder="Postal Code"
                required
                disabled={createOrderMutation.isPending}
              />
              <Input
                value={shippingCountry}
                onChange={(e) => setShippingCountry(e.target.value)}
                placeholder="Country"
                required
                disabled={createOrderMutation.isPending}
                className="col-span-2"
              />
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={useBillingAddress}
                onChange={(e) => setUseBillingAddress(e.target.checked)}
                disabled={createOrderMutation.isPending}
                className="rounded border-white/20"
              />
              <span className="text-sm font-medium text-text">Use different billing address</span>
            </label>
            {useBillingAddress && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  value={billingFirstName}
                  onChange={(e) => setBillingFirstName(e.target.value)}
                  placeholder="First Name"
                  disabled={createOrderMutation.isPending}
                />
                <Input
                  value={billingLastName}
                  onChange={(e) => setBillingLastName(e.target.value)}
                  placeholder="Last Name"
                  disabled={createOrderMutation.isPending}
                />
                <Input
                  value={billingAddress1}
                  onChange={(e) => setBillingAddress1(e.target.value)}
                  placeholder="Address Line 1"
                  disabled={createOrderMutation.isPending}
                  className="col-span-2"
                />
                <Input
                  value={billingAddress2}
                  onChange={(e) => setBillingAddress2(e.target.value)}
                  placeholder="Address Line 2 (Optional)"
                  disabled={createOrderMutation.isPending}
                  className="col-span-2"
                />
                <Input
                  value={billingCity}
                  onChange={(e) => setBillingCity(e.target.value)}
                  placeholder="City"
                  disabled={createOrderMutation.isPending}
                />
                <Input
                  value={billingPostalCode}
                  onChange={(e) => setBillingPostalCode(e.target.value)}
                  placeholder="Postal Code"
                  disabled={createOrderMutation.isPending}
                />
                <Input
                  value={billingCountry}
                  onChange={(e) => setBillingCountry(e.target.value)}
                  placeholder="Country"
                  disabled={createOrderMutation.isPending}
                  className="col-span-2"
                />
              </div>
            )}
          </div>

          {/* Payment Method & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Payment Method <span className="text-red-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={createOrderMutation.isPending}
                className={cn(
                  'flex h-10 w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Currency <span className="text-red-400">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={createOrderMutation.isPending}
                className={cn(
                  'flex h-10 w-full rounded-md border border-white/20 bg-black/25 px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createOrderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createOrderMutation.isPending || items.length === 0 || !userId.trim()}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
