import { memo, useEffect, useState } from 'react';
import { getFeatureFlags } from '../utils/featureFlags';

// Import all modal versions
import { MobileOptimizedDropModal } from './MobileOptimizedDropModal';
import { CleanDropModal } from './CleanDropModal';
import { EnhancedMobileDropModal } from './EnhancedMobileDropModal';
import { EnhancedCleanDropModal } from './EnhancedCleanDropModal';

/**
 * 🎯 Drop Modal Wrapper with Feature Flag Support
 * Switches between original and enhanced versions based on feature flags and device
 */
export const DropModalWrapper = memo(() => {
  const flags = getFeatureFlags();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile modals
  if (isMobile) {
    if (flags.useEnhancedMobileModal) {
      return <EnhancedMobileDropModal />;
    }
    return <MobileOptimizedDropModal />;
  }

  // Desktop modals
  if (flags.useEnhancedDesktopModal) {
    return <EnhancedCleanDropModal />;
  }
  return <CleanDropModal />;
});

DropModalWrapper.displayName = 'DropModalWrapper';





