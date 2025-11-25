# 📱 Mobile-First Component Guide

## 🎯 Übersicht

Diese Mobile-First Component Library enthält alle Tools für eine **native App-ähnliche Experience** in deiner Web-App.

## 🚀 Komponenten

### 1. **BottomNavigation** - iOS/Android Style Navigation

```tsx
import { BottomNavigation } from '@/components/mobile';

function App() {
  const [activeTab, setActiveTab] = useState('game');
  
  return (
    <>
      <MainContent />
      <BottomNavigation
        activeItem={activeTab}
        onItemChange={setActiveTab}
      />
    </>
  );
}
```

**Features:**
- ✅ Touch-optimiert (44x44px Targets)
- ✅ Haptic Feedback
- ✅ Smooth Animations
- ✅ Badge Support
- ✅ Safe Area Support

---

### 2. **BottomSheet** - Native Modal System

```tsx
import { BottomSheet, QuickActionSheet } from '@/components/mobile';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Settings"
      snapPoints={[50, 85]}
      showDragHandle
    >
      <div>Your content here</div>
    </BottomSheet>
  );
}
```

**Features:**
- ✅ Drag to dismiss
- ✅ Multiple snap points
- ✅ Backdrop blur
- ✅ Keyboard support (ESC)
- ✅ Body scroll lock

---

### 3. **PullToRefresh** - Native Pull Gesture

```tsx
import { PullToRefresh } from '@/components/mobile';

function Feed() {
  const handleRefresh = async () => {
    await fetchNewData();
  };
  
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <FeedContent />
    </PullToRefresh>
  );
}
```

**Features:**
- ✅ Elastic scroll
- ✅ Loading indicator
- ✅ Haptic feedback
- ✅ Configurable threshold

---

### 4. **MobileCookieButton** - Touch-Optimiert Button

```tsx
import { MobileCookieButton, CookieButtonStats } from '@/components/mobile';

function CookieGame() {
  const handleClick = (x: number, y: number) => {
    addCookies(x, y);
  };
  
  return (
    <>
      <MobileCookieButton
        onClick={handleClick}
        cookiesPerClick={10}
        size="lg"
      />
      <CookieButtonStats
        totalClicks={1234}
        streak={5}
        multiplier={2}
      />
    </>
  );
}
```

**Features:**
- ✅ Ripple effects
- ✅ Haptic feedback
- ✅ Responsive sizing
- ✅ Visual feedback
- ✅ Accessibility

---

### 5. **SwipeableView** - Horizontal Swiping

```tsx
import { SwipeableView, ScrollableCards } from '@/components/mobile';

function TabView() {
  const views = [
    <View1 />,
    <View2 />,
    <View3 />
  ];
  
  return (
    <SwipeableView
      views={views}
      showIndicators
      loop
      onViewChange={(index) => console.log('View:', index)}
    />
  );
}
```

**Features:**
- ✅ Smooth swiping
- ✅ Snap points
- ✅ Indicators
- ✅ Loop mode
- ✅ Haptic feedback

---

### 6. **PWAInstallPrompt** - Progressive Web App

```tsx
import { PWAInstallPrompt, InstallButton } from '@/components/mobile';

function App() {
  return (
    <>
      <YourApp />
      <PWAInstallPrompt />
      
      {/* Or manual button */}
      <InstallButton className="custom-style" />
    </>
  );
}
```

**Features:**
- ✅ Auto-detection
- ✅ iOS instructions
- ✅ Android prompt
- ✅ Dismissible
- ✅ LocalStorage persistence

---

## 🎨 Hooks

### 1. **useEnhancedTouch** - Touch & Haptics

```tsx
import { useEnhancedTouch } from '@/hooks/useEnhancedTouch';

function Component() {
  const { triggerHaptic, toggleHaptic, touchState } = useEnhancedTouch();
  
  const handleClick = () => {
    triggerHaptic('medium');
    // Your logic
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

**Haptic Types:**
- `light` - Leichte Vibration (10ms)
- `medium` - Mittlere Vibration (20ms)
- `heavy` - Starke Vibration (30ms)
- `success` - Erfolgs-Pattern [10, 20, 10]
- `warning` - Warn-Pattern [20, 10, 20]
- `error` - Fehler-Pattern [30, 10, 30, 10, 30]

---

### 2. **useSwipeGesture** - Swipe Detection

```tsx
import { useSwipeGesture } from '@/hooks/useEnhancedTouch';

function Component() {
  const swipeHandlers = useSwipeGesture(
    () => console.log('Swiped left'),
    () => console.log('Swiped right'),
    () => console.log('Swiped up'),
    () => console.log('Swiped down')
  );
  
  return <div {...swipeHandlers}>Swipe me!</div>;
}
```

---

### 3. **usePullToRefresh** - Pull Gesture

```tsx
import { usePullToRefresh } from '@/hooks/useEnhancedTouch';

function Component() {
  const {
    isPulling,
    pullDistance,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  } = usePullToRefresh(async () => {
    await refreshData();
  });
  
  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isPulling && <Indicator />}
      <Content />
    </div>
  );
}
```

---

## 🎨 CSS Utilities

### Safe Area Classes
```css
.safe-top       /* padding-top: env(safe-area-inset-top) */
.safe-bottom    /* padding-bottom: env(safe-area-inset-bottom) */
.safe-left      /* padding-left: env(safe-area-inset-left) */
.safe-right     /* padding-right: env(safe-area-inset-right) */
.safe-area-full /* All safe areas */
```

### Touch Optimizations
```css
.touch-target      /* min 44x44px */
.touch-manipulation /* better touch handling */
.active-feedback    /* press feedback */
```

### Animations
```css
.animate-ripple      /* Ripple effect */
.animate-spin-slow   /* Slow rotation */
.animate-glow-pulse  /* Glow pulsing */
.animate-slide-up    /* Slide from bottom */
.animate-scale-in    /* Scale appearance */
```

### Effects
```css
.glass-effect      /* Glassmorphism */
.neuro-card        /* Neumorphism */
.card-interactive  /* Hover lift effect */
.skeleton          /* Loading skeleton */
.gradient-text     /* Gradient text */
```

### Scrolling
```css
.scrollbar-hide    /* Hide scrollbar */
.snap-x           /* Horizontal snap */
.snap-y           /* Vertical snap */
.snap-start       /* Snap to start */
.snap-center      /* Snap to center */
```

---

## 🚀 PWA Setup

### 1. Register Service Worker

In `src/main.tsx`:

```tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}
```

### 2. Add Manifest to HTML

In `index.html`:

```html
<head>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#0BF7BC">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
</head>
```

---

## 📱 Responsive Breakpoints

```tsx
// Tailwind Config
const breakpoints = {
  xs: '320px',   // Small phones
  sm: '480px',   // Telegram WebView
  md: '768px',   // Tablets
  lg: '1024px',  // Desktop
  xl: '1440px',  // Large Desktop
  '2xl': '1920px' // Ultra-Wide
};
```

### Usage:
```tsx
<div className="w-full sm:w-1/2 lg:w-1/3">
  Responsive!
</div>
```

---

## ✅ Best Practices

### 1. **Touch Targets**
- Minimum 44x44px für alle interaktiven Elemente
- Verwende `.touch-target` class

### 2. **Performance**
- Nutze `will-change` für animierte Elemente
- `.gpu-accelerated` für Hardware-Beschleunigung
- Lazy-load große Komponenten

### 3. **Accessibility**
- Immer `aria-label` für Icon-Buttons
- Keyboard-Support (Tab, Enter, Escape)
- Screen Reader Support

### 4. **Safe Areas**
- Immer `.safe-bottom` für fixed bottom elements
- `.safe-top` für fixed headers
- Teste auf iPhone X+ (Notch)

### 5. **Haptic Feedback**
- `light` - Normale Interaktionen
- `medium` - Wichtige Actions
- `heavy` - Kritische Actions
- `success/error` - Feedback

---

## 🎯 Performance Checklist

- [ ] Service Worker registriert
- [ ] Manifest.json vorhanden
- [ ] Icons generiert (72-512px)
- [ ] Offline-Page erstellt
- [ ] Safe Areas implementiert
- [ ] Touch Targets ≥44px
- [ ] Haptic Feedback integriert
- [ ] Reduced Motion Support
- [ ] Loading States
- [ ] Error States

---

## 📚 Weitere Ressourcen

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [iOS Safe Areas](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Touch Guidelines](https://www.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/)
- [Haptic Patterns](https://developer.apple.com/design/human-interface-guidelines/haptics)

---

## 🤝 Support

Bei Fragen oder Problemen:
1. Check die Component-Docs oben
2. Schau in die Beispiel-Implementierungen
3. Test auf echten Geräten (nicht nur Emulator)

**Happy Mobile-First Coding! 🚀📱**


