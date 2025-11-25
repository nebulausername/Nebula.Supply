import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheService } from '../services/cache';
import { logger } from '../utils/logger';

const router = Router();

function maskIp(ip?: string): string {
  if (!ip) return 'N/A';
  // IPv6 or IPv4 masking
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return parts.slice(0, 2).join(':') + '::****';
  }
  const parts = ip.split('.');
  if (parts.length !== 4) return '***.***.***.***';
  return `${parts[0]}.${parts[1]}.***.***`;
}

// GET /api/security/stats
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const cacheKey = 'security:stats';
  const data = await cacheService.getOrSet(cacheKey, async () => {
    // Simulierte/aggregierte Kenndaten (in Produktion aus Metriken/WAF sammeln)
    return {
      failedLogins: 12,
      failedLoginsChange: +3,
      suspiciousActivity: 7,
      suspiciousActivityChange: -2,
      activeThreats: 1,
      mfaCompliance: 0.91,
      timestamp: new Date().toISOString()
    };
  }, 15);

  res.json({ success: true, data });
}));

// GET /api/security/events
router.get('/events', asyncHandler(async (_req: Request, res: Response) => {
  const cacheKey = 'security:events';
  const events = await cacheService.getOrSet(cacheKey, async () => {
    const now = Date.now();
    return [
      {
        id: `se-${now - 60000}`,
        severity: 'high',
        type: 'ddos_attack_detected',
        description: 'Ungewöhnlich hohe Request-Rate (Layer 7) erkannt',
        ipAddress: maskIp('203.0.113.45'),
        timestamp: new Date(now - 60000).toISOString()
      },
      {
        id: `se-${now - 120000}`,
        severity: 'medium',
        type: 'bot_traffic_spike',
        description: 'Erhöhte Bot-Signaturen im Traffic festgestellt',
        ipAddress: maskIp('198.51.100.23'),
        timestamp: new Date(now - 120000).toISOString()
      },
      {
        id: `se-${now - 240000}`,
        severity: 'low',
        type: 'credential_stuffing',
        description: 'Mehrere fehlgeschlagene Login-Versuche in kurzer Zeit',
        ipAddress: maskIp('192.0.2.10'),
        timestamp: new Date(now - 240000).toISOString()
      }
    ];
  }, 15);

  res.json({ success: true, data: events });
}));

// GET /api/security/audit
router.get('/audit', asyncHandler(async (_req: Request, res: Response) => {
  const cacheKey = 'security:audit';
  const logs = await cacheService.getOrSet(cacheKey, async () => {
    const now = Date.now();
    return [
      {
        id: `al-${now - 5000}`,
        userEmail: 'admin@nebula.local',
        action: 'login_success',
        resource: 'auth',
        ipAddress: maskIp('203.0.113.1'),
        status: 'success',
        timestamp: new Date(now - 5000).toISOString()
      },
      {
        id: `al-${now - 45000}`,
        userEmail: 'unknown',
        action: 'login_failed',
        resource: 'auth',
        ipAddress: maskIp('192.0.2.200'),
        status: 'failed',
        timestamp: new Date(now - 45000).toISOString()
      }
    ];
  }, 30);

  res.json({ success: true, data: logs });
}));

// GET /api/security/protection - DDoS/Bot/Anomaly overview (anonymized)
router.get('/protection', asyncHandler(async (_req: Request, res: Response) => {
  const cacheKey = 'security:protection';
  const protection = await cacheService.getOrSet(cacheKey, async () => {
    // Diese Werte sollten in Produktion aus Metriksystem/WAF/Ingress stammen
    const now = new Date().toISOString();
    return {
      timestamp: now,
      requestsPerMinute: 1840,
      uniqueIpsPerMinute: 312,
      botTrafficPercent: 0.38, // ML/Heuristik
      rateLimitBlocksLast15m: 124,
      wafBlocksLast15m: 17,
      ddosRiskScore: 0.72, // 0..1
      suspiciousIpsSample: [
        { ip: maskIp('198.51.100.17'), reason: 'High RPM', lastSeen: now },
        { ip: maskIp('203.0.113.77'), reason: 'Bad UA / Headless', lastSeen: now }
      ]
    };
  }, 10);

  res.json({ success: true, data: protection });
}));

export default router;



