import { useState, useCallback, useEffect } from 'react';

export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        
        lock.addEventListener('release', () => {
          setWakeLock(null);
        });
      }
    } catch (err) {
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
        // Silently fail for permission issues as this is a non-critical feature
        return;
      }
      console.error('Wake Lock request failed:', err);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock !== null) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  // Handle visibility change to re-request wake lock when returning to the app
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLock, requestWakeLock]);

  return { requestWakeLock, releaseWakeLock, isLocked: wakeLock !== null };
}
