
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it.each([
    ['Applied', 'applied'],
    ['Assessment', 'assessment'],
    ['Interview', 'interview'],
    ['Selected', 'selected'],
    ['Rejected', 'rejected'],
  ])('renders the %s status correctly', (status, modifier) => {
    render(<StatusBadge status={status} />);

    const badge = screen.getByText(status);

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(`badge--${modifier}`);
  });

  it('renders Unknown when no status is provided', () => {
    render(<StatusBadge />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toHaveClass('badge--unknown');
  });

  it('uses the unknown modifier for an unsupported status', () => {
    render(<StatusBadge status="Pending" />);

    expect(screen.getByText('Pending')).toHaveClass('badge--unknown');
  });
});
