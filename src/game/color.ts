import Phaser from 'phaser';

/**
 * Global cache for parsed hex colors to avoid repetitive HexStringToColor calls.
 */
const hexColorCache = new Map<string, number>();

/**
 * Parses a hex color string into a Phaser color number and caches the result.
 *
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