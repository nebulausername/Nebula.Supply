/**
 * Health Check System for NEBULA Bot
 * Monitors bot health and provides status information
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  features: {
    supportTickets: boolean;
    verification: boolean;
    invites: boolean;
    admin: boolean;
  };
  metrics: {
    totalUsers: number;
    totalTickets: number;
    activeUsers: number;
  };
}

class HealthCheckManager {
  private startTime: number;
  private isHealthy: boolean = true;

  constructor() {
    this.startTime = Date.now();
  }

  init() {
    console.log('[HealthCheck] Initialized');
    
    // Monitor memory usage
    setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Every 30 seconds
  }

  private checkMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      const usagePercentage = (memory.heapUsed / memory.heapTotal) * 100;
      
      if (usagePercentage > 90) {
        console.warn(`[HealthCheck] Critical memory usage: ${usagePercentage.toFixed(2)}%`);
        this.isHealthy = false;
        // Trigger immediate cleanup if available
        try {
          const { getMemoryManager } = require('./memoryManager');
          const memoryManager = getMemoryManager();
          memoryManager.getCurrentMemoryStats(); // This will trigger cleanup if threshold exceeded
        } catch (e) {
          // Memory manager not available, ignore
        }
      } else if (usagePercentage > 85) {
        console.warn(`[HealthCheck] High memory usage: ${usagePercentage.toFixed(2)}%`);
        this.isHealthy = false;
      } else if (usagePercentage > 75) {
        console.warn(`[HealthCheck] Elevated memory usage: ${usagePercentage.toFixed(2)}%`);
        // Still healthy but monitor closely
      } else if (!this.isHealthy && usagePercentage < 70) {
        // Recover health if memory usage drops
        this.markHealthy();
      }
    }
  }

  getStatus(): HealthStatus {
    const uptime = Date.now() - this.startTime;
    const memory = this.getMemoryInfo();

    return {
      status: this.isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime,
      memory,
      features: {
        supportTickets: true,
        verification: true,
        invites: true,
        admin: true
      },
      metrics: {
        totalUsers: 0, // Would be populated from analytics
        totalTickets: 0,
        activeUsers: 0
      }
    };
  }

  private getMemoryInfo() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memory = process.memoryUsage();
      return {
        used: memory.heapUsed,
        total: memory.heapTotal,
        percentage: (memory.heapUsed / memory.heapTotal) * 100
      };
    }
    
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  markUnhealthy() {
    this.isHealthy = false;
    console.warn('[HealthCheck] Bot marked as unhealthy');
  }

  markHealthy() {
    this.isHealthy = true;
    console.log('[HealthCheck] Bot marked as healthy');
  }
}

// Singleton instance
export const healthCheckManager = new HealthCheckManager();

export const initHealthCheck = () => {
  healthCheckManager.init();
};

export const registerHealthCheckCommand = (bot: any) => {
  bot.command('health', async (ctx: any) => {
    const status = healthCheckManager.getStatus();
    
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      unhealthy: '❌'
    };

    const uptimeHours = Math.floor(status.uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((status.uptime % (1000 * 60 * 60)) / (1000 * 60));

    await ctx.reply(
      `${statusEmoji[status.status]} *Bot Health Status*\n\n` +
      `🕐 Uptime: ${uptimeHours}h ${uptimeMinutes}m\n` +
      `💾 Memory: ${status.memory.percentage.toFixed(1)}%\n` +
      `📊 Features: Support ✅ | Verification ✅ | Invites ✅ | Admin ✅\n\n` +
      `_Status: ${status.status.toUpperCase()}_`,
      { parse_mode: 'Markdown' }
    );
  });
};