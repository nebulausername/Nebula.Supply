import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/Select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/Tabs';
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  MessageSquare,
  Edit,
  Save,
  X,
  Copy,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Euro,
  Coins,
  AlertCircle
} from 'lucide-react';
import { OrderStatusBadge, OrderStatus } from './OrderStatusBadge';
import { OrderTimeline } from './OrderTimeline';
import { InlineEdit } from '../ui/InlineEdit';
import { cn } from '../../utils/cn';
import { TrackingInfo } from '../../lib/types/common';

export interface OrderDetails {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
  notes: OrderNote[];
  timeline: OrderEvent[];
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
  category?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  vatNumber?: string;
}

export interface OrderNote {
  id: string;
  content: string;
  author: string;
  isInternal: boolean;
  createdAt: string;
}

export interface OrderEvent {
  id: string;
  type: 'status_changed' | 'payment_confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'note_added' | 'tracking_updated';
  title: string;
  description: string;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
  trackingNumber?: string;
  carrier?: string;
  author?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface OrderDetailsModalProps {
  order: OrderDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (orderId: string, status: OrderStatus, trackingInfo?: TrackingInfo) => Promise<void>;
  onTrackingUpdate?: (orderId: string, trackingInfo: TrackingInfo) => Promise<void>;
  onNoteAdd?: (orderId: string, content: string, isInternal: boolean) => Promise<void>;
}

export function OrderDetailsModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  onTrackingUpdate,
  onNoteAdd
}: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLoyaltyAdjust, setShowLoyaltyAdjust] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState('');
  const [loyaltyReason, setLoyaltyReason] = useState('');
  const [loyaltyMultiplier, setLoyaltyMultiplier] = useState('1.0');
  const [isAdjustingLoyalty, setIsAdjustingLoyalty] = useState(false);

  if (!order) return null;

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (onStatusUpdate) {
      setIsSaving(true);
      try {
        await onStatusUpdate(order.id, newStatus);
        setIsEditingStatus(false);
      } catch (error) {
        console.error('Failed to update status:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleTrackingUpdate = async (trackingInfo: TrackingInfo) => {
    if (onTrackingUpdate) {
      setIsSaving(true);
      try {
        await onTrackingUpdate(order.id, trackingInfo);
        setIsEditingTracking(false);
      } catch (error) {
        console.error('Failed to update tracking:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddNote = async () => {
    if (onNoteAdd && newNote.trim()) {
      setIsSaving(true);
      try {
        await onNoteAdd(order.id, newNote.trim(), isInternalNote);
        setNewNote('');
        setIsInternalNote(false);
      } catch (error) {
        console.error('Failed to add note:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Order {order.orderId}
              </DialogTitle>
              <DialogDescription>
                Created {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString()}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} size="lg" />
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="space-y-4">
              {/* Order Status & Actions */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Order Status</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingStatus(!isEditingStatus)}
                    disabled={isSaving}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditingStatus ? 'Cancel' : 'Edit'}
                  </Button>
                </div>

                {isEditingStatus ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Status</label>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusUpdate(value as OrderStatus)}
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <OrderStatusBadge status={order.status} size="lg" />
                    {order.trackingNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-muted" />
                        <span className="text-muted">Tracking:</span>
                        <code className="bg-gray-800 px-2 py-1 rounded text-cyan-400">
                          {order.trackingNumber}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(order.trackingNumber!)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        {order.trackingUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(order.trackingUrl, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Customer Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted">Name</label>
                    <p className="text-text">{order.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Email</label>
                    <div className="flex items-center gap-2">
                      <p className="text-text">{order.customerEmail}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(order.customerEmail)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Customer ID</label>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-800 px-2 py-1 rounded text-sm">
                        {order.customerId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(order.customerId)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Payment Information */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted">Method</label>
                    <p className="text-text capitalize">{order.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Status</label>
                    <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'secondary'}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted">Total Amount</label>
                    <p className="text-text font-semibold">
                      {order.currency} {order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  {order.paymentId && (
                    <div>
                      <label className="text-sm font-medium text-muted">Payment ID</label>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-800 px-2 py-1 rounded text-sm">
                          {order.paymentId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(order.paymentId!)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items
                </h3>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border border-white/10 rounded-lg">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-text">{item.productName}</h4>
                        {item.variantName && (
                          <p className="text-sm text-muted">Variant: {item.variantName}</p>
                        )}
                        <p className="text-sm text-muted">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted">Qty: {item.quantity}</p>
                        <p className="font-medium text-text">
                          {order.currency} {(item.unitPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="shipping" className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h3>
                <div className="space-y-2">
                  <p className="text-text">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  {order.shippingAddress.company && (
                    <p className="text-text">{order.shippingAddress.company}</p>
                  )}
                  <p className="text-text">{order.shippingAddress.street}</p>
                  <p className="text-text">
                    {order.shippingAddress.postalCode} {order.shippingAddress.city}
                  </p>
                  <p className="text-text">{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="text-text flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </Card>

              {order.billingAddress && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                  <div className="space-y-2">
                    <p className="text-text">
                      {order.billingAddress.firstName} {order.billingAddress.lastName}
                    </p>
                    {order.billingAddress.company && (
                      <p className="text-text">{order.billingAddress.company}</p>
                    )}
                    <p className="text-text">{order.billingAddress.street}</p>
                    <p className="text-text">
                      {order.billingAddress.postalCode} {order.billingAddress.city}
                    </p>
                    <p className="text-text">{order.billingAddress.country}</p>
                    {order.billingAddress.phone && (
                      <p className="text-text flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {order.billingAddress.phone}
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
                <OrderTimeline events={order.timeline} />
              </Card>

              {/* Loyalty Points Adjustment (Admin Only) */}
              {order.status === 'delivered' && (
                <Card className="p-4 border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      Loyalty Punkte Anpassung
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLoyaltyAdjust(!showLoyaltyAdjust)}
                    >
                      {showLoyaltyAdjust ? 'Ausblenden' : 'Anpassen'}
                    </Button>
                  </div>

                  {showLoyaltyAdjust && (
                    <div className="space-y-4 pt-4 border-t border-yellow-500/20">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                          <div className="text-sm text-blue-300">
                            <p className="font-medium mb-1">Punkte werden normalerweise automatisch vergeben</p>
                            <p className="text-blue-400">Nutze diese Funktion nur bei Verspätungen oder Sonderfällen</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">
                            Punkte (optional)
                          </label>
                          <Input
                            type="number"
                            placeholder="z.B. +50 oder -20"
                            value={loyaltyPoints}
                            onChange={(e) => setLoyaltyPoints(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">
                            Multiplikator (optional)
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="10"
                            placeholder="1.0 = Standard"
                            value={loyaltyMultiplier}
                            onChange={(e) => setLoyaltyMultiplier(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          Grund für Anpassung
                        </label>
                        <Textarea
                          placeholder="z.B. Verspätung, Sonderaktion, etc."
                          value={loyaltyReason}
                          onChange={(e) => setLoyaltyReason(e.target.value)}
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={async () => {
                          if (!loyaltyReason.trim()) {
                            alert('Bitte gib einen Grund an');
                            return;
                          }
                          setIsAdjustingLoyalty(true);
                          try {
                            const points = loyaltyPoints ? parseInt(loyaltyPoints) : undefined;
                            const multiplier = loyaltyMultiplier ? parseFloat(loyaltyMultiplier) : undefined;
                            
                            // Calculate points if multiplier is provided
                            let finalPoints = points;
                            if (multiplier && !points) {
                              const orderValueInEuros = order.totalAmount / 100;
                              finalPoints = Math.floor(orderValueInEuros * multiplier);
                            }

                            const response = await fetch(`/api/loyalty/${order.customerId}/adjust-points`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                points: finalPoints || 0,
                                reason: loyaltyReason,
                                orderId: order.id,
                                multiplier: multiplier
                              })
                            });

                            if (response.ok) {
                              alert(`Loyalty Punkte erfolgreich angepasst: ${finalPoints || 'berechnet'} Punkte`);
                              setLoyaltyPoints('');
                              setLoyaltyReason('');
                              setLoyaltyMultiplier('1.0');
                              setShowLoyaltyAdjust(false);
                            } else {
                              alert('Fehler beim Anpassen der Punkte');
                            }
                          } catch (error) {
                            console.error('Failed to adjust loyalty points:', error);
                            alert('Fehler beim Anpassen der Punkte');
                          } finally {
                            setIsAdjustingLoyalty(false);
                          }
                        }}
                        disabled={!loyaltyReason.trim() || isAdjustingLoyalty}
                        className="w-full"
                      >
                        {isAdjustingLoyalty ? 'Wird angepasst...' : 'Punkte anpassen'}
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {/* Add Note */}
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Add Note
                </h3>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Add a note about this order..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded border-white/20 bg-black/25"
                      />
                      <span className="text-sm">Internal note (not visible to customer)</span>
                    </label>
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isSaving}
                      size="sm"
                    >
                      {isSaving ? 'Adding...' : 'Add Note'}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

































































