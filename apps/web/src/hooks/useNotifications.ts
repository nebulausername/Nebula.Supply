import { useState, useCallback, useRef, useEffect } from 'react';
import { Toast, ToastType } from '../components/notifications/ToastNotification';

interface UseNotificationsOptions {
  maxToasts?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { maxToasts = 5, position = 'top-right' } = options;
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message?: string,
    duration?: number,
    action?: { label: string; onClick: () => void }
  ) => {
    const id = `toast-${toastIdRef.current++}`;
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      duration,
      action
    };

    setToasts(prev => [newToast, ...prev].slice(0, maxToasts));
    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) => {
    return showToast('success', title, message, duration);
  }, [showToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    return showToast('error', title, message, duration || 7000);
  }, [showToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return showToast('info', title, message, duration);
  }, [showToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return showToast('warning', title, message, duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning
  };
};

