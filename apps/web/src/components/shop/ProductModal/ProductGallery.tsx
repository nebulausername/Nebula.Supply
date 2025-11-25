import { memo } from "react";
import type { Product, ProductMedia } from "@nebula/shared";
import { ProductImage } from "../../media/ProductImage";
import { StaggeredAnimation } from "./StaggeredAnimation";

interface ProductGalleryProps {
  product: Product;
  activeMedia: ProductMedia | null;
  fallbackColor: string;
  onThumbnailClick: (mediaId: string, colorValue?: string) => void;
  isMobile: boolean;
}

// 🎯 Optimierte Gallery-Komponente
export const ProductGallery = memo(({ 
  product, 
  activeMedia, 
  fallbackColor, 
  onThumbnailClick, 
  isMobile 
}: ProductGalleryProps) => {
  return (
    <section id="overview" className={`${isMobile ? 'min-h-[60vh] p-4' : 'min-h-screen p-6 md:p-8'}`}>
      <div className={`${isMobile ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
        {/* 🎯 Hauptbild */}
        {activeMedia && (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 bg-black/30 shadow-2xl">
              <ProductImage
                src={activeMedia.url}
                alt={activeMedia.alt}
                fallbackColor={fallbackColor}
                overlayLabel={product.name}
                aspectRatio={isMobile ? "1 / 1" : "4 / 3"}
                priority
                className="w-full h-auto"
              />
              
              {/* 🎯 Overlay mit Produktname */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                <h3 className="text-2xl font-bold text-white drop-shadow-lg">{product.name}</h3>
                <p className="text-white/90 text-sm drop-shadow-md">Premium Qualität</p>
              </div>
              
              {/* 🎯 Top Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-accent text-black px-3 py-1 rounded-full text-sm font-bold">
                  {product.badges?.[0] || "Neu"}
                </span>
              </div>
            </div>
            
            {/* 🎯 Thumbnail Gallery */}
            {product.media.length > 1 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-text flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  Weitere Ansichten
                </h4>
                <StaggeredAnimation 
                  staggerDelay={100} 
                  direction="up"
                  className="flex gap-3 overflow-x-auto pb-2"
                >
                  {product.media.map((media) => {
                    const isActive = media.id === activeMedia.id;
                    return (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => onThumbnailClick(media.id, media.color)}
                        className={`group rounded-xl border-2 p-1 transition-all duration-300 hover:scale-105 flex-shrink-0 ${
                          isActive
                            ? "border-accent shadow-lg shadow-accent/20 bg-accent/10 scale-105" 
                            : "border-white/20 hover:border-accent/40 bg-white/5 hover:shadow-md"
                        }`}
                        aria-label={`Ansicht ${media.alt}`}
                      >
                        <ProductImage
                          src={media.url}
                          alt={media.alt}
                          aspectRatio="1 / 1"
                          fallbackColor={fallbackColor}
                          overlayLabel={media.color ?? product.name}
                          className={`${isMobile ? 'h-16 w-16' : 'h-20 w-20'} rounded-lg transition-transform duration-300 group-hover:scale-105`}
                        />
                      </button>
                    );
                  })}
                </StaggeredAnimation>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
});

ProductGallery.displayName = 'ProductGallery';
