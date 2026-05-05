import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Phaser before importing the module under test
vi.mock('phaser', () => ({
  Display: {
    Color: {
      HexStringToColor: vi.fn((hex: string) => ({ color: parseInt(hex.replace('#', ''), 16) })),
    },
  },
}));

import { getParsedColor } from '../../src/game/color';
import * as Phaser from 'phaser';

describe('getParsedColor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses a hex color using Phaser on first call', () => {
    const result = getParsedColor('#ff0000');
    expect(Phaser.Display.Color.HexStringToColor).toHaveBeenCalledWith('#ff0000');
    expect(result).toBe(0xff0000);
  });

  it('returns cached value on subsequent calls without calling Phaser again', () => {
    getParsedColor('#00ff00');
    const callCount = (Phaser.Display.Color.HexStringToColor as ReturnType<typeof vi.fn>).mock.calls.length;

    const result = getParsedColor('#00ff00');
    expect(result).toBe(0x00ff00);
    expect(Phaser.Display.Color.HexStringToColor).toHaveBeenCalledTimes(callCount);
  });

  it('caches different colors independently', () => {
    const red = getParsedColor('#ff0000');
    const green = getParsedColor('#00ff00');
    const blue = getParsedColor('#0000ff');

    expect(red).toBe(0xff0000);
    expect(green).toBe(0x00ff00);
    expect(blue).toBe(0x0000ff);
    expect(Phaser.Display.Color.HexStringToColor).toHaveBeenCalledWith('#0000ff');
  });
});
