import sys
import os

path = 'src/components/Stats.tsx'
with open(path, 'r') as f:
    content = f.read()

search_text = """import { useGameStore } from '../store';
import { formatNumber } from '../utils';
import { getPrestigeThreshold } from '../types';"""

replace_text = """import { useGameStore } from '../store';
import { formatNumber } from '../utils';
import { getPrestigeThreshold, PRESTIGE_BONUS } from '../types';"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """  const prestigeLevel = useGameStore((state) => state.prestigeLevel);
  const prestigeTarget = getPrestigeThreshold(prestigeLevel);

  return (
    <div className="stats">"""

replace_text = """  const prestigeLevel = useGameStore((state) => state.prestigeLevel);
  const prestigeTarget = getPrestigeThreshold(prestigeLevel);
  const prestigeMult = 1 + prestigeLevel * PRESTIGE_BONUS;

  return (
    <div className="stats">"""

if search_text in content:
    content = content.replace(search_text, replace_text)

search_text = """      <div className="stat">
        <TrendingUp className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(prestigeTarget)}</span>
        <label>Next Prestige</label>
      </div>"""

replace_text = """      <div className="stat">
        <TrendingUp className="stat-icon" size={24} />
        <span className="stat-value">{formatNumber(prestigeTarget)}</span>
        <label>Next Prestige</label>
      </div>
      <div className="stat">
        <TrendingUp className="stat-icon text-purple-400" size={24} />
        <span className="stat-value">{prestigeMult.toFixed(2)}x</span>
        <label>Prestige Bonus</label>
      </div>"""

if search_text in content:
    content = content.replace(search_text, replace_text)
    with open(path, 'w') as f:
        f.write(content)
    print('Successfully updated ' + path)
else:
    print('Search text not found in ' + path)
