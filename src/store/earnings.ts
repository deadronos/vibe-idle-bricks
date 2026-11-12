import Decimal from 'break_infinity.js';
import { BALL_TYPES, OFFLINE_EARNINGS_RATE, calculateBrickStats, getPrestigeMultiplier } from '../types';
import { OFFLINE_EARNINGS_CONSTANT } from '../game/constants';
import { formatNumber } from '../utils';
import type { BallData } from '../types';

/** Offline income stops after this much time away. */
export const MAX_OFFLINE_SECONDS = 24 * 60 * 60;

const formatElapsed = (seconds: number): string => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${totalMinutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

export interface OfflineEarningsResult {
  coins: Decimal;
  message: string | null;
}

/**
 * Nominal bricks per second for the current board. Damage past a one-shot is
 * wasted, so each ball's rate is capped by the hits the brick actually needs.
 */
export const calculateHitRate = (
  balls: BallData[],
  speedMult: number,
  damageMult: number,
  currentTier: number
): number => {
  const { maxHealth } = calculateBrickStats(currentTier);
  let hitRate = 0;
  for (const ball of balls) {
    const config = BALL_TYPES[ball.type];
    const hits = Math.max(1, Math.ceil(maxHealth.toNumber() / (config.damage * damageMult)));
    let rate = (config.speed * speedMult) / hits;
    if (config.explosive) rate *= 1.5;
    if (config.pierce) rate *= 1.3;
    if (config.targeting) rate *= 1.2;
    hitRate += rate;
  }
  return hitRate;
};

/**
 * Simulated bricks-per-second is optimistic: balls bounce and spend time in
 * empty space. Live measurement at tier 1 (one basic ball, 60 s) gave 0.1
 * coins/s against a nominal 1/s, so display and ETA hints apply this factor.
 * Offline earnings keep their own constants and are not affected.
 */
export const LIVE_INCOME_CALIBRATION = 0.1;

/** Nominal coins per second; offline earnings apply their own constants. */
export const calculateIncomePerSecond = (
  balls: BallData[],
  speedMult: number,
  damageMult: number,
  coinMult: number,
  prestigeLevel: number,
  currentTier: number
): Decimal => {
  const { value } = calculateBrickStats(currentTier);
  return new Decimal(calculateHitRate(balls, speedMult, damageMult, currentTier))
    .mul(value)
    .mul(coinMult)
    .mul(getPrestigeMultiplier(prestigeLevel));
};

export const calculateOfflineEarnings = (
  balls: BallData[],
  speedMult: number,
  damageMult: number,
  coinMult: number,
  prestigeLevel: number,
  currentTier: number,
  offlineSeconds: number
): OfflineEarningsResult => {
  const safeOfflineSeconds = Math.min(Math.max(0, offlineSeconds), MAX_OFFLINE_SECONDS);
  const cps = calculateIncomePerSecond(
    balls,
    speedMult,
    damageMult,
    coinMult,
    prestigeLevel,
    currentTier
  ).mul(OFFLINE_EARNINGS_CONSTANT);
  const offlineCoins = cps.mul(safeOfflineSeconds).mul(OFFLINE_EARNINGS_RATE).floor();

  if (offlineCoins.lte(0)) {
    return { coins: new Decimal(0), message: null };
  }

  const capped = offlineSeconds > MAX_OFFLINE_SECONDS ? ' (max)' : '';

  return {
    coins: offlineCoins,
    message: `Welcome back! You earned ${formatNumber(offlineCoins)} coins over ${formatElapsed(safeOfflineSeconds)}${capped}.`,
  };
};
