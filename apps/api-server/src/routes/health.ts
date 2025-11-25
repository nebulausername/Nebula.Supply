import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache';
import { databaseService } from '../services/database';

const router = Router();

// GET /health - Grundlegender Health Check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    responseTime: Date.now() - startTime
  };

  res.json(health);
}));

// GET /health/detailed - Detaillierter Health Check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();

  // Prüfe alle System-Komponenten
  const [cacheHealth, dbHealth] = await Promise.all([
    cacheService.healthCheck(),
    Promise.resolve(databaseService.getConnection())
  ]);

  // Bestimme Gesamtstatus
  let overallStatus = 'healthy';
  const components = {
    cache: cacheHealth.connected ? 'healthy' : 'unhealthy',
    database: dbHealth.isConnected ? 'healthy' : 'unhealthy'
  };

  if (Object.values(components).some(status => status === 'unhealthy')) {
    overallStatus = 'unhealthy';
  } else if (Object.values(components).some(status => status === 'degraded')) {
    overallStatus = 'degraded';
  }

  // Erweiterte Redis-Informationen
  const redisDetails = cacheHealth.mode === 'redis' ? {
    mode: 'redis',
    connected: cacheHealth.connected,
    metrics: cacheHealth.metrics,
    redisInfo: cacheHealth.redisInfo,
    connectionStatus: cacheHealth.metrics?.connectionStatus || 'unknown',
    hitRate: cacheHealth.metrics?.hitRate || 0,
    missRate: cacheHealth.metrics?.missRate || 0,
    avgLatency: cacheHealth.metrics?.avgLatency || 0,
    totalOperations: cacheHealth.metrics?.operationCount || 0,
    errors: cacheHealth.metrics?.errors || 0,
  } : {
    mode: 'memory',
    connected: cacheHealth.connected,
    memoryStoreSize: cacheHealth.memoryStoreSize || 0,
    metrics: cacheHealth.metrics,
  };

  const health = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    responseTime: Date.now() - startTime,
    components,
    details: {
      cache: {
        ...cacheHealth,
        ...redisDetails,
      },
      database: dbHealth
    }
  };

  // HTTP Status Code basierend auf Health
  const statusCode = overallStatus === 'healthy' ? 200 :
                   overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
}));

// GET /health/ready - Kubernetes Readiness Probe
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const dbHealth = databaseService.getConnection();

  if (!dbHealth.isConnected) {
    logger.warn('Readiness check failed - database not connected');
    return res.status(503).json({
      status: 'not ready',
      reason: 'database not connected'
    });
  }

  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
}));

// GET /health/live - Kubernetes Liveness Probe
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // Einfache Liveness-Prüfung - wenn der Server läuft, ist er alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}));

// GET /health/metrics - Prometheus Metrics (wenn gewünscht)
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    // Zusätzliche Metriken könnten hier hinzugefügt werden
  };

  res.json({
    success: true,
    data: metrics
  });
}));

export { router as healthRoutes };
