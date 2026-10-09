
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import Toast from './Toast';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Toast', () => {
  it('renders the notification message', () => {
    render(
      <Toast message="Application created successfully!" onClose={vi.fn()} />
    );

    expect(
      screen.getByRole('alert')
    ).toHaveTextContent('Application created successfully!');
  });

  it('uses the success style by default', () => {
    render(<Toast message="Success" onClose={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveClass('toast--success');
  });

  it('supports error notifications', () => {
    render(
      <Toast message="Something went wrong" type="error" onClose={vi.fn()} />
    );

    expect(screen.getByRole('alert')).toHaveClass('toast--error');
  });

  it('calls onClose when the dismiss button is clicked', () => {
    const onClose = vi.fn();

    render(<Toast message="Saved" onClose={onClose} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Dismiss notification' })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when the message is empty', () => {
    render(<Toast message="" onClose={vi.fn()} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('automatically dismisses after 3.5 seconds', () => {
    vi.useFakeTimers();

    const onClose = vi.fn();

    render(<Toast message="Temporary notification" onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
