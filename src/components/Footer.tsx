import { useGameStore } from '../store';

export function Footer() {
  const save = useGameStore((state) => state.save);
  const reset = useGameStore((state) => state.reset);

  const handleSave = () => {
    save();
    // Could add toast notification here
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
      reset();
    }
  };

  return (
    <footer className="footer">
      <button className="btn btn-save" onClick={handleSave}>
        💾 Save
      </button>
      <button className="btn btn-reset" onClick={handleReset}>
        🔄 Reset
      </button>
      <span className="auto-save-status">Auto-saves every 30s</span>
    </footer>
  );
}
