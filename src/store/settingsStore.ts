import { create } from 'zustand';
import { getAudioModule } from '../utils/audio';

/** Persisted key for user preferences. Kept separate from the game save. */
const SETTINGS_STORAGE_KEY = 'idleBricksSettings';

export type ColorblindMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface Settings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  colorblindMode: ColorblindMode;
}

export interface SettingsStore extends Settings {
  setSoundEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setColorblindMode: (mode: ColorblindMode) => void;
  hydrate: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  reducedMotion: false,
  colorblindMode: 'off',
};

const isColorblindMode = (value: unknown): value is ColorblindMode =>
  value === 'off' || value === 'protanopia' || value === 'deuteranopia' || value === 'tritanopia';

const isStorageLike = (value: unknown): value is Pick<Storage, 'getItem' | 'setItem'> => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Pick<Storage, 'getItem' | 'setItem'>>;
  return typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function';
};

const getLocalStorage = (): Pick<Storage, 'getItem' | 'setItem'> | null => {
  if (typeof window === 'undefined') return null;
  if (isStorageLike(window.localStorage)) return window.localStorage;
  const candidate = (globalThis as { localStorage?: unknown }).localStorage;
  if (isStorageLike(candidate)) return candidate;
  return null;
};

const parseStoredSettings = (raw: string | null): Settings => {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
    const candidate = parsed as Partial<Settings>;
    return {
      soundEnabled: candidate.soundEnabled !== false,
      reducedMotion: candidate.reducedMotion === true,
      colorblindMode: isColorblindMode(candidate.colorblindMode) ? candidate.colorblindMode : 'off',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const persist = (settings: Settings): void => {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Quota / private mode — ignore.
  }
};

/**
 * Persisted UI preference store. Independent of the main game store so that
 * `gameStore.reset()` doesn't wipe a player's chosen settings.
 */
export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  setSoundEnabled: (enabled) => {
    getAudioModule().setEnabled(enabled);
    set({ soundEnabled: enabled });
    const { reducedMotion, colorblindMode } = get();
    persist({ soundEnabled: enabled, reducedMotion, colorblindMode });
  },

  setReducedMotion: (enabled) => {
    set({ reducedMotion: enabled });
    const { soundEnabled, colorblindMode } = get();
    persist({ soundEnabled, reducedMotion: enabled, colorblindMode });
  },

  setColorblindMode: (mode) => {
    set({ colorblindMode: mode });
    const { soundEnabled, reducedMotion } = get();
    persist({ soundEnabled, reducedMotion, colorblindMode: mode });
  },

  hydrate: () => {
    const storage = getLocalStorage();
    if (!storage) return;
    const stored = parseStoredSettings(storage.getItem(SETTINGS_STORAGE_KEY));
    getAudioModule().setEnabled(stored.soundEnabled);
    set(stored);
  },
}));

/** Re-export the audio module for callers that just want a shared instance. */
export { getAudioModule };
