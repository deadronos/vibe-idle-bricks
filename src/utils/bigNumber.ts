import Decimal from 'break_infinity.js';

/**
 * Number suffixes for formatting large numbers
 */
const SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'
];

/**
 * Converts various types to Decimal
 */
function toDecimal(value: Decimal | number | string): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}

/**
 * BigNum utility wrapper for break_infinity.js
 * Provides convenient methods for big number operations
 */
export const BigNum = {
  /**
   * Creates a new Decimal from a value
   */
  create: (value: number | string = 0): Decimal => new Decimal(value),

  /**
   * Converts various types to Decimal
   */
  toDecimal,

  /**
   * Formats a Decimal number into a human-readable string with suffix
   * e.g., 1500 -> "1.50K", 1500000 -> "1.50M"
   */
  format: (value: Decimal | number | string, decimals: number = 2): string => {
    const decimal = toDecimal(value);
    
    if (decimal.lt(1000)) {
      return decimal.toFixed(Math.min(decimals, 2));
    }

    const exponent = Math.floor(decimal.log10() / 3);
    const suffixIndex = Math.min(exponent, SUFFIXES.length - 1);
    
    if (suffixIndex >= SUFFIXES.length) {
      return decimal.toExponential(decimals);
    }

    const divisor = new Decimal(10).pow(suffixIndex * 3);
    const formatted = decimal.div(divisor);
    
    return formatted.toFixed(decimals) + SUFFIXES[suffixIndex];
  },

  /**
   * Adds two Decimal values
   */
  add: (a: Decimal | number, b: Decimal | number): Decimal => 
    toDecimal(a).add(toDecimal(b)),

  /**
   * Subtracts two Decimal values
   */
  sub: (a: Decimal | number, b: Decimal | number): Decimal => 
    toDecimal(a).sub(toDecimal(b)),

  /**
   * Multiplies two Decimal values
   */
  mul: (a: Decimal | number, b: Decimal | number): Decimal => 
    toDecimal(a).mul(toDecimal(b)),

  /**
   * Divides two Decimal values
   */
  div: (a: Decimal | number, b: Decimal | number): Decimal => 
    toDecimal(a).div(toDecimal(b)),

  /**
   * Compares if a >= b
   */
  gte: (a: Decimal | number, b: Decimal | number): boolean => 
    toDecimal(a).gte(toDecimal(b)),

  /**
   * Compares if a <= b
   */
  lte: (a: Decimal | number, b: Decimal | number): boolean => 
    toDecimal(a).lte(toDecimal(b)),

  /**
   * Compares if a > b
   */
  gt: (a: Decimal | number, b: Decimal | number): boolean => 
    toDecimal(a).gt(toDecimal(b)),

  /**
   * Compares if a < b
   */
  lt: (a: Decimal | number, b: Decimal | number): boolean => 
    toDecimal(a).lt(toDecimal(b)),

  /**
   * Serializes a Decimal for storage
   */
  serialize: (value: Decimal): string => value.toString(),

  /**
   * Deserializes a Decimal from storage
   */
  deserialize: (value: string): Decimal => new Decimal(value),
};

export default BigNum;
