# Frontend Performance Optimierungen

## Implementierte Optimierungen

### 1. Lazy Loading & Code Splitting

**Bilder:**
```tsx
<img src="..." loading="lazy" alt="..." />
```

**Routes:**
```tsx
const DropsPage = lazy(() => import('./pages/DropsPage'));
const ShopPage = lazy(() => import('./pages/ShopPage'));
```

**Benefits:**
- ✅ Reduzierter Initial Bundle Size
- ✅ Schnellere First Contentful Paint
- ✅ Weniger Netzwerk-Traffic

---

### 2. Mobile-First Responsive Design

**Touch-Targets:**
```tsx
// Minimum 48px height for touch targets
className="min-h-[48px] px-8 py-4"
```

**Breakpoints (Tailwind):**
```tsx
// Mobile-first approach
className="w-full sm:w-auto"  // Full width on mobile, auto on desktop
className="flex-col sm:flex-row"  // Column on mobile, row on desktop
className="text-lg md:text-xl"  // Smaller text on mobile
```

**Viewport Meta:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

---

### 3. API Call Optimization

**Caching:**
```typescript
// Server-side caching with 30s TTL
const cached = await cacheService.get(cacheKey);
if (cached) return res.json({ success: true, data: JSON.parse(cached) });
```

**Debouncing:**
```typescript
// Client-side debounce for frequent calls
const debouncedFetch = useMemo(
  () => debounce(fetchRewardStatus, 1000),
  []
);
```

**Rate Limiting:**
- Max 10 requests/minute per user
- Prevents spam and reduces server load

---

### 4. WebSocket Optimization

**Connection Management:**
```typescript
// Auto-reconnect with exponential backoff
const reconnect = () => {
  const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
  setTimeout(() => connect(), delay);
};
```

**Message Throttling:**
```typescript
// Minimum 100ms between messages
const throttledBroadcast = throttle(broadcast, 100);
```

**Heartbeat:**
```typescript
// Keep connection alive with 30s ping
setInterval(() => ws.send(JSON.stringify({ type: 'ping' })), 30000);
```

---

### 5. Animation Performance

**Reduced Motion:**
```tsx
const { reducedMotion } = useMobileOptimizations();

<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: reducedMotion ? 0 : 0.3 }}
>
```

**GPU Acceleration:**
```tsx
// Use transform instead of top/left for animations
<motion.div style={{ transform: `translateY(${y}px)` }}>
```

**Will-Change:**
```css
.animated-element {
  will-change: transform, opacity;
}
```

---

### 6. Bundle Size Optimization

**Tree Shaking:**
```typescript
// Import only what you need
import { motion } from 'framer-motion';  // ❌
import { motion } from 'framer-motion/dist/framer-motion';  // ✅
```

**Dynamic Imports:**
```typescript
// Load components on demand
const TelegramLoginButton = lazy(() => import('./TelegramLoginButton'));
```

---

## Lighthouse Scores (Target)

### Mobile
- **Performance:** ≥ 90
- **Accessibility:** ≥ 95
- **Best Practices:** ≥ 95
- **SEO:** ≥ 90

### Desktop
- **Performance:** ≥ 95
- **Accessibility:** ≥ 95
- **Best Practices:** ≥ 95
- **SEO:** ≥ 90

---

## Core Web Vitals

### LCP (Largest Contentful Paint)
**Target:** < 2.5s

**Optimizations:**
- Lazy load images below fold
- Preload critical assets
- Optimize hero images

```html
<link rel="preload" href="/hero-image.webp" as="image" />
```

### FID (First Input Delay)
**Target:** < 100ms

**Optimizations:**
- Minimize JavaScript execution time
- Use Web Workers for heavy computations
- Debounce event handlers

### CLS (Cumulative Layout Shift)
**Target:** < 0.1

**Optimizations:**
- Fixed dimensions for images/videos
- Reserve space for dynamic content
- Avoid inserting content above viewport

```tsx
<div className="min-h-[400px]">
  {/* Dynamic content */}
</div>
```

---

## Network Optimization

### HTTP/2 & Compression
```javascript
// vite.config.ts
export default {
  build: {
    target: 'es2015',
    minify: 'terser',
    cssCodeSplit: true
  }
};
```

### Resource Hints
```html
<link rel="dns-prefetch" href="//api.nebula.com" />
<link rel="preconnect" href="https://api.nebula.com" />
```

### Service Worker Caching
```javascript
// Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('nebula-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/styles.css',
        '/main.js'
      ]);
    })
  );
});
```

---

## Memory Management

### Component Cleanup
```typescript
useEffect(() => {
  const interval = setInterval(updateCountdown, 1000);
  return () => clearInterval(interval);  // Cleanup
}, []);
```

### Memo & useMemo
```typescript
// Prevent unnecessary re-renders
const MemoizedComponent = memo(ExpensiveComponent);

// Memoize expensive calculations
const calculation = useMemo(() => heavyCalculation(data), [data]);
```

### Lazy State Updates
```typescript
// Batch state updates
import { unstable_batchedUpdates } from 'react-dom';

unstable_batchedUpdates(() => {
  setStatus(newStatus);
  setLoading(false);
});
```

---

## Monitoring

### Performance Observer
```typescript
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('LCP:', entry);
  }
});
observer.observe({ entryTypes: ['largest-contentful-paint'] });
```

### Error Tracking
```typescript
window.addEventListener('error', (event) => {
  // Send to monitoring service
  trackError(event.error);
});
```

---

## Testing Performance

### Lighthouse CI
```bash
npm run build
npx lighthouse http://localhost:4173 --view
```

### Chrome DevTools
1. Open DevTools (F12)
2. Navigate to "Performance" tab
3. Click "Record"
4. Interact with page
5. Click "Stop"
6. Analyze flame chart

### WebPageTest
```
https://www.webpagetest.org/
```

---

## Best Practices Checklist

- [x] Images have `loading="lazy"`
- [x] Touch targets ≥ 48px
- [x] Mobile-first responsive design
- [x] API calls are cached/debounced
- [x] WebSocket auto-reconnect
- [x] Animations respect `prefers-reduced-motion`
- [x] Bundle size minimized
- [x] Service Worker for offline support
- [x] Error boundaries implemented
- [x] Performance monitoring active

---

## Future Optimizations

### 1. Image Optimization
- Convert to WebP/AVIF
- Implement responsive images
- Use CDN for static assets

### 2. API Improvements
- GraphQL for efficient data fetching
- Server-side rendering (SSR)
- Edge caching with CDN

### 3. Advanced Caching
- IndexedDB for offline data
- Background sync for failed requests
- Optimistic UI updates

### 4. Code Splitting
- Route-based splitting
- Component-based splitting
- Vendor chunk optimization


