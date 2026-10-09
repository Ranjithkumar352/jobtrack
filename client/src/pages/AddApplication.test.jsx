
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AddApplication from './AddApplication';
import { createApplication } from '../services/api';

vi.mock('../services/api', () => ({
  createApplication: vi.fn(),
}));

function renderAddApplication() {
  return render(
    <MemoryRouter>
      <AddApplication />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AddApplication page', () => {
  it('renders the application form fields', () => {
    renderAddApplication();

    expect(screen.getByRole('heading', { name: 'Add Application' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Type/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Application Date/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Application' })).toBeInTheDocument();
  });

  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    renderAddApplication();

    await user.click(screen.getByRole('button', { name: 'Save Application' }));

    expect(await screen.findByText('Company name is required.')).toBeInTheDocument();
    expect(screen.getByText('Job title is required.')).toBeInTheDocument();
    expect(screen.getByText('Application date is required.')).toBeInTheDocument();
    expect(createApplication).not.toHaveBeenCalled();
  });

  it('validates the job URL format', async () => {
    const user = userEvent.setup();
    renderAddApplication();

    await user.type(screen.getByLabelText(/Company Name/), 'Example Corp');
    await user.type(screen.getByLabelText(/Job Title/), 'Frontend Developer');
    await user.type(screen.getByLabelText(/Application Date/), '2026-10-09');
    await user.type(screen.getByLabelText('Job URL'), 'example.com/job');

    await user.click(screen.getByRole('button', { name: 'Save Application' }));

    expect(await screen.findByText(
      'Job URL must begin with http:// or https://'
    )).toBeInTheDocument();

    expect(createApplication).not.toHaveBeenCalled();
  });

  it('submits trimmed form values when the form is valid', async () => {
    const user = userEvent.setup();
    createApplication.mockResolvedValue({ _id: 'application-123' });

    renderAddApplication();

    await user.type(screen.getByLabelText(/Company Name/), '  Example Corp  ');
    await user.type(screen.getByLabelText(/Job Title/), '  Frontend Developer  ');
    await user.type(screen.getByLabelText(/Location/), '  Hyderabad  ');
    await user.type(screen.getByLabelText(/Application Date/), '2026-10-09');

    await user.click(screen.getByRole('button', { name: 'Save Application' }));

    await waitFor(() => {
      expect(createApplication).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: 'Example Corp',
          jobTitle: 'Frontend Developer',
          location: 'Hyderabad',
          jobType: 'Full-time',
          applicationDate: '2026-10-09',
          status: 'Applied',
        })
      );
    });
  });

  it('shows an error when the API request fails', async () => {
    const user = userEvent.setup();
    createApplication.mockRejectedValue(new Error('Server unavailable'));

    renderAddApplication();

    await user.type(screen.getByLabelText(/Company Name/), 'Example Corp');
    await user.type(screen.getByLabelText(/Job Title/), 'Frontend Developer');
    await user.type(screen.getByLabelText(/Application Date/), '2026-10-09');

    await user.click(screen.getByRole('button', { name: 'Save Application' }));

    expect(
  await screen.findByText('Server unavailable', {
    selector: '.form-error',
  })
).toBeInTheDocument();
  });
});
