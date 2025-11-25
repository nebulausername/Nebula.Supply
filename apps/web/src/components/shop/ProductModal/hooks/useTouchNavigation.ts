import { useState, useCallback, useRef } from "react";

interface TouchNavigationProps {
  sections: string[];
  onSectionChange: (sectionId: string) => void;
}

// 🎯 Touch Navigation Hook für Mobile
export const useTouchNavigation = ({ sections, onSectionChange }: TouchNavigationProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const touchTimeoutRef = useRef<NodeJS.Timeout>();

  // 🎯 Touch Start Handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  // 🎯 Touch Move Handler
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  // 🎯 Touch End Handler mit Swipe Detection
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe || isRightSwipe) {
      let newIndex = currentSectionIndex;
      
      if (isLeftSwipe && currentSectionIndex < sections.length - 1) {
        newIndex = currentSectionIndex + 1;
      } else if (isRightSwipe && currentSectionIndex > 0) {
        newIndex = currentSectionIndex - 1;
      }
      
      if (newIndex !== currentSectionIndex) {
        setCurrentSectionIndex(newIndex);
        onSectionChange(sections[newIndex]);
      }
    }
  }, [touchStart, touchEnd, currentSectionIndex, sections, onSectionChange]);

  // 🎯 Haptic Feedback (falls unterstützt)
  const triggerHapticFeedback = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Kurze Vibration
    }
  }, []);

  // 🎯 Debounced Touch Handler
  const handleTouchEndDebounced = useCallback(() => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    
    touchTimeoutRef.current = setTimeout(() => {
      handleTouchEnd();
      triggerHapticFeedback();
    }, 100);
  }, [handleTouchEnd, triggerHapticFeedback]);

  return {
    currentSectionIndex,
    setCurrentSectionIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd: handleTouchEndDebounced
  };
};
