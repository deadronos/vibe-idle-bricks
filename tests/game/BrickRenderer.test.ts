import { describe, it, expect, vi } from 'vitest';

// Avoid Phaser's canvas initialisation in jsdom; only colour parsing is used.
vi.mock('phaser', () => ({
  default: {},
  Display: {
    Color: {
      HexStringToColor: (hex: string) => ({
        color: parseInt(hex.replace('#', ''), 16),
      }),
    },
  },
}));

import Decimal from 'break_infinity.js';
import { BrickRenderer } from '../../src/game/GameRenderers';
import type { BrickData } from '../../src/types/game';

/** Minimal Graphics stand-in that records fill colours for assertions. */
class RecordingGraphics {
  fillStyles: Array<{ color: number; alpha: number }> = [];

  clear() {
    this.fillStyles = [];
  }

  fillStyle(color: number, alpha: number) {
    this.fillStyles.push({ color, alpha });
  }

  fillRect() {}
  lineStyle() {}
  strokeRect() {}
  destroy() {}
}

type SceneArg = ConstructorParameters<typeof BrickRenderer>[0];

const createRenderer = () => {
  const graphics = new RecordingGraphics();
  const scene = {
    add: {
      graphics: () => graphics,
      text: () => ({
        style: { color: '#ffffff' },
        setOrigin: () => undefined,
        setText: () => undefined,
        setColor: () => undefined,
        destroy: () => undefined,
      }),
    },
  } as unknown as SceneArg;
  return { renderer: new BrickRenderer(scene), graphics };
};

const makeBrick = (lastHitTime?: number): BrickData => ({
  id: 'brick-1',
  x: 0,
  y: 0,
  width: 40,
  height: 20,
  tier: 1,
  health: new Decimal(3),
  maxHealth: new Decimal(3),
  value: new Decimal(1),
  lastHitTime,
});

const flashedWhite = (graphics: RecordingGraphics) =>
  graphics.fillStyles.some(({ color }) => color === 0xffffff);

describe('BrickRenderer health bar', () => {
  it('draws a green bar for a lightly damaged brick', () => {
    const { renderer, graphics } = createRenderer();
    const brick = { ...makeBrick(), tier: 2, health: new Decimal(2.5) };
    renderer.render([brick]);

    expect(graphics.fillStyles.some(({ color }) => color === 0x4ade80)).toBe(true);
  })

  it('draws a red bar when the brick is nearly broken', () => {
    const { renderer, graphics } = createRenderer();
    const brick = { ...makeBrick(), tier: 2, health: new Decimal(0.5) };
    renderer.render([brick]);

    expect(graphics.fillStyles.some(({ color }) => color === 0xef4444)).toBe(true);
  })

  it('draws no bar on a full-health brick', () => {
    const { renderer, graphics } = createRenderer();
    renderer.render([{ ...makeBrick(), tier: 2 }]);

    const bars = graphics.fillStyles.filter(
      ({ color }) => color === 0x4ade80 || color === 0xfacc15 || color === 0xef4444
    );
    expect(bars).toHaveLength(0);
  })
})

describe('BrickRenderer hit flash', () => {
  it('flashes a just-hit brick white', () => {
    const { renderer, graphics } = createRenderer();
    renderer.render([makeBrick(performance.now())]);

    expect(flashedWhite(graphics)).toBe(true);
  });

  it('repaints the normal colour after the flash expires', () => {
    const { renderer, graphics } = createRenderer();
    const brick = makeBrick(performance.now());
    renderer.render([brick]);
    expect(flashedWhite(graphics)).toBe(true);

    // Same brick instance, but the hit is now older than the flash duration.
    brick.lastHitTime = performance.now() - 1000;
    renderer.render([brick]);

    expect(flashedWhite(graphics)).toBe(false);
  });

  it('does not flash an unhit brick', () => {
    const { renderer, graphics } = createRenderer();

    renderer.render([makeBrick()]);

    expect(flashedWhite(graphics)).toBe(false);
  });

  it('does not flash for timestamps from a different clock', () => {
    const { renderer, graphics } = createRenderer();

    // Regression: Date.now() epoch values used to sit "in the future" for the
    // renderer and keep every damaged brick white forever.
    renderer.render([makeBrick(Date.now())]);

    expect(flashedWhite(graphics)).toBe(false);
  });
});
