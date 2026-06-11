import { useEffect, useRef } from 'react';

export interface KeyboardShortcutHandlers {
  /** Called when the user presses the toggle-pause shortcut (Space or P). */
  onPauseToggle?: () => void;
  /** Called when the user presses the resume shortcut (Escape). */
  onResume?: () => void;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
};

/**
 * Global keyboard shortcuts for the game.
 *
 * - `Space` or `P`: toggle pause.
 * - `Escape`: resume (un-pause) if currently paused.
 *
 * The handler ignores key events that originate in editable elements so that
 * typing in a textarea (e.g. the Import dialog) does not flip pause state.
 *
 * Handlers are read from a ref, so callers can pass inline functions without
 * re-binding the underlying event listener on every render.
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.repeat) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key;
      const current = handlersRef.current;

      if (key === ' ' || key === 'Spacebar' || key === 'p' || key === 'P') {
        if (current.onPauseToggle) {
          event.preventDefault();
          current.onPauseToggle();
        }
      } else if (key === 'Escape') {
        if (current.onResume) {
          event.preventDefault();
          current.onResume();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
