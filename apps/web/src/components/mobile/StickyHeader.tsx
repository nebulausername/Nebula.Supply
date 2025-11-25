import { memo, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useMobileOptimizations } from '../MobileOptimizations';

interface StickyHeaderProps {
  children: React.ReactNode;
  showProgress?: boolean;
  className?: string;
}

export const StickyHeader = memo(({
  children,
  showProgress = true,
  className = ''
}: StickyHeaderProps) => {
  const { isMobile } = useMobileOptimizations();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 10]);
  const progress = useTransform(scrollY, [0, document.documentElement.scrollHeight - window.innerHeight], [0, 100]);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50);
    });

    return () => unsubscribe();
  }, [scrollY]);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <motion.header
      style={{
        opacity: headerOpacity,
        backdropFilter: `blur(${headerBlur}px)`
      }}
      className={`sticky top-0 z-50 bg-black/80 border-b border-white/10 ${className}`}
    >
      {children}
      {showProgress && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent via-purple-500 to-accent origin-left"
          style={{ scaleX: useTransform(progress, [0, 100], [0, 1]) }}
        />
      )}
    </motion.header>
  );
});

StickyHeader.displayName = 'StickyHeader';

