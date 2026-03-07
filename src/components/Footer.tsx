import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store';
import { Save, Upload, Download, RotateCcw } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';

/**
 * Footer component containing save management controls.
 * Allows saving, loading, exporting, resetting, and importing game data.
 * All feedback uses in-app UI (no native alert/confirm/prompt).
 *
 * @returns {JSX.Element} The footer toolbar.
 */
export function Footer() {
  const save = useGameStore((state) => state.save);
  const reset = useGameStore((state) => state.reset);
  const exportSave = useGameStore((state) => state.exportSave);
  const importSave = useGameStore((state) => state.importSave);

  const { showToast } = useToast();

  // Reset confirmation modal state
  const [resetOpen, setResetOpen] = useState(false);

  // Import dialog state
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = () => {
    save();
    showToast('Game saved!', 'success');
  };

  const handleReset = () => setResetOpen(true);

  const confirmReset = () => {
    reset();
    setResetOpen(false);
    showToast('Game reset.', 'info');
  };

  const handleExport = async () => {
    const saveData = exportSave();
    try {
      await navigator.clipboard.writeText(saveData);
      showToast('Save data copied to clipboard!', 'success');
    } catch {
      // Clipboard not available – show a pre-selected textarea so the user can copy manually
      setImportText(saveData);
      setImportOpen(true);
    }
  };

  const handleImportOpen = () => {
    setImportText('');
    setImportOpen(true);
  };

  // When the dialog opens with pre-filled export data, select it so the user
  // can copy it immediately (clipboard fallback path).
  useEffect(() => {
    if (importOpen && importText && textareaRef.current) {
      textareaRef.current.select();
    }
  }, [importOpen, importText]);

  const confirmImport = () => {
    if (!importText.trim()) {
      showToast('No save data entered.', 'error');
      return;
    }
    const success = importSave(importText.trim());
    if (success) {
      showToast('Save imported successfully!', 'success');
      setImportOpen(false);
      setImportText('');
    } else {
      showToast('Failed to import save. Invalid data format.', 'error');
    }
  };

  return (
    <>
      <footer className="footer">
        <button className="btn btn-save" onClick={handleSave}>
          <Save size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" /> Save
        </button>
        <button className="btn btn-export" onClick={handleExport}>
          <Upload size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" /> Export
        </button>
        <button className="btn btn-import" onClick={handleImportOpen}>
          <Download size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" /> Import
        </button>
        <button className="btn btn-reset" onClick={handleReset}>
          <RotateCcw size={16} className="inline-block mr-2" style={{ verticalAlign: 'text-bottom' }} aria-hidden="true" /> Reset
        </button>
        <span className="auto-save-status">Auto-saves every 30s</span>
      </footer>

      {/* Reset confirmation */}
      <Modal
        open={resetOpen}
        title="Reset All Progress?"
        confirmLabel="Reset"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={confirmReset}
        onCancel={() => setResetOpen(false)}
      >
        <p>This will permanently delete all progress and cannot be undone.</p>
      </Modal>

      {/* Import / fallback export dialog */}
      <Modal
        open={importOpen}
        title="Import Save"
        confirmLabel="Import"
        cancelLabel="Cancel"
        confirmVariant="primary"
        onConfirm={confirmImport}
        onCancel={() => {
          setImportOpen(false);
          setImportText('');
        }}
      >
        <label className="import-label" htmlFor="import-textarea">
          Paste your save data below:
        </label>
        <textarea
          id="import-textarea"
          ref={textareaRef}
          className="import-textarea"
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste save data here…"
          rows={5}
          spellCheck={false}
          aria-label="Save data"
        />
      </Modal>
    </>
  );
}
