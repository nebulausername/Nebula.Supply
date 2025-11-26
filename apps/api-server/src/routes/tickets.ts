import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache';
import { databaseService } from '../services/database';
import { getWebSocketServer } from '../websocket/server';
import { sanitizeString } from '../middleware/sanitize';
import { telegramNotificationService } from '../services/telegramNotification';

const router = Router();

// Separate router for unauthenticated endpoints (development only)
export const ticketDevRoutes = Router();

// POST /api/tickets/seed - Create 3 example tickets (development only)
if (process.env.NODE_ENV !== 'production') {
  ticketDevRoutes.post('/seed', asyncHandler(async (req: Request, res: Response) => {
    logger.info('Seeding example tickets');

    const exampleTickets = [
      {
        id: `TK-EXAMPLE-${Date.now()}-1`,
        subject: 'Versandverzögerung',
        summary: 'Mein Paket wurde vor 5 Tagen bestellt, aber noch nicht versendet. Kann ich ein Update erhalten?',
        status: 'open',
        priority: 'medium',
        category: 'shipping',
        tags: ['versand', 'dringend'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        channel: 'web',
        assignedAgent: null,
        unreadCount: 1,
        sentiment: 'neutral',
        satisfaction: null,
        userId: 'example_user_1',
        telegramUserId: 'example_user_1',
        messages: [{
          id: `MSG-${Date.now()}-1`,
          text: 'Mein Paket wurde vor 5 Tagen bestellt, aber noch nicht versendet. Kann ich ein Update erhalten?',
          from: 'user',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }]
      },
      {
        id: `TK-EXAMPLE-${Date.now()}-2`,
        subject: 'Zahlungsproblem',
        summary: 'Meine Zahlung wurde abgelehnt, obwohl genug Guthaben vorhanden ist. Bitte helfen Sie mir.',
        status: 'in_progress',
        priority: 'high',
        category: 'payment',
        tags: ['zahlung', 'fehler'],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        channel: 'telegram',
        assignedAgent: 'Support Team',
        unreadCount: 0,
        sentiment: 'negative',
        satisfaction: null,
        userId: 'example_user_2',
        telegramUserId: 'example_user_2',
        messages: [{
          id: `MSG-${Date.now()}-2-1`,
          text: 'Meine Zahlung wurde abgelehnt, obwohl genug Guthaben vorhanden ist. Bitte helfen Sie mir.',
          from: 'user',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          id: `MSG-${Date.now()}-2-2`,
          text: 'Wir prüfen das Problem und melden uns innerhalb von 24 Stunden bei Ihnen.',
          from: 'agent',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          id: `MSG-${Date.now()}-2-3`,
          text: 'Das Problem wurde behoben. Ihre Zahlung wurde erfolgreich verarbeitet.',
          from: 'agent',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }]
      },
      {
        id: `TK-EXAMPLE-${Date.now()}-3`,
        subject: 'Produktanfrage',
        summary: 'Wann wird das neue Produkt wieder verfügbar sein? Ich würde es gerne bestellen.',
        status: 'done',
        priority: 'low',
        category: 'product',
        tags: ['produkt', 'verfügbarkeit'],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        channel: 'web',
        assignedAgent: 'Support Team',
        unreadCount: 0,
        sentiment: 'positive',
        satisfaction: 5,
        userId: 'example_user_3',
        telegramUserId: 'example_user_3',
        messages: [{
          id: `MSG-${Date.now()}-3-1`,
          text: 'Wann wird das neue Produkt wieder verfügbar sein? Ich würde es gerne bestellen.',
          from: 'user',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          id: `MSG-${Date.now()}-3-2`,
          text: 'Vielen Dank für Ihre Anfrage! Das Produkt wird voraussichtlich nächste Woche wieder verfügbar sein. Wir benachrichtigen Sie gerne, sobald es wieder im Shop ist.',
          from: 'agent',
          timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        }, {
          id: `MSG-${Date.now()}-3-3`,
          text: 'Das Produkt ist jetzt wieder verfügbar! Sie können es jetzt bestellen.',
          from: 'agent',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }]
      }
    ];

    const createdTickets = [];
    const wsServer = getWebSocketServer();

    for (const ticketData of exampleTickets) {
      try {
        const ticket = await databaseService.create('tickets', ticketData);
        createdTickets.push(ticket);

        // Broadcast WebSocket event
        if (wsServer) {
          await wsServer.broadcastTicketCreated(ticket);
        }
      } catch (error) {
        logger.error('Failed to create example ticket', { error, ticketId: ticketData.id });
      }
    }

    // Invalidate cache
    await cacheService.invalidatePattern('tickets:list:*');
    await cacheService.invalidatePattern('kpi:*');
    await cacheService.invalidatePattern('dashboard:*');

    res.status(201).json({
      success: true,
      data: createdTickets,
      message: `Successfully created ${createdTickets.length} example tickets`
    });
  }));

  ticketDevRoutes.post('/test', [
    body('subject').optional().isLength({ min: 1, max: 200 }),
    body('summary').optional().isLength({ min: 1, max: 1000 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('category').optional().isLength({ min: 1 })
  ], asyncHandler(async (req: Request, res: Response) => {
    const subject = req.body.subject || 'Test Ticket - Realtime Sync Demo';
    const summary = req.body.summary || 'Dies ist ein Test-Ticket um die Echtzeit-Synchronisation zu testen. Das Ticket sollte sofort im Admin Dashboard, Frontend und Telegram erscheinen.';
    const priority = req.body.priority || 'high';
    const category = req.body.category || 'technical';
    const telegramUserId = req.body.telegramUserId || '123456789';

    logger.logTicketEvent('test', 'created', undefined, {
      subject,
      priority,
      category
    });

    const newTicket = {
      id: `TK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      subject,
      summary,
      status: 'open',
      priority,
      category,
      tags: req.body.tags || ['test', 'realtime', 'demo'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      channel: 'api',
      assignedAgent: null,
      unreadCount: 0,
      sentiment: 'neutral',
      satisfaction: null,
      userId: telegramUserId,
      telegramUserId: telegramUserId,
      messages: [{
        id: `MSG-${Date.now()}`,
        text: summary,
        from: 'user',
        timestamp: new Date().toISOString()
      }]
    };

    const ticket = await databaseService.create('tickets', newTicket);

    // Cache invalidieren
    await cacheService.invalidatePattern('tickets:list:*');
    await cacheService.invalidatePattern('kpi:*');
    await cacheService.invalidatePattern('dashboard:*');

    // Broadcast WebSocket event
    try {
      const wsServer = getWebSocketServer();
      if (wsServer) {
        await wsServer.broadcastTicketCreated(ticket);
      }
    } catch (error) {
      logger.debug('WebSocket not available for ticket creation broadcast', { ticketId: ticket.id });
    }

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Test-Ticket erfolgreich erstellt und WebSocket Event gesendet!'
    });
  }));
}

// GET /api/tickets - Ticket-Liste mit Filtering
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    priority,
    assignedAgent,
    limit = '50',
    offset = '0'
  } = req.query;

  logger.info('Tickets requested', {
    userId: req.user?.id,
    filters: { status, priority, assignedAgent, limit, offset }
  });

  const cacheKey = `tickets:list:${status}:${priority}:${assignedAgent}:${limit}:${offset}`;

  const tickets = await cacheService.getOrSet(cacheKey, async () => {
    const filter: any = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedAgent) filter.assignedAgent = assignedAgent;

    const result = await databaseService.getTickets({
      ...filter,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
    
    // Sort by updatedAt descending for better UX
    return result.sort((a: any, b: any) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, 30); // 30 Sekunden Cache

  res.json({
    success: true,
    data: tickets,
    pagination: {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: tickets.length === parseInt(limit as string)
    }
  });
}));

// GET /api/tickets/:id - Einzelnes Ticket
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  logger.info('Ticket details requested', {
    userId: req.user?.id,
    ticketId: id
  });

  const cacheKey = `tickets:detail:${id}`;

  const ticket = await cacheService.getOrSet(cacheKey, async () => {
    return await databaseService.findOne('tickets', id);
  }, 60); // 1 Minute Cache für Ticket-Details

  if (!ticket) {
    throw createError('Ticket nicht gefunden', 404, 'TICKET_NOT_FOUND');
  }

  res.json({
    success: true,
    data: ticket
  });
}));

// POST /api/tickets - Neues Ticket erstellen
router.post('/', [
  body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject ist erforderlich'),
  body('summary').isLength({ min: 1, max: 1000 }).withMessage('Summary ist erforderlich'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Ungültige Priorität'),
  body('category').isLength({ min: 1 }).withMessage('Kategorie ist erforderlich')
], asyncHandler(async (req: Request, res: Response) => {
  // Validation prüfen
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg,
      value: err.type === 'field' ? (err as any).value : undefined
    }));
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR', { details: errorDetails });
  }

  const { subject, summary, priority, category, tags } = req.body;

  // Sanitize user input to prevent XSS
  const sanitizedSubject = sanitizeString(subject, 200);
  const sanitizedSummary = sanitizeString(summary, 1000);
  const sanitizedCategory = sanitizeString(category, 50);

  logger.logTicketEvent('new', 'created', req.user?.id, {
    subject: sanitizedSubject,
    priority,
    category: sanitizedCategory
  });

  // Erstelle neues Ticket
  const telegramUserId = req.body.telegramUserId || req.body.user_id;
  const webUserId = req.body.userId || req.user?.id;
  const sessionId = req.body.sessionId; // Session-ID für anonyme Benutzer
  const channel = telegramUserId ? 'telegram' : (req.body.channel || 'web');
  
  // Generate session ID for anonymous users if no user ID is provided
  // This allows 100% anonymous ticket creation as advertised in the UI
  let finalUserId = telegramUserId || webUserId;
  let finalTelegramUserId = telegramUserId || (webUserId && channel === 'web' ? webUserId : null);
  
  // If no user identifier is provided, generate a session-based ID for anonymous users
  if (!finalUserId && !finalTelegramUserId && !sessionId) {
    // Generate a unique session ID for anonymous ticket creation
    const anonymousSessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    finalUserId = anonymousSessionId;
    finalTelegramUserId = null;
    logger.info('Creating anonymous ticket with generated session ID', { sessionId: anonymousSessionId });
  } else if (sessionId && !finalUserId && !finalTelegramUserId) {
    // Use provided session ID for anonymous users
    finalUserId = sessionId;
    finalTelegramUserId = null;
    logger.info('Creating anonymous ticket with provided session ID', { sessionId });
  }
  
  // Final validation - should never fail at this point, but safety check
  if (!finalUserId) {
    logger.error('Failed to generate user identifier for ticket', {
      telegramUserId,
      webUserId,
      sessionId,
      hasUser: !!req.user
    });
    throw createError('Konnte keine Benutzer-ID generieren', 500, 'USER_ID_GENERATION_FAILED');
  }
  
  const newTicket = {
    id: `TK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    subject: sanitizedSubject,
    summary: sanitizedSummary,
    status: 'open',
    priority,
    category: sanitizedCategory,
    tags: Array.isArray(tags) ? tags.map(tag => sanitizeString(String(tag), 50)) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    channel,
    assignedAgent: null,
    unreadCount: 0,
    sentiment: 'neutral',
    satisfaction: null,
    // Store both userId and telegramUserId for unified access from both sources
    userId: finalUserId,
    telegramUserId: finalTelegramUserId,
    // Initialize messages array with first message (sanitized)
    messages: [{
      id: `MSG-${Date.now()}`,
      text: sanitizedSummary,
      from: 'user',
      timestamp: new Date().toISOString()
    }]
  };

  const ticket = await databaseService.create('tickets', newTicket);

  // Optimized cache invalidation - only invalidate specific patterns
  await Promise.allSettled([
    cacheService.invalidatePattern('tickets:list:*'),
    cacheService.invalidatePattern(`tickets:user:${finalUserId}*`),
    cacheService.invalidatePattern(`tickets:user:${finalTelegramUserId}*`),
    cacheService.invalidatePattern('kpi:*'),
    cacheService.invalidatePattern('dashboard:*')
  ]);

  // Broadcast WebSocket event (non-blocking)
  const broadcastPromise = (async () => {
    try {
      const wsServer = getWebSocketServer();
      if (wsServer) {
        logger.info('[TicketRoute] Broadcasting ticket creation event', {
          ticketId: ticket.id,
          source: ticket.telegramUserId ? 'telegram' : 'web'
        });
        await wsServer.broadcastTicketCreated(ticket);
        logger.debug('[TicketRoute] Ticket creation event broadcasted successfully', {
          ticketId: ticket.id
        });
      } else {
        logger.warn('[TicketRoute] WebSocket server not available for ticket creation broadcast', {
          ticketId: ticket.id
        });
      }
    } catch (error) {
      logger.error('[TicketRoute] Failed to broadcast ticket creation event', {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        ticketId: ticket.id
      });
    }
  })();

  // Send admin Telegram notification via API-Server service (fire-and-forget, non-blocking)
  const apiNotificationPromise = telegramNotificationService.sendTicketCreatedNotification({
    id: ticket.id,
    subject: ticket.subject,
    summary: ticket.summary,
    priority: ticket.priority,
    category: ticket.category,
    status: ticket.status,
    telegramUserId: ticket.telegramUserId,
    userId: ticket.userId,
    createdAt: ticket.createdAt
  }).catch((error) => {
    // Don't fail ticket creation if notification fails - errors are already logged in service
    logger.error('[TicketRoute] Failed to send admin Telegram notification via API service', {
      ticketId: ticket.id,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
  });

  // Log notification attempts
  logger.info('[TicketRoute] Ticket created, notifications initiated', {
    ticketId: ticket.id,
    hasWebSocket: !!getWebSocketServer(),
    source: ticket.telegramUserId ? 'telegram' : 'web',
    priority: ticket.priority,
    category: ticket.category
  });

  // Wait for both notifications to complete (non-blocking for response)
  Promise.allSettled([broadcastPromise, apiNotificationPromise]).then((results) => {
    const broadcastSuccess = results[0].status === 'fulfilled';
    const apiNotificationSuccess = results[1].status === 'fulfilled';
    
    logger.debug('[TicketRoute] Notification results', {
      ticketId: ticket.id,
      broadcastSuccess,
      apiNotificationSuccess
    });
  });

  res.status(201).json({
    success: true,
    data: ticket,
    message: 'Ticket erfolgreich erstellt'
  });
}));

// PUT /api/tickets/:id - Ticket aktualisieren
router.put('/:id', [
  param('id').isLength({ min: 1 }).withMessage('Ticket ID ist erforderlich'),
  body('status').optional().isIn(['open', 'waiting', 'in_progress', 'escalated', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('assignedAgent').optional().isLength({ min: 1 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  const { id } = req.params;
  const updates = req.body;

  // Prüfe ob Ticket existiert
  const existingTicket = await databaseService.findOne('tickets', id);
  if (!existingTicket) {
    throw createError(`Ticket mit ID "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
  }

  // Race condition prevention: Check if ticket was modified since last read
  if (req.body.expectedUpdatedAt) {
    const expectedTime = new Date(req.body.expectedUpdatedAt).getTime();
    const actualTime = new Date((existingTicket as any).updatedAt).getTime();
    if (Math.abs(actualTime - expectedTime) > 1000) {
      throw createError(
        'Ticket wurde zwischenzeitlich aktualisiert. Bitte Seite neu laden.',
        409,
        'CONCURRENT_UPDATE',
        { 
          ticketId: id,
          expectedUpdatedAt: req.body.expectedUpdatedAt,
          actualUpdatedAt: (existingTicket as any).updatedAt
        }
      );
    }
  }

  // Sanitize string fields in updates
  const sanitizedUpdates: any = { ...updates };
  if (sanitizedUpdates.subject) {
    sanitizedUpdates.subject = sanitizeString(sanitizedUpdates.subject, 200);
  }
  if (sanitizedUpdates.summary) {
    sanitizedUpdates.summary = sanitizeString(sanitizedUpdates.summary, 1000);
  }
  if (sanitizedUpdates.category) {
    sanitizedUpdates.category = sanitizeString(sanitizedUpdates.category, 50);
  }

  logger.logTicketEvent(id, 'updated', req.user?.id, { updates: sanitizedUpdates });

  // Aktualisiere Ticket
  const updatedTicket = await databaseService.update('tickets', id, {
    ...sanitizedUpdates,
    updatedAt: new Date().toISOString()
  });

  // Optimized cache invalidation - only invalidate affected caches
  const ticketUserId = (updatedTicket as any).userId;
  const ticketTelegramUserId = (updatedTicket as any).telegramUserId;
  
  await Promise.allSettled([
    cacheService.invalidatePattern(`tickets:detail:${id}`),
    cacheService.invalidatePattern('tickets:list:*'),
    ticketUserId && cacheService.invalidatePattern(`tickets:user:${ticketUserId}*`),
    ticketTelegramUserId && cacheService.invalidatePattern(`tickets:user:${ticketTelegramUserId}*`),
    cacheService.invalidatePattern('kpi:*'),
    cacheService.invalidatePattern('dashboard:*')
  ]);

  // Broadcast WebSocket event
  try {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      await wsServer.broadcastTicketUpdate(updatedTicket, updates);
    }
  } catch (error) {
    logger.debug('WebSocket not available for ticket update broadcast', { ticketId: id });
  }

  res.json({
    success: true,
    data: updatedTicket,
    message: 'Ticket erfolgreich aktualisiert'
  });
}));

// POST /api/tickets/:id/status - Ticket-Status ändern
router.post('/:id/status', [
  param('id').isLength({ min: 1 }),
  body('status').isIn(['open', 'waiting', 'in_progress', 'escalated', 'done']),
  body('comment').optional().isLength({ max: 500 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  const { id } = req.params;
  const { status, comment } = req.body;

  // Prüfe ob Ticket existiert
  const existingTicket = await databaseService.findOne('tickets', id);
  if (!existingTicket) {
    throw createError(`Ticket mit ID "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
  }

  const oldStatus = existingTicket.status;

  logger.logTicketEvent(id, 'status_changed', req.user?.id, {
    oldStatus,
    newStatus: status,
    comment
  });

  // Aktualisiere Status
  const updatedTicket = await databaseService.update('tickets', id, {
    status,
    updatedAt: new Date().toISOString()
  });

  // Cache invalidieren
  await cacheService.invalidatePattern(`tickets:detail:${id}`);
  await cacheService.invalidatePattern('tickets:list:*');
  await cacheService.invalidatePattern('kpi:*');
  await cacheService.invalidatePattern('dashboard:*');

  // Broadcast WebSocket event
  try {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      await wsServer.broadcastTicketStatusChange(id, oldStatus, status, updatedTicket);
      await wsServer.broadcastTicketUpdate(updatedTicket, { status });
    }
  } catch (error) {
    logger.debug('WebSocket not available for ticket status change broadcast', { ticketId: id });
  }

  res.json({
    success: true,
    data: updatedTicket,
    message: `Ticket-Status zu "${status}" geändert`
  });
}));

// GET /api/tickets/user/:telegramId - Get tickets for Telegram user (includes both Telegram and Web tickets)
router.get('/user/:telegramId', asyncHandler(async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;

  logger.info('Tickets requested for user', { telegramId, limit, offset });

  const cacheKey = `tickets:user:${telegramId}:${limit}:${offset}`;
    
    const userTickets = await cacheService.getOrSet(cacheKey, async () => {
    // Use optimized database-level filtering instead of loading all tickets
    const tickets = await databaseService.getTickets({
      telegramUserId: telegramId,
      limit,
      offset
      });
      
    return tickets;
    }, 30); // 30 seconds cache
    
    res.json({
      success: true,
    data: userTickets,
    pagination: {
      limit,
      offset,
      hasMore: userTickets.length === limit
    }
  });
}));

// POST /api/tickets/:id/replies - Add reply to ticket (VIP bot feature)
router.post('/:id/replies', [
  param('id').isString().notEmpty(),
  body('from').isIn(['bot', 'user', 'agent', 'system']),
  body('user_id').isString().notEmpty(),
  body('message').isString().notEmpty(),
  body('attachments').optional().isArray()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid reply data', details: errors.array() });
  }

  const { id } = req.params;
  const { from, user_id, message, attachments } = req.body;

  const ticket = await databaseService.findOne('tickets', id);
  if (!ticket) {
    throw createError(`Ticket mit ID "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
  }

  // Race condition prevention: Use atomic update to prevent message loss
  // Read current messages array to ensure we don't lose concurrent updates
  const currentTicket = await databaseService.findOne('tickets', id);
  if (!currentTicket) {
    throw createError(`Ticket mit ID "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
  }

  // Sanitize message content to prevent XSS
  const sanitizedMessage = sanitizeString(message, 5000);

  logger.info('Ticket reply from bot', { ticketId: id, from, userId: user_id });

  // Store message in ticket messages (use current ticket's messages to avoid race conditions)
  const ticketMessages = (currentTicket as any).messages || [];
  
  // Check for duplicate message (prevent duplicate submissions)
  const isDuplicate = ticketMessages.some((msg: any) => 
    msg.text === sanitizedMessage && 
    msg.from === (from === 'bot' ? 'agent' : from) &&
    Math.abs(new Date(msg.timestamp).getTime() - Date.now()) < 5000 // Within 5 seconds
  );
  
  if (isDuplicate) {
    throw createError('Diese Nachricht wurde bereits gesendet', 409, 'DUPLICATE_MESSAGE', { ticketId: id });
  }

  const messageData = {
    id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: sanitizedMessage,
    from: from === 'bot' ? 'agent' : from,
    timestamp: new Date().toISOString(),
    attachments: Array.isArray(attachments) ? attachments.map((att: any) => ({
      ...att,
      name: att.name ? sanitizeString(String(att.name), 200) : undefined,
      url: att.url ? sanitizeString(String(att.url), 500) : undefined
    })) : []
  };

  // Add message to current messages array
  ticketMessages.push(messageData);

  // Update ticket status if needed
  let statusUpdate: any = { updatedAt: new Date().toISOString() };
  if (ticket.status === 'open' && from === 'agent') {
    statusUpdate.status = 'in_progress';
  } else if (ticket.status === 'waiting' && from === 'agent') {
    statusUpdate.status = 'in_progress';
  } else if (from === 'user' && ticket.status === 'in_progress') {
    statusUpdate.status = 'waiting';
  }

  const updatedTicket = await databaseService.update('tickets', id, {
    ...statusUpdate,
    messages: ticketMessages,
    unreadCount: from === 'user' ? ((ticket.unreadCount || 0) + 1) : 0
  });

  // Optimized cache invalidation - use Promise.allSettled for parallel execution
  const ticketUserId = (updatedTicket as any).userId;
  const ticketTelegramUserId = (updatedTicket as any).telegramUserId;
  
  const invalidationPromises = [
    cacheService.invalidatePattern(`tickets:detail:${id}`),
    cacheService.invalidatePattern('tickets:list:*'),
    cacheService.invalidatePattern(`tickets:user:${user_id}*`)
  ];
  
  // Only invalidate additional user caches if they differ
  if (ticketTelegramUserId && String(ticketTelegramUserId) !== String(user_id)) {
    invalidationPromises.push(cacheService.invalidatePattern(`tickets:user:${ticketTelegramUserId}*`));
  }
  
  if (ticketUserId && String(ticketUserId) !== String(user_id) && String(ticketUserId) !== String(ticketTelegramUserId)) {
    invalidationPromises.push(cacheService.invalidatePattern(`tickets:user:${ticketUserId}*`));
  }
  
  await Promise.allSettled(invalidationPromises);

  // Broadcast WebSocket event for real-time updates
  try {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      await wsServer.broadcastTicketMessageAdded(id, messageData, updatedTicket);
    }
  } catch (error) {
    // WebSocket not available, continue without it
    logger.debug('WebSocket not available for ticket message broadcast', { ticketId: id });
  }

  // Send Telegram notification to user if agent replied
  // Only send if message is from agent (not from user or bot)
  if (from === 'agent' && (updatedTicket as any).telegramUserId) {
    try {
      // Check user notification preferences
      const userId = (updatedTicket as any).telegramUserId || (updatedTicket as any).userId;
      let shouldNotify = true;
      
      if (userId) {
        try {
          const users = await databaseService.findMany('users');
          const user = users.find((u: any) => 
            u.id === userId || 
            u.telegram_id === userId || 
            String(u.telegram_id) === String(userId) ||
            String(u.id) === String(userId)
          );
          
          if (user && (user as any).notificationPreferences) {
            const prefs = (user as any).notificationPreferences;
            // Check if Telegram notifications are enabled and ticket messages are enabled
            shouldNotify = prefs.telegramEnabled !== false && prefs.ticketMessages !== false;
            
            if (!shouldNotify) {
              logger.debug('Telegram notification skipped due to user preferences', {
                ticketId: id,
                userId,
                telegramEnabled: prefs.telegramEnabled,
                ticketMessages: prefs.ticketMessages
              });
            }
          }
        } catch (prefError) {
          // If we can't check preferences, default to sending notification
          logger.debug('Could not check user preferences, defaulting to send notification', {
            error: prefError instanceof Error ? prefError.message : String(prefError)
          });
        }
      }
      
      if (shouldNotify) {
        // Get sender name from request or use default
        const senderName = (req as any).user?.name || (req as any).user?.username || 'Support Team';
        
        await telegramNotificationService.sendTicketMessageNotification(
          {
            id: updatedTicket.id,
            subject: (updatedTicket as any).subject || 'Ticket',
            telegramUserId: (updatedTicket as any).telegramUserId,
            userId: (updatedTicket as any).userId
          },
          {
            text: sanitizedMessage,
            senderName,
            timestamp: messageData.timestamp
          }
        );
        
        logger.info('Telegram notification sent for agent reply', {
          ticketId: id,
          telegramUserId: (updatedTicket as any).telegramUserId
        });
      }
    } catch (error) {
      // Don't fail the request if notification fails
      logger.warn('Failed to send Telegram notification for ticket message', {
        error: error instanceof Error ? error.message : String(error),
        ticketId: id
      });
    }
  }

  res.json({
    success: true,
    data: {
      message: messageData,
      ticket: updatedTicket
    },
    message: 'Reply added to ticket'
  });
}));

// POST /api/tickets/:id/share - Generate shareable link for ticket
router.post('/:id/share', [
  param('id').isLength({ min: 1 }).withMessage('Ticket ID ist erforderlich')
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if ticket exists
  const ticket = await databaseService.findOne('tickets', id);
  if (!ticket) {
    throw createError('Ticket nicht gefunden', 404, 'TICKET_NOT_FOUND');
  }

  // Generate secure share token (expires in 7 days)
  const shareToken = Buffer.from(
    JSON.stringify({
      ticketId: id,
      userId: (ticket as any).userId || (ticket as any).telegramUserId,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: Date.now()
    })
  ).toString('base64url');

  // Generate shareable link
  const baseUrl = process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:5173';
  const shareLink = `${baseUrl}/support?ticket=${id}&token=${shareToken}`;

  logger.info('Share link generated', { ticketId: id });

  res.json({
    success: true,
    data: {
      shareLink,
      shareToken,
      expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
    },
    message: 'Share link generated successfully'
  });
}));

// GET /api/tickets/:id/share/verify - Verify share token and get ticket
router.get('/:id/share/verify', [
  param('id').isLength({ min: 1 }),
], asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    throw createError('Share token erforderlich', 400, 'SHARE_TOKEN_MISSING');
  }

  try {
    // Decode token
    const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());
    
    // Verify token
    if (tokenData.ticketId !== id) {
      throw createError('Ungültiger Token', 401, 'INVALID_TOKEN');
    }

    if (tokenData.expiresAt < Date.now()) {
      throw createError('Token abgelaufen', 401, 'TOKEN_EXPIRED');
    }

    // Get ticket
    const ticket = await databaseService.findOne('tickets', id);
    if (!ticket) {
      throw createError('Ticket nicht gefunden', 404, 'TICKET_NOT_FOUND');
    }

    res.json({
      success: true,
      data: ticket,
      message: 'Token verified successfully'
    });
  } catch (error: any) {
    if (error.message === 'TICKET_NOT_FOUND' || error.message === 'INVALID_TOKEN' || error.message === 'TOKEN_EXPIRED') {
      throw error;
    }
    throw createError('Ungültiger Token', 401, 'INVALID_TOKEN');
  }
}));

// POST /api/tickets/:id/assign - Assign ticket to agent
router.post('/:id/assign', [
  param('id').isLength({ min: 1 }),
  body('agentId').isLength({ min: 1 }).withMessage('Agent ID ist erforderlich')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  const { id } = req.params;
  const { agentId } = req.body;

  const ticket = await databaseService.findOne('tickets', id);
  if (!ticket) {
    throw createError(`Ticket mit ID "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
  }

  const oldAgent = (ticket as any).assignedAgent;

  logger.logTicketEvent(id, 'assigned', req.user?.id, {
    oldAgent,
    newAgent: agentId,
  });

  const updatedTicket = await databaseService.update('tickets', id, {
    assignedAgent: agentId,
    updatedAt: new Date().toISOString()
  });

  await cacheService.invalidatePattern(`tickets:detail:${id}`);
  await cacheService.invalidatePattern('tickets:list:*');
  await cacheService.invalidatePattern('kpi:*');
  await cacheService.invalidatePattern('dashboard:*');

  try {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      await wsServer.broadcastTicketUpdate(updatedTicket, { assignedAgent: agentId });
    }
  } catch (error) {
    logger.debug('WebSocket not available for ticket assignment broadcast', { ticketId: id });
  }

  res.json({
    success: true,
    data: updatedTicket,
    message: `Ticket wurde Agent "${agentId}" zugewiesen`
  });
}));

// POST /api/tickets/:id/notes - Add internal note to ticket
router.post('/:id/notes', [
  param('id').isLength({ min: 1 }),
  body('note').isString().isLength({ min: 1, max: 5000 }).withMessage('Notiz ist erforderlich (max. 5000 Zeichen)')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  const { id } = req.params;
  const { note } = req.body;

  const ticket = await databaseService.findOne('tickets', id);
  if (!ticket) {
    throw createError(`Ticket mit ID "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
  }

  const sanitizedNote = sanitizeString(note, 5000);
  const noteData = {
    id: `NOTE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    note: sanitizedNote,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user?.id || 'admin',
  };

  const ticketNotes = (ticket as any).notes || [];
  ticketNotes.push(noteData);

  const updatedTicket = await databaseService.update('tickets', id, {
    notes: ticketNotes,
    updatedAt: new Date().toISOString()
  });

  await cacheService.invalidatePattern(`tickets:detail:${id}`);
  await cacheService.invalidatePattern('tickets:list:*');

  logger.logTicketEvent(id, 'note_added', req.user?.id, {
    noteId: noteData.id,
  });

  res.json({
    success: true,
    data: {
      note: noteData,
      ticket: updatedTicket
    },
    message: 'Notiz hinzugefügt'
  });
}));

// PUT /api/tickets/:id/notes/:noteId - Update internal note
router.put('/:id/notes/:noteId', [
  param('id').isLength({ min: 1 }),
  param('noteId').isLength({ min: 1 }),
  body('note').isString().isLength({ min: 1, max: 5000 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  const { id, noteId } = req.params;
  const { note } = req.body;

  const ticket = await databaseService.findOne('tickets', id);
  if (!ticket) {
    throw createError(`Ticket mit ID "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
  }

  const ticketNotes = (ticket as any).notes || [];
  const noteIndex = ticketNotes.findIndex((n: any) => n.id === noteId);
  
  if (noteIndex === -1) {
    throw createError(`Notiz mit ID "${noteId}" nicht gefunden`, 404, 'NOTE_NOT_FOUND', { noteId });
  }

  const sanitizedNote = sanitizeString(note, 5000);
  ticketNotes[noteIndex] = {
    ...ticketNotes[noteIndex],
    note: sanitizedNote,
    updatedAt: new Date().toISOString(),
  };

  const updatedTicket = await databaseService.update('tickets', id, {
    notes: ticketNotes,
    updatedAt: new Date().toISOString()
  });

  await cacheService.invalidatePattern(`tickets:detail:${id}`);

  logger.logTicketEvent(id, 'note_updated', req.user?.id, {
    noteId,
  });

  res.json({
    success: true,
    data: {
      note: ticketNotes[noteIndex],
      ticket: updatedTicket
    },
    message: 'Notiz aktualisiert'
  });
}));

// DELETE /api/tickets/:id/notes/:noteId - Delete internal note
router.delete('/:id/notes/:noteId', [
  param('id').isLength({ min: 1 }),
  param('noteId').isLength({ min: 1 })
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  const { id, noteId } = req.params;

  const ticket = await databaseService.findOne('tickets', id);
  if (!ticket) {
    throw createError(`Ticket mit ID "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
  }

  const ticketNotes = (ticket as any).notes || [];
  const filteredNotes = ticketNotes.filter((n: any) => n.id !== noteId);
  
  if (filteredNotes.length === ticketNotes.length) {
    throw createError(`Notiz mit ID "${noteId}" nicht gefunden`, 404, 'NOTE_NOT_FOUND', { noteId });
  }

  const updatedTicket = await databaseService.update('tickets', id, {
    notes: filteredNotes,
    updatedAt: new Date().toISOString()
  });

  await cacheService.invalidatePattern(`tickets:detail:${id}`);

  logger.logTicketEvent(id, 'note_deleted', req.user?.id, {
    noteId,
  });

  res.json({
    success: true,
    data: updatedTicket,
    message: 'Notiz gelöscht'
  });
}));

// POST /api/tickets/merge - Merge multiple tickets into one
router.post('/merge', [
  body('sourceTicketIds').isArray().isLength({ min: 1 }).withMessage('Mindestens ein Quell-Ticket erforderlich'),
  body('targetTicketId').isLength({ min: 1 }).withMessage('Ziel-Ticket ID ist erforderlich'),
  body('options').optional().isObject()
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validierungsfehler', 400, 'VALIDATION_ERROR');
  }

  const { sourceTicketIds, targetTicketId, options } = req.body;

  // Verify all tickets exist
  const targetTicket = await databaseService.findOne('tickets', targetTicketId);
  if (!targetTicket) {
    throw createError(`Ziel-Ticket "${targetTicketId}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: targetTicketId });
  }

  const sourceTickets = [];
  for (const id of sourceTicketIds) {
    const ticket = await databaseService.findOne('tickets', id);
    if (!ticket) {
      throw createError(`Quell-Ticket "${id}" nicht gefunden`, 404, 'TICKET_NOT_FOUND', { ticketId: id });
    }
    if (id === targetTicketId) {
      throw createError('Quell- und Ziel-Ticket können nicht identisch sein', 400, 'INVALID_MERGE');
    }
    sourceTickets.push(ticket);
  }

  // Merge logic
  const mergedMessages = (targetTicket as any).messages || [];
  const mergedTags = new Set((targetTicket as any).tags || []);
  const mergedNotes = (targetTicket as any).notes || [];

  if (options?.keepSourceMessages) {
    sourceTickets.forEach((ticket: any) => {
      if (ticket.messages) {
        mergedMessages.push(...ticket.messages);
      }
    });
  }

  if (options?.keepSourceTags) {
    sourceTickets.forEach((ticket: any) => {
      if (ticket.tags) {
        ticket.tags.forEach((tag: string) => mergedTags.add(tag));
      }
    });
  }

  if (options?.mergeNotes) {
    sourceTickets.forEach((ticket: any) => {
      if (ticket.notes) {
        mergedNotes.push(...ticket.notes);
      }
    });
  }

  // Update target ticket
  const updatedTicket = await databaseService.update('tickets', targetTicketId, {
    messages: mergedMessages,
    tags: Array.from(mergedTags),
    notes: mergedNotes,
    updatedAt: new Date().toISOString()
  });

  // Delete source tickets
  for (const id of sourceTicketIds) {
    await databaseService.delete('tickets', id);
  }

  // Invalidate caches
  await Promise.allSettled([
    cacheService.invalidatePattern(`tickets:detail:${targetTicketId}`),
    cacheService.invalidatePattern('tickets:list:*'),
    cacheService.invalidatePattern('kpi:*'),
    cacheService.invalidatePattern('dashboard:*'),
    ...sourceTicketIds.map(id => cacheService.invalidatePattern(`tickets:detail:${id}`))
  ]);

  // Broadcast WebSocket events
  try {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      await wsServer.broadcastTicketUpdate(updatedTicket, { merged: true });
      sourceTicketIds.forEach(async (id: string) => {
        await wsServer.broadcastTicketUpdate({ id, deleted: true } as any, { deleted: true });
      });
    }
  } catch (error) {
    logger.debug('WebSocket not available for ticket merge broadcast');
  }

  logger.logTicketEvent(targetTicketId, 'merged', req.user?.id, {
    sourceTicketIds,
  });

  res.json({
    success: true,
    data: {
      mergedTicket: updatedTicket,
      deletedTicketIds: sourceTicketIds
    },
    message: `${sourceTicketIds.length} Ticket(s) erfolgreich zusammengeführt`
  });
}));

// GET /api/tickets/duplicates - Find duplicate tickets
router.get('/duplicates', [
  body('ticketId').optional().isLength({ min: 1 })
], asyncHandler(async (req: Request, res: Response) => {
  const { ticketId } = req.query;

  if (ticketId) {
    // Find duplicates for specific ticket
    const ticket = await databaseService.findOne('tickets', ticketId as string);
    if (!ticket) {
      throw createError(`Ticket mit ID "${ticketId}" nicht gefunden`, 404, 'TICKET_NOT_FOUND');
    }

    // Simple duplicate detection based on subject similarity
    const allTickets = await databaseService.findMany('tickets');
    const ticketSubject = (ticket as any).subject?.toLowerCase() || '';
    
    const duplicates = allTickets
      .filter((t: any) => {
        if (t.id === ticketId) return false;
        const otherSubject = t.subject?.toLowerCase() || '';
        // Simple similarity check (can be improved with proper string similarity algorithm)
        const similarity = ticketSubject.split(' ').filter((word: string) => 
          otherSubject.includes(word)
        ).length / Math.max(ticketSubject.split(' ').length, otherSubject.split(' ').length);
        return similarity > 0.5;
      })
      .slice(0, 10);

    res.json({
      success: true,
      data: duplicates,
      message: `${duplicates.length} ähnliche Ticket(s) gefunden`
    });
  } else {
    // Find all potential duplicates
    const allTickets = await databaseService.findMany('tickets');
    const duplicates: any[] = [];
    const processed = new Set<string>();

    for (const ticket of allTickets) {
      if (processed.has(ticket.id)) continue;
      
      const ticketSubject = (ticket as any).subject?.toLowerCase() || '';
      const similar = allTickets.filter((t: any) => {
        if (t.id === ticket.id || processed.has(t.id)) return false;
        const otherSubject = t.subject?.toLowerCase() || '';
        const similarity = ticketSubject.split(' ').filter((word: string) => 
          otherSubject.includes(word)
        ).length / Math.max(ticketSubject.split(' ').length, otherSubject.split(' ').length);
        return similarity > 0.5;
      });

      if (similar.length > 0) {
        duplicates.push({
          group: [ticket, ...similar],
          similarity: 0.5
        });
        processed.add(ticket.id);
        similar.forEach((t: any) => processed.add(t.id));
      }
    }

    res.json({
      success: true,
      data: duplicates.slice(0, 20), // Limit to 20 groups
      message: `${duplicates.length} Duplikat-Gruppen gefunden`
    });
  }
}));

// GET /api/tickets/stats - Ticket-Statistiken
router.get('/stats/overview', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Ticket stats requested', { userId: req.user?.id });

  const cacheKey = 'tickets:stats:overview';

  const stats = await cacheService.getOrSet(cacheKey, async () => {
    const ticketStats = await databaseService.getTicketStats();

    // Zusätzliche Statistiken berechnen
    const tickets = await databaseService.findMany('tickets');

    const avgResolutionTime = tickets
      .filter(t => t.status === 'done')
      .reduce((acc, t) => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        return acc + (updated - created);
      }, 0) / (tickets.filter(t => t.status === 'done').length || 1) / (1000 * 60); // Minuten

    return {
      ...ticketStats,
      avgResolutionTime: Math.round(avgResolutionTime),
      satisfactionScore: 4.6, // Placeholder
      automationDeflectionRate: 0.42, // Placeholder
      timestamp: new Date().toISOString()
    };
  }, 60); // 1 Minute Cache

  res.json({
    success: true,
    data: stats
  });
}));

export { router as ticketRoutes };
