import { useRef, useEffect, RefObject } from 'react';

interface MagneticHoverOptions {
  intensity?: number; // How strong the magnetic effect (0-1)
  damping?: number; // Smoothness of movement (0-1)
  range?: number; // Distance in pixels where effect is active
}

const defaultOptions: Required<MagneticHoverOptions> = {
  intensity: 0.3,
  damping: 0.7,
  range: 100,
};

export const useMagneticHover = <T extends HTMLElement>(
  options: MagneticHoverOptions = {}
): RefObject<T> => {
  const ref = useRef<T>(null);
  const position = useRef({ x: 0, y: 0 });
  const targetPosition = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  const opts = { ...defaultOptions, ...options };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      if (distance < opts.range) {
        // Calculate magnetic attraction
        const factor = (1 - distance / opts.range) * opts.intensity;
        targetPosition.current = {
          x: distanceX * factor,
          y: distanceY * factor,
        };
      } else {
        targetPosition.current = { x: 0, y: 0 };
      }
    };

    const handleMouseLeave = () => {
      targetPosition.current = { x: 0, y: 0 };
    };

    const animate = () => {
      // Smooth interpolation using damping
      position.current.x += (targetPosition.current.x - position.current.x) * (1 - opts.damping);
      position.current.y += (targetPosition.current.y - position.current.y) * (1 - opts.damping);

      // Apply transform
      if (element) {
        element.style.transform = `translate(${position.current.x}px, ${position.current.y}px)`;
      }

      // Continue animation if there's movement
      if (Math.abs(position.current.x) > 0.1 || Math.abs(position.current.y) > 0.1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        animationFrameId.current = null;
        // Reset to avoid floating point errors
        position.current = { x: 0, y: 0 };
        if (element) {
          element.style.transform = '';
        }
      }
    };

    const startAnimation = () => {
      if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(animate);
      }
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', startAnimation);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', startAnimation);
      
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Reset transform
      if (element) {
        element.style.transform = '';
      }
    };
  }, [opts.intensity, opts.damping, opts.range]);

  return ref;
};

