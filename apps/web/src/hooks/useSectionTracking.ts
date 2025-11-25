import { useEffect, useRef } from 'react';
import { startSectionTimer, endSectionTimer } from '../utils/analytics';

export const useSectionTracking = (sectionId: string, enabled: boolean = true) => {
  const isVisibleRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisibleRef.current) {
            isVisibleRef.current = true;
            startSectionTimer(sectionId);
          } else if (!entry.isIntersecting && isVisibleRef.current) {
            isVisibleRef.current = false;
            endSectionTimer(sectionId);
          }
        });
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(sectionId);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      if (isVisibleRef.current) {
        endSectionTimer(sectionId);
      }
    };
  }, [sectionId, enabled]);
};

