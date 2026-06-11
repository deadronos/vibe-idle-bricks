import { useMemo } from 'react';
import { Modal } from './Modal';
import { useGameStore } from '../store';
import { ACHIEVEMENTS, type AchievementDef, type UnlockedAchievements } from '../types/achievements';

/** Props for the `AchievementsModal` component. */
interface AchievementsModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Called when the user dismisses the modal. */
  onClose: () => void;
}

/**
 * Formats a timestamp (ms) as a human-readable unlock date. Falls back to
 * "Unlocked" for invalid values.
 */
const formatUnlockDate = (ts: number): string => {
  if (!Number.isFinite(ts) || ts <= 0) return 'Unlocked';
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unlocked';
  }
};

/**
 * Modal showing the player's achievement progress.
 *
 * Lists every achievement defined in `ACHIEVEMENTS`. Unlocked entries show
 * the unlock date and a highlighted style; locked entries show a greyed-out
 * style with the unlock criteria.
 */
export function AchievementsModal({ open, onClose }: AchievementsModalProps) {
  const unlockedAchievements: UnlockedAchievements = useGameStore(
    (state) => state.unlockedAchievements,
  );

  const { unlockedCount, totalCount, sorted } = useMemo(() => {
    const unlocked = ACHIEVEMENTS.filter((a) => unlockedAchievements[a.id]);
    const locked = ACHIEVEMENTS.filter((a) => !unlockedAchievements[a.id]);
    // Unlocked first (most recent first), then locked (in declaration order).
    const unlockedSorted = unlocked
      .slice()
      .sort(
        (a, b) =>
          (unlockedAchievements[b.id] ?? 0) - (unlockedAchievements[a.id] ?? 0),
      );
    return {
      unlockedCount: unlocked.length,
      totalCount: ACHIEVEMENTS.length,
      sorted: [...unlockedSorted, ...locked] as AchievementDef[],
    };
  }, [unlockedAchievements]);

  return (
    <Modal
      open={open}
      title="Achievements"
      confirmLabel="Done"
      cancelLabel="Close"
      onConfirm={onClose}
      onCancel={onClose}
    >
      <div
        className="achievements-summary"
        data-testid="achievements-summary"
      >
        <span className="achievements-summary-count">
          {unlockedCount} / {totalCount}
        </span>
        <span className="achievements-summary-label">unlocked</span>
      </div>
      <ul
        className="achievements-list"
        role="list"
        aria-label="Achievements"
      >
        {sorted.map((achievement) => {
          const unlockedAt = unlockedAchievements[achievement.id];
          const isUnlocked = unlockedAt !== undefined;
          return (
            <li
              key={achievement.id}
              className={`achievement-item ${isUnlocked ? 'is-unlocked' : 'is-locked'}`}
              data-testid={`achievement-${achievement.id}`}
              data-unlocked={isUnlocked ? 'true' : 'false'}
              aria-label={`${achievement.name} — ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <span className="achievement-icon" aria-hidden="true">
                {achievement.icon}
              </span>
              <div className="achievement-body">
                <div className="achievement-name">{achievement.name}</div>
                <div className="achievement-description">
                  {achievement.description}
                </div>
              </div>
              <div className="achievement-status">
                {isUnlocked ? (
                  <span className="achievement-unlock-date">
                    {formatUnlockDate(unlockedAt)}
                  </span>
                ) : (
                  <span className="achievement-locked-label" aria-hidden="true">
                    🔒
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
