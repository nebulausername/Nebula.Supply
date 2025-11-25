import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Importiere Middleware und Services
import { errorHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { authMiddleware, optionalAuth } from './middleware/auth';
import { logger } from './utils/logger';
import { initDatabase } from './services/database';
import { initCache } from './services/cache';
import { initWebSocket } from './websocket/server';
import { SchedulerService } from './services/scheduler';
import { botEventManager } from './services/botEventManager';
import { createOrderService } from './services/orderService';
import { createProductService } from './services/productService';
import { createCategoryService } from './services/categoryService';
import { createInventoryService } from './services/inventoryService';
import { createAnalyticsService } from './services/analyticsService';
import { dashboardRoutes } from './routes/dashboard';
import { ticketRoutes } from './routes/tickets';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { botRoutes } from './routes/bot';
import dropsRoutes from './routes/drops';
import affiliateRoutes from './routes/affiliate';
import paymentsRoutes from './routes/payments';
import checkoutRoutes from './routes/checkout';
import cartRoutes from './routes/cart';
import ordersRoutes from './routes/orders';
import productsRoutes from './routes/products';
import categoriesRoutes from './routes/categories';
import inventoryRoutes from './routes/inventory';
import analyticsRoutes from './routes/analytics';
import loyaltyRoutes from './routes/loyalty';
import adminDropsRoutes from './routes/admin/drops';
import adminMediaRoutes from './routes/admin/media';
import statusRoutes from './routes/status';
import adminImagesRoutes from './routes/admin/images';
import adminCommissionRoutes from './routes/admin/commission';
import adminShopSyncRoutes from './routes/admin/shopSync';
import adminSyncRoutes from './routes/admin/sync';
import { adminOnly } from './middleware/auth';
import rewardsRoutes from './routes/rewards';
import rankRoutes from './routes/rank';
import cookieRoutes from './routes/cookie';
import cookieAdminRoutes from './routes/cookieAdmin';
import securityRoutes from './routes/security';

// Lade Environment Variables
dotenv.config();

// Initialisiere Express App
const app = express();
const server = createServer(app);

// Initialisiere Socket.IO
const io = new SocketServer(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      process.env.ADMIN_URL || "http://localhost:5273"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Basic JWT auth for Socket.IO (admin/web can pass token via auth.token)
io.use((socket, next) => {
  try {
    const token = (socket.handshake.auth && (socket.handshake.auth as any).token)
      || (socket.handshake.query && (socket.handshake.query as any).token);

    // Only verify if token looks like a JWT; otherwise allow anonymous
    const looksLikeJwt = typeof token === 'string' && token.split('.').length === 3;
    if (looksLikeJwt) {
      try {
        const decoded = jwt.verify(
          token as string,
          process.env.JWT_SECRET || 'fallback-secret-change-in-production'
        ) as any;

        (socket.data as any).user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          permissions: decoded.permissions || []
        };
      } catch {
        // Invalid token → proceed as anonymous (no roles)
      }
    }

    // If no token is provided, allow connection (public channels), but user is undefined
    return next();
  } catch (err) {
    // Never hard-fail the connection for admin dev; proceed anonymous
    return next();
  }
});

// Middleware Setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    process.env.ADMIN_URL || "http://localhost:5273"
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media (dev)
app.use('/uploads', express.static('storage/uploads'));

// Serve image files with proper cache headers
app.use('/files', (req, res, next) => {
  // Set cache headers for images
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  next();
}, express.static('storage/images'));

// 🚀 Performance Monitoring
import { performanceMonitor } from './middleware/performanceMonitor';
app.use(performanceMonitor);

// Rate Limiting
app.use(rateLimitMiddleware);

// Health Check (ohne Auth)
app.use('/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Ticket Routes: Test and Seed endpoints without auth (development only)
import { ticketDevRoutes } from './routes/tickets';
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/tickets', ticketDevRoutes);
}
// Use optionalAuth to allow anonymous ticket creation (100% Anonym as advertised)
app.use('/api/tickets', optionalAuth, ticketRoutes);
app.use('/api/bot', botRoutes); // Bot-zu-API Integration ohne Auth für Bot-Calls
app.use('/api/drops', dropsRoutes);
app.use('/api/admin/drops', optionalAuth, adminDropsRoutes);
app.use('/api/admin/images', adminOnly, adminImagesRoutes);
app.use('/api/admin/commission', adminOnly, adminCommissionRoutes);
app.use('/api/admin/shop', adminOnly, adminShopSyncRoutes);
app.use('/api/admin/sync', adminOnly, adminSyncRoutes);
app.use('/api/payments', authMiddleware, paymentsRoutes);
app.use('/api/cart', authMiddleware, cartRoutes);
app.use('/api/checkout', authMiddleware, checkoutRoutes);
app.use('/api/orders', authMiddleware, ordersRoutes);
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/categories', authMiddleware, categoriesRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/loyalty', authMiddleware, loyaltyRoutes);
app.use('/api/rewards', rewardsRoutes); // Rewards uses own Telegram auth
app.use('/api/rank', rankRoutes);
app.use('/api/cookie', cookieRoutes);
app.use('/api/admin/cookie', cookieAdminRoutes);
app.use('/api/admin/media', authMiddleware, adminMediaRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/security', authMiddleware, securityRoutes);

// Error Handling (muss nach allen Routes kommen)
app.use(errorHandler);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route nicht gefunden',
    path: req.originalUrl
  });
});

// Server Startup
const startServer = async () => {
  try {
    // Initialisiere Services
    await initDatabase();
    await initCache();

    // Initialisiere WebSocket
    const wsServer = initWebSocket(io);

    // Initialisiere Order Service
    createOrderService(wsServer);

    // Initialisiere Product Service
    createProductService(wsServer);

    // Initialisiere Category Service
    createCategoryService(wsServer);

    // Initialisiere Inventory Service
    createInventoryService(wsServer);

    // Initialisiere Analytics Service
    createAnalyticsService(wsServer);

    // Start scheduler for starting_soon/live notifications based in-memory admin drops
    const { getAdminDrops } = await import('./routes/admin/drops');
    const getDrops = () => getAdminDrops();
    const scheduler = new SchedulerService(io as any, getDrops);
    scheduler.start();

    // Initialisiere Bot Event Manager mit WebSocket Integration
    botEventManager.initializeWebSocketIntegration(wsServer);

    // Starte Server
    const PORT = process.env.PORT || 3001;

    server.listen(PORT, () => {
      logger.info(`🚀 Nebula API Server läuft auf Port ${PORT}`);
      logger.info(`📡 WebSocket Server bereit`);
      logger.info(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });

    // Graceful Shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM empfangen, fahre Server herunter...');
      server.close(() => {
        logger.info('Server erfolgreich heruntergefahren');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Fehler beim Server-Start:', error);
    process.exit(1);
  }
};

// Nur starten wenn diese Datei direkt ausgeführt wird
if (require.main === module) {
  startServer();
}

export { app, server, io };
