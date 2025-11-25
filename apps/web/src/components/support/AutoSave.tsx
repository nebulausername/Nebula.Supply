import { useEffect, useRef, useState } from 'react';

interface AutoSaveProps {
  data: any;
  storageKey: string;
  interval?: number;
}

export const useAutoSave = ({ data, storageKey, interval = 2000 }: AutoSaveProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only save if data has changed
    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) {
      return;
    }

    // Debounce save operation
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, currentData);
        lastSavedRef.current = currentData;
        console.log(`[AutoSave] Saved ${storageKey}`);
      } catch (error) {
        console.error(`[AutoSave] Failed to save ${storageKey}:`, error);
      }
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, storageKey, interval]);
};

export function useAutoLoad<T>(storageKey: string, defaultValue: T): T {
  const [data, setData] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed);
        console.log(`[AutoLoad] Loaded ${storageKey}`);
      }
    } catch (error) {
      console.error(`[AutoLoad] Failed to load ${storageKey}:`, error);
    }
  }, [storageKey]);

  return data;
};