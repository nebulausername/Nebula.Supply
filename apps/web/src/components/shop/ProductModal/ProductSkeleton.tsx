import { memo } from "react";

interface ProductSkeletonProps {
  isMobile: boolean;
}

// 🎯 Optimierte Skeleton Loader Komponente
export const ProductSkeleton = memo(({ isMobile }: ProductSkeletonProps) => {
  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
      {/* 🎯 Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-300/20 rounded-lg animate-pulse w-3/4"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-300/20 rounded-full animate-pulse w-16"></div>
          <div className="h-6 bg-gray-300/20 rounded-full animate-pulse w-20"></div>
        </div>
      </div>

      {/* 🎯 Image Skeleton */}
      <div className="space-y-4">
        <div 
          className={`bg-gray-300/20 rounded-2xl animate-pulse ${
            isMobile ? 'h-64' : 'h-80'
          }`}
        ></div>
        
        {/* 🎯 Thumbnail Skeleton */}
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className={`bg-gray-300/20 rounded-xl animate-pulse ${
                isMobile ? 'h-16 w-16' : 'h-20 w-20'
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* 🎯 Content Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-300/20 rounded-lg animate-pulse w-1/2"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300/20 rounded animate-pulse w-full"></div>
          <div className="h-4 bg-gray-300/20 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-gray-300/20 rounded animate-pulse w-4/6"></div>
        </div>
      </div>

      {/* 🎯 Variants Skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-300/20 rounded animate-pulse w-1/3"></div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-300/20 rounded-lg animate-pulse w-20"></div>
          ))}
        </div>
      </div>

      {/* 🎯 Actions Skeleton */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="h-12 bg-gray-300/20 rounded-xl animate-pulse flex-1"></div>
          <div className="h-12 bg-gray-300/20 rounded-xl animate-pulse flex-1"></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-8 bg-gray-300/20 rounded-lg animate-pulse"></div>
          <div className="h-8 bg-gray-300/20 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
});

ProductSkeleton.displayName = 'ProductSkeleton';
