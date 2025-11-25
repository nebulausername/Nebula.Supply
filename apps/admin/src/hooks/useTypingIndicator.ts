import { useState, useCallback, useRef, useEffect } from 'react';

interface TypingUser {
  userId: string;
  userName?: string;
  timestamp: number;
}

export function useTypingIndicator() {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const setTyping = useCallback((userId: string, userName?: string) => {
    setTypingUsers(prev => {
      const existing = prev.find(u => u.userId === userId);
      if (existing) {
        return prev.map(u =>
          u.userId === userId
            ? { ...u, timestamp: Date.now() }
            : u
        );
      }
      return [...prev, { userId, userName, timestamp: Date.now() }];
    });

    // Clear existing timeout
    const existingTimeout = typingTimeoutRef.current.get(userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout to remove typing indicator after 3 seconds
    const timeout = setTimeout(() => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      typingTimeoutRef.current.delete(userId);
    }, 3000);

    typingTimeoutRef.current.set(userId, timeout);
  }, []);

  const clearTyping = useCallback((userId: string) => {
    const timeout = typingTimeoutRef.current.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeoutRef.current.delete(userId);
    }
    setTypingUsers(prev => prev.filter(u => u.userId !== userId));
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup all timeouts on unmount
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
    };
  }, []);

  return {
    typingUsers,
    setTyping,
    clearTyping,
  };
}

