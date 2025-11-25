import { logger } from '../utils/logger';

interface Notification {
  id: string;
  type: 'cash_verification' | 'order' | 'support' | 'system';
  title: string;
  message: string;
  data?: any;
  recipients: string[];
  createdAt: string;
  read: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private maxNotifications = 1000; // Keep last 1000 notifications in memory

  async createNotification(params: {
    type: Notification['type'];
    title: string;
    message: string;
    data?: any;
    recipients: string[];
  }): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
      recipients: params.recipients,
      createdAt: new Date().toISOString(),
      read: false
    };

    // Add to in-memory store
    this.notifications.unshift(notification);

    // Keep only last N notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    logger.info('Notification created', {
      id: notification.id,
      type: notification.type,
      recipients: notification.recipients
    });

    // In production: Save to database
    // await database.notifications.create(notification);

    return notification;
  }

  async getNotifications(recipient: string, limit: number = 50): Promise<Notification[]> {
    // Filter notifications for this recipient
    const userNotifications = this.notifications
      .filter(n => n.recipients.includes(recipient) || n.recipients.includes('admin'))
      .slice(0, limit);

    return userNotifications;
  }

  async getNewNotifications(recipient: string, since: string): Promise<Notification[]> {
    const sinceDate = new Date(since);
    
    const newNotifications = this.notifications
      .filter(n => 
        (n.recipients.includes(recipient) || n.recipients.includes('admin')) &&
        new Date(n.createdAt) > sinceDate &&
        !n.read
      );

    return newNotifications;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      logger.info('Notification marked as read', { notificationId });
    }

    // In production: Update in database
    // await database.notifications.update({ id: notificationId }, { read: true });
  }

  async markAllAsRead(recipient: string): Promise<void> {
    this.notifications.forEach(n => {
      if (n.recipients.includes(recipient) || n.recipients.includes('admin')) {
        n.read = true;
      }
    });

    logger.info('All notifications marked as read', { recipient });

    // In production: Update in database
    // await database.notifications.updateMany(
    //   { recipients: recipient, read: false },
    //   { read: true }
    // );
  }
}

export const notificationService = new NotificationService();





