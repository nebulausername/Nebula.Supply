/**
 * Performance Dashboard
 * Advanced admin dashboard with performance monitoring
 */

import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";
import { getAnalytics } from "../utils/analytics";
import { getPerformanceMonitor } from "../utils/performanceMonitor";
import { getSimpleOptimizer } from "../utils/simpleOptimizer";
// import { getHealthCheck } from "../utils/healthCheck";

export const registerPerformanceDashboard = (bot: Telegraf<NebulaContext>) => {
  
  // Performance Dashboard Command
  bot.command("performance", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ Nur Admins können Performance-Daten abrufen.");
      return;
    }

    logger.info("Performance dashboard accessed", { userId: ctx.from?.id });

    const analytics = getAnalytics();
    const performance = getPerformanceMonitor();
    const optimizer = getSimpleOptimizer();
    // const health = getHealthCheck();

    const metrics = analytics.getMetrics();
    const performanceMetrics = performance.getMetrics();
    const insights = performance.getInsights();
    const report = optimizer.getOptimizationReport();

    await ctx.reply(
      "📊 **Performance Dashboard**\n\n" +
      "📈 **Analytics:**\n" +
      `• Total Users: ${metrics.totalUsers}\n` +
      `• Active Users: ${metrics.activeUsers}\n` +
      `• Total Messages: ${metrics.totalMessages}\n` +
      `• Commands Used: ${Array.from(metrics.commandsUsed.entries()).length}\n\n` +
      "⚡ **Performance:**\n" +
      `• Avg Response Time: ${performanceMetrics.averageResponseTime}ms\n` +
      `• Error Rate: ${performanceMetrics.errorRate}%\n` +
      `• Memory Usage: ${performanceMetrics.memoryUsage}MB\n` +
      `• Uptime: ${Math.floor(performanceMetrics.uptime / 60)}min\n\n` +
      "🔧 **Optimizations:**\n" +
      (insights.length > 0 ? insights.map(insight => `• ${insight}`).join('\n') : '• All systems optimal'),
      Markup.inlineKeyboard([
        [Markup.button.callback("📊 Detailed Report", "performance_detailed")],
        [Markup.button.callback("🔧 Run Optimization", "performance_optimize")],
        [Markup.button.callback("📈 Top Commands", "performance_commands")],
        [Markup.button.callback("🔙 Back to Admin", "admin")]
      ])
    );
  });

  // Detailed Performance Report
  bot.action("performance_detailed", async (ctx) => {
    await ctx.answerCbQuery("📊 Detailed report...");
    
    const analytics = getAnalytics();
    const performance = getPerformanceMonitor();
    const optimizer = getSimpleOptimizer();

    const topCommands = analytics.getTopCommands(10);
    const recentEvents = analytics.getRecentEvents(20);
    const report = optimizer.getOptimizationReport();

    let message = "📊 **Detailed Performance Report**\n\n";
    message += report + "\n\n";
    
    message += "🔥 **Top Commands:**\n";
    topCommands.forEach((cmd, index) => {
      message += `${index + 1}. ${cmd.command}: ${cmd.count} uses\n`;
    });

    message += "\n📝 **Recent Events:**\n";
    recentEvents.slice(-5).forEach((event: any) => {
      const time = new Date(event.timestamp).toLocaleTimeString('de-DE');
      const label = (event.type || event.event || 'event');
      message += `• ${label} (${time})\n`;
    });

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Refresh", "performance_detailed")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });

  // Run Optimization
  bot.action("performance_optimize", async (ctx) => {
    await ctx.answerCbQuery("🔧 Running optimization...");
    
    const optimizer = getSimpleOptimizer();
    const suggestions = await optimizer.runOptimization();
    
    if (suggestions.length === 0) {
      await ctx.reply(
        "✅ **No optimizations needed**\n\n" +
        "All systems are running optimally!",
        Markup.inlineKeyboard([
          [Markup.button.callback("🔙 Back", "performance")]
        ])
      );
      return;
    }

    let message = "🔧 **Optimization Results**\n\n";
    suggestions.forEach((suggestion, index) => {
      const priority = suggestion.priority === 'critical' ? '🔴' : 
                      suggestion.priority === 'high' ? '🟠' : 
                      suggestion.priority === 'medium' ? '🟡' : '🟢';
      message += `${priority} **${suggestion.type.toUpperCase()}**\n`;
      message += `${suggestion.description}\n`;
      message += `Action: ${suggestion.action}\n\n`;
    });

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback("✅ Apply Optimizations", "performance_apply")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });

  // Apply Optimizations
  bot.action("performance_apply", async (ctx) => {
    await ctx.answerCbQuery("✅ Applying optimizations...");
    
    const optimizer = getSimpleOptimizer();
    const suggestions = await optimizer.runOptimization();
    await optimizer.applyOptimizations(suggestions);

    await ctx.reply(
      "✅ **Optimizations Applied**\n\n" +
      "Performance optimizations have been applied successfully.\n" +
      "Monitor the performance dashboard for improvements.",
      Markup.inlineKeyboard([
        [Markup.button.callback("📊 View Performance", "performance_detailed")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });

  // Top Commands
  bot.action("performance_commands", async (ctx) => {
    await ctx.answerCbQuery("📈 Top commands...");
    
    const analytics = getAnalytics();
    const topCommands = analytics.getTopCommands(15);

    let message = "📈 **Top Commands**\n\n";
    topCommands.forEach((cmd, index) => {
      const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : '📊';
      message += `${emoji} **${cmd.command}**: ${cmd.count} uses\n`;
    });

    const totalCommands = topCommands.reduce((sum, cmd) => sum + cmd.count, 0);
    message += `\n📊 **Total Commands**: ${totalCommands}`;

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Refresh", "performance_commands")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });

  // Performance Alerts
  bot.command("alerts", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ Nur Admins können Alerts abrufen.");
      return;
    }

    const performance = getPerformanceMonitor();
    const metrics = performance.getMetrics();
    const insights = performance.getInsights();

    let message = "🚨 **Performance Alerts**\n\n";
    
    if (insights.length === 0) {
      message += "✅ **No alerts** - All systems running smoothly!";
    } else {
      insights.forEach(insight => {
        message += `⚠️ ${insight}\n`;
      });
    }

    message += `\n📊 **Current Status:**\n`;
    message += `• Response Time: ${metrics.averageResponseTime}ms\n`;
    message += `• Error Rate: ${metrics.errorRate}%\n`;
    message += `• Memory: ${metrics.memoryUsage}MB\n`;

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔧 Optimize", "performance_optimize")],
        [Markup.button.callback("📊 Dashboard", "performance")],
        [Markup.button.callback("🔙 Back", "admin")]
      ])
    );
  });
};
