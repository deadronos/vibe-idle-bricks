import Decimal from 'break_infinity.js';
import { BALL_TYPES, PRESTIGE_BONUS, OFFLINE_EARNINGS_RATE } from '../types';
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
  const prestigeBonus = 1 + prestigeLevel * PRESTIGE_BONUS;

  let totalBallPower = new Decimal(0);
  for (const ball of balls) {
    const config = BALL_TYPES[ball.type];
    let power = new Decimal(config.damage).mul(damageMult).mul(config.speed).mul(speedMult);
    if (config.explosive) power = power.mul(1.5);
    if (config.pierce) power = power.mul(1.3);
    if (config.targeting) power = power.mul(1.2);
    totalBallPower = totalBallPower.add(power);
  }

  const cps = totalBallPower.mul(coinMult).mul(prestigeBonus).mul(OFFLINE_EARNINGS_CONSTANT).mul(currentTier);
  const offlineCoins = cps.mul(safeOfflineSeconds).mul(OFFLINE_EARNINGS_RATE).floor();

  if (offlineCoins.lte(0)) {
    return { coins: new Decimal(0), message: null };
  }

  return {
    coins: offlineCoins,
    message: `Welcome back! You earned ${formatNumber(offlineCoins)} coins while away.`,
  };
};
