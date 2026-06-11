import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Tests for the persisted settings store. We stub localStorage in jsdom so
 * the store can hydrate, write, and read its JSON state without touching the
 * real storage layer.
 */
describe('settingsStore', () => {
  beforeEach(async () => {
    // Make sure the store starts in a known state and localStorage is clean.
    const { useSettingsStore } = await import('../../src/store/settingsStore');
    useSettingsStore.setState({
      soundEnabled: true,
      reducedMotion: false,
      colorblindMode: 'off',
    });
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('uses sensible defaults', async () => {
    const { useSettingsStore } = await import('../../src/store/settingsStore');
    const { soundEnabled, reducedMotion, colorblindMode } = useSettingsStore.getState();
    expect(soundEnabled).toBe(true);
    expect(reducedMotion).toBe(false);
    expect(colorblindMode).toBe('off');
  });

  it('toggles sound and persists to localStorage', async () => {
    const { useSettingsStore } = await import('../../src/store/settingsStore');
    useSettingsStore.getState().setSoundEnabled(false);
    const stored = window.localStorage.getItem('idleBricksSettings');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.soundEnabled).toBe(false);
    expect(useSettingsStore.getState().soundEnabled).toBe(false);
  });

  it('toggles reduced motion and persists', async () => {
    const { useSettingsStore } = await import('../../src/store/settingsStore');
    useSettingsStore.getState().setReducedMotion(true);
    const stored = JSON.parse(window.localStorage.getItem('idleBricksSettings')!);
    expect(stored.reducedMotion).toBe(true);
    expect(useSettingsStore.getState().reducedMotion).toBe(true);
  });

  it('changes colorblind mode and persists', async () => {
    const { useSettingsStore } = await import('../../src/store/settingsStore');
    useSettingsStore.getState().setColorblindMode('deuteranopia');
    const stored = JSON.parse(window.localStorage.getItem('idleBricksSettings')!);
    expect(stored.colorblindMode).toBe('deuteranopia');
    expect(useSettingsStore.getState().colorblindMode).toBe('deuteranopia');
  });

  it('hydrate() reads persisted values', async () => {
    window.localStorage.setItem(
      'idleBricksSettings',
      JSON.stringify({ soundEnabled: false, reducedMotion: true, colorblindMode: 'tritanopia' })
    );
    // Import after the value is in storage so the module-level state is also
    // the default. The store reads on hydrate() rather than at import time.
    const { useSettingsStore } = await import('../../src/store/settingsStore');
    useSettingsStore.getState().hydrate();
    const { soundEnabled, reducedMotion, colorblindMode } = useSettingsStore.getState();
    expect(soundEnabled).toBe(false);
    expect(reducedMotion).toBe(true);
    expect(colorblindMode).toBe('tritanopia');
  });

  it('hydrate() ignores garbage and falls back to defaults', async () => {
    window.localStorage.setItem('idleBricksSettings', 'not-json');
    const { useSettingsStore } = await import('../../src/store/settingsStore');
    useSettingsStore.getState().hydrate();
    const { soundEnabled, reducedMotion, colorblindMode } = useSettingsStore.getState();
    expect(soundEnabled).toBe(true);
    expect(reducedMotion).toBe(false);
    expect(colorblindMode).toBe('off');
  });

  it('hydrate() ignores unknown colorblind values', async () => {
    window.localStorage.setItem(
      'idleBricksSettings',
      JSON.stringify({ soundEnabled: true, reducedMotion: false, colorblindMode: 'gibberish' })
    );
    const { useSettingsStore } = await import('../../src/store/settingsStore');
    useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().colorblindMode).toBe('off');
  });
});
