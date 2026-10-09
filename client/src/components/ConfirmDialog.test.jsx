
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

afterEach(() => {
  cleanup();
});

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        message="Delete this application?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders the message when open', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Delete this application?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Delete this application?')).toBeInTheDocument();
  });

  it('calls onConfirm when Confirm is clicked', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Delete this application?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Delete this application?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Escape is pressed', () => {
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen={true}
        message="Delete this application?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes when the overlay is clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        message="Delete this application?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    await user.click(container.querySelector('.confirm-dialog-overlay'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while loading', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        message="Deleting application?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        loading={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
  });
});
