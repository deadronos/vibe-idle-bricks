import { useEffect } from 'react';
import { useSettingsStore } from '../store';
import { Modal } from './Modal';
import { Volume2, VolumeX, Eye, Palette } from 'lucide-react';
import type { ColorblindMode } from '../store';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const COLORBLIND_OPTIONS: { value: ColorblindMode; label: string; description: string }[] = [
  { value: 'off', label: 'Off', description: 'Default colors' },
  { value: 'protanopia', label: 'Protanopia', description: 'Red-blind' },
  { value: 'deuteranopia', label: 'Deuteranopia', description: 'Green-blind' },
  { value: 'tritanopia', label: 'Tritanopia', description: 'Blue-blind' },
];

/**
 * Settings drawer with sound, reduced-motion, and colorblind toggles.
 *
 * The state lives in `useSettingsStore` (persisted to its own localStorage key
 * so the game reset button doesn't wipe preferences). The audio module is
 * notified immediately when sound is toggled on/off.
 */
export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const colorblindMode = useSettingsStore((s) => s.colorblindMode);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);
  const setColorblindMode = useSettingsStore((s) => s.setColorblindMode);
  const hydrate = useSettingsStore((s) => s.hydrate);

  // Hydrate persisted settings on first mount. Settings are not game state,
  // so the main store does not own them.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Modal
      open={open}
      title="Settings"
      confirmLabel="Done"
      cancelLabel="Cancel"
      confirmVariant="primary"
      onConfirm={onClose}
      onCancel={onClose}
    >
      <div className="settings-section">
        <h3 className="settings-section-title">
          {soundEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
          Sound
        </h3>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => setSoundEnabled(event.target.checked)}
            data-testid="setting-sound"
          />
          <span>Enable sound effects</span>
        </label>
        <p className="settings-help">
          All effects are synthesised in the browser; no audio files are loaded.
        </p>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">
          <Eye size={16} aria-hidden="true" />
          Motion
        </h3>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
            data-testid="setting-reduced-motion"
          />
          <span>Reduce motion (camera shake, trails)</span>
        </label>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">
          <Palette size={16} aria-hidden="true" />
          Colorblind palette
        </h3>
        <div className="settings-radio-group" role="radiogroup" aria-label="Colorblind palette">
          {COLORBLIND_OPTIONS.map((option) => (
            <label key={option.value} className="settings-radio">
              <input
                type="radio"
                name="colorblind-mode"
                value={option.value}
                checked={colorblindMode === option.value}
                onChange={() => setColorblindMode(option.value)}
              />
              <span className="settings-radio-label">{option.label}</span>
              <span className="settings-radio-desc">{option.description}</span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}
