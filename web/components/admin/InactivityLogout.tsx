'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function InactivityLogout({ timeoutMs = 5 * 60 * 1000 }: { timeoutMs?: number }) {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function handleLogout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {}
      router.push('/login?expired=1');
      router.refresh();
    }

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleLogout, timeoutMs);
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [router, timeoutMs]);

  return null;
}
