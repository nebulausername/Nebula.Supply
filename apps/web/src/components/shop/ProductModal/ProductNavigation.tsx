import { memo, useEffect, useState } from "react";
import { Info, Package, Percent, Truck } from "lucide-react";

// 🎯 Navigation Sections
const SECTIONS = [
  { id: 'overview', title: 'Übersicht', icon: Info },
  { id: 'details', title: 'Details', icon: Package },
  { id: 'shipping', title: 'Versand', icon: Truck },
  { id: 'pricing', title: 'Rabatte', icon: Percent },
];

interface ProductNavigationProps {
  isMobile: boolean;
}

// 🎯 Optimierte Navigation-Komponente
export const ProductNavigation = memo(({ isMobile }: ProductNavigationProps) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  // 🎯 Intersection Observer für aktive Section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { 
        threshold: 0.5,
        rootMargin: '-10% 0px -10% 0px' // Bessere Erkennung der aktiven Section
      }
    );

    SECTIONS.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // 🎯 Reset auf 'overview' beim Öffnen des Modals
  useEffect(() => {
    setActiveSection('overview');
  }, []);

  // 🎯 Smooth Scrolling zu Section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeIndex = SECTIONS.findIndex(section => section.id === activeSection);

  return (
    <>
      {/* 🎯 Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-black/20 z-[60]">
        <div 
          className="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500 ease-out"
          style={{ width: `${(activeIndex + 1) * 25}%` }}
        />
      </div>
      
      {/* 🎯 Floating Navigation */}
      <div className={`fixed left-1/2 transform -translate-x-1/2 z-[60] ${
        isMobile ? 'top-2' : 'top-4'
      }`}>
        <div className={`flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-full border border-white/10 shadow-2xl ${
          isMobile ? 'px-2 py-1' : 'px-3 py-2'
        }`}>
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`group flex items-center gap-1 rounded-full transition-all duration-300 ${
                  isMobile 
                    ? 'px-2 py-1' 
                    : 'px-3 py-2'
                } ${
                  isActive
                    ? 'bg-accent text-black scale-105'
                    : 'text-muted hover:text-text hover:bg-white/10 hover:scale-102'
                }`}
              >
                <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  <Icon size={isMobile ? 14 : 16} />
                </div>
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isMobile ? 'hidden' : 'hidden sm:inline'
                } ${
                  isActive ? 'font-semibold' : 'font-medium'
                }`}>
                  {section.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* 🎯 Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[60]">
          <div className="flex items-center gap-1 bg-black/90 backdrop-blur-sm rounded-full px-3 py-2 border border-white/10 shadow-2xl">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-accent text-black scale-110'
                      : 'text-muted hover:text-text hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
});

ProductNavigation.displayName = 'ProductNavigation';
