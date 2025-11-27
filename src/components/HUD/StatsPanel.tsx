import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { formatNumber } from '../../utils/bigNumber';
import { GAME_CONFIG } from '../../config/gameConfig';
import './StatsPanel.css';

/**
 * StatsPanel - Shows game statistics
 */
export const StatsPanel: React.FC = () => {
  const totalBricksDestroyed = useGameStore((state) => state.totalBricksDestroyed);
  const ballStats = useGameStore((state) => state.ballStats);
  
  const totalBricks = GAME_CONFIG.gridWidth * GAME_CONFIG.gridHeight;
  const progressPercent = (totalBricksDestroyed / totalBricks) * 100;

  return (
    <div className="stats-panel">
      <h3 className="stats-title">Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Bricks Destroyed</span>
          <span className="stat-value">{formatNumber(totalBricksDestroyed, 0)}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Total Bricks</span>
          <span className="stat-value">{formatNumber(totalBricks, 0)}</span>
        </div>
        
        <div className="stat-item progress-item">
          <span className="stat-label">Progress</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <span className="stat-value">{progressPercent.toFixed(4)}%</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Active Balls</span>
          <span className="stat-value">{ballStats.count}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Ball Damage</span>
          <span className="stat-value">{formatNumber(ballStats.damage)}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Ball Speed</span>
          <span className="stat-value">{formatNumber(ballStats.speed, 0)}</span>
        </div>
      </div>
    </div>
  );
};
