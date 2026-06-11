import { useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { ACHIEVEMENTS_BY_ID } from '../types/achievements';
import { useToast } from '../components/Toast';

/**
 * Subscribes to the `pendingAchievementUnlocks` queue and shows a toast for
 * each newly-unlocked achievement. Drains the queue once all toasts are
 * shown so the same unlock isn't re-shown on re-render.
 *
 * Mount this hook once near the top of the app (e.g. inside `<GameApp>`).
 */
export function useAchievementToasts(): void {
  const pendingUnlocks = useGameStore(
    (state) => state.pendingAchievementUnlocks,
  );
  const drainQueue = useGameStore(
    (state) => state.drainPendingAchievementUnlocks,
  );
  const { showToast } = useToast();
  const lastSeenRef = useRef<number>(-1);

  useEffect(() => {
    if (pendingUnlocks.length === 0) return;
    if (lastSeenRef.current === pendingUnlocks.length) return;
    lastSeenRef.current = pendingUnlocks.length;

    for (const id of pendingUnlocks) {
      const def = ACHIEVEMENTS_BY_ID[id];
      if (!def) continue;
      showToast(`🏆 Achievement unlocked: ${def.name}`, 'success');
    }
    drainQueue();
  }, [pendingUnlocks, showToast, drainQueue]);
}
