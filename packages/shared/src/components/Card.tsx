import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glassmorphic';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  interactive = false,
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-lg border transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-surface border-border',
    elevated: 'bg-elevated border-border shadow-lg',
    glassmorphic: 'bg-black/40 border-neon/20 backdrop-blur-xl'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-neon/30 hover:shadow-neon'
    : '';
  
  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};


