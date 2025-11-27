import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../utils/bigNumber';
import './MoneyDisplay.css';

/**
 * MoneyDisplay - Shows the current money amount
 */
export const MoneyDisplay: React.FC = () => {
  const money = useGameStore((state) => state.money);

  return (
    <div className="money-display">
      <span className="money-label">Money:</span>
      <span className="money-value">{formatCurrency(money)}</span>
    </div>
  );
};
