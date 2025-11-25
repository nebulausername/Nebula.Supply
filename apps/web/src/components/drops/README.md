# 🎨 Drop UX/UI Optimization - Component Library

## Overview

This directory contains the enhanced Drop components and utilities for Nebula Supply's premium UX/UI experience.

## Components

### Core Components

#### EnhancedDropCard
Premium drop card with glassmorphism, animated gradients, and gesture support.

**Features:**
- 🎨 Glassmorphism effects with backdrop blur
- ✨ Animated gradients based on access type
- 🖼️ Progressive image loading with blur-up effect
- 🎯 Hover overlays with quick actions
- 📱 Touch gestures (swipe, long-press, double-tap)
- 🔊 Haptic feedback integration
- 🎭 Micro-interactions and animations

**Usage:**
```tsx
import { EnhancedDropCard } from './components/drops';

<EnhancedDropCard
  drop={drop}
  onOpen={handleOpen}
  showQuickActions
  enableGestures
/>
```

#### EnhancedProductImage
Advanced product image with progressive loading, zoom, and parallax.

**Features:**
- 📸 Progressive loading with blur placeholder
- 🔍 Click to zoom (2x)
- 🌊 Optional parallax effect on scroll
- 🎨 SVG fallback with gradient
- ⚡ Performance optimized

**Usage:**
```tsx
import { EnhancedProductImage } from './components/drops';

<EnhancedProductImage
  src={imageUrl}
  alt="Product"
  enableZoom
  enableParallax
  fallbackColor="#0BF7BC"
/>
```

#### VariantSelector
Reusable variant selector with multiple modes.

**Modes:**
- `single` - Single selection (radio behavior)
- `multi` - Multiple selection (checkbox behavior)
- `gallery` - Visual gallery with images

**Usage:**
```tsx
import { VariantSelector } from './components/drops';

<VariantSelector
  variants={drop.variants}
  selectedIds={selectedIds}
  onSelect={handleSelect}
  mode="gallery"
  showPrice
  showStock
/>
```

#### QuantityControl
Smart quantity selector with slider and presets.

**Features:**
- ➕➖ +/- buttons with haptic feedback
- 🎚️ Optional slider
- 🔢 Quick preset buttons (1x, 3x, 5x, MAX)
- ⌨️ Keyboard input support
- 📊 Min/max validation

**Usage:**
```tsx
import { QuantityControl } from './components/drops';

<QuantityControl
  value={quantity}
  min={1}
  max={10}
  onChange={setQuantity}
  showSlider
  showPresets
  presets={[1, 3, 5, 10]}
/>
```

#### PriceDisplay
Animated price display with breakdown and savings.

**Features:**
- 💰 Animated price changes
- 📊 Price breakdown for multi-quantity
- 💾 Savings calculator
- 🎨 Multiple sizes (sm, md, lg)
- ⚡ Performance optimized animations

**Usage:**
```tsx
import { PriceDisplay } from './components/drops';

<PriceDisplay
  price={12.90}
  comparePrice={19.90}
  currency="EUR"
  quantity={3}
  showBreakdown
  showSavings
  animate
  size="lg"
/>
```

#### DropBadge
Enhanced badge system with icons and animations.

**Badge Types:**
- VIP - Crown icon with purple glow
- Limited - Flame icon with orange glow
- Kostenlos - Sparkles icon with green glow
- Drop - Zap icon with accent glow
- Locked, Popular, New, Ending Soon

**Variants:**
- `solid` - Solid background
- `outline` - Outline only
- `glass` - Glassmorphism (default)

**Usage:**
```tsx
import { DropBadge, VIPBadge } from './components/drops';

<DropBadge type="VIP" showGlow />
<VIPBadge showIcon={false} />
```

### Modals

#### EnhancedMobileDropModal
Mobile-optimized modal with parallax hero and gesture support.

**Features:**
- 📱 Full-screen mobile experience
- 🖼️ Hero section with parallax effect
- 📸 Swipeable variant gallery
- 🛒 Floating cart preview
- 👆 Gesture controls (swipe, double-tap, pull-to-refresh)
- 🔊 Haptic feedback throughout
- ⌨️ Keyboard navigation

#### EnhancedCleanDropModal
Desktop-optimized modal with advanced gallery.

**Features:**
- 🖥️ Two-column layout
- 🖼️ Advanced image gallery with zoom
- 🎯 Sticky action sidebar
- ⌨️ Full keyboard navigation (Arrow keys, Enter, Esc, F)
- 💡 Tooltips on hover
- 🔢 Number keys for variant selection

## Hooks

### useDropInteractions
Centralized drop interaction logic.

**Returns:**
```ts
{
  handleAddToCart,      // Add drop to cart
  handleToggleInterest, // Toggle interest
  handleShare,          // Share drop
  handleQuickBuy,       // Quick buy (bypasses modal)
  checkAccess,          // Check if user has access
  interestCount,        // Number of interested users
  isInterested,         // Current user interest status
  hasInviteAccess       // User has invite
}
```

### useVariantSelection
Smart variant selection state management.

**Modes:**
- `single` - Single variant selection
- `multi` - Multiple variant selection with individual quantities

**Returns:**
```ts
{
  selectedVariant,      // Selected variant(s)
  selectedVariantId,    // Selected ID (single mode)
  selectedVariantIds,   // Selected IDs (multi mode)
  variantQuantities,    // Quantities per variant (multi mode)
  selectVariant,        // Select variant (single mode)
  toggleVariant,        // Toggle variant (multi mode)
  setVariantQuantity,   // Set quantity for variant
  selectAll,            // Select all available
  clearSelection,       // Clear selection
  totalPrice,           // Total price
  totalQuantity,        // Total quantity
  isVariantSelected,    // Check if variant is selected
  hasSelection          // Has any selection
}
```

### useDropGestures
Drop-specific gesture handling.

**Gestures:**
- Swipe Left/Right/Up/Down
- Long Press (500ms default)
- Double Tap (300ms window)

## Animations

All animations are defined in `/styles/drop-animations.css`:

### Available Classes

**Card Animations:**
- `.drop-card-enter` - Card entrance animation
- `.drop-card-stagger` - Staggered entrance (use with `.stagger-1` to `.stagger-6`)

**Price Animations:**
- `.price-pulse` - Pulsing price animation
- `.price-glow` - Glowing price effect

**Badge Animations:**
- `.badge-glow` - Standard badge glow
- `.badge-vip-glow` - VIP badge glow (purple)
- `.badge-limited-glow` - Limited badge glow (orange)

**Progress Animations:**
- `.progress-shimmer` - Shimmer effect for progress bar
- `.progress-fill` - Fill animation

**Success Animations:**
- `.success-bounce` - Success bounce effect
- `.success-ripple` - Success ripple effect

**Interactive Feedback:**
- `.button-press` - Button press animation
- `.variant-select` - Variant selection animation
- `.hover-float` - Floating hover effect
- `.hover-glow` - Glow on hover

## Feature Flags

Control which enhanced components are active:

```ts
import { getFeatureFlags, enableAllFeatures } from '../utils/featureFlags';

const flags = getFeatureFlags();

// Check individual flags
if (flags.useEnhancedDropCard) {
  // Use enhanced version
}

// Enable/disable features
enableAllFeatures();
disableAllFeatures();

// Or set individual flags
saveFlags({
  useEnhancedDropCard: true,
  enableGestures: false
});
```

**Available Flags:**
- `useEnhancedDropCard` - Use EnhancedDropCard vs DropCard
- `useEnhancedMobileModal` - Use EnhancedMobileDropModal
- `useEnhancedDesktopModal` - Use EnhancedCleanDropModal
- `enableGestures` - Enable touch gestures
- `enableHapticFeedback` - Enable haptic feedback
- `enableAnimations` - Enable animations

## Wrappers

### DropCardWrapper
Automatically switches between original and enhanced card based on feature flags.

```tsx
import { DropCardWrapper } from '../components/DropCardWrapper';

<DropCardWrapper drop={drop} onOpen={handleOpen} />
```

### DropModalWrapper
Automatically switches between modals based on feature flags and device.

```tsx
import { DropModalWrapper } from '../components/DropModalWrapper';

<DropModalWrapper />
```

## Integration

### Update DropsPage

Replace `DropCard` and modals with wrappers:

```tsx
// Before
import { DropCard } from '../components/DropCard';
import { MobileOptimizedDropModal } from '../components/MobileOptimizedDropModal';

// After
import { DropCardWrapper } from '../components/DropCardWrapper';
import { DropModalWrapper } from '../components/DropModalWrapper';

// In render
{drops.map((drop) => (
  <DropCardWrapper key={drop.id} drop={drop} onOpen={handleOpen} />
))}

<DropModalWrapper />
```

## Design Tokens

### Colors
- Primary Accent: `#0BF7BC` (Ion Mint)
- Secondary Accent: `#FF5EDB` (Stellar Pink)
- Background: `#0A0A0A` (Galaxy Black)
- Surface: `#111827` (Nebula Dark)

### Animations
- Duration: 200-300ms for micro-interactions
- Easing: `cubic-bezier(0.4, 0.0, 0.2, 1)`
- Hover scale: 1.02 - 1.05
- Transform origin: center for scales, custom for zoom

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Performance

### Optimizations Applied
- ⚡ GPU acceleration with `transform: translateZ(0)`
- 🎨 `will-change` for animated properties
- 📦 Lazy loading for images
- 🔄 Memoization for expensive calculations
- 🎯 Virtual scrolling ready (for long lists)
- 📱 Touch event passive listeners

### Target Metrics
- 🎯 < 100ms touch response time
- 🎬 60fps animations
- 💯 Lighthouse score > 90
- 📊 LCP < 2.5s

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Android 90+

## Testing

Run linter:
```bash
npm run lint
```

Type check:
```bash
npm run type-check
```

## Migration Guide

### From DropCard to EnhancedDropCard

1. Import the enhanced version:
```tsx
import { EnhancedDropCard } from './components/drops';
```

2. Replace component usage (props are compatible):
```tsx
<EnhancedDropCard
  drop={drop}
  onOpen={handleOpen}
  showQuickActions
  enableGestures={true} // New optional prop
/>
```

### From Old Modals to Enhanced Modals

Use the wrapper for automatic switching:
```tsx
import { DropModalWrapper } from '../components/DropModalWrapper';

// Replaces both MobileOptimizedDropModal and CleanDropModal
<DropModalWrapper />
```

## Credits

Built with ❤️ by the Nebula Supply team
Optimized for the best drop shopping experience





