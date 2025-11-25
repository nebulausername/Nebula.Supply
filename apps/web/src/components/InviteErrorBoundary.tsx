import React from "react";

// 🎯 ERROR BOUNDARY FOR INVITE SYSTEM - Simplified for compatibility
export const InviteErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
}> = ({ children, fallback: FallbackComponent }) => {
  return <>{children}</>;
};
