import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Package,
  Euro,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Crown,
  Lock,
  Globe,
  MoreHorizontal,
  Download,
  Copy,
  Share2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { logger } from '../../lib/logger';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  inventory: number;
  media: Array<{
    id: string;
    url: string;
    alt?: string;
  }>;
  badges?: string[];
  analytics?: {
    views: number;
    sales: number;
    conversion: number;
    trend: 'up' | 'down' | 'stable';
  };
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AdminProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (product: Product) => void;
  showAnalytics?: boolean;
  showStock?: boolean;
  enableQuickActions?: boolean;
  className?: string;
}

export const AdminProductCard = ({
  product,
  viewMode,
  onEdit,
  onDelete,
  onView,
  showAnalytics = true,
  showStock = true,
  enableQuickActions = true,
  className
}: AdminProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 🎨 Status Configuration
  const statusConfig = useMemo(() => {
    const configs = {
      active: {
        color: 'text-green-400 bg-green-500/20 border-green-500/30',
        icon: CheckCircle,
        label: 'Active'
      },
      inactive: {
        color: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
        icon: XCircle,
        label: 'Inactive'
      },
      draft: {
        color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
        icon: Clock,
        label: 'Draft'
      },
      archived: {
        color: 'text-red-400 bg-red-500/20 border-red-500/30',
        icon: AlertTriangle,
        label: 'Archived'
      }
    };
    return configs[product.status] || configs.inactive;
  }, [product.status]);

  // 📊 Stock Status
  const stockStatus = useMemo(() => {
    if (product.inventory === 0) {
      return {
        color: 'text-red-400 bg-red-500/20',
        icon: XCircle,
        label: 'Out of Stock',
        urgent: true
      };
    } else if (product.inventory <= 10) {
      return {
        color: 'text-orange-400 bg-orange-500/20',
        icon: AlertTriangle,
        label: 'Low Stock',
        urgent: true
      };
    } else {
      return {
        color: 'text-green-400 bg-green-500/20',
        icon: CheckCircle,
        label: 'In Stock',
        urgent: false
      };
    }
  }, [product.inventory]);

  // 📈 Trend Indicator
  const trendConfig = useMemo(() => {
    if (!product.analytics?.trend) return null;
    
    const configs = {
      up: {
        color: 'text-green-400',
        icon: TrendingUp,
        label: 'Rising'
      },
      down: {
        color: 'text-red-400',
        icon: TrendingDown,
        label: 'Falling'
      },
      stable: {
        color: 'text-gray-400',
        icon: TrendingUp,
        label: 'Stable'
      }
    };
    return configs[product.analytics.trend];
  }, [product.analytics?.trend]);

  // 🎯 Quick Actions
  const handleQuickAction = useCallback((action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    switch (action) {
      case 'edit':
        onEdit(product);
        break;
      case 'delete':
        onDelete(product.id);
        break;
      case 'view':
        onView(product);
        break;
      case 'duplicate':
        logger.info('Duplicate product:', product.id);
        break;
      case 'share':
        logger.info('Share product:', product.id);
        break;
      default:
        logger.warn('Unknown action:', action);
    }
  }, [product, onEdit, onDelete, onView]);

  // 🖼️ Image Handlers
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
  }, []);

  // 📱 Responsive Image
  const primaryImage = product.media?.[0];
  const fallbackImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0a0a0a"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#0BF7BC" font-family="Arial" font-size="16">
        ${product.name}
      </text>
    </svg>
  `)}`;

  if (viewMode === 'list') {
    return (
      <Card className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-accent/10",
        className
      )}>
        <div className="flex items-center space-x-4 p-4">
          {/* Image */}
          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
            {!imageError && primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                loading="lazy"
                decoding="async"
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            ) : (
              <img
                src={fallbackImage}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            
            {/* Status Badge */}
            <div className="absolute top-1 right-1">
              <Badge className={cn("text-xs", statusConfig.color)}>
                <statusConfig.icon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {product.description || 'No description'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-accent font-bold">
                    {product.currency} {product.price.toFixed(2)}
                  </span>
                  {showStock && (
                    <Badge className={cn("text-xs", stockStatus.color)}>
                      <stockStatus.icon className="w-3 h-3 mr-1" />
                      {product.inventory} left
                    </Badge>
                  )}
                </div>
              </div>

              {/* Analytics */}
              {showAnalytics && product.analytics && (
                <div className="text-right space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {product.analytics.views} views
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {product.analytics.sales} sales
                  </div>
                  {trendConfig && (
                    <div className={cn("text-xs flex items-center gap-1", trendConfig.color)}>
                      <trendConfig.icon className="w-3 h-3" />
                      {trendConfig.label}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {enableQuickActions && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => handleQuickAction('view', e)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => handleQuickAction('edit', e)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => handleQuickAction('delete', e)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Grid View
  return (
    <Card
      className={cn(
        "group relative overflow-hidden bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-white/10 hover:border-accent/30 transition-all duration-300 hover:shadow-2xl hover:shadow-accent/10",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        {!imageError && primaryImage ? (
          <picture>
            {/* WebP source for better compression */}
            <source
              srcSet={`${primaryImage.url}?format=webp&w=400 400w, ${primaryImage.url}?format=webp&w=800 800w`}
              type="image/webp"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            <img
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              loading="lazy"
              decoding="async"
              className={cn(
                "w-full h-full object-cover transition-all duration-500 group-hover:scale-110",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          </picture>
        ) : (
          <img
            src={fallbackImage}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={cn("text-xs", statusConfig.color)}>
            <statusConfig.icon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>

        {/* Stock Alert */}
        {showStock && stockStatus.urgent && (
          <div className="absolute top-3 right-3">
            <Badge className={cn("text-xs animate-pulse", stockStatus.color)}>
              <stockStatus.icon className="w-3 h-3 mr-1" />
              {stockStatus.label}
            </Badge>
          </div>
        )}

        {/* Hover Overlay with Actions */}
        <div className={cn(
          "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => handleQuickAction('view', e)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => handleQuickAction('edit', e)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => handleQuickAction('duplicate', e)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => handleQuickAction('delete', e)}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Product Badges */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1">
            {product.badges.slice(0, 2).map((badge, index) => (
              <Badge
                key={index}
                className="bg-accent text-black text-xs"
              >
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Title & Price */}
        <div className="space-y-1">
          <h3 className="font-semibold text-white truncate group-hover:text-accent transition-colors">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description || 'No description available'}
          </p>
        </div>

        {/* Price & Stock */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-accent font-bold text-lg">
              {product.currency} {product.price.toFixed(2)}
            </div>
            {showStock && (
              <div className="text-xs text-muted-foreground">
                {product.inventory} in stock
              </div>
            )}
          </div>
          
          {/* Analytics */}
          {showAnalytics && product.analytics && (
            <div className="text-right space-y-1">
              <div className="text-sm text-muted-foreground">
                {product.analytics.views} views
              </div>
              <div className="text-sm text-muted-foreground">
                {product.analytics.sales} sales
              </div>
              {trendConfig && (
                <div className={cn("text-xs flex items-center gap-1", trendConfig.color)}>
                  <trendConfig.icon className="w-3 h-3" />
                  {trendConfig.label}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs text-muted-foreground border-white/20"
              >
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground border-white/20"
              >
                +{product.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            <span>{product.media?.length || 0} images</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};





