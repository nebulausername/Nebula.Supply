import { Server } from 'socket.io';
import { emitShopEvent } from '../websocket/events/shopEvents';

interface SchedulableDrop { id: string; name: string; scheduledDate?: string }

export class SchedulerService {
  private timer: NodeJS.Timer | null = null;
  private io: Server;
  private getDrops: () => SchedulableDrop[];

  constructor(io: Server, getDrops: () => SchedulableDrop[]) {
    this.io = io;
    this.getDrops = getDrops;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 60 * 1000);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    const now = Date.now();
    for (const drop of this.getDrops()) {
      if (!drop.scheduledDate) continue;
      const startMs = new Date(drop.scheduledDate).getTime();
      const diffMin = Math.round((startMs - now) / 60000);
      if (diffMin === 60 || diffMin === 10) {
        emitShopEvent(this.io, {
          type: 'event:starting_soon',
          eventId: drop.id,
          startsAt: drop.scheduledDate,
          inMinutes: diffMin,
          timestamp: new Date().toISOString()
        });
      }
      if (diffMin === 0) {
        emitShopEvent(this.io, {
          type: 'event:live',
          eventId: drop.id,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
}








