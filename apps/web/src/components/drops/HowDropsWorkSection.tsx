import { useState } from "react";
import { Clock, CheckCircle2, Shield, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { DropInfoModal } from "./DropInfoModal";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import type { FilterId } from "../../pages/DropsPage";

interface HowDropsWorkSectionProps {
  activeFilter?: FilterId;
  onFilterChange?: (filter: FilterId) => void;
  filterConfigs?: Array<{
    id: FilterId;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }>;
  filterConfig?: {
    icon: React.ReactNode;
    description: string;
  };
}

export const HowDropsWorkSection = ({ 
  activeFilter = "all", 
  onFilterChange,
  filterConfigs = [],
  filterConfig
}: HowDropsWorkSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { triggerHaptic } = useEnhancedTouch();

  const handleOpenModal = () => {
    triggerHaptic('medium');
    setIsModalOpen(true);
  };

  const handleFilterClick = (filterId: FilterId) => {
    triggerHaptic('light');
    onFilterChange?.(filterId);
  };

  return (
    <section className="w-full py-12 md:py-16 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 bg-gradient-to-r from-[#0BF7BC] via-orange-400 to-[#0BF7BC] bg-clip-text text-transparent">
            Wie funktionieren unsere Drops?
          </h2>
          <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto">
            Zeitlich begrenzte Vorbestellungen mit exklusiven Preisen - so sicherst du dir einzigartige Produkte
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* 1. Dauer */}
          <div className={cn(
            "group relative p-6 rounded-2xl border-2 transition-all duration-500",
            "bg-gradient-to-br from-orange-500/20 via-orange-600/15 to-cyan-500/20",
            "border-orange-400/40 hover:border-orange-400/60",
            "hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/30",
            "backdrop-blur-sm"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/30 to-orange-600/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Zeitlich begrenzt</h3>
              <p className="text-sm text-blue-200 leading-relaxed">
                Drops laufen durchschnittlich <span className="font-bold text-orange-400">1-2 Wochen</span>. 
                Nutze die Chance, solange der Timer läuft!
              </p>
            </div>
          </div>

          {/* 2. Aktivierung */}
          <div className={cn(
            "group relative p-6 rounded-2xl border-2 transition-all duration-500",
            "bg-gradient-to-br from-green-500/20 via-green-600/15 to-emerald-500/20",
            "border-green-400/40 hover:border-green-400/60",
            "hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/30",
            "backdrop-blur-sm"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500/30 to-green-600/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Automatische Aktivierung</h3>
              <p className="text-sm text-blue-200 leading-relaxed">
                Sobald die <span className="font-bold text-green-400">Mindestmenge erreicht</span> ist 
                oder die <span className="font-bold text-green-400">Frist abläuft</span>, wird der Drop aktiviert 
                und bestellt.
              </p>
            </div>
          </div>

          {/* 3. Risiko/Erfolg */}
          <div className={cn(
            "group relative p-6 rounded-2xl border-2 transition-all duration-500",
            "bg-gradient-to-br from-yellow-500/20 via-orange-500/15 to-amber-500/20",
            "border-yellow-400/40 hover:border-yellow-400/60",
            "hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/30",
            "backdrop-blur-sm"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Erfolgsgarantie</h3>
              <p className="text-sm text-blue-200 leading-relaxed">
                Drops können <span className="font-bold text-yellow-400">scheitern</span>, wenn die Mindestmenge 
                nicht erreicht wird. <span className="font-bold text-green-400">Dein Geld ist sicher</span> - 
                keine Sorge!
              </p>
            </div>
          </div>

          {/* 4. Vorteil */}
          <div className={cn(
            "group relative p-6 rounded-2xl border-2 transition-all duration-500",
            "bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-purple-600/20",
            "border-purple-400/40 hover:border-purple-400/60",
            "hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30",
            "backdrop-blur-sm"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Exklusive Preise</h3>
              <p className="text-sm text-blue-200 leading-relaxed">
                Einzigartige Produkte zu <span className="font-bold text-purple-400">unschlagbaren Preisen</span> 
                durch gemeinschaftliche Vorbestellungen. Insider bestimmen den Preis!
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-10 md:mt-14 text-center">
          <button
            onClick={handleOpenModal}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold",
              "bg-gradient-to-r from-[#0BF7BC] to-cyan-500 text-black",
              "hover:from-cyan-400 hover:to-[#0BF7BC] hover:scale-105",
              "transition-all duration-300 shadow-lg shadow-[#0BF7BC]/30",
              "hover:shadow-xl hover:shadow-[#0BF7BC]/50",
              "active:scale-95"
            )}
          >
            <span>Mehr über Drops erfahren</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* 🎯 Category Filters - Premium Design - Directly After CTA Button */}
        {filterConfigs.length > 0 && (
          <div className="mt-6 md:mt-8">
            <div className="relative">
              {/* Simplified dark green background with glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/50 via-green-900/40 to-teal-950/50 rounded-3xl blur-xl" />
              
              <div className="relative bg-gradient-to-br from-emerald-950/70 via-green-900/60 to-teal-950/70 backdrop-blur-2xl rounded-3xl border-2 border-green-700/50 p-5 md:p-8 shadow-2xl shadow-green-900/30">

                {/* Filter Buttons Row - Pill Design */}
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-4">
                  {filterConfigs.map((filter) => {
                    const isActive = activeFilter === filter.id;
                    
                    // Color schemes matching the reference image
                    const colorSchemes = {
                      all: {
                        active: "bg-gradient-to-br from-slate-700/95 to-slate-800/75 border-blue-400/70 text-white",
                        inactive: "bg-green-900/50 border-green-600/40 text-green-200/90 hover:bg-green-800/60 hover:border-green-500/50 hover:text-green-100 transition-all duration-300"
                      },
                      free: {
                        active: "bg-gradient-to-br from-slate-700/95 to-slate-800/75 border-blue-400/70 text-white",
                        inactive: "bg-green-900/50 border-green-600/40 text-green-200/90 hover:bg-green-800/60 hover:border-green-500/50 hover:text-green-100 transition-all duration-300"
                      },
                      limited: {
                        active: "bg-gradient-to-br from-slate-700/95 to-slate-800/75 border-blue-400/70 text-white",
                        inactive: "bg-green-900/50 border-green-600/40 text-green-200/90 hover:bg-green-800/60 hover:border-green-500/50 hover:text-green-100 transition-all duration-300"
                      },
                      vip: {
                        active: "bg-gradient-to-br from-slate-700/95 to-slate-800/75 border-blue-400/70 text-white",
                        inactive: "bg-green-900/50 border-green-600/40 text-green-200/90 hover:bg-green-800/60 hover:border-green-500/50 hover:text-green-100 transition-all duration-300"
                      },
                      standard: {
                        active: "bg-gradient-to-br from-slate-700/95 to-slate-800/75 border-blue-400/70 text-white",
                        inactive: "bg-green-900/50 border-green-600/40 text-green-200/90 hover:bg-green-800/60 hover:border-green-500/50 hover:text-green-100 transition-all duration-300"
                      }
                    };

                    const scheme = colorSchemes[filter.id] || colorSchemes.all;
                    const buttonClasses = isActive ? scheme.active : scheme.inactive;

                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => handleFilterClick(filter.id)}
                        className={cn(
                          "group relative flex items-center gap-2.5 px-6 md:px-7 py-3.5 md:py-4",
                          "rounded-full border transition-all duration-300",
                          "font-bold text-sm md:text-base tracking-normal",
                          "backdrop-blur-sm",
                          "hover:scale-105 active:scale-95",
                          "min-w-[100px] justify-center",
                          buttonClasses
                        )}
                      >
                        {/* Icon */}
                        <span className={cn(
                          "transition-all duration-300",
                          isActive ? "text-current" : "text-green-200/90 group-hover:text-green-100"
                        )}>
                          {filter.icon}
                        </span>
                        
                        {/* Label */}
                        <span className="whitespace-nowrap">{filter.label}</span>
                        
                        {/* Active Indicator - Simple blue underline */}
                        {isActive && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-blue-400 rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Filter Description - Simplified */}
                {filterConfig && (
                  <div className="mt-4 pt-4 border-t border-green-700/50">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-green-900/40 border border-green-700/40">
                      {filterConfig.icon && (
                        <div className="flex-shrink-0 mt-0.5 text-green-300">
                          {filterConfig.icon}
                        </div>
                      )}
                      <p className="text-sm md:text-base text-white leading-relaxed flex-1">
                        {filterConfig.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drop Info Modal */}
      <DropInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};
