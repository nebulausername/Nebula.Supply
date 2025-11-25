import { io } from '../index';
import { logger } from '../utils/logger';

interface PaymentNotificationRequest {
  dropId: string;
  dropName: string;
  userIds: string[];
  amount: number;
  currency: string;
  deadline?: string;
}

/**
 * Send payment request notifications to all users who preordered a drop
 * This is called when a drop reaches minimum orders or is fake-completed
 */
export async function sendPaymentNotifications(
  request: PaymentNotificationRequest
): Promise<{ sent: number; failed: number }> {
  const { dropId, dropName, userIds, amount, currency, deadline } = request;
  
  let sent = 0;
  let failed = 0;

  logger.info(`Sending payment notifications for drop ${dropId} to ${userIds.length} users`);

  // Broadcast WebSocket event to all connected clients
  try {
    if (io) {
      userIds.forEach((userId) => {
        io.to(`user:${userId}`).emit('payment:request', {
          type: 'payment:request',
          dropId,
          dropName,
          userId,
          amount,
          currency,
          deadline,
          timestamp: new Date().toISOString()
        });
        sent++;
      });

      // Also broadcast general drop update
      io.emit('drop:payment_request_sent', {
        type: 'drop:payment_request_sent',
        dropId,
        dropName,
        userCount: userIds.length,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Error broadcasting payment notifications:', error);
    failed = userIds.length;
  }

  // TODO: In production, also send:
  // - Email notifications
  // - Telegram bot messages
  // - SMS (optional)

  logger.info(`Payment notifications sent: ${sent} successful, ${failed} failed`);

  return { sent, failed };
}

/**
 * Get all user IDs who preordered a specific drop
 * This should query the database for preorders
 */
export async function getPreorderUserIds(dropId: string): Promise<string[]> {
  // TODO: Implement database query
  // SELECT DISTINCT user_id FROM preorders WHERE drop_id = $1 AND status = 'pending' OR status = 'locked'
  
  // For now, return empty array - will be implemented with database
  return [];
}

