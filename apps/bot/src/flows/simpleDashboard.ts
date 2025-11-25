/**
 * Simple Dashboard
 * Lightweight admin dashboard without complex dependencies
 */

import { Markup, Telegraf } from "telegraf";
import { logger } from "../logger";
import type { NebulaContext } from "../types";
import { getAnalytics } from "../utils/analytics";
import { getPerformanceMonitor } from "../utils/performanceMonitor";
import { getSimpleOptimizer } from "../utils/simpleOptimizer";
import { getErrorRecovery } from "../utils/errorRecovery";
import { getMemoryManager } from "../utils/memoryManager";

export const registerSimpleDashboard = (bot: Telegraf<NebulaContext>) => {
  
  // Simple Performance Dashboard Command
  bot.command("performance", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ Nur Admins können Performance-Daten abrufen.");
      return;
    }

    logger.info("Simple performance dashboard accessed", { userId: ctx.from?.id });

    const analytics = getAnalytics();
    const performance = getPerformanceMonitor();
    const optimizer = getSimpleOptimizer();
    const errorRecovery = getErrorRecovery();
    const memoryManager = getMemoryManager();

    const metrics = analytics.getMetrics();
    const performanceMetrics = performance.getMetrics();
    const insights = performance.getInsights();
    const report = optimizer.getOptimizationReport();

    await ctx.reply(
      "📊 **Simple Performance Dashboard**\n\n" +
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
      (insights.length > 0 ? insights.map(insight => `• ${insight}`).join('\n') : '• All systems optimal') + "\n\n" +
      "🧠 **Memory:**\n" +
      `• Usage: ${(memoryManager.getCurrentMemoryStats().usage * 100).toFixed(1)}%\n` +
      `• Trend: ${memoryManager.getMemoryTrends().trend}\n\n` +
      "🛡️ **Error Recovery:**\n" +
      `• Active Systems: ${Object.keys(errorRecovery.getStatus()).length}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("📊 Detailed Report", "simple_detailed")],
        [Markup.button.callback("🔧 Run Optimization", "simple_optimize")],
        [Markup.button.callback("📈 Top Commands", "simple_commands")],
        [Markup.button.callback("🔙 Back to Admin", "admin")]
      ])
    );
  });

  // Detailed Performance Report
  bot.action("simple_detailed", async (ctx) => {
    await ctx.answerCbQuery("📊 Detailed report...");
    
    const analytics = getAnalytics();
    const performance = getPerformanceMonitor();
    const optimizer = getSimpleOptimizer();
    const errorRecovery = getErrorRecovery();
    const memoryManager = getMemoryManager();

    const topCommands = analytics.getTopCommands(10);
    const recentEvents = analytics.getRecentEvents(20);
    const report = optimizer.getOptimizationReport();

    let message = "📊 **Detailed Performance Report**\n\n";
    message += report + "\n\n";
    
    message += "🔥 **Top Commands:**\n";
    topCommands.forEach((cmd: any, index: number) => {
      message += `${index + 1}. ${cmd.command}: ${cmd.count} uses\n`;
    });

    message += "\n📝 **Recent Events:**\n";
    recentEvents.slice(-5).forEach((event: any) => {
      const time = new Date(event.timestamp).toLocaleTimeString('de-DE');
      message += `• ${event.type} (${time})\n`;
    });

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Refresh", "simple_detailed")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });

  // Run Optimization
  bot.action("simple_optimize", async (ctx) => {
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
        [Markup.button.callback("✅ Apply Optimizations", "simple_apply")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });

  // Apply Optimizations
  bot.action("simple_apply", async (ctx) => {
    await ctx.answerCbQuery("✅ Applying optimizations...");
    
    const optimizer = getSimpleOptimizer();
    const suggestions = await optimizer.runOptimization();
    await optimizer.applyOptimizations(suggestions);

    await ctx.reply(
      "✅ **Optimizations Applied**\n\n" +
      "Performance optimizations have been applied successfully.\n" +
      "Monitor the performance dashboard for improvements.",
      Markup.inlineKeyboard([
        [Markup.button.callback("📊 View Performance", "simple_detailed")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });

  // Top Commands
  bot.action("simple_commands", async (ctx) => {
    await ctx.answerCbQuery("📈 Top commands...");
    
    const analytics = getAnalytics();
    const topCommands = analytics.getTopCommands(15);

    let message = "📈 **Top Commands**\n\n";
    topCommands.forEach((cmd: any, index: number) => {
      const emoji = index < 3 ? ['🥇', '🥈', '🥉'][index] : '📊';
      message += `${emoji} **${cmd.command}**: ${cmd.count} uses\n`;
    });

    const totalCommands = topCommands.reduce((sum: number, cmd: any) => sum + cmd.count, 0);
    message += `\n📊 **Total Commands**: ${totalCommands}`;

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Refresh", "simple_commands")],
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
        [Markup.button.callback("🔧 Optimize", "simple_optimize")],
        [Markup.button.callback("📊 Dashboard", "performance")],
        [Markup.button.callback("🔙 Back", "admin")]
      ])
    );
  });

  // Memory Management Command
  bot.command("memory", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ Nur Admins können Memory-Daten abrufen.");
      return;
    }

    const memoryManager = getMemoryManager();
    const report = memoryManager.getMemoryReport();

    await ctx.reply(
      report,
      Markup.inlineKeyboard([
        [Markup.button.callback("🧹 Force Cleanup", "memory_cleanup")],
        [Markup.button.callback("📊 Memory History", "memory_history")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });

  // Memory Cleanup Action
  bot.action("memory_cleanup", async (ctx) => {
    await ctx.answerCbQuery("🧹 Cleaning up memory...");
    
    const memoryManager = getMemoryManager();
    const before = memoryManager.getCurrentMemoryStats();
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    const after = memoryManager.getCurrentMemoryStats();
    const saved = before.heapUsed - after.heapUsed;

    await ctx.reply(
      `✅ **Memory Cleanup Complete**\n\n` +
      `📊 **Before:** ${(before.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
      `📊 **After:** ${(after.heapUsed / 1024 / 1024).toFixed(2)} MB\n` +
      `💾 **Saved:** ${(saved / 1024 / 1024).toFixed(2)} MB`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Refresh", "memory_cleanup")],
        [Markup.button.callback("🔙 Back", "memory")]
      ])
    );
  });

  // System Status Command
  bot.command("system", async (ctx) => {
    const adminIds = ctx.config.adminIds || [];
    if (!ctx.from || !adminIds.includes(ctx.from.id?.toString())) {
      await ctx.reply("⛔️ Nur Admins können System-Status abrufen.");
      return;
    }

    const analytics = getAnalytics();
    const performance = getPerformanceMonitor();
    const errorRecovery = getErrorRecovery();
    const memoryManager = getMemoryManager();

    const metrics = analytics.getMetrics();
    const performanceMetrics = performance.getMetrics();
    const errorStatus = errorRecovery.getStatus();
    const memoryStats = memoryManager.getCurrentMemoryStats();

    let message = "🖥️ **System Status**\n\n";
    message += "📊 **Analytics:**\n";
    message += `• Total Users: ${metrics.totalUsers}\n`;
    message += `• Active Users: ${metrics.activeUsers}\n`;
    message += `• Total Messages: ${metrics.totalMessages}\n\n`;
    
    message += "⚡ **Performance:**\n";
    message += `• Response Time: ${performanceMetrics.averageResponseTime}ms\n`;
    message += `• Error Rate: ${performanceMetrics.errorRate}%\n`;
    message += `• Uptime: ${Math.floor(performanceMetrics.uptime / 60)}min\n\n`;
    
    message += "🧠 **Memory:**\n";
    message += `• Usage: ${(memoryStats.usage * 100).toFixed(1)}%\n`;
    message += `• Heap: ${(memoryStats.heapUsed / 1024 / 1024).toFixed(2)} MB\n\n`;
    
    message += "🛡️ **Error Recovery:**\n";
    message += `• Monitored Systems: ${Object.keys(errorStatus).length}\n`;
    
    const openCircuitBreakers = Object.values(errorStatus).filter(
      (status: any) => status.circuitBreakerState === 'open'
    ).length;
    
    if (openCircuitBreakers > 0) {
      message += `⚠️ Open Circuit Breakers: ${openCircuitBreakers}\n`;
    } else {
      message += `✅ All systems healthy\n`;
    }

    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔄 Refresh", "system")],
        [Markup.button.callback("🧹 Memory Cleanup", "memory_cleanup")],
        [Markup.button.callback("🔧 Optimize", "simple_optimize")],
        [Markup.button.callback("🔙 Back", "performance")]
      ])
    );
  });
};
