import { useEffect } from 'react';
import { useNotificationStore } from '../lib/store/notifications';

// Simple polling-based notification system
// In production, this would be replaced with Server-Sent Events (SSE) or WebSockets

export function useNotifications() {
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    let lastFetch = new Date().toISOString();

    // Fetch new notifications from API
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/admin/notifications/new?since=${encodeURIComponent(lastFetch)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || 'dev-token'}`
          }
        });
        
        if (!response.ok) {
          console.log('Failed to fetch notifications:', response.status);
          return;
        }
        
        const data = await response.json();
        if (data.success && data.notifications && data.notifications.length > 0) {
          // Add new notifications
          data.notifications.forEach((notif: any) => {
            addNotification({
              type: notif.type,
              title: notif.title,
              message: notif.message,
              data: notif.data
            });
          });
          
          // Update last fetch time
          lastFetch = new Date().toISOString();
          
          console.log(`Received ${data.notifications.length} new notifications`);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);

    // Initial fetch
    fetchNotifications();

    return () => clearInterval(interval);
  }, [addNotification]);
}

// Utility function to trigger a test notification (for development)
export function triggerTestNotification() {
  const { addNotification } = useNotificationStore.getState();
  
  addNotification({
    type: 'cash_verification',
    title: 'Neue Barzahlung Verifikation',
    message: 'User hat ein Selfie mit Handzeichen hochgeladen',
    data: {
      verificationId: 'test_123',
      userId: 'user_456'
    }
  });
}

