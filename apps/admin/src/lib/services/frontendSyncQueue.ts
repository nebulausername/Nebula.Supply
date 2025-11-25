import { logger } from '../logger';
import { shopSyncService } from './shopSyncService';

export interface SyncTask {
  id: string;
  type: 'shop_to_drops' | 'drops_to_shop' | 'bidirectional';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  retryCount: number;
  maxRetries: number;
  options?: {
    includeInventory?: boolean;
    includeImages?: boolean;
    includeVariants?: boolean;
  };
}

export interface SyncQueueStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
}

class FrontendSyncQueue {
  private queue: SyncTask[] = [];
  private isProcessing = false;
  private listeners: Set<(stats: SyncQueueStats) => void> = new Set();
  private progressListeners: Set<(taskId: string, progress: number) => void> = new Set();

  // Add task to queue
  addTask(
    type: SyncTask['type'],
    options?: SyncTask['options']
  ): string {
    const task: SyncTask = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending',
      progress: 0,
      retryCount: 0,
      maxRetries: 3,
      options: {
        includeInventory: true,
        includeImages: true,
        includeVariants: true,
        ...options,
      },
    };

    this.queue.push(task);
    this.notifyListeners();
    this.processQueue();

    return task.id;
  }

  // Process queue
  private async processQueue() {
    if (this.isProcessing) return;
    if (this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.find(t => t.status === 'pending');
      if (!task) {
        // Check for retrying tasks
        const retryTask = this.queue.find(t => t.status === 'retrying');
        if (!retryTask) {
          break;
        }
        await this.processTask(retryTask);
        continue;
      }

      await this.processTask(task);
    }

    this.isProcessing = false;
  }

  // Process individual task
  private async processTask(task: SyncTask) {
    task.status = 'in_progress';
    task.startedAt = new Date();
    task.progress = 0;
    this.notifyListeners();

    try {
      let response;
      
      // Update progress
      this.updateProgress(task.id, 10);

      switch (task.type) {
        case 'shop_to_drops':
          response = await shopSyncService.syncShopToDropsAnonymously(task.options);
          break;
        case 'drops_to_shop':
          response = await shopSyncService.syncDropsToShopAnonymously(task.options);
          break;
        case 'bidirectional':
          response = await shopSyncService.syncBidirectionalAnonymously(task.options);
          break;
      }

      this.updateProgress(task.id, 50);

      // If sync returns a syncId, poll for status
      if (response?.data?.syncId) {
        await this.pollSyncStatus(task, response.data.syncId);
      } else {
        // Immediate completion
        task.status = 'completed';
        task.progress = 100;
        task.completedAt = new Date();
        this.notifyListeners();
      }
    } catch (error: any) {
      logger.error('[FrontendSyncQueue] Task failed', { taskId: task.id, error });
      
      if (task.retryCount < task.maxRetries) {
        task.status = 'retrying';
        task.retryCount++;
        task.error = error.message;
        this.notifyListeners();
        
        // Retry after delay
        setTimeout(() => {
          this.processQueue();
        }, 2000 * task.retryCount); // Exponential backoff
      } else {
        task.status = 'failed';
        task.error = error.message;
        task.completedAt = new Date();
        this.notifyListeners();
      }
    }
  }

  // Poll sync status
  private async pollSyncStatus(task: SyncTask, syncId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await shopSyncService.getSyncStatus(syncId);
        
        if (status.progress !== undefined) {
          this.updateProgress(task.id, 50 + (status.progress * 0.5)); // 50-100%
        }

        if (status.state === 'completed') {
          task.status = 'completed';
          task.progress = 100;
          task.completedAt = new Date();
          this.notifyListeners();
        } else if (status.state === 'failed') {
          throw new Error('Sync failed on server');
        } else if (status.state === 'in_progress' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        } else if (attempts >= maxAttempts) {
          throw new Error('Sync timeout');
        }
      } catch (error: any) {
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        } else {
          throw error;
        }
      }
    };

    poll();
  }

  // Update progress
  private updateProgress(taskId: string, progress: number) {
    const task = this.queue.find(t => t.id === taskId);
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress));
      this.progressListeners.forEach(listener => listener(taskId, task.progress));
    }
  }

  // Get queue stats
  getStats(): SyncQueueStats {
    return {
      total: this.queue.length,
      pending: this.queue.filter(t => t.status === 'pending').length,
      inProgress: this.queue.filter(t => t.status === 'in_progress').length,
      completed: this.queue.filter(t => t.status === 'completed').length,
      failed: this.queue.filter(t => t.status === 'failed').length,
    };
  }

  // Get task by ID
  getTask(taskId: string): SyncTask | undefined {
    return this.queue.find(t => t.id === taskId);
  }

  // Get all tasks
  getTasks(): SyncTask[] {
    return [...this.queue];
  }

  // Remove completed tasks
  removeCompletedTasks() {
    this.queue = this.queue.filter(t => t.status !== 'completed');
    this.notifyListeners();
  }

  // Clear queue
  clearQueue() {
    this.queue = [];
    this.notifyListeners();
  }

  // Subscribe to stats updates
  subscribe(listener: (stats: SyncQueueStats) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Subscribe to progress updates
  subscribeProgress(listener: (taskId: string, progress: number) => void) {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners() {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }
}

export const frontendSyncQueue = new FrontendSyncQueue();

