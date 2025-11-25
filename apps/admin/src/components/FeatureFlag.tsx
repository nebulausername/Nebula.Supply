import React from 'react';
import { useFeatureFlag } from '../lib/flags';

interface FeatureFlagProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureFlag: React.FC<FeatureFlagProps> = ({ flag, children, fallback = null }) => {
  const enabled = useFeatureFlag(flag);
  return enabled ? <>{children}</> : <>{fallback}</>;
};

// Higher-order component for feature flags
export const withFeatureFlag = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  flagName: string,
  fallback?: React.ComponentType<P>
) => {
  const WithFeatureFlagComponent = (props: P) => {
    const enabled = useFeatureFlag(flagName);
    
    if (!enabled && fallback) {
      return <fallback {...props} />;
    }
    
    if (!enabled) {
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };

  WithFeatureFlagComponent.displayName = `withFeatureFlag(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithFeatureFlagComponent;
};



