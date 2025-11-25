// 🎯 Enhanced Skeleton Loader Components
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { springConfigs } from "../../utils/springConfigs";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton = ({ 
  className, 
  width = "100%", 
  height = "1rem", 
  rounded = true,
  animate = true
}: SkeletonProps) => {
  return (
    <motion.div
      className={cn(
        "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
        "bg-[length:200%_100%]",
        rounded && "rounded-lg",
        animate && "animate-pulse",
        className
      )}
      style={{ width, height }}
      animate={animate ? {
        backgroundPosition: ["200% 0", "-200% 0"],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }
      } : {}}
    />
  );
};

// Card Skeleton
export const CardSkeleton = ({ className }: { className?: string }) => (
  <motion.div
    className={cn(
      "bg-gradient-to-br from-slate-800/50 to-slate-900/50",
      "rounded-2xl border border-white/10 p-6",
      "space-y-4",
      className
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={springConfigs.gentle}
  >
    <div className="flex items-center space-x-3">
      <Skeleton width={48} height={48} className="rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton width="100%" height={14} />
      <Skeleton width="80%" height={14} />
      <Skeleton width="60%" height={14} />
    </div>
    <div className="flex justify-between items-center">
      <Skeleton width={80} height={20} />
      <Skeleton width={60} height={32} className="rounded-full" />
    </div>
  </motion.div>
);

// List Item Skeleton
export const ListItemSkeleton = ({ className }: { className?: string }) => (
  <motion.div
    className={cn(
      "flex items-center space-x-4 p-4",
      "bg-slate-800/30 rounded-xl",
      className
    )}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={springConfigs.gentle}
  >
    <Skeleton width={40} height={40} className="rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton width="70%" height={16} />
      <Skeleton width="50%" height={12} />
    </div>
    <Skeleton width={24} height={24} className="rounded" />
  </motion.div>
);

// Table Skeleton
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) => (
  <motion.div
    className={cn("space-y-3", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={springConfigs.gentle}
  >
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} height={20} />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <motion.div
        key={`row-${rowIndex}`}
        className="grid gap-4 py-2"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          ...springConfigs.gentle,
          delay: rowIndex * 0.1
        }}
      >
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={`cell-${rowIndex}-${colIndex}`} 
            height={16}
            width={colIndex === 0 ? "80%" : "100%"}
          />
        ))}
      </motion.div>
    ))}
  </motion.div>
);

// Profile Skeleton
export const ProfileSkeleton = ({ className }: { className?: string }) => (
  <motion.div
    className={cn("space-y-6", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={springConfigs.gentle}
  >
    {/* Header */}
    <div className="text-center space-y-4">
      <Skeleton width={120} height={120} className="rounded-full mx-auto" />
      <div className="space-y-2">
        <Skeleton width="60%" height={24} className="mx-auto" />
        <Skeleton width="80%" height={16} className="mx-auto" />
      </div>
    </div>
    
    {/* Stats */}
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton width={40} height={20} className="mx-auto" />
          <Skeleton width={60} height={14} className="mx-auto" />
        </div>
      ))}
    </div>
    
    {/* Content */}
    <div className="space-y-4">
      <Skeleton width="100%" height={200} />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton width="100%" height={100} />
        <Skeleton width="100%" height={100} />
      </div>
    </div>
  </motion.div>
);

// Staggered List Skeleton
export const StaggeredListSkeleton = ({ 
  items = 5,
  className 
}: { 
  items?: number;
  className?: string;
}) => (
  <motion.div
    className={cn("space-y-3", className)}
    initial="initial"
    animate="animate"
    variants={{
      initial: {},
      animate: {
        transition: {
          staggerChildren: 0.1
        }
      }
    }}
  >
    {Array.from({ length: items }).map((_, i) => (
      <motion.div
        key={i}
        variants={{
          initial: { opacity: 0, y: 20 },
          animate: { 
            opacity: 1, 
            y: 0,
            transition: springConfigs.gentle
          }
        }}
      >
        <ListItemSkeleton />
      </motion.div>
    ))}
  </motion.div>
);

// Page Skeleton
export const PageSkeleton = ({ className }: { className?: string }) => (
  <motion.div
    className={cn("space-y-6 p-6", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={springConfigs.gentle}
  >
    {/* Header */}
    <div className="space-y-4">
      <Skeleton width="40%" height={32} />
      <Skeleton width="60%" height={16} />
    </div>
    
    {/* Content Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </motion.div>
);

// Loading States
export const LoadingSpinner = ({ 
  size = "md",
  className 
}: { 
  size?: "sm" | "md" | "lg";
  className?: string;
}) => {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <motion.div
      className={cn("flex items-center justify-center", className)}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <div className={cn(
        "border-2 border-accent/30 border-t-accent rounded-full",
        sizes[size]
      )} />
    </motion.div>
  );
};

// Progress Skeleton
export const ProgressSkeleton = ({ 
  progress = 0,
  className 
}: { 
  progress?: number;
  className?: string;
}) => (
  <div className={cn("w-full bg-white/10 rounded-full h-2", className)}>
    <motion.div
      className="h-2 bg-gradient-to-r from-accent to-emerald-400 rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={springConfigs.smooth}
    />
  </div>
);




