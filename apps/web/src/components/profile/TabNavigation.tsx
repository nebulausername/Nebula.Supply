import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, ChevronDown, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { useEnhancedTouch } from "../../hooks/useEnhancedTouch";
import { useMobileOptimizations } from "../../components/MobileOptimizations";
import { useSearchParams } from "react-router-dom";

export interface SubTab {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface MainTab {
  id: string;
  label: string;
  icon: LucideIcon;
  subTabs: SubTab[];
}

interface TabNavigationProps {
  mainTabs: MainTab[];
  activeMainTab: string;
  activeSubTab: string;
  onMainTabChange: (mainTabId: string) => void;
  onSubTabChange: (subTabId: string) => void;
  achievementsCount?: number;
}

export const TabNavigation = memo(({
  mainTabs,
  activeMainTab,
  activeSubTab,
  onMainTabChange,
  onSubTabChange,
  achievementsCount,
}: TabNavigationProps) => {
  const { isMobile } = useMobileOptimizations();
  const { triggerHaptic } = useEnhancedTouch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSubTabMenu, setShowSubTabMenu] = useState(false);
  const [hoveredMainTab, setHoveredMainTab] = useState<string | null>(null);
  const [focusedMainTabIndex, setFocusedMainTabIndex] = useState<number | null>(null);
  const [focusedSubTabIndex, setFocusedSubTabIndex] = useState<number | null>(null);
  const [collapsedMainTabs, setCollapsedMainTabs] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const mainTabRefs = useRef<Record<string, HTMLButtonElement>>({});
  const subTabRefs = useRef<Record<string, HTMLButtonElement>>({});
  const navRef = useRef<HTMLElement>(null);
  
  // Track update source to prevent loops
  const isUpdatingFromUrl = useRef(false);
  const isUpdatingFromUser = useRef(false);
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync URL with tab state (only when URL changes externally)
  useEffect(() => {
    // Skip if we're currently updating from user action
    if (isUpdatingFromUser.current) {
      return;
    }

    const urlMainTab = searchParams.get('mainTab');
    const urlSubTab = searchParams.get('subTab');
    
    // Only update if URL actually differs from current state
    if (urlMainTab && urlMainTab !== activeMainTab) {
      const tab = mainTabs.find(t => t.id === urlMainTab);
      if (tab) {
        isUpdatingFromUrl.current = true;
        onMainTabChange(urlMainTab);
        if (urlSubTab && tab.subTabs.some(st => st.id === urlSubTab)) {
          onSubTabChange(urlSubTab);
        } else if (tab.subTabs.length > 0) {
          onSubTabChange(tab.subTabs[0].id);
        }
        // Reset flag after a short delay
        setTimeout(() => {
          isUpdatingFromUrl.current = false;
        }, 100);
      }
    } else if (urlSubTab && urlSubTab !== activeSubTab && !isUpdatingFromUser.current) {
      // Handle subTab changes from URL
      const currentTab = mainTabs.find(t => t.id === activeMainTab);
      if (currentTab && currentTab.subTabs.some(st => st.id === urlSubTab)) {
        isUpdatingFromUrl.current = true;
        onSubTabChange(urlSubTab);
        setTimeout(() => {
          isUpdatingFromUrl.current = false;
        }, 100);
      }
    }
  }, [searchParams, activeMainTab, activeSubTab, mainTabs, onMainTabChange, onSubTabChange]);

  // Update URL when tabs change (debounced to prevent spam)
  useEffect(() => {
    // Skip if we're currently updating from URL
    if (isUpdatingFromUrl.current) {
      return;
    }

    // Clear existing timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }

    // Debounce URL updates
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const currentMainTab = searchParams.get('mainTab');
      const currentSubTab = searchParams.get('subTab');
      
      // Only update if actually different
      if (currentMainTab !== activeMainTab || currentSubTab !== activeSubTab) {
        isUpdatingFromUser.current = true;
        const params = new URLSearchParams(searchParams);
        params.set('mainTab', activeMainTab);
        if (activeSubTab) {
          params.set('subTab', activeSubTab);
        } else {
          params.delete('subTab');
        }
        setSearchParams(params, { replace: true });
        
        // Reset flag after update
        setTimeout(() => {
          isUpdatingFromUser.current = false;
        }, 100);
      }
    }, 50); // 50ms debounce

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [activeMainTab, activeSubTab, searchParams, setSearchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowSubTabMenu(false);
        setHoveredMainTab(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentMainTab = useMemo(() => 
    mainTabs.find((tab) => tab.id === activeMainTab),
    [mainTabs, activeMainTab]
  );
  const hasSubTabs = currentMainTab && currentMainTab.subTabs.length > 0;

  const handleMainTabClick = useCallback((mainTabId: string, event?: React.MouseEvent) => {
    triggerHaptic("light");
    const mainTab = mainTabs.find((t) => t.id === mainTabId);
    
    // Toggle collapse state if clicking on already active tab with sub-tabs
    if (activeMainTab === mainTabId && mainTab && mainTab.subTabs.length > 0 && !isMobile) {
      setCollapsedMainTabs(prev => {
        const newSet = new Set(prev);
        if (newSet.has(mainTabId)) {
          newSet.delete(mainTabId);
        } else {
          newSet.add(mainTabId);
        }
        return newSet;
      });
      return;
    }
    
    // Mark as user-initiated update
    isUpdatingFromUser.current = true;
    
    if (isMobile) {
      // On mobile, show bottom sheet for sub-tabs
      if (mainTab && mainTab.subTabs.length > 0) {
        setShowSubTabMenu(true);
      } else {
        onMainTabChange(mainTabId);
        if (mainTab && mainTab.subTabs.length > 0) {
          onSubTabChange(mainTab.subTabs[0].id);
        }
      }
    } else {
      // On desktop, show dropdown on hover
      onMainTabChange(mainTabId);
      if (mainTab && mainTab.subTabs.length > 0 && !collapsedMainTabs.has(mainTabId)) {
        onSubTabChange(mainTab.subTabs[0].id);
      }
    }
    setFocusedMainTabIndex(mainTabs.findIndex(t => t.id === mainTabId));
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromUser.current = false;
    }, 200);
  }, [mainTabs, isMobile, onMainTabChange, onSubTabChange, triggerHaptic, activeMainTab, collapsedMainTabs]);

  const handleSubTabSelect = useCallback((subTabId: string) => {
    triggerHaptic("light");
    
    // Mark as user-initiated update
    isUpdatingFromUser.current = true;
    
    onSubTabChange(subTabId);
    setShowSubTabMenu(false);
    setHoveredMainTab(null);
    if (currentMainTab) {
      const subTabIndex = currentMainTab.subTabs.findIndex(st => st.id === subTabId);
      setFocusedSubTabIndex(subTabIndex >= 0 ? subTabIndex : null);
    }
    
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromUser.current = false;
    }, 200);
  }, [onSubTabChange, triggerHaptic, currentMainTab]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Escape to close mobile menu
      if (e.key === 'Escape' && showSubTabMenu) {
        e.preventDefault();
        setShowSubTabMenu(false);
        return;
      }

      // Number keys 1-9 for quick main tab navigation
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        const tab = mainTabs[num - 1];
        if (tab) {
          handleMainTabClick(tab.id);
          mainTabRefs.current[tab.id]?.focus();
        }
        return;
      }

      // Arrow key navigation for main tabs
      if (['ArrowLeft', 'ArrowRight'].includes(e.key) && !showSubTabMenu) {
        e.preventDefault();
        const currentIndex = focusedMainTabIndex !== null 
          ? focusedMainTabIndex 
          : mainTabs.findIndex(t => t.id === activeMainTab);

        let nextIndex: number;
        if (e.key === 'ArrowRight') {
          nextIndex = currentIndex < mainTabs.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : mainTabs.length - 1;
        }

        const nextTab = mainTabs[nextIndex];
        if (nextTab) {
          setFocusedMainTabIndex(nextIndex);
          mainTabRefs.current[nextTab.id]?.focus();
        }
        return;
      }

      // Arrow key navigation for sub-tabs (when dropdown is open or sub-tabs are visible)
      if (hasSubTabs && currentMainTab && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
        // Only handle if dropdown is open (desktop) or menu is open (mobile)
        if ((!isMobile && (hoveredMainTab === activeMainTab || activeMainTab === currentMainTab.id)) || 
            (isMobile && showSubTabMenu)) {
          e.preventDefault();
          const subTabs = currentMainTab.subTabs;
          const currentSubIndex = focusedSubTabIndex !== null
            ? focusedSubTabIndex
            : subTabs.findIndex(st => st.id === activeSubTab);

          let nextSubIndex: number;
          if (e.key === 'ArrowDown') {
            nextSubIndex = currentSubIndex < subTabs.length - 1 ? currentSubIndex + 1 : 0;
          } else {
            nextSubIndex = currentSubIndex > 0 ? currentSubIndex - 1 : subTabs.length - 1;
          }

          const nextSubTab = subTabs[nextSubIndex];
          if (nextSubTab) {
            setFocusedSubTabIndex(nextSubIndex);
            subTabRefs.current[nextSubTab.id]?.focus();
          }
          return;
        }
      }

      // Enter to select focused tab
      if (e.key === 'Enter') {
        if (focusedMainTabIndex !== null && !showSubTabMenu) {
          e.preventDefault();
          const tab = mainTabs[focusedMainTabIndex];
          if (tab) {
            handleMainTabClick(tab.id);
          }
          return;
        }
        if (focusedSubTabIndex !== null && currentMainTab && showSubTabMenu) {
          e.preventDefault();
          const subTab = currentMainTab.subTabs[focusedSubTabIndex];
          if (subTab) {
            handleSubTabSelect(subTab.id);
          }
          return;
        }
      }

      // Home/End for main tabs
      if (e.key === 'Home' && !showSubTabMenu) {
        e.preventDefault();
        const firstTab = mainTabs[0];
        if (firstTab) {
          setFocusedMainTabIndex(0);
          mainTabRefs.current[firstTab.id]?.focus();
        }
        return;
      }

      if (e.key === 'End' && !showSubTabMenu) {
        e.preventDefault();
        const lastTab = mainTabs[mainTabs.length - 1];
        if (lastTab) {
          setFocusedMainTabIndex(mainTabs.length - 1);
          mainTabRefs.current[lastTab.id]?.focus();
        }
        return;
      }
    };

    const element = navRef.current || window;
    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [
    mainTabs, 
    activeMainTab, 
    activeSubTab, 
    focusedMainTabIndex, 
    focusedSubTabIndex,
    showSubTabMenu,
    hoveredMainTab,
    hasSubTabs,
    currentMainTab,
    isMobile,
    handleMainTabClick,
    handleSubTabSelect
  ]);

  // Mobile: Bottom Sheet for Sub-Tabs
  if (isMobile) {
    return (
      <>
        {/* Main Tab Navigation */}
        <motion.nav
          ref={navRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "sticky top-0 z-30 mb-4 pb-2",
            "bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50"
          )}
          role="tablist"
          aria-label="Profilbereiche"
          aria-orientation="horizontal"
        >
          <div className={cn(
            "flex gap-2.5 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl overflow-x-auto scrollbar-hide scroll-smooth",
            "p-2",
            "snap-x snap-mandatory"
          )}>
            {mainTabs.map((tab, index) => {
              const badgeCount =
                tab.id === "achievements" && achievementsCount
                  ? achievementsCount
                  : null;

              return (
                <motion.button
                  key={tab.id}
                  ref={(el) => {
                    if (el) mainTabRefs.current[tab.id] = el;
                  }}
                  onClick={() => handleMainTabClick(tab.id)}
                  onFocus={() => setFocusedMainTabIndex(index)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap min-w-[90px] relative overflow-hidden touch-target snap-start",
                    "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900",
                    activeMainTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white shadow-lg shadow-purple-500/50 backdrop-blur-md scale-105"
                      : "text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm",
                    focusedMainTabIndex === index && activeMainTab !== tab.id && "ring-2 ring-purple-400/50",
                    "px-4 py-3 sm:px-5 sm:py-3.5",
                    "text-xs sm:text-sm",
                    "min-h-[48px]"
                  )}
                  role="tab"
                  aria-selected={activeMainTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={activeMainTab === tab.id ? 0 : -1}
                >
                  {activeMainTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon
                    className={cn(
                      "relative z-10 transition-transform duration-300 flex-shrink-0",
                      activeMainTab === tab.id ? "w-4 h-4 sm:w-5 sm:h-5 scale-110" : "w-4 h-4 sm:w-5 sm:h-5",
                      activeMainTab === tab.id && "animate-pulse"
                    )}
                    aria-hidden="true"
                  />
                  <span className="relative z-10">{tab.label}</span>
                  {badgeCount !== null && badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center",
                        activeMainTab === tab.id
                          ? "bg-white/30 text-white"
                          : "bg-purple-500/30 text-purple-300"
                      )}
                    >
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </motion.span>
                  )}
                  {tab.subTabs.length > 0 && (
                    <ChevronDown
                      className={cn(
                        "relative z-10 w-3 h-3 transition-transform duration-300",
                        activeMainTab === tab.id && "rotate-180"
                      )}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.nav>

        {/* Sub-Tab Bottom Sheet */}
        <AnimatePresence>
          {showSubTabMenu && currentMainTab && currentMainTab.subTabs.length > 0 && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  triggerHaptic("light");
                  setShowSubTabMenu(false);
                }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              />

              {/* Bottom Sheet */}
              <motion.div
                ref={menuRef}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={cn(
                  "fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-2xl safe-bottom",
                  "max-h-[80vh] overflow-y-auto"
                )}
              >
                <div className="p-4">
                  {/* Handle */}
                  <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={cn(
                      "font-semibold text-white flex items-center gap-2",
                      "text-base sm:text-lg"
                    )}>
                      <currentMainTab.icon className="w-5 h-5 text-purple-400" />
                      {currentMainTab.label}
                    </h3>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setShowSubTabMenu(false);
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-target"
                      aria-label="Menü schließen"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Sub-Tabs */}
                  <div className="space-y-2" role="menu" aria-label={`${currentMainTab.label} sub-tabs`}>
                    {currentMainTab.subTabs.map((subTab, subIndex) => (
                      <motion.button
                        key={subTab.id}
                        ref={(el) => {
                          if (el) subTabRefs.current[subTab.id] = el;
                        }}
                        onClick={() => handleSubTabSelect(subTab.id)}
                        onFocus={() => setFocusedSubTabIndex(subIndex)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 touch-target",
                          "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900",
                          activeSubTab === subTab.id
                            ? "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white shadow-lg"
                            : "bg-white/5 text-gray-300 hover:bg-white/10",
                          focusedSubTabIndex === subIndex && activeSubTab !== subTab.id && "ring-2 ring-purple-400/50",
                          "px-3 sm:px-4",
                          "py-2.5 sm:py-3",
                          "min-h-[44px]"
                        )}
                        role="menuitem"
                        aria-selected={activeSubTab === subTab.id}
                        tabIndex={0}
                      >
                        <subTab.icon className="w-5 h-5" />
                        <span className="flex-1 text-left">{subTab.label}</span>
                        {subTab.badge !== undefined && subTab.badge > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20">
                            {subTab.badge > 99 ? "99+" : subTab.badge}
                          </span>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Sub-Tab Indicator Bar (when sub-tabs exist) */}
        {hasSubTabs && !showSubTabMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-4"
          >
            <div className={cn(
              "flex gap-3 overflow-x-auto scrollbar-hide",
              "snap-x snap-mandatory"
            )}>
              {currentMainTab!.subTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => handleSubTabSelect(subTab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg text-xs font-medium transition-all duration-300 whitespace-nowrap snap-start touch-target",
                    activeSubTab === subTab.id
                      ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10",
                    "px-3 sm:px-4",
                    "py-2 sm:py-2.5",
                    "min-h-[44px]"
                  )}
                >
                  <subTab.icon className="w-3 h-3" />
                  {subTab.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </>
    );
  }

  // Desktop: Horizontal Tabs with Hover Dropdowns
  return (
    <motion.nav
      ref={navRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-30 mb-8 pb-3",
        "bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50"
      )}
      role="tablist"
      aria-label="Profilbereiche"
      aria-orientation="horizontal"
    >
      <div className={cn(
        "flex gap-2.5 rounded-2xl backdrop-blur-xl bg-white/5 border-2 border-white/15 shadow-2xl",
        "p-2.5",
        "w-full max-w-full"
      )}>
        {mainTabs.map((tab, index) => {
          const badgeCount =
            tab.id === "achievements" && achievementsCount
              ? achievementsCount
              : null;

          return (
            <div
              key={tab.id}
              ref={tab.id === activeMainTab ? dropdownRef : undefined}
              className="relative flex-1 min-w-0"
              onMouseEnter={() => {
                if (tab.subTabs.length > 0) {
                  setHoveredMainTab(tab.id);
                }
              }}
              onMouseLeave={() => {
                setHoveredMainTab(null);
              }}
            >
              <motion.button
                ref={(el) => {
                  if (el) mainTabRefs.current[tab.id] = el;
                }}
                onClick={() => handleMainTabClick(tab.id)}
                onFocus={() => setFocusedMainTabIndex(index)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.03,
                  type: "spring",
                  stiffness: 300,
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center justify-center gap-2.5 rounded-xl font-bold transition-all duration-300 relative overflow-hidden group",
                  "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900",
                  activeMainTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white shadow-xl shadow-purple-500/60 backdrop-blur-md scale-[1.02] border-2 border-white/20"
                    : "text-gray-300 hover:text-white hover:bg-white/15 backdrop-blur-sm border-2 border-transparent hover:border-white/10",
                  focusedMainTabIndex === index && activeMainTab !== tab.id && "ring-2 ring-purple-400/50",
                  "px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 lg:px-7 lg:py-4.5",
                  "text-xs sm:text-sm md:text-base lg:text-lg",
                  "w-full h-full",
                  "hover:scale-105 active:scale-95"
                )}
                role="tab"
                aria-selected={activeMainTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={activeMainTab === tab.id ? 0 : -1}
              >
                {activeMainTab === tab.id && (
                  <motion.div
                    layoutId="activeTabDesktop"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <motion.div
                  className={cn(
                    "relative z-10 p-1.5 rounded-lg transition-all duration-300",
                    activeMainTab === tab.id
                      ? "bg-white/20"
                      : "bg-transparent group-hover:bg-white/10"
                  )}
                >
                  <tab.icon
                    className={cn(
                      "transition-all duration-300",
                      activeMainTab === tab.id
                        ? "w-5 h-5 scale-110 rotate-12"
                        : "w-5 h-5 group-hover:scale-110 group-hover:rotate-6"
                    )}
                    aria-hidden="true"
                  />
                </motion.div>
                <span className="relative z-10 font-semibold">{tab.label}</span>
                {badgeCount !== null && badgeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "relative z-10 px-2 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center",
                      activeMainTab === tab.id
                        ? "bg-white/30 text-white"
                        : "bg-purple-500/30 text-purple-300"
                    )}
                  >
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </motion.span>
                )}
                {tab.subTabs.length > 0 && (
                  <ChevronDown
                    className={cn(
                      "relative z-10 w-4 h-4 transition-transform duration-300",
                      (activeMainTab === tab.id || hoveredMainTab === tab.id) &&
                        !collapsedMainTabs.has(tab.id) &&
                        "rotate-180"
                    )}
                  />
                )}
                {activeMainTab === tab.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
                  />
                )}
              </motion.button>

              {/* Sub-Tab Dropdown */}
              {tab.subTabs.length > 0 &&
                (hoveredMainTab === tab.id || (activeMainTab === tab.id && !collapsedMainTabs.has(tab.id))) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2" role="menu" aria-label={`${tab.label} sub-tabs`}>
                      {tab.subTabs.map((subTab, subIndex) => (
                        <button
                          key={subTab.id}
                          ref={(el) => {
                            if (el) subTabRefs.current[subTab.id] = el;
                          }}
                          onClick={() => handleSubTabSelect(subTab.id)}
                          onFocus={() => setFocusedSubTabIndex(subIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300",
                            "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-800",
                            activeSubTab === subTab.id
                              ? "bg-gradient-to-r from-purple-600/50 via-blue-600/50 to-cyan-600/50 text-white"
                              : "text-gray-300 hover:bg-white/10 hover:text-white",
                            focusedSubTabIndex === subIndex && activeSubTab !== subTab.id && "ring-2 ring-purple-400/50",
                            "px-3 sm:px-4",
                            "py-2 sm:py-2.5"
                          )}
                          role="menuitem"
                          aria-selected={activeSubTab === subTab.id}
                          tabIndex={0}
                        >
                          <subTab.icon className="w-4 h-4" />
                          <span className="flex-1 text-left">{subTab.label}</span>
                          {subTab.badge !== undefined && subTab.badge > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/30 text-purple-300">
                              {subTab.badge > 99 ? "99+" : subTab.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
            </div>
          );
        })}
      </div>

      {/* Sub-Tab Indicator Bar (when sub-tabs exist and not collapsed) */}
      {hasSubTabs && !collapsedMainTabs.has(activeMainTab) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-5 flex gap-3 flex-wrap"
        >
          {currentMainTab!.subTabs.map((subTab, subIndex) => (
            <button
              key={subTab.id}
              ref={(el) => {
                if (el) subTabRefs.current[subTab.id] = el;
              }}
              onClick={() => handleSubTabSelect(subTab.id)}
              onFocus={() => setFocusedSubTabIndex(subIndex)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900",
                activeSubTab === subTab.id
                  ? "bg-gradient-to-r from-purple-500/40 via-blue-500/30 to-purple-500/40 text-purple-200 border-2 border-purple-500/60 shadow-lg"
                  : "bg-white/10 text-gray-400 hover:bg-white/15 hover:text-white border-2 border-white/15 hover:border-white/25",
                focusedSubTabIndex === subIndex && activeSubTab !== subTab.id && "ring-2 ring-purple-400/50",
                "px-4 sm:px-5",
                "py-2 sm:py-2.5",
                "hover:scale-105 active:scale-95"
              )}
              role="tab"
              aria-selected={activeSubTab === subTab.id}
              tabIndex={activeSubTab === subTab.id ? 0 : -1}
            >
              <subTab.icon className="w-4 h-4" />
              {subTab.label}
            </button>
          ))}
        </motion.div>
      )}
    </motion.nav>
  );
});

TabNavigation.displayName = 'TabNavigation';


