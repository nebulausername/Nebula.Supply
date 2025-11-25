import React from 'react';
import { Badge } from '../ui/Badge';
import { Database, Cloud, AlertCircle } from 'lucide-react';

interface ProductSyncStatusProps {
  syncStatus?: {
    backend: number;
    frontend: number;
    total: number;
  };
  source?: 'backend' | 'frontend';
  className?: string;
}

export const ProductSyncStatus: React.FC<ProductSyncStatusProps> = ({
  syncStatus,
  source = 'backend',
  className = ''
}) => {
  if (!syncStatus) return null;

  const { backend, frontend, total } = syncStatus;
  const isMixed = backend > 0 && frontend > 0;
  const isFrontendOnly = source === 'frontend' || (frontend > 0 && backend === 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isMixed ? (
        <Badge variant="outline" className="text-yellow-400 border-yellow-400 bg-yellow-500/10">
          <AlertCircle className="w-3 h-3 mr-1" />
          Gemischt: {backend} Backend + {frontend} Frontend
        </Badge>
      ) : isFrontendOnly ? (
        <Badge variant="outline" className="text-blue-400 border-blue-400 bg-blue-500/10">
          <Cloud className="w-3 h-3 mr-1" />
          Frontend: {frontend} Produkte
        </Badge>
      ) : (
        <Badge variant="outline" className="text-green-400 border-green-400 bg-green-500/10">
          <Database className="w-3 h-3 mr-1" />
          Backend: {backend} Produkte
        </Badge>
      )}
      <span className="text-xs text-muted-foreground">
        ({total} gesamt)
      </span>
    </div>
  );
};

