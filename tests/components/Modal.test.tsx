import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../../src/components/Modal';

const renderWithoutCancel = (onCancel = vi.fn()) => {
  render(
    <Modal
      open
      title="Test"
      confirmLabel="Done"
      cancelLabel={null}
      onConfirm={() => {}}
      onCancel={onCancel}
    />,
  );
  return onCancel;
};

describe('Modal with cancelLabel={null}', () => {
  it('renders only the confirm action and focuses it', () => {
    renderWithoutCancel();

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    const done = screen.getByRole('button', { name: 'Done' });
    expect(done).toHaveFocus();
  });

  it('still closes on Escape', () => {
    const onCancel = renderWithoutCancel();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
