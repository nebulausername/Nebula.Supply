import { cn } from './cn';

export interface GlassmorphismOptions {
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  border?: boolean;
  shadow?: boolean;
  gradient?: boolean;
}

export const glassmorphism = (options: GlassmorphismOptions = {}) => {
  const {
    blur = 'lg',
    opacity = 0.1,
    border = true,
    shadow = true,
    gradient = false
  } = options;

  const blurMap = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl'
  };

  return cn(
    blurMap[blur],
    `bg-white/[${opacity}]`,
    border && 'border border-white/10',
    shadow && 'shadow-lg shadow-black/10',
    gradient && 'bg-gradient-to-br from-white/10 via-white/5 to-transparent'
  );
};

export const glassmorphismCard = (options: GlassmorphismOptions = {}) => {
  return cn(
    glassmorphism(options),
    'rounded-2xl p-6',
    'transition-all duration-300',
    'hover:bg-white/[0.15] hover:border-white/20',
    'hover:shadow-xl hover:shadow-black/20'
  );
};

export const glassmorphismButton = (options: GlassmorphismOptions = {}) => {
  return cn(
    glassmorphism({ ...options, opacity: 0.2 }),
    'rounded-full px-6 py-3',
    'transition-all duration-300',
    'hover:bg-white/[0.3] hover:scale-105',
    'active:scale-95',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'
  );
};

