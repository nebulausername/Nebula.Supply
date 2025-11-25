interface AnalyticsEmitter {
  track: (eventName: string, data?: Record<string, unknown>) => void;
}

type ErrorLike = Error | { message?: string } | string;

const getEmitter = (): AnalyticsEmitter | null => {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as unknown as { nebulaAnalytics?: AnalyticsEmitter };
  return anyWindow.nebulaAnalytics ?? null;
};

const logDebug = (label: string, payload: Record<string, unknown>) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[analytics:${label}]`, payload);
  }
};

const dispatch = (event: string, data: Record<string, unknown>) => {
  const emitter = getEmitter();
  if (emitter) {
    emitter.track(event, data);
    return;
  }

  logDebug(event, data);
};

export const trackEvent = (event: string, data: Record<string, unknown> = {}) => {
  dispatch(event, data);
};

export const trackWebVital = (metric: string, value: number, extra: Record<string, unknown> = {}) => {
  dispatch('web_vital', { metric, value, ...extra });
};

export const trackError = (event: string, error: ErrorLike, extra: Record<string, unknown> = {}) => {
  const payload: Record<string, unknown> = {
    message: typeof error === 'string' ? error : error?.message ?? 'Unknown error',
    ...extra
  };

  if (error instanceof Error && error.stack) {
    payload.stack = error.stack;
  }

  dispatch(event, payload);
};

// Scroll Depth Tracking
let scrollDepthTracked: Set<number> = new Set();
const scrollDepthMilestones = [25, 50, 75, 90, 100];

export const trackScrollDepth = (depth: number) => {
  const milestone = scrollDepthMilestones.find(m => depth >= m && !scrollDepthTracked.has(m));
  if (milestone) {
    scrollDepthTracked.add(milestone);
    dispatch('scroll_depth', { depth: milestone, timestamp: Date.now() });
  }
};

export const resetScrollDepth = () => {
  scrollDepthTracked.clear();
};

// Click Heatmap Tracking
export const trackClick = (element: string, x: number, y: number, extra: Record<string, unknown> = {}) => {
  dispatch('click_heatmap', {
    element,
    x,
    y,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    timestamp: Date.now(),
    ...extra
  });
};

// Time on Section Tracking
const sectionTimers: Map<string, number> = new Map();

export const startSectionTimer = (sectionId: string) => {
  sectionTimers.set(sectionId, Date.now());
};

export const endSectionTimer = (sectionId: string) => {
  const startTime = sectionTimers.get(sectionId);
  if (startTime) {
    const duration = Date.now() - startTime;
    dispatch('time_on_section', {
      section: sectionId,
      duration,
      timestamp: Date.now()
    });
    sectionTimers.delete(sectionId);
  }
};

// Performance Metrics
export const trackPerformanceMetric = (metric: string, value: number, extra: Record<string, unknown> = {}) => {
  dispatch('performance_metric', {
    metric,
    value,
    timestamp: Date.now(),
    ...extra
  });
};

// Core Web Vitals Enhanced
export const trackCoreWebVital = (
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB',
  value: number,
  id: string,
  rating: 'good' | 'needs-improvement' | 'poor'
) => {
  dispatch('core_web_vital', {
    name,
    value,
    id,
    rating,
    timestamp: Date.now()
  });
};
