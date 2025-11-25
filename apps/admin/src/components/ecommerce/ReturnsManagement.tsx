import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import {
  Package,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  Mail,
  RefreshCw,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { springConfigs } from '../../utils/springConfigs';

interface Return {
  id: string;
  orderId: string;
  returnNumber: string;
  customerName: string;
  items: Array<{
    productName: string;
    quantity: number;
    reason: string;
  }>;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'in_transit' | 'received' | 'completed';
  requestedAt: string;
  totalAmount: number;
}

// Mock data for now
const mockReturns: Return[] = [
  {
    id: '1',
    orderId: 'ORD-12345',
    returnNumber: 'RET-001',
    customerName: 'Max Mustermann',
    items: [
      { productName: 'Nike Air Max 95', quantity: 1, reason: 'Size too small' }
    ],
    reason: 'Size exchange needed',
    status: 'requested',
    requestedAt: new Date().toISOString(),
    totalAmount: 189.99,
  },
];

const statusConfig = {
  requested: { label: 'Requested', color: 'text-yellow-400 border-yellow-400', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-400 border-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-400 border-red-400', icon: XCircle },
  in_transit: { label: 'In Transit', color: 'text-blue-400 border-blue-400', icon: Package },
  received: { label: 'Received', color: 'text-purple-400 border-purple-400', icon: ArrowLeft },
  completed: { label: 'Completed', color: 'text-green-400 border-green-400', icon: CheckCircle },
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

export function ReturnsManagement() {
  const [returns, setReturns] = useState<Return[]>(mockReturns);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  const handleApprove = (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setRefundAmount(returnItem.totalAmount);
  };

  const handleReject = (returnItem: Return) => {
    setSelectedReturn(returnItem);
  };

  const confirmApproval = () => {
    if (!selectedReturn) return;
    // API call would go here
    setReturns(prev => 
      prev.map(r => r.id === selectedReturn.id ? { ...r, status: 'approved' } : r)
    );
    setSelectedReturn(null);
    setAdminNotes('');
  };

  const confirmRejection = () => {
    if (!selectedReturn) return;
    // API call would go here
    setReturns(prev => 
      prev.map(r => r.id === selectedReturn.id ? { ...r, status: 'rejected' } : r)
    );
    setSelectedReturn(null);
    setAdminNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ArrowLeft className="w-7 h-7 text-blue-400" />
            Returns & Refunds Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Process return requests and manage refunds
          </p>
        </div>

        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-4">
        {[
          { label: 'Pending', value: returns.filter(r => r.status === 'requested').length, color: 'orange' },
          { label: 'Approved', value: returns.filter(r => r.status === 'approved').length, color: 'green' },
          { label: 'In Transit', value: returns.filter(r => r.status === 'in_transit').length, color: 'blue' },
          { label: 'Completed', value: returns.filter(r => r.status === 'completed').length, color: 'purple' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfigs.gentle, delay: index * 0.05 }}
          >
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Returns List */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Return Requests</h3>
          
          <div className="space-y-4">
            {returns.map((returnItem, index) => {
              const statusInfo = statusConfig[returnItem.status];
              const StatusIcon = statusInfo.icon;

              return (
                <motion.div
                  key={returnItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg bg-gray-800/30 border border-white/10 hover:bg-gray-800/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    {/* Return Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{returnItem.returnNumber}</h4>
                        <Badge variant="outline" className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          <span>Order: {returnItem.orderId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>Customer: {returnItem.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(returnItem.requestedAt)}</span>
                        </div>
                      </div>

                      <div className="mt-3 p-3 rounded-lg bg-gray-900/50">
                        <p className="text-sm font-medium text-white mb-2">Items:</p>
                        {returnItem.items.map((item, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground">
                            • {item.productName} (x{item.quantity}) - {item.reason}
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="font-semibold text-green-400">
                          {formatCurrency(returnItem.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {returnItem.status === 'requested' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(returnItem)}
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(returnItem)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {returns.length === 0 && (
            <div className="text-center py-12">
              <ArrowLeft className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No return requests</h3>
              <p className="text-muted-foreground">All caught up!</p>
            </div>
          )}
        </div>
      </Card>

      {/* Approval/Rejection Dialog */}
      {selectedReturn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReturn(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springConfigs.bouncy }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Process Return: {selectedReturn.returnNumber}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Refund Amount
                </label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                  placeholder="Enter refund amount"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Admin Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for this return..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedReturn(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmApproval}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Refund
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

