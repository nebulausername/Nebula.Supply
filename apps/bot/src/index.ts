import { Telegraf } from "telegraf";
import { appConfig } from "./config";
import { logger } from "./logger";
import type { NebulaContext } from "./types";
import { createConfigMiddleware } from "./middlewares/config";
import { sessionMiddleware } from "./middlewares/session";
import { registerSimplifiedMenu } from "./flows/simplifiedMenu";
import { registerVerificationSystem } from "./flows/verificationSystem";
import { registerInviteSystem } from "./flows/inviteSystem";
import { registerAdminDashboard } from "./flows/adminDashboard";
import { registerSupportTickets } from "./flows/supportTickets";
import { registerFileUpload } from "./flows/fileUpload";
import { registerVipSupport } from "./flows/vipSupport";
import { registerSimpleDashboard } from "./flows/simpleDashboard";
import { initAnalytics, getAnalytics } from "./utils/analytics";
import { initRateLimiter, rateLimitMiddleware } from "./utils/rateLimit";
import { initHealthCheck, registerHealthCheckCommand } from "./utils/healthCheck";
import { createErrorHandler, setupGracefulShutdown } from "./utils/errorHandler";
import { validateBotStartup, printStartupValidation, interactiveSetup } from "./utils/startupValidator";
import { initPerformanceMonitor, performanceMiddleware } from "./utils/performanceMonitor";
import { initSimpleOptimizer } from "./utils/simpleOptimizer";
import { initErrorRecovery } from "./utils/errorRecovery";
import { initMemoryManager } from "./utils/memoryManager";
import { connectRealtime, onEvent } from "./clients/realtimeClient";
import { registerHomeTab } from "./flows/homeTab";
import { registerSettings } from "./flows/settings";
import { registerFAQ } from "./flows/faq";
import { registerPremiumFeatures } from "./flows/premiumFeatures";
import { registerCommonButtons } from "./utils/buttonRegistry";

// Initialize services
initAnalytics(appConfig);
initRateLimiter(appConfig.rateLimitWindow, appConfig.rateLimitMax);
initHealthCheck();
initPerformanceMonitor();
initSimpleOptimizer();
initErrorRecovery();
initMemoryManager();

// Validate bot token
if (!appConfig.botToken || appConfig.botToken === 'your_telegram_bot_token_here') {
  // In development, exit gracefully so monorepo dev doesn't fail
  if (appConfig.nodeEnv !== 'production') {
    logger.warn('BOT_TOKEN is not configured. Skipping bot startup in development.');
    logger.warn('Set BOT_TOKEN in apps/bot/.env to run the bot locally.');
    process.exit(0);
  }

  logger.error('BOT_TOKEN is required in production. Please set BOT_TOKEN in your .env file');
  logger.error('See docs/BOT_SETUP_GUIDE.md for setup instructions');
  process.exit(1);
}

const bot = new Telegraf<NebulaContext>(appConfig.botToken);

// Apply middlewares in optimized order
// 1. Config (fastest, no I/O)
bot.use(createConfigMiddleware(appConfig));

// 2. Session (needs config, may use Redis)
bot.use(sessionMiddleware);

// 3. Rate limiting (protects against abuse)
bot.use(rateLimitMiddleware);

// 4. Performance monitoring (tracks response times)
bot.use(performanceMiddleware);

// 5. Analytics tracking (non-blocking)
bot.use(async (ctx, next) => {
  const startTime = Date.now();
  try {
    await next();
  } finally {
    const duration = Date.now() - startTime;
    const analytics = getAnalytics();
    analytics.trackInteraction('update', ctx, { 
      type: ctx.updateType,
      duration 
    });
    
    // Log slow requests (>1s)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        userId: ctx.from?.id,
        updateType: ctx.updateType,
        duration
      });
    }
  }
});

// Register flows based on feature flags
// IMPORTANT: Register specialized handlers FIRST, simplifiedMenu LAST (as catch-all)

if (appConfig.enableVerification) {
  registerVerificationSystem(bot);
  logger.info("Verification system enabled");
}

if (appConfig.enableInviteSystem) {
  registerInviteSystem(bot);
  logger.info("Invite system enabled");
}

if (appConfig.enableAdminDashboard) {
  registerAdminDashboard(bot);
  logger.info("Admin dashboard enabled");
}

if (appConfig.enableSupportTickets) {
  registerSupportTickets(bot);
  registerFileUpload(bot);
  registerVipSupport(bot);
  logger.info("Support tickets enabled");
}

// Register simple dashboard (always enabled for admins)
registerSimpleDashboard(bot);
logger.info("Simple dashboard enabled");

// Register home tab
registerHomeTab(bot);

// Register settings and FAQ
registerSettings(bot);
registerFAQ(bot);

// Register premium features
registerPremiumFeatures(bot);

// Register simplified menu LAST as catch-all handler (always responds)
registerSimplifiedMenu(bot);

// Register common button actions
registerCommonButtons();

// Register health check command
registerHealthCheckCommand(bot);

// Error handling
const errorHandler = createErrorHandler();
bot.catch(errorHandler);

const launch = async () => {
  // Validate bot configuration before starting
  console.log('🔍 Validating bot configuration...');
  const validation = await validateBotStartup();
  printStartupValidation(validation);
  
  if (!validation.isValid) {
    console.log('❌ Bot kann nicht gestartet werden. Bitte behebe die Fehler.');
    console.log('📋 Siehe BOT_SETUP_GUIDE.md für Hilfe.');
    process.exit(1);
  }

  logger.info(`Starting ${appConfig.botName}`, {
    env: appConfig.nodeEnv,
    webhooks: appConfig.useWebhooks,
    features: {
      verification: appConfig.enableVerification,
      invites: appConfig.enableInviteSystem,
      tickets: appConfig.enableSupportTickets,
      admin: appConfig.enableAdminDashboard
    }
  });

  try {
    if (appConfig.useWebhooks && appConfig.webhookDomain) {
      // Webhook mode for production
      const webhookUrl = `${appConfig.webhookDomain}${appConfig.webhookPath}`;
      logger.info("Starting bot in webhook mode", { webhookUrl });
      await bot.launch({
        webhook: {
          domain: appConfig.webhookDomain,
          port: parseInt(process.env.PORT || "3000")
        }
      });
    } else {
      // Long polling mode for development
      logger.info("Starting bot in polling mode");
      await bot.launch();
    }
  } catch (error) {
    logger.error("Failed to launch bot", { 
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    if (String(error).includes('401')) {
      console.log('\n❌ **Bot Token ungültig!**\n');
      console.log('🔧 **Lösung:**');
      console.log('1. Gehe zu @BotFather auf Telegram');
      console.log('2. Sende `/newbot` und erstelle einen neuen Bot');
      console.log('3. Kopiere den neuen Token');
      console.log('4. Ersetze den Token in `apps/bot/.env`\n');
      console.log('📋 **Siehe BOT_SETUP_GUIDE.md für Details**\n');
    }
    
    process.exit(1);
  }

  logger.info(`${appConfig.botName} is live`, {
    botId: bot.botInfo?.id,
    username: bot.botInfo?.username
  });

  // Log initial metrics
  const analytics = getAnalytics();
  logger.info("Bot analytics initialized", analytics.getMetrics());
  
  // Success message
  console.log('\n🎉 **Nebula Bot erfolgreich gestartet!**\n');
  console.log(`🤖 **Bot:** @${bot.botInfo?.username} (${bot.botInfo?.id})`);
  console.log(`🌐 **WebApp:** ${appConfig.webAppUrl}`);
  console.log(`⚙️ **Mode:** ${appConfig.useWebhooks ? 'Webhook' : 'Polling'}`);
  console.log(`🔧 **Features:** Verification, Invites, Tickets, Admin`);
  console.log('\n📱 **Teste den Bot:**');
  console.log('1. Suche nach deinem Bot in Telegram');
  console.log('2. Sende `/start`');
  console.log('3. Teste die Features!\n');

  // Connect realtime and subscribe
  try {
    const ws = connectRealtime({ baseUrl: process.env.BOT_WS_URL || process.env.API_WS_URL || 'http://localhost:3001' }, bot);
    
    // Drop events
    onEvent('drop:created', async (data: any) => {
      logger.info('RT event: drop:created', data);
      // TODO: fetch verified users and send notification (segmented by rank)
    });
    
    onEvent('event:starting_soon', async (data: any) => {
      logger.info('RT event: starting_soon', data);
      // TODO: fetch verified users and send reminder
    });
    
    onEvent('event:live', async (data: any) => {
      logger.info('RT event: live', data);
      // TODO: fetch verified users and send alert
    });

    onEvent('product:trending', async (data: any) => {
      logger.info('RT event: product:trending', data);
      // TODO: rate-limited notification to verified users
    });

    onEvent('product:hyped', async (data: any) => {
      logger.info('RT event: product:hyped', data);
      // TODO: rate-limited notification to verified users
    });

    logger.info('Realtime subscriptions active');
  } catch (e) {
    logger.warn('Realtime connection failed (non-fatal)', { error: String(e) });
  }
};

launch().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error("Failed to launch bot", { message, stack: error instanceof Error ? error.stack : undefined });
  process.exitCode = 1;
});

// Graceful shutdown
setupGracefulShutdown(async () => {
  logger.info("Stopping bot...");
  
  // Export analytics before shutdown
  const analytics = getAnalytics();
  const finalMetrics = analytics.export();
  logger.info("Final bot metrics", finalMetrics);
  
  // Stop bot
  bot.stop();
  
  logger.info("Bot stopped successfully");
});
