import { logger } from "../logger";
import type { NebulaContext } from "../types";

export interface ScreenContext {
  screenId: string;
  title: string;
  data?: any;
  timestamp: Date;
  breadcrumb: string;
}

export interface NavigationStack {
  screens: ScreenContext[];
  currentIndex: number;
  maxHistory: number;
}

export class NavigationManager {
  private static instance: NavigationManager;
  private userStacks = new Map<string, NavigationStack>();

  private constructor() {}

  static getInstance(): NavigationManager {
    if (!NavigationManager.instance) {
      NavigationManager.instance = new NavigationManager();
    }
    return NavigationManager.instance;
  }

  private getUserId(ctx: NebulaContext): string {
    return ctx.from?.id?.toString() || 'unknown';
  }

  private getUserStack(userId: string): NavigationStack {
    if (!this.userStacks.has(userId)) {
      this.userStacks.set(userId, {
        screens: [],
        currentIndex: -1,
        maxHistory: 10
      });
    }
    return this.userStacks.get(userId)!;
  }

  // Push a new screen to the navigation stack
  pushScreen(ctx: NebulaContext, screenId: string, title: string, data?: any): void {
    const userId = this.getUserId(ctx);
    const stack = this.getUserStack(userId);
    
    // Remove any screens after current index (when navigating from middle of stack)
    if (stack.currentIndex < stack.screens.length - 1) {
      stack.screens = stack.screens.slice(0, stack.currentIndex + 1);
    }

    // Create breadcrumb
    const parentBreadcrumb = stack.screens.length > 0 ? stack.screens[stack.currentIndex].breadcrumb : '';
    const breadcrumb = parentBreadcrumb ? `${parentBreadcrumb} > ${title}` : title;

    const newScreen: ScreenContext = {
      screenId,
      title,
      data,
      timestamp: new Date(),
      breadcrumb
    };

    // Add new screen
    stack.screens.push(newScreen);
    stack.currentIndex = stack.screens.length - 1;

    // Limit history size
    if (stack.screens.length > stack.maxHistory) {
      stack.screens.shift();
      stack.currentIndex--;
    }

    logger.info("Screen pushed to navigation stack", { 
      userId, 
      screenId, 
      title, 
      breadcrumb,
      stackSize: stack.screens.length 
    });
  }

  // Pop current screen and return to previous
  popScreen(ctx: NebulaContext): ScreenContext | null {
    const userId = this.getUserId(ctx);
    const stack = this.getUserStack(userId);
    
    if (stack.currentIndex <= 0) {
      return null; // No previous screen
    }

    const currentScreen = stack.screens[stack.currentIndex];
    stack.currentIndex--;
    
    logger.info("Screen popped from navigation stack", { 
      userId, 
      currentScreen: currentScreen.screenId,
      newIndex: stack.currentIndex 
    });

    return stack.screens[stack.currentIndex];
  }

  // Get current screen
  getCurrentScreen(ctx: NebulaContext): ScreenContext | null {
    const userId = this.getUserId(ctx);
    const stack = this.getUserStack(userId);
    
    if (stack.currentIndex < 0 || stack.currentIndex >= stack.screens.length) {
      return null;
    }

    return stack.screens[stack.currentIndex];
  }

  // Get previous screen
  getPreviousScreen(ctx: NebulaContext): ScreenContext | null {
    const userId = this.getUserId(ctx);
    const stack = this.getUserStack(userId);
    
    if (stack.currentIndex <= 0) {
      return null;
    }

    return stack.screens[stack.currentIndex - 1];
  }

  // Get breadcrumb trail
  getBreadcrumb(ctx: NebulaContext): string {
    const currentScreen = this.getCurrentScreen(ctx);
    return currentScreen?.breadcrumb || 'Home';
  }

  // Check if we can go back
  canGoBack(ctx: NebulaContext): boolean {
    const userId = this.getUserId(ctx);
    const stack = this.getUserStack(userId);
    return stack.currentIndex > 0;
  }

  // Navigate to specific screen (for deep links)
  navigateToScreen(ctx: NebulaContext, screenId: string, title: string, data?: any): void {
    const userId = this.getUserId(ctx);
    const stack = this.getUserStack(userId);
    
    // Find if screen already exists in history
    const existingIndex = stack.screens.findIndex(s => s.screenId === screenId);
    
    if (existingIndex !== -1) {
      // Navigate to existing screen
      stack.currentIndex = existingIndex;
      logger.info("Navigated to existing screen", { userId, screenId, index: existingIndex });
    } else {
      // Push new screen
      this.pushScreen(ctx, screenId, title, data);
    }
  }

  // Clear navigation history
  clearHistory(ctx: NebulaContext): void {
    const userId = this.getUserId(ctx);
    this.userStacks.delete(userId);
    logger.info("Navigation history cleared", { userId });
  }

  // Get navigation history for debugging
  getHistory(ctx: NebulaContext): ScreenContext[] {
    const userId = this.getUserId(ctx);
    const stack = this.getUserStack(userId);
    return [...stack.screens];
  }

  // Smart back navigation - goes to previous screen or main menu
  async handleBackNavigation(ctx: NebulaContext, fallbackHandler: () => Promise<void>): Promise<boolean> {
    if (this.canGoBack(ctx)) {
      const previousScreen = this.popScreen(ctx);
      if (previousScreen) {
        logger.info("Smart back navigation", { 
          userId: this.getUserId(ctx),
          from: this.getCurrentScreen(ctx)?.screenId,
          to: previousScreen.screenId 
        });
        return true; // Caller should handle the navigation
      }
    }
    
    // Fallback to main menu
    await fallbackHandler();
    return false;
  }
}

// Export singleton instance
export const navigationManager = NavigationManager.getInstance();














































































