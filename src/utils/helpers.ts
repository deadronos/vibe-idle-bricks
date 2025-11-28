import Decimal from 'break_infinity.js';

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

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
  }
  return decimal.floor().toString();
};

export const adjustBrightness = (hex: string, percent: number): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
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
