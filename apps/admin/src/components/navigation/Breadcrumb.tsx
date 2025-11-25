// Breadcrumb Navigation Component
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
}

export function Breadcrumb({ items, className, separator }: BreadcrumbProps) {
  const defaultSeparator = <ChevronRight className="w-4 h-4 text-muted" />;

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn("flex items-center gap-2 text-sm", className)}
      aria-label="Breadcrumb"
    >
      {/* Home Icon */}
      {items[0]?.path !== '/' && (
        <>
          <Link
            to="/"
            className="flex items-center text-muted hover:text-text transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
          {separator || defaultSeparator}
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0 && item.path === '/';

        if (isFirst) {
          return (
            <span key={index} className="flex items-center text-text font-medium">
              <Home className="w-4 h-4 mr-1" />
              {item.label}
            </span>
          );
        }

        return (
          <React.Fragment key={index}>
            {item.path ? (
              <Link
                to={item.path}
                className={cn(
                  "text-muted hover:text-text transition-colors",
                  isLast && "text-text font-medium pointer-events-none"
                )}
                onClick={item.onClick}
              >
                {item.label}
              </Link>
            ) : (
              <button
                onClick={item.onClick}
                className={cn(
                  "text-muted hover:text-text transition-colors",
                  isLast && "text-text font-medium cursor-default"
                )}
                disabled={isLast}
              >
                {item.label}
              </button>
            )}
            {!isLast && (separator || defaultSeparator)}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// Hook for building breadcrumbs from route
export function useBreadcrumbs(currentPath: string): BreadcrumbItem[] {
  const pathParts = currentPath.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', path: '/' }
  ];

  let accumulatedPath = '';
  pathParts.forEach((part, index) => {
    accumulatedPath += `/${part}`;
    const isLast = index === pathParts.length - 1;
    
    // Capitalize and format label
    const label = part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      path: isLast ? undefined : accumulatedPath
    });
  });

  return breadcrumbs;
}

