import Decimal from 'break_infinity.js';

/**
 * BigNumber utility wrapper for break_infinity.js
 * Provides easy number formatting and common operations
 */

// Suffix array for formatting large numbers
const SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg',
  'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'Tg'
];

/**
 * Format a Decimal number to a human-readable string
 * @param value - The Decimal value to format
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.50M", "999.99K")
 */
export function formatNumber(value: Decimal | number | string, precision: number = 2): string {
  const decimal = new Decimal(value);
  
  // Handle zero
  if (decimal.eq(0)) {
    return '0';
  }
  
  // Handle negative numbers
  if (decimal.lt(0)) {
    return '-' + formatNumber(decimal.abs(), precision);
  }
  
  // For small numbers, just return the value
  if (decimal.lt(1000)) {
    const num = decimal.toNumber();
    if (Number.isInteger(num)) {
      return num.toString();
    }
    return num.toFixed(precision);
  }
  
  // Calculate the suffix index based on the exponent
  const exponent = decimal.e;
  const suffixIndex = Math.floor(exponent / 3);
  
  if (suffixIndex >= SUFFIXES.length) {
    // For very large numbers, use scientific notation
    return decimal.toExponential(precision);
  }
  
  // Calculate the mantissa for display
  const divisor = new Decimal(10).pow(suffixIndex * 3);
  const mantissa = decimal.div(divisor).toNumber();
  
  return mantissa.toFixed(precision) + SUFFIXES[suffixIndex];
}

/**
 * Format a number for compact display (e.g., in buttons)
 * @param value - The value to format
 * @returns Compact formatted string
 */
export function formatCompact(value: Decimal | number | string): string {
  return formatNumber(value, 1);
}

/**
 * Format currency with a prefix
 * @param value - The value to format
 * @param prefix - Currency symbol (default: "$")
 * @returns Formatted currency string
 */
export function formatCurrency(value: Decimal | number | string, prefix: string = '$'): string {
  return prefix + formatNumber(value, 2);
}

/**
 * Parse a string or number to Decimal
 * @param value - Value to parse
 * @returns Decimal instance
 */
export function toDecimal(value: string | number | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}

/**
 * Check if a value can afford a cost
 * @param current - Current amount
 * @param cost - Cost to check
 * @returns Whether the cost can be afforded
 */
export function canAfford(current: Decimal | number | string, cost: Decimal | number | string): boolean {
  return toDecimal(current).gte(toDecimal(cost));
}

/**
 * Calculate upgrade cost with exponential scaling
 * @param baseCost - Base cost of the upgrade
 * @param level - Current level
 * @param multiplier - Cost multiplier per level (default: 1.15)
 * @returns The cost for the next level
 */
export function calculateUpgradeCost(
  baseCost: Decimal | number,
  level: number,
  multiplier: number = 1.15
): Decimal {
  return toDecimal(baseCost).mul(new Decimal(multiplier).pow(level));
}

/**
 * Calculate brick health based on tier/row
 * @param tier - The tier/row of the brick
 * @param baseHealth - Base health value
 * @param healthMultiplier - Health multiplier per tier
 * @returns Health as Decimal
 */
export function calculateBrickHealth(
  tier: number,
  baseHealth: number = 10,
  healthMultiplier: number = 1.5
): Decimal {
  return new Decimal(baseHealth).mul(new Decimal(healthMultiplier).pow(tier));
}

/**
 * Calculate brick reward based on tier
 * @param tier - The tier of the brick
 * @param baseReward - Base reward value
 * @param rewardMultiplier - Reward multiplier per tier
 * @returns Reward as Decimal
 */
export function calculateBrickReward(
  tier: number,
  baseReward: number = 1,
  rewardMultiplier: number = 1.3
): Decimal {
  return new Decimal(baseReward).mul(new Decimal(rewardMultiplier).pow(tier));
}

/**
 * Add two Decimal values
 */
export function add(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  return toDecimal(a).add(toDecimal(b));
}

/**
 * Subtract two Decimal values
 */
export function subtract(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  return toDecimal(a).sub(toDecimal(b));
}

/**
 * Multiply two Decimal values
 */
export function multiply(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  return toDecimal(a).mul(toDecimal(b));
}

/**
 * Divide two Decimal values
 */
export function divide(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  return toDecimal(a).div(toDecimal(b));
}

/**
 * Get the maximum of two Decimal values
 */
export function max(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.gte(decB) ? decA : decB;
}

/**
 * Get the minimum of two Decimal values
 */
export function min(a: Decimal | number | string, b: Decimal | number | string): Decimal {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.lte(decB) ? decA : decB;
}

// Re-export Decimal for convenience
export { Decimal };
