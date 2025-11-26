// Component Preloader - Preloads components on hover for faster navigation

type ComponentLoader = () => Promise<any>;

const preloadCache = new Map<string, Promise<any>>();

// Preload a component module
export function preloadComponent(loader: ComponentLoader): void {
  // Start loading immediately
  const promise = loader();
  preloadCache.set(loader.toString(), promise);
}

// Preload component with delay (for hover events)
export function preloadComponentDelayed(
  loader: ComponentLoader,
  delay: number = 200
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const preload = () => {
    if (cancelled) return;
    
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        preloadComponent(loader);
      }
    }, delay);
  };

  preload();

  // Return cancel function
  return () => {
    cancelled = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

// Preload multiple components
export function preloadComponents(loaders: ComponentLoader[]): void {
  loaders.forEach(loader => preloadComponent(loader));
}

// Clear preload cache
export function clearPreloadCache(): void {
  preloadCache.clear();
}






























