import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  RefreshCw, 
  ExternalLink, 
  Eye,
  EyeOff,
  Settings,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
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
  category?: string;
  tags?: string[];
}

interface FrontendPreviewProps {
  product: Product;
  mode?: 'desktop' | 'tablet' | 'mobile';
  showControls?: boolean;
  enableFullscreen?: boolean;
  className?: string;
}

export const FrontendPreview = ({
  product,
  mode: initialMode = 'desktop',
  showControls = true,
  enableFullscreen = true,
  className
}: FrontendPreviewProps) => {
  const [mode, setMode] = useState<'desktop' | 'tablet' | 'mobile'>(initialMode);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🎨 Device Configuration
  const deviceConfig = useMemo(() => {
    const configs = {
      desktop: {
        width: '100%',
        maxWidth: '1200px',
        height: '800px',
        icon: Monitor,
        label: 'Desktop',
        breakpoint: 'lg'
      },
      tablet: {
        width: '768px',
        maxWidth: '768px',
        height: '1024px',
        icon: Tablet,
        label: 'Tablet',
        breakpoint: 'md'
      },
      mobile: {
        width: '375px',
        maxWidth: '375px',
        height: '667px',
        icon: Smartphone,
        label: 'Mobile',
        breakpoint: 'sm'
      }
    };
    return configs[mode];
  }, [mode]);

  // 🖼️ Product Image Component (Frontend Style)
  const ProductImage = useCallback(({ 
    src, 
    alt, 
    className: imgClassName 
  }: { 
    src: string; 
    alt: string; 
    className?: string; 
  }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleLoad = () => {
      setImageLoaded(true);
      setImageError(false);
    };

    const handleError = () => {
      setImageError(true);
      setImageLoaded(false);
    };

    const fallbackImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#0a0a0a"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#0BF7BC" font-family="Arial" font-size="16">
          ${alt}
        </text>
      </svg>
    `)}`;

    return (
      <div className={cn("relative overflow-hidden rounded-xl border border-white/10 bg-[#05070b]", imgClassName)}>
        {!imageError && src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : (
          <img
            src={fallbackImage}
            alt={alt}
            className="h-full w-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(11,247,188,0.08),transparent_70%)]" />
      </div>
    );
  }, []);

  // 🔄 Refresh Handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRefreshKey(prev => prev + 1);
      logger.info('Frontend preview refreshed', { productId: product.id, mode });
    } catch (error) {
      logger.error('Failed to refresh preview:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [product.id, mode]);

  // 📱 Mode Change Handler
  const handleModeChange = useCallback((newMode: 'desktop' | 'tablet' | 'mobile') => {
    setMode(newMode);
    logger.info('Preview mode changed', { from: mode, to: newMode });
  }, [mode]);

  // 🖥️ Fullscreen Handler
  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    logger.info('Fullscreen toggled', { isFullscreen: !isFullscreen });
  }, [isFullscreen]);

  // 🎨 Frontend Product Card Component
  const FrontendProductCard = useCallback(() => {
    const primaryImage = product.media?.[0];
    
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm transition-all duration-300 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/10">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          {primaryImage ? (
            <ProductImage
              src={primaryImage.url}
              alt={primaryImage.alt || product.name}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}

          {/* Product Badges */}
          {product.badges && product.badges.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-1">
              {product.badges.slice(0, 2).map((badge, index) => (
                <Badge
                  key={index}
                  className="bg-accent text-black text-xs font-bold"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button className="bg-accent text-black hover:bg-accent/90">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-white truncate group-hover:text-accent transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description || 'No description available'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-accent font-bold text-lg">
                {product.currency} {product.price.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                {product.inventory} in stock
              </div>
            </div>
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
            </div>
          )}
        </div>
      </div>
    );
  }, [product, ProductImage]);

  // 🎨 Frontend Product Modal Component
  const FrontendProductModal = useCallback(() => {
    const primaryImage = product.media?.[0];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0B0B12] to-[#050509] p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden border-2 border-white/20 bg-black/30 shadow-2xl">
                {primaryImage ? (
                  <ProductImage
                    src={primaryImage.url}
                    alt={primaryImage.alt || product.name}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <span className="text-gray-400 text-lg">No Image Available</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {product.media && product.media.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.media.slice(0, 4).map((media, index) => (
                    <div key={media.id} className="aspect-square rounded-lg overflow-hidden border border-white/20">
                      <ProductImage
                        src={media.url}
                        alt={media.alt || `${product.name} ${index + 1}`}
                        className="w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                <p className="text-muted-foreground text-lg">{product.description}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-accent">
                  {product.currency} {product.price.toFixed(2)}
                </span>
                {product.badges && product.badges.length > 0 && (
                  <Badge className="bg-accent text-black">
                    {product.badges[0]}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Stock:</span>
                  <span className="text-white">{product.inventory} available</span>
                </div>
                
                {product.category && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <span className="text-white">{product.category}</span>
                  </div>
                )}
              </div>

              <Button className="w-full bg-accent text-black hover:bg-accent/90 text-lg py-3">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [product, ProductImage]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Frontend Preview</h3>
            <Badge className="bg-green-500/20 text-green-400">
              Live Sync
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Mode Toggle */}
            <div className="flex rounded-lg border border-white/20 p-1">
              {(['desktop', 'tablet', 'mobile'] as const).map((deviceMode) => {
                const Icon = deviceConfig.icon;
                return (
                  <Button
                    key={deviceMode}
                    size="sm"
                    variant={mode === deviceMode ? 'default' : 'ghost'}
                    onClick={() => handleModeChange(deviceMode)}
                    className="px-3"
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                );
              })}
            </div>

            {/* Refresh Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            </Button>

            {/* Fullscreen Button */}
            {enableFullscreen && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}

            {/* Settings Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className={cn(
        "relative mx-auto bg-gray-900 rounded-lg overflow-hidden shadow-2xl",
        isFullscreen && "fixed inset-0 z-50 rounded-none"
      )}>
        {/* Device Frame */}
        <div 
          className="relative mx-auto bg-black rounded-lg overflow-hidden"
          style={{
            width: deviceConfig.width,
            maxWidth: deviceConfig.maxWidth,
            height: deviceConfig.height
          }}
        >
          {/* Device Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs text-gray-400">
              {deviceConfig.label} Preview
            </div>
            <div className="text-xs text-gray-400">
              {mode === 'mobile' ? '375×667' : mode === 'tablet' ? '768×1024' : '1200×800'}
            </div>
          </div>

          {/* Preview Content */}
          <div className="h-full overflow-auto bg-gradient-to-br from-black via-[#0B0B12] to-[#050509]">
            <div key={refreshKey} className="p-4">
              {mode === 'mobile' ? (
                <FrontendProductCard />
              ) : (
                <FrontendProductModal />
              )}
            </div>
          </div>
        </div>

        {/* Fullscreen Overlay */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-10">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleFullscreen}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="p-4">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Preview Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Device Mode</label>
                <select
                  value={mode}
                  onChange={(e) => handleModeChange(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-gray-800 border border-white/20 text-white"
                >
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                  <option value="mobile">Mobile</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Refresh Rate</label>
                <select className="w-full p-2 rounded-lg bg-gray-800 border border-white/20 text-white">
                  <option value="realtime">Real-time</option>
                  <option value="5s">5 seconds</option>
                  <option value="10s">10 seconds</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};





