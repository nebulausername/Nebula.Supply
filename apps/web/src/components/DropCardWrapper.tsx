import { memo } from 'react';
import type { Drop, DropVariant } from '@nebula/shared';
import { getFeatureFlags } from '../utils/featureFlags';

// Import both versions
import { DropCard } from './DropCard';
import { EnhancedDropCard } from './drops/EnhancedDropCard';

interface DropCardWrapperProps {
  drop: Drop;
  onOpen: (drop: Drop) => void;
  onQuickPreorder?: (drop: Drop, variant: DropVariant, quantity: number) => void;
  showQuickActions?: boolean;
  compact?: boolean;
}

/**
 * 🎯 Drop Card Wrapper with Feature Flag Support
 * Switches between original and enhanced version based on feature flags
 */
export const DropCardWrapper = memo((props: DropCardWrapperProps) => {
  const flags = getFeatureFlags();

  // Use enhanced version if feature flag is enabled
  if (flags.useEnhancedDropCard) {
    return (
      <EnhancedDropCard
        {...props}
        enableGestures={flags.enableGestures}
      />
    );
  }

  // Fallback to original version
  return <DropCard {...props} />;
});

DropCardWrapper.displayName = 'DropCardWrapper';





