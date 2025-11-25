import { motion } from "framer-motion";
import { HelpCircle, Sparkles, Package, Clock } from "lucide-react";
import { cn } from "../../utils/cn";
import type { MaintenanceProduct } from "../../data/maintenanceProducts";
import { categoryMetadata } from "../../data/maintenanceProducts";

interface EnhancedMysteryCardProps {
  product: MaintenanceProduct;
  index: number;
  variant?: 'shop' | 'drop';
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

const glowVariants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const questionMarkVariants = {
  animate: {
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const EnhancedMysteryCard = ({ product, index, variant = 'shop' }: EnhancedMysteryCardProps) => {
  const category = categoryMetadata[product.category];
  
  const priceDisplay = typeof product.priceRange === 'number'
    ? `${product.priceRange}€`
    : `${product.priceRange.min}€ - ${product.priceRange.max}€`;
  
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ 
        y: -12, 
        scale: 1.03,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="relative group cursor-pointer"
    >
      {/* Neon Glow Background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-[#0BF7BC]/20 to-[#FF5EDB]/20 blur-2xl rounded-2xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Card */}
      <motion.div 
        className="relative bg-[#111827] rounded-2xl border border-white/10 overflow-hidden"
        whileHover={{
          borderColor: "rgba(11, 247, 188, 0.3)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(11, 247, 188, 0.2)"
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Image Area with Neon Outline */}
        <div className="aspect-square relative bg-gradient-to-br from-[#1E293B] to-[#111827] flex items-center justify-center">
          {/* Animated Neon Border */}
          <motion.div
            variants={glowVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-4 border-2 border-[#0BF7BC] rounded-xl"
            style={{
              boxShadow: '0 0 20px rgba(11, 247, 188, 0.5), 0 0 40px rgba(11, 247, 188, 0.3)'
            }}
          />
          
          {/* Question Mark with Rotation */}
          <motion.div
            variants={questionMarkVariants}
            animate="animate"
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <HelpCircle className="w-16 h-16 md:w-20 md:h-20 text-[#0BF7BC]" strokeWidth={1.5} />
            <span className="text-4xl">{category.icon}</span>
          </motion.div>
          
          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <div className={cn(
              "px-3 py-1 rounded-full text-white text-xs font-semibold backdrop-blur-sm",
              `bg-gradient-to-r ${category.gradient}`
            )}>
              {product.hint}
            </div>
          </div>
          
          {/* Subtle Pattern Overlay */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>
        
        {/* Info Area */}
        <div className="p-4 space-y-3">
          {/* Coming Soon Badge */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0BF7BC]" />
            <span className="text-sm font-medium text-[#0BF7BC]">
              {variant === 'drop' ? 'Drop startet bald' : 'Coming Soon'}
            </span>
          </div>
          
          {/* Description */}
          {product.description && (
            <p className="text-xs text-white/60 line-clamp-1">
              {product.description}
            </p>
          )}
          
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl md:text-2xl font-bold font-mono text-white">
              {priceDisplay}
            </span>
            {variant === 'drop' && (
              <span className="text-xs text-white/40">pro Stück</span>
            )}
          </div>
          
          {/* Min Quantity */}
          <div className="flex items-center gap-2 text-xs md:text-sm text-white/60">
            <Package className="w-4 h-4 flex-shrink-0" />
            <span>Min. {product.minQuantity} {product.minQuantity === 1 ? 'Stück' : 'Stück'}</span>
          </div>
          
          {/* Delivery Time */}
          {product.deliveryTime && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-white/60">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{product.deliveryTime}</span>
            </div>
          )}
        </div>
        
        {/* Hover Overlay with Gradient */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-t from-[#0BF7BC]/10 via-transparent to-transparent pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Shine Effect on Hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
          }}
        />
      </motion.div>
    </motion.div>
  );
};

