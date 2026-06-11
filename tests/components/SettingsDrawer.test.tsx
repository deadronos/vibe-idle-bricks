import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsDrawer } from '../../src/components/SettingsDrawer';
import { useSettingsStore } from '../../src/store/settingsStore';

describe('SettingsDrawer', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      soundEnabled: true,
      reducedMotion: false,
      colorblindMode: 'off',
    });
  });

  it('renders nothing when closed', () => {
    render(<SettingsDrawer open={false} onClose={() => undefined} />);
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('renders the drawer when open', () => {
    render(<SettingsDrawer open={true} onClose={() => undefined} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('toggles the sound checkbox and updates the store', () => {
    render(<SettingsDrawer open={true} onClose={() => undefined} />);
    const sound = screen.getByTestId('setting-sound') as HTMLInputElement;
    expect(sound.checked).toBe(true);
    fireEvent.click(sound);
    expect(useSettingsStore.getState().soundEnabled).toBe(false);
  });

  it('toggles reduced motion', () => {
    render(<SettingsDrawer open={true} onClose={() => undefined} />);
    const motion = screen.getByTestId('setting-reduced-motion') as HTMLInputElement;
    expect(motion.checked).toBe(false);
    fireEvent.click(motion);
    expect(useSettingsStore.getState().reducedMotion).toBe(true);
  });

  it('selects a colorblind option', () => {
    render(<SettingsDrawer open={true} onClose={() => undefined} />);
    const options = screen.getAllByRole('radio') as HTMLInputElement[];
    const deutan = options.find((r) => r.value === 'deuteranopia');
    expect(deutan).toBeDefined();
    expect(deutan!.checked).toBe(false);
    fireEvent.click(deutan!);
    expect(useSettingsStore.getState().colorblindMode).toBe('deuteranopia');
  });
});
