import { useGameStore } from '../store';

export function Footer() {
  const save = useGameStore((state) => state.save);
  const reset = useGameStore((state) => state.reset);
  const exportSave = useGameStore((state) => state.exportSave);
  const importSave = useGameStore((state) => state.importSave);

  const handleSave = () => {
    save();
    // Could add toast notification here
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
      reset();
    }
  };

  const handleExport = async () => {
    const saveData = exportSave();
    try {
      await navigator.clipboard.writeText(saveData);
      alert('Save data copied to clipboard!');
    } catch {
      // Fallback: show the data in a prompt
      prompt('Copy the save data below:', saveData);
    }
  };

  const handleImport = () => {
    const data = prompt('Paste your save data:');
    if (data) {
      if (confirm('This will overwrite your current progress. Continue?')) {
        const success = importSave(data);
        if (success) {
          alert('Save imported successfully!');
        } else {
          alert('Failed to import save. Invalid data format.');
        }
      }
    }
  };

  return (
    <footer className="footer">
      <button className="btn btn-save" onClick={handleSave}>
        💾 Save
      </button>
      <button className="btn btn-export" onClick={handleExport}>
        📤 Export
      </button>
      <button className="btn btn-import" onClick={handleImport}>
        📥 Import
      </button>
      <button className="btn btn-reset" onClick={handleReset}>
        🔄 Reset
      </button>
      <span className="auto-save-status">Auto-saves every 30s</span>
    </footer>
  );
}
