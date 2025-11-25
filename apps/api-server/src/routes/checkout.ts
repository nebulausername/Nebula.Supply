import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { telegramNotificationService } from '../services/telegramNotification';
import { notificationService } from '../services/notificationService';
import { checkoutRateLimit } from '../middleware/rateLimit';
import { sanitizeBody, checkoutItemValidation, addressValidation } from '../middleware/sanitize';
import { csrfProtection, getCsrfToken } from '../middleware/csrf';

const router = Router();

// Apply sanitization to all routes
router.use(sanitizeBody);

// CSRF token endpoint (GET requests don't need CSRF protection)
router.get('/csrf-token', getCsrfToken);

// Apply CSRF protection to all POST/PUT/DELETE routes
router.use(csrfProtection);

// POST /api/checkout/session - erstellt eine (Stub-)Checkout-Session
router.post('/session', checkoutRateLimit, [
  body('userId').isString().trim().isLength({ min: 1, max: 100 }),
  ...checkoutItemValidation,
  body('invite.totalReferrals').optional().isInt({ min: 0, max: 1000 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, userId, invite } = req.body as { items: Array<any>, userId: string, invite?: { totalReferrals?: number } };

  // Serverseitige Invite-Validierung: irgendein Item flagged inviteRequired?
  const requiresInvite = items.some(i => i.inviteRequired === true);
  if (requiresInvite && ((invite?.totalReferrals ?? 0) < 1)) {
    return res.status(403).json({ error: 'Invite erforderlich: Mindestens 1 erfolgreiche Einladung notwendig' });
  }

  // Secure Session ID generation using crypto
  const crypto = require('crypto');
  const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
  const amount = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
  
  // Validate session expiry
  const expiresAt = Date.now() + 1000 * 60 * 10; // 10 minutes

  return res.json({
    success: true,
    sessionId,
    amount,
    currency: 'EUR',
    expiresAt: Date.now() + 1000 * 60 * 10,
    message: 'Checkout Session erstellt'
  });
});

// POST /api/checkout/cash-verification - Upload cash payment hand gesture selfie
router.post('/cash-verification', [
  body('sessionId').isString().trim().isLength({ min: 1, max: 100 }),
  body('userId').isString().trim().isLength({ min: 1, max: 100 }),
  body('orderId').isString().trim().isLength({ min: 1, max: 100 }),
  body('handSign').isString().trim().isLength({ min: 1, max: 50 }),
  body('handSignEmoji').isString().trim().isLength({ min: 1, max: 10 }),
  body('handSignInstructions').isString().trim().isLength({ min: 1, max: 500 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { sessionId, userId, orderId, handSign, handSignEmoji, handSignInstructions } = req.body;
    
    // In production: 
    // 1. Handle file upload (multer or similar)
    // 2. Store file in cloud storage (S3, Cloudinary, etc.)
    // 3. Save verification record to database with photo URL
    // 4. Optionally send notification to admin

    // Secure ID generation
    const crypto = require('crypto');
    const verificationId = `cash_verify_${crypto.randomBytes(12).toString('hex')}`;
    
    // Mock storage - In production, save to database
    const verification = {
      id: verificationId,
      sessionId,
      userId,
      orderId,
      handSign,
      handSignEmoji,
      handSignInstructions,
      photoUrl: 'https://placeholder.example.com/selfie.jpg', // In production: actual uploaded file URL
      status: 'pending_review',
      createdAt: new Date().toISOString()
    };

    console.log('Cash verification created:', verification);

    // Send Telegram notification to admin
    await telegramNotificationService.sendCashVerificationAlert({
      id: verificationId,
      userId,
      orderId,
      handSign,
      handSignEmoji,
      photoUrl: 'https://placeholder.example.com/selfie.jpg', // In production: actual photo URL
      createdAt: new Date().toISOString()
    });

    // Create dashboard notification
    await notificationService.createNotification({
      type: 'cash_verification',
      title: 'Neue Barzahlung Verifikation',
      message: `User ${userId} hat ein Selfie hochgeladen (${handSignEmoji} ${handSign})`,
      data: {
        verificationId,
        userId,
        orderId,
        handSign,
        handSignEmoji,
        photoUrl: 'https://placeholder.example.com/selfie.jpg'
      },
      recipients: ['admin']
    });

    return res.json({
      success: true,
      verificationId,
      status: 'pending_review',
      message: 'Selfie erfolgreich hochgeladen. Warte auf Admin-Freigabe.'
    });
  } catch (error) {
    console.error('Failed to create cash verification:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Fehler beim Hochladen der Verifikation' 
    });
  }
});

// GET /api/checkout/cash-verification/:sessionId/status - Check verification status
router.get('/cash-verification/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // In production: Query database for verification status
    // For now, return mock data
    
    return res.json({
      success: true,
      sessionId,
      status: 'pending_review', // or 'approved' / 'rejected'
      message: 'Warte auf Admin-Freigabe'
    });
  } catch (error) {
    console.error('Failed to get verification status:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Fehler beim Abrufen des Verifikations-Status' 
    });
  }
});

// GET /api/checkout/booked-slots - Get booked time slots for a location and date
router.get('/booked-slots', async (req, res) => {
  try {
    const { locationId, date } = req.query;

    if (!locationId || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing locationId or date parameter'
      });
    }

    // In production: Query database for booked appointments
    // SELECT time FROM cash_appointments 
    // WHERE location_id = ? AND date = ? AND status != 'cancelled'
    
    // Mock data: Simulate some booked slots
    const mockBookedSlots: Record<string, string[]> = {
      [new Date().toISOString().split('T')[0]]: ['14:00', '15:30', '17:00'], // Today
      // Other dates have no bookings
    };

    const bookedTimes = mockBookedSlots[date as string] || [];

    return res.json({
      success: true,
      locationId,
      date,
      bookedTimes,
      message: `${bookedTimes.length} Zeitslots bereits gebucht`
    });
  } catch (error) {
    console.error('Failed to get booked slots:', error);
    return res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen der gebuchten Zeitslots'
    });
  }
});

export default router;





