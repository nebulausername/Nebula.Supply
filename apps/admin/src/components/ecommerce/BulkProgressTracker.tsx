import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface BulkProgressTrackerProps {
  total: number;
  current: number;
  status: 'importing' | 'processing' | 'complete' | 'error';
  errors?: number;
  message?: string;
}

export function BulkProgressTracker({
  total,
  current,
  status,
  errors = 0,
  message
}: BulkProgressTrackerProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const success = status === 'complete' ? total - errors : current - errors;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              {status === 'importing' || status === 'processing' ? 'Processing...' : 
               status === 'complete' ? 'Complete' : 'Error'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {message || `Processing ${total} items`}
            </p>
          </div>
          <Badge variant="outline" className={
            status === 'complete' ? 'text-green-400 border-green-400' :
            status === 'error' ? 'text-red-400 border-red-400' :
            'text-blue-400 border-blue-400'
          }>
            {status === 'importing' || status === 'processing' ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : status === 'complete' ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            {percentage}%
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{current} of {total}</span>
            <span>{percentage}% complete</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium">Success</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{success}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium">Errors</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{errors}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Remaining</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{total - current}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}


