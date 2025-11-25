import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowRight, Sparkles, Package, Rocket } from "lucide-react";
import { fetchMaintenanceStatus, type MaintenanceStatus } from "../api/status";
import { StatusBadge } from "../components/maintenance/StatusBadge";
import { UpdateCard } from "../components/maintenance/UpdateCard";
import { ProgressOrbit } from "../components/maintenance/ProgressOrbit";
import { EnhancedProgressBar } from "../components/maintenance/EnhancedProgressBar";
import { StatusTimeline } from "../components/maintenance/StatusTimeline";
import { FloatingParticles } from "../components/maintenance/FloatingParticles";
import { EnhancedMysteryCard } from "../components/maintenance/EnhancedMysteryCard";
import { shopProducts, dropProducts } from "../data/maintenanceProducts";
import { useMobileOptimizations } from "../components/MobileOptimizations";
import { cn } from "../utils/cn";

export const MaintenancePage = () => {
  const { isMobile } = useMobileOptimizations();
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await fetchMaintenanceStatus();
        setStatus(data);
      } catch (error) {
        console.error('Failed to load maintenance status:', error);
        // Fallback status
        setStatus({
          isActive: true,
          mode: 'maintenance',
          title: 'Wartungsarbeiten',
          message: 'Wir arbeiten gerade an Verbesserungen. Bitte habe etwas Geduld.',
          updates: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadStatus();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading || !status) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-[#0BF7BC]" />
      </div>
    );
  }
  
  const formatEstimatedTime = (timeString?: string) => {
    if (!timeString) return null;
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      
      if (diffMs < 0) return null;
      
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffHours > 0) {
        return `ca. ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;
      }
      return `ca. ${diffMins} ${diffMins === 1 ? 'Minute' : 'Minuten'}`;
    } catch {
      return null;
    }
  };
  
  const estimatedTime = formatEstimatedTime(status.estimatedEndTime);
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(11,247,188,0.15),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,94,219,0.1),transparent_70%)] blur-3xl" />
        <FloatingParticles count={30} />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12 space-y-4"
        >
          <div className="flex justify-center mb-4">
            <StatusBadge mode={status.mode} />
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#0BF7BC] via-white to-[#FF5EDB] bg-clip-text text-transparent">
            {status.title || 'Wartungsarbeiten'}
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            {status.message || 'Wir arbeiten gerade an Verbesserungen. Bitte habe etwas Geduld.'}
          </p>
          
          {/* Enhanced Progress Section */}
          {status.progress !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 max-w-3xl mx-auto"
            >
              <EnhancedProgressBar 
                progress={status.progress} 
                showPercentage={true}
                showMilestones={true}
                animated={true}
                size="lg"
              />
            </motion.div>
          )}
          
          {estimatedTime && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 mt-6 text-white/60"
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm md:text-base">Geschätzte Dauer: {estimatedTime}</span>
            </motion.div>
          )}
        </motion.div>
        
        {/* Updates Section with Timeline */}
        {status.updates && status.updates.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-12 md:mb-16"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-[#0BF7BC] to-white bg-clip-text text-transparent">
                Aktuelle Updates
              </h2>
              <p className="text-sm md:text-base text-white/60">
                Live-Status der Wartungsarbeiten
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              {/* Timeline View */}
              <div className="mb-8 bg-[#111827]/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
                <StatusTimeline 
                  steps={status.updates.map((update, index) => ({
                    id: update.id,
                    label: update.message,
                    status: index === status.updates.length - 1 ? 'current' : 'completed',
                    timestamp: update.timestamp
                  }))}
                />
              </div>
              
              {/* Update Cards */}
              <div className="space-y-3">
                {status.updates.slice().reverse().slice(0, 3).map((update, index) => (
                  <UpdateCard key={update.id} update={update} index={index} />
                ))}
              </div>
            </div>
          </motion.section>
        )}
        
        {/* Product Teasers Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-12 md:mb-16"
        >
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Bald verfügbar
            </h2>
            <p className="text-white/60 text-sm md:text-base">
              Vorschau auf ausgewählte Produkte – vollständiger Katalog nach Re-Launch
            </p>
          </div>
          
          {/* Shop Products Teaser */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-3 mb-4 md:mb-6 justify-center">
              <div className="p-2 rounded-lg bg-[#0BF7BC]/10">
                <Package className="w-5 h-5 text-[#0BF7BC]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg md:text-xl font-semibold">Shop</h3>
                <p className="text-xs md:text-sm text-white/60">Premium Produkte</p>
              </div>
            </div>
            <div className={cn(
              "grid gap-4 md:gap-6",
              isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            )}>
              {shopProducts.map((product, i) => (
                <EnhancedMysteryCard 
                  key={product.id} 
                  product={product}
                  index={i} 
                  variant="shop" 
                />
              ))}
            </div>
            <div className="text-center mt-4">
              <p className="text-xs md:text-sm text-white/40">
                + viele weitere Produkte nach Re-Launch
              </p>
            </div>
          </div>
          
          {/* Drops Teaser */}
          <div>
            <div className="flex items-center gap-3 mb-4 md:mb-6 justify-center">
              <div className="p-2 rounded-lg bg-[#FF5EDB]/10">
                <Rocket className="w-5 h-5 text-[#FF5EDB]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg md:text-xl font-semibold">Drops</h3>
                <p className="text-xs md:text-sm text-white/60">Limitierte Releases</p>
              </div>
            </div>
            <div className={cn(
              "grid gap-4 md:gap-6",
              isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            )}>
              {dropProducts.map((product, i) => (
                <EnhancedMysteryCard 
                  key={product.id} 
                  product={product}
                  index={i} 
                  variant="drop" 
                />
              ))}
            </div>
            <div className="text-center mt-4">
              <p className="text-xs md:text-sm text-white/40">
                + exklusive Drops nach Re-Launch
              </p>
            </div>
          </div>
        </motion.section>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#0BF7BC]/10 to-[#61F4F4]/10 border border-[#0BF7BC]/30 backdrop-blur-xl">
            <Sparkles className="w-5 h-5 text-[#0BF7BC]" />
            <span className="text-sm md:text-base text-white/90">
              Wir informieren dich, sobald alles bereit ist
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

