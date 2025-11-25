// 🎯 Long Press Gesture Hook
import { useRef, useCallback, useState } from "react";
import { useEnhancedTouch } from "./useEnhancedTouch";

interface LongPressOptions {
  onLongPress?: () => void;
  onPress?: () => void;
  delay?: number; // Delay in ms before long press triggers
  hapticFeedback?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export const useLongPress = (options: LongPressOptions = {}) => {
  const {
    onLongPress,
    onPress,
    delay = 500,
    hapticFeedback = true,
    preventDefault = true,
    stopPropagation = true
  } = options;

  const { triggerHaptic } = useEnhancedTouch();
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const elementRef = useRef<HTMLElement>(null);

  const startPress = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
    if (stopPropagation) e.stopPropagation();

    setIsPressed(true);
    triggerHaptic('light');

    // Start long press timer
    timeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
      onLongPress?.();
      if (hapticFeedback) {
        triggerHaptic('medium');
      }
    }, delay);
  }, [delay, onLongPress, hapticFeedback, preventDefault, stopPropagation, triggerHaptic]);

  const endPress = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
    if (stopPropagation) e.stopPropagation();

    setIsPressed(false);
    setIsLongPressing(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If it wasn't a long press, trigger regular press
    if (!isLongPressing) {
      onPress?.();
    }
  }, [isLongPressing, onPress, preventDefault, stopPropagation]);

  const cancelPress = useCallback(() => {
    setIsPressed(false);
    setIsLongPressing(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const bind = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', startPress, { passive: false });
    element.addEventListener('touchend', endPress, { passive: false });
    element.addEventListener('touchcancel', cancelPress, { passive: false });

    return () => {
      element.removeEventListener('touchstart', startPress);
      element.removeEventListener('touchend', endPress);
      element.removeEventListener('touchcancel', cancelPress);
    };
  }, [startPress, endPress, cancelPress]);

  return {
    elementRef,
    bind,
    isPressed,
    isLongPressing
  };
};

// Context Menu Hook
export const useContextMenu = (options: {
  onContextMenu?: () => void;
  onPress?: () => void;
  delay?: number;
}) => {
  const longPress = useLongPress({
    onLongPress: options.onContextMenu,
    onPress: options.onPress,
    delay: options.delay || 500
  });

  return longPress;
};




