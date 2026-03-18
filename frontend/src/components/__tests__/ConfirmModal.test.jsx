import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <ConfirmModal
        open={false}
        title="Test"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the modal when open is true', () => {
    render(
      <ConfirmModal
        open={true}
        title="Delete Item"
        message="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open={true}
        title="Confirm"
        message="Proceed?"
        confirmLabel="Yes"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Yes'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        open={true}
        title="Confirm"
        message="Proceed?"
        cancelLabel="No"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByText('No'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses default labels and variant', () => {
    render(
      <ConfirmModal
        open={true}
        message="Default test"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
