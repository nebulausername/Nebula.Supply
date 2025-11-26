import { liveHomepageEvents } from '../events/liveHomepageEvents';
import { logger } from '../../utils/logger';

export class HomepageMockEventGenerator {
  private intervals: NodeJS.Timeout[] = [];
  private isRunning = false;

  constructor() {
    this.startMockEvents();
  }

  private startMockEvents() {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info('[HomepageMockEvents] Starting mock event generation');

    // Drop events every 30-60 seconds
    const dropInterval = setInterval(() => {
      this.generateDropEvent();
    }, Math.random() * 30000 + 30000);

    // Activity events every 5-15 seconds
    const activityInterval = setInterval(() => {
      this.generateActivityEvent();
    }, Math.random() * 10000 + 5000);

    // Stats updates every 10-20 seconds
    const statsInterval = setInterval(() => {
      this.generateStatsUpdate();
    }, Math.random() * 10000 + 10000);

    this.intervals.push(dropInterval, activityInterval, statsInterval);
  }

  private generateDropEvent() {
    const events = [
      () => this.generateNewDrop(),
      () => this.generateStockChange(),
      () => this.generateProgressUpdate()
    ];

    const randomEvent = events[Math.floor(Math.random() * events.length)];
    randomEvent();
  }

  private generateNewDrop() {
    const dropNames = [
      'Nebula Pro Max',
      'Quantum X1',
      'Stellar Edition',
      'Cosmic Collection',
      'Galaxy Series',
      'Nova Limited',
      'Orbit Special',
      'Flux Premium'
    ];

    const dropName = dropNames[Math.floor(Math.random() * dropNames.length)];
    const dropId = Math.random().toString(36).slice(2);

    liveHomepageEvents.broadcastDropNew(dropId, dropName, 'available');
    logger.info(`[HomepageMockEvents] Generated new drop: ${dropName}`);
  }

  private generateStockChange() {
    const dropNames = [
      'Nebula Pro Max',
      'Quantum X1',
      'Stellar Edition',
      'Cosmic Collection'
    ];

    const dropName = dropNames[Math.floor(Math.random() * dropNames.length)];
    const dropId = Math.random().toString(36).slice(2);
    const stock = Math.floor(Math.random() * 50) + 10;

    liveHomepageEvents.broadcastDropStockChanged(dropId, dropName, stock);
    logger.info(`[HomepageMockEvents] Generated stock change: ${dropName} - ${stock} left`);
  }

  private generateProgressUpdate() {
    const dropNames = [
      'Nebula Pro Max',
      'Quantum X1',
      'Stellar Edition',
      'Cosmic Collection'
    ];

    const dropName = dropNames[Math.floor(Math.random() * dropNames.length)];
    const dropId = Math.random().toString(36).slice(2);
    const progress = Math.random() * 0.3 + 0.7; // 70-100% progress

    liveHomepageEvents.broadcastDropProgress(dropId, dropName, progress);
    logger.info(`[HomepageMockEvents] Generated progress update: ${dropName} - ${Math.round(progress * 100)}%`);
  }

  private generateActivityEvent() {
    const activities = [
      {
        action: 'purchase' as const,
        messages: [
          'hat einen Drop gekauft 🎯',
          'hat 3 Produkte bestellt 🛍️',
          'hat VIP freigeschaltet 👑',
          'hat Premium gekauft 💎'
        ]
      },
      {
        action: 'interest' as const,
        messages: [
          'ist interessiert an einem Drop ⭐',
          'hat einen Drop geliked ❤️',
          'verfolgt einen Drop 👀'
        ]
      },
      {
        action: 'invite' as const,
        messages: [
          'hat 5 Freunde eingeladen 🎉',
          'Team Level aufgestiegen ⭐',
          'Invite Code aktiviert ✨',
          'hat 10 Freunde geworben 🚀'
        ]
      },
      {
        action: 'achievement' as const,
        messages: [
          'Erfolg freigeschaltet! 🏆',
          'hat 100 Coins verdient 💰',
          'ist jetzt Supernova 🌟',
          'hat Level 10 erreicht 🎖️'
        ]
      }
    ];

    const activity = activities[Math.floor(Math.random() * activities.length)];
    const message = activity.messages[Math.floor(Math.random() * activity.messages.length)];
    const userId = Math.random().toString(36).slice(2);
    const userHandle = ['@neo', '@luna', '@max', '@stella', '@kai', '@nova', '@orbit', '@flux'][Math.floor(Math.random() * 8)];

    liveHomepageEvents.broadcastUserActivity(
      userId,
      userHandle,
      activity.action,
      'homepage',
      `${userHandle} ${message}`
    );

    logger.info(`[HomepageMockEvents] Generated activity: ${userHandle} ${activity.action}`);
  }

  private generateStatsUpdate() {
    // Stats are automatically updated by the HomepageStatsService
    // This is just for logging
    logger.info('[HomepageMockEvents] Stats update triggered');
  }

  public stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;
    logger.info('[HomepageMockEvents] Mock event generation stopped');
  }

  public isActive() {
    return this.isRunning;
  }
}

export const homepageMockEventGenerator = new HomepageMockEventGenerator();




































































































