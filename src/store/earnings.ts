import Decimal from 'break_infinity.js';
import { BALL_TYPES, OFFLINE_EARNINGS_RATE, calculateBrickStats, getPrestigeMultiplier } from '../types';
import { OFFLINE_EARNINGS_CONSTANT } from '../game/constants';
import { formatNumber } from '../utils';
import type { BallData } from '../types';

export interface OfflineEarningsResult {
  coins: Decimal;
  message: string | null;
}

export const calculateOfflineEarnings = (
  balls: BallData[],
  speedMult: number,
  damageMult: number,
  coinMult: number,
  prestigeLevel: number,
  currentTier: number,
  offlineSeconds: number
): OfflineEarningsResult => {
  const safeOfflineSeconds = Math.max(0, offlineSeconds);
  const prestigeBonus = getPrestigeMultiplier(prestigeLevel);
  const { maxHealth, value } = calculateBrickStats(currentTier);

  let hitRate = 0;
  for (const ball of balls) {
    const config = BALL_TYPES[ball.type];
    // A brick takes ceil(health / damage) hits; extra damage beyond that is
    // wasted, so cap it the same way live play does.
    const hits = Math.max(1, Math.ceil(maxHealth.toNumber() / (config.damage * damageMult)));
    let rate = (config.speed * speedMult) / hits;
    if (config.explosive) rate *= 1.5;
    if (config.pierce) rate *= 1.3;
    if (config.targeting) rate *= 1.2;
    hitRate += rate;
  }

  const cps = new Decimal(hitRate)
    .mul(value)
    .mul(coinMult)
    .mul(prestigeBonus)
    .mul(OFFLINE_EARNINGS_CONSTANT);
  const offlineCoins = cps.mul(safeOfflineSeconds).mul(OFFLINE_EARNINGS_RATE).floor();

  if (offlineCoins.lte(0)) {
    return { coins: new Decimal(0), message: null };
  }

  return {
    coins: offlineCoins,
    message: `Welcome back! You earned ${formatNumber(offlineCoins)} coins while away.`,
  };
};
