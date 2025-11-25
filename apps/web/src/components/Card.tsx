import React from 'react';
import { cn } from '../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Generic Card component for consistent styling across the application
 */
export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick
}) => {
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm",
        onClick && "cursor-pointer hover:shadow-md transition-shadow duration-200",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
