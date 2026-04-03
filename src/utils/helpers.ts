import Decimal from 'break_infinity.js';
import { BALL_TYPES } from '../types';
import type { BallType, BallData } from '../types';
import Phaser from 'phaser';

/**
 * Generates a unique 9-character string ID.
 * @returns {string} A random alphanumeric string.
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

/**
 * Formats a number (or Decimal) into a human-readable string with suffixes (K, M, B).
 * Handles very large numbers using exponential notation.
 *
 * @param num - The number to format, either a primitive number or a Decimal.
 * @returns {string} The formatted string (e.g., "1.50K", "2.00M").
 */
export const formatNumber = (num: Decimal | number): string => {
  const decimal = num instanceof Decimal ? num : new Decimal(num);

  if (decimal.gte(1e12)) {
    return decimal.toExponential(2);
  } else if (decimal.gte(1e9)) {
    return decimal.div(1e9).toFixed(2) + 'B';
  } else if (decimal.gte(1e6)) {
    return decimal.div(1e6).toFixed(2) + 'M';
  } else if (decimal.gte(1e3)) {
    return decimal.div(1e3).toFixed(2) + 'K';
  } else if (decimal.lt(10) && !decimal.eq(decimal.floor())) {
    return decimal.toFixed(1);
  }
  return decimal.floor().toString();
};

/**
 * Adjusts the brightness of a hex color.
 *
 * @param hex - The hex color code (e.g., "#ff0000").
 * @param percent - The percentage to adjust brightness (positive to lighten, negative to darken).
 * @returns {string} The adjusted hex color code.
 */
export const adjustBrightness = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};

/**
 * Returns the color associated with a specific brick tier.
 * Colors cycle or clamp based on the tier index.
 *
 * @param tier - The tier level of the brick (1-based).
 * @returns {string} The hex color code for the tier.
 */


/**
 * Global cache for parsed hex colors to avoid repetitive HexStringToColor calls.
 */
const hexColorCache = new Map<string, number>();

/**
 * Parses a hex color string into a Phaser color number and caches the result.
 * @param hex - The hex color code (e.g., "#ff0000").
 * @returns {number} The parsed color number.
 */
export const getParsedColor = (hex: string): number => {
  let color = hexColorCache.get(hex);
  if (color === undefined) {
    color = Phaser.Display.Color.HexStringToColor(hex).color;
    hexColorCache.set(hex, color);
  }
  return color;
};

export const getTierColor = (tier: number): string => {
  const colors = [
    '#4ade80', // Green - Tier 1
    '#60a5fa', // Blue - Tier 2
    '#facc15', // Yellow - Tier 3
    '#f97316', // Orange - Tier 4
    '#ef4444', // Red - Tier 5
    '#a855f7', // Purple - Tier 6
    '#ec4899', // Pink - Tier 7
    '#14b8a6', // Teal - Tier 8
    '#8b5cf6', // Violet - Tier 9
    '#fbbf24', // Amber - Tier 10+
  ];
  return colors[Math.min(tier - 1, colors.length - 1)];
};

/**
 * Creates a new ball of the specified type with random position and velocity.
 * @param type - The type of ball to create.
 * @param canvasWidth - The width of the canvas.
 * @param canvasHeight - The height of the canvas.
 * @returns {BallData} The new ball object.
 */
export const createBall = (
  type: BallType,
  canvasWidth: number,
  canvasHeight: number
): BallData => {
  const config = BALL_TYPES[type] || BALL_TYPES.basic;
  const x = canvasWidth / 2 + (Math.random() - 0.5) * 200;
  const y = canvasHeight - 50;
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 3;

  return {
    id: generateId(),
    type,
    x,
    y,
    dx: Math.cos(angle) * config.speed,
    dy: Math.sin(angle) * config.speed,
  };
};
