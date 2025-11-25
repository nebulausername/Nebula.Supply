// 🎯 Modal State Management Hook
import { useState, useCallback, useEffect } from 'react';

interface ModalState {
  isOpen: boolean;
  data?: any;
}

interface UseModalReturn {
  isOpen: boolean;
  data: any;
  open: (data?: any) => void;
  close: () => void;
  toggle: () => void;
}

export const useModal = (initialState: boolean = false): UseModalReturn => {
  const [state, setState] = useState<ModalState>({
    isOpen: initialState,
    data: undefined
  });

  const open = useCallback((data?: any) => {
    setState({ isOpen: true, data });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, data: undefined });
  }, []);

  const toggle = useCallback(() => {
    setState(prev => ({ 
      isOpen: !prev.isOpen, 
      data: prev.isOpen ? undefined : prev.data 
    }));
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) {
        close();
      }
    };

    if (state.isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [state.isOpen, close]);

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle
  };
};

// Stack management for multiple modals
interface ModalStackItem {
  id: string;
  component: React.ComponentType<any>;
  props: any;
  zIndex: number;
}

class ModalStack {
  private stack: ModalStackItem[] = [];
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  push(modal: Omit<ModalStackItem, 'zIndex'>) {
    const zIndex = 1000 + this.stack.length;
    this.stack.push({ ...modal, zIndex });
    this.notify();
  }

  pop(id?: string) {
    if (id) {
      this.stack = this.stack.filter(item => item.id !== id);
    } else {
      this.stack.pop();
    }
    this.notify();
  }

  clear() {
    this.stack = [];
    this.notify();
  }

  getStack() {
    return [...this.stack];
  }

  getTop() {
    return this.stack[this.stack.length - 1];
  }
}

export const modalStack = new ModalStack();

// Hook for modal stack
export const useModalStack = () => {
  const [stack, setStack] = useState<ModalStackItem[]>([]);

  useEffect(() => {
    const unsubscribe = modalStack.subscribe(() => {
      setStack(modalStack.getStack());
    });
    return unsubscribe;
  }, []);

  const pushModal = useCallback((modal: Omit<ModalStackItem, 'zIndex'>) => {
    modalStack.push(modal);
  }, []);

  const popModal = useCallback((id?: string) => {
    modalStack.pop(id);
  }, []);

  const clearStack = useCallback(() => {
    modalStack.clear();
  }, []);

  return {
    stack,
    pushModal,
    popModal,
    clearStack
  };
};




