export const EXPLOSION_DAMAGE_MULTIPLIER = 0.5;
export const EXPLOSION_SCREEN_SHAKE_DURATION = 100;
export const EXPLOSION_SCREEN_SHAKE_INTENSITY = 0.005;

export const OFFLINE_EARNINGS_CONSTANT = 0.05;

export const FIXED_STEP = 8;
/** A stalled frame simulates at most this many steps; older time is dropped. */
export const MAX_CATCH_UP_STEPS = 5;
export const BALL_RADIUS = 8;

/** Frame time a single frame may simulate, even after a long stall. */
export const clampFrameDelta = (delta: number): number =>
  Math.min(delta, FIXED_STEP * MAX_CATCH_UP_STEPS);

/** Adds frame time to the fixed-step accumulator without hoarding stalled time. */
export const clampAccumulator = (accumulator: number, delta: number): number =>
  Math.min(accumulator + delta, FIXED_STEP * MAX_CATCH_UP_STEPS);

export const MIN_BRICKS_ON_SCREEN = 20;
export const INITIAL_BRICKS_TO_GENERATE = 50;

export const BRICK_WIDTH = 60;
export const BRICK_HEIGHT = 25;
export const BRICK_PADDING = 5;

export const SPEED_STEER_STRENGTH = 0.06;
export const TRAIL_LENGTH_FACTOR = 0.15;

export const HIT_FLASH_DURATION_MS = 50;
export const FLOATING_TEXT_LIFE_MS = 1000;
export const FLOATING_TEXT_RISE_SPEED = 0.05;

export const PARTICLE_EMITTER_LIFESPAN = 600;
export const PARTICLE_EMITTER_SPEED_MIN = 50;
export const PARTICLE_EMITTER_SPEED_MAX = 150;

export const BALL_HIT_PARTICLE_COUNT = 10;
export const EXPLOSION_HIT_PARTICLE_COUNT = 8;
export const CLICK_PARTICLE_COUNT = 5;

export const CLICK_DAMAGE_BASE = 0.5;

export const MAX_ROWS_FILL_FACTOR = 0.7;

/** Height of the decorative floor strip at the bottom of the arena. */
export const ARENA_FLOOR_HEIGHT = 12;
/** Height of the launch zone above the floor where balls spawn. */
export const SPAWN_ZONE_HEIGHT = 90;

/** Launch zone shrinks on very short canvases instead of eating the field. */
export const getSpawnZoneHeight = (height: number): number =>
  Math.min(SPAWN_ZONE_HEIGHT, height * 0.2);
