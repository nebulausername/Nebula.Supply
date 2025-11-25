import React from 'react';

/**
 * 🎯 Skeleton Loading Component für die Homepage
 * Zeigt animierte Platzhalter während die echten Daten laden
 */
export const HomePageSkeleton: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-24 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-32 bg-white/10 rounded" />
        <div className="h-12 w-64 bg-white/20 rounded" />
        <div className="h-6 w-full max-w-lg bg-white/10 rounded" />
      </div>

      {/* Invite System Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 bg-white/5 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-64 bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-white/5 rounded-xl" />
            <div className="h-24 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl" />
        ))}
      </div>

      {/* Limited Offers Skeleton */}
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Featured Drops Skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-white/10 rounded" />
          <div className="h-10 w-32 bg-accent/20 rounded-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-80 bg-white/5 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * 🎯 Card Skeleton Component
 */
export const CardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 h-6 w-24 bg-white/10 rounded" />
      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded" />
        <div className="h-4 w-5/6 bg-white/10 rounded" />
      </div>
      <div className="mt-4 h-8 w-20 bg-accent/20 rounded" />
    </div>
  </div>
);

/**
 * 🎯 Stats Skeleton Component
 */
export const StatsSkeleton: React.FC = () => (
  <div className="animate-pulse grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="h-10 w-10 bg-white/10 rounded-xl" />
          <div className="h-4 w-12 bg-green-400/20 rounded" />
        </div>
        <div className="h-8 w-16 bg-white/20 rounded mb-1" />
        <div className="h-4 w-24 bg-white/10 rounded" />
      </div>
    ))}
  </div>
);
