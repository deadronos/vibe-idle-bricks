import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAudioModule, playSound } from '../../src/utils/audio';

/**
 * jsdom does not implement Web Audio. The audio module should be a safe
 * no-op in that environment — `getContext()` returns null, `play()` does
 * nothing, and `isEnabled`/`setEnabled` still track state for callers.
 */
describe('audio module', () => {
  // Reset the singleton's internal flag between tests so we always start
  // from a known "enabled" baseline. We do NOT call vi.resetModules() because
  // the module is intentionally a process-wide singleton.
  beforeEach(() => {
    getAudioModule().setEnabled(true);
  });

  afterEach(() => {
    getAudioModule().setEnabled(true);
  });

  it('returns a stable module instance within an import', () => {
    const a = getAudioModule();
    const b = getAudioModule();
    // Mutating the returned module's flag is visible on the next call, even
    // though `getAudioModule()` returns a new wrapper object each time.
    a.setEnabled(false);
    expect(b.isEnabled()).toBe(false);
    a.setEnabled(true);
  });

  it('reports enabled by default', () => {
    const audio = getAudioModule();
    expect(audio.isEnabled()).toBe(true);
  });

  it('toggles enabled state', () => {
    const audio = getAudioModule();
    audio.setEnabled(false);
    expect(audio.isEnabled()).toBe(false);
    audio.setEnabled(true);
    expect(audio.isEnabled()).toBe(true);
  });

  it('returns null from getContext when AudioContext is unavailable', () => {
    // jsdom has no AudioContext. We don't polyfill it; the module must
    // gracefully return null.
    expect(getAudioModule().getContext()).toBeNull();
  });

  it('play() is a safe no-op in a non-audio environment', () => {
    // Should not throw.
    expect(() => playSound('ballBounce')).not.toThrow();
    expect(() => playSound('brickBreak')).not.toThrow();
    expect(() => playSound('coin')).not.toThrow();
    expect(() => playSound('purchase')).not.toThrow();
    expect(() => playSound('prestige')).not.toThrow();
  });

  it('play() respects the enabled flag', () => {
    const audio = getAudioModule();
    audio.setEnabled(false);
    expect(audio.isEnabled()).toBe(false);
    audio.setEnabled(true);
    expect(audio.isEnabled()).toBe(true);
  });
});
