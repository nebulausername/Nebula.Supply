import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache';
import { databaseService } from '../services/database';

const router = Router();

// GET /api/dashboard/overview - Gesamtübersicht
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Dashboard overview requested', { userId: req.user?.id });

  const cacheKey = 'dashboard:overview';

  const overview = await cacheService.getOrSet(cacheKey, async () => {
    // Hole alle nötigen Daten
    const ticketStats = await databaseService.getTicketStats();
    const kpis = await getCurrentKPIs();

    return {
      timestamp: new Date().toISOString(),
      kpis,
      ticketStats,
      systemHealth: await getSystemHealth(),
      recentActivity: await getRecentActivity()
    };
  }, 30); // 30 Sekunden Cache

  res.json({
    success: true,
    data: overview
  });
}));

// GET /api/dashboard/kpis - Live KPI Daten
router.get('/kpis', asyncHandler(async (req: Request, res: Response) => {
  logger.info('KPIs requested', { userId: req.user?.id });

  const cacheKey = 'kpi:current';

  const kpis = await cacheService.getOrSet(cacheKey, async () => {
    return await getCurrentKPIs();
  }, 15); // 15 Sekunden Cache für KPIs

  res.json({
    success: true,
    data: kpis
  });
}));

// GET /api/dashboard/trends - Zeitreihen-Daten
router.get('/trends', asyncHandler(async (req: Request, res: Response) => {
  const { timeRange = '24h', metrics = 'all' } = req.query;

  logger.info('Trends requested', {
    userId: req.user?.id,
    timeRange,
    metrics
  });

  const cacheKey = `trends:${timeRange}:${metrics}`;

  const trends = await cacheService.getOrSet(cacheKey, async () => {
    return await getTrendData(timeRange as string, metrics as string);
  }, 60); // 1 Minute Cache für Trends

  res.json({
    success: true,
    data: trends
  });
}));

// GET /api/dashboard/activity - Aktivitäts-Feed
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const { limit = '20' } = req.query;

  logger.info('Activity feed requested', {
    userId: req.user?.id,
    limit
  });

  const cacheKey = `activity:${limit}`;

  const activities = await cacheService.getOrSet(cacheKey, async () => {
    return await getRecentActivity(parseInt(limit as string));
  }, 15); // 15 Sekunden Cache

  res.json({
    success: true,
    data: activities
  });
}));

// GET /api/dashboard/alerts - Aktive Alerts
router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Alerts requested', { userId: req.user?.id });

  const alerts = await getActiveAlerts();

  res.json({
    success: true,
    data: alerts
  });
}));

// Helper Functions
async function getCurrentKPIs() {
  const ticketStats = await databaseService.getTicketStats();

  return {
    openTickets: ticketStats.open,
    waitingTickets: ticketStats.waiting,
    escalatedTickets: ticketStats.escalated,
    totalTickets: ticketStats.total,
    avgResponseTime: ticketStats.avgResponseTime ?? 0,
    avgResolutionTime: ticketStats.avgResolutionTime ?? 0,
    satisfactionScore: ticketStats.satisfactionScore ?? null,
    automationDeflectionRate: ticketStats.automationDeflectionRate ?? 0,
    timestamp: new Date().toISOString()
  };
}


async function getSystemHealth() {
  const cacheHealth = await cacheService.healthCheck();
  const dbConnection = databaseService.getConnection();

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {
      database: dbConnection.isConnected ? 'healthy' : 'unhealthy',
      cache: cacheHealth.connected ? 'healthy' : 'unhealthy'
    },
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  };
}

async function getTrendData(timeRange: string, metrics: string) {
  const requestedMetrics = metrics === 'all'
    ? undefined
    : metrics
        .split(',')
        .map(metric => metric.trim())
        .filter(Boolean);

  return databaseService.getTicketTrends(timeRange, requestedMetrics);
}


async function getRecentActivity(limit: number = 20) {
  const tickets = await databaseService.findMany('tickets');

  const activities = tickets
    .flatMap(ticket => {
      const events: Array<{
        id: string;
        type: string;
        description: string;
        timestamp: string;
        userId: string;
        metadata: Record<string, unknown>;
      }> = [];

      const baseTimestamp = ticket.updatedAt || ticket.createdAt;
      const assignedUser = ticket.assignedAgent ?? 'system';

      events.push({
        id: `ticket-${ticket.id}-status-${baseTimestamp}`,
        type: 'ticket_status',
        description: `Ticket ${ticket.id} status updated to "${ticket.status}"`,
        timestamp: baseTimestamp,
        userId: assignedUser,
        metadata: {
          ticketId: ticket.id,
          status: ticket.status,
          priority: ticket.priority,
          channel: ticket.channel
        }
      });

      if (ticket.priority === 'critical') {
        events.push({
          id: `ticket-${ticket.id}-priority-${baseTimestamp}`,
          type: 'ticket_priority',
          description: `Ticket ${ticket.id} marked as critical`,
          timestamp: baseTimestamp,
          userId: assignedUser,
          metadata: {
            ticketId: ticket.id,
            priority: ticket.priority
          }
        });
      }

      if (ticket.sentiment === 'negative') {
        events.push({
          id: `ticket-${ticket.id}-sentiment-${baseTimestamp}`,
          type: 'ticket_sentiment',
          description: `Negative sentiment detected for ticket ${ticket.id}`,
          timestamp: baseTimestamp,
          userId: assignedUser,
          metadata: {
            ticketId: ticket.id,
            sentiment: ticket.sentiment
          }
        });
      }

      if (ticket.slaDueAt) {
        events.push({
          id: `ticket-${ticket.id}-sla-${ticket.slaDueAt}`,
          type: 'ticket_sla',
          description: `Ticket ${ticket.id} SLA due at ${ticket.slaDueAt}`,
          timestamp: ticket.slaDueAt,
          userId: assignedUser,
          metadata: {
            ticketId: ticket.id,
            slaDueAt: ticket.slaDueAt
          }
        });
      }

      return events;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return activities;
}


async function getActiveAlerts() {
  const ticketStats = await databaseService.getTicketStats({ recordSnapshot: false });

  const alerts = [] as Array<{
    id: string;
    type: 'info' | 'warning';
    severity: 'low' | 'medium' | 'high';
    title: string;
    message: string;
    timestamp: string;
  }>;

  if (ticketStats.escalated > 2) {
    alerts.push({
      id: 'escalated-high',
      type: 'warning',
      severity: 'high',
      title: 'High number of escalated tickets',
      message: `${ticketStats.escalated} tickets are escalated`,
      timestamp: new Date().toISOString()
    });
  }

  if (ticketStats.waiting > 5) {
    alerts.push({
      id: 'waiting-high',
      type: 'info',
      severity: 'medium',
      title: 'Tickets waiting for response',
      message: `${ticketStats.waiting} tickets are waiting on agents`,
      timestamp: new Date().toISOString()
    });
  }

  const avgResponseTime = ticketStats.avgResponseTime ?? 0;
  if (avgResponseTime > 45) {
    alerts.push({
      id: 'response-slow',
      type: 'warning',
      severity: 'high',
      title: 'Response time above target',
      message: `Average response time ${avgResponseTime} minutes`,
      timestamp: new Date().toISOString()
    });
  }

  const automationRate = ticketStats.automationDeflectionRate ?? 0;
  if (automationRate > 0 && automationRate < 0.25) {
    alerts.push({
      id: 'automation-low',
      type: 'info',
      severity: 'medium',
      title: 'Automation efficiency down',
      message: `Automation deflection at ${(automationRate * 100).toFixed(0)}%`,
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}


export { router as dashboardRoutes };
