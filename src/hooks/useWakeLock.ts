import { useState, useEffect, useCallback } from 'react';

export function useWakeLock(enabled: boolean = true) {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const requestLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    try {
      const sentinel = await (navigator as any).wakeLock.request('screen');
      setIsLocked(true);
      sentinel.addEventListener('release', () => {
        setIsLocked(false);
      });
      return sentinel;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      setIsLocked(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let currentSentinel: any;

    requestLock().then((sentinel) => {
      currentSentinel = sentinel;
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        requestLock().then((sentinel) => {
          currentSentinel = sentinel;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (currentSentinel) {
        currentSentinel.release().catch(() => {});
      }
    };
  }, [enabled, requestLock]);

  return { isLocked, isSupported };
}
