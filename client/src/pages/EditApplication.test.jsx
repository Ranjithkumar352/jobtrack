
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import EditApplication from './EditApplication';
import { getApplication, updateApplication } from '../services/api';

vi.mock('../services/api', () => ({
  getApplication: vi.fn(),
  updateApplication: vi.fn(),
}));

const mockApplication = {
  _id: 'app123',
  companyName: 'Example Corp',
  jobTitle: 'Frontend Developer',
  location: 'Hyderabad',
  jobType: 'Internship',
  applicationDate: '2026-10-09T00:00:00.000Z',
  status: 'Interview',
  jobUrl: 'https://example.com/jobs/123',
  notes: 'Technical interview scheduled',
};

function renderEditApplication() {
  return render(
    <MemoryRouter initialEntries={['/applications/app123/edit']}>
      <Routes>
        <Route
          path="/applications/:id/edit"
          element={<EditApplication />}
        />
        <Route
          path="/applications/:id"
          element={<h1>Application Details Page</h1>}
        />
        <Route
          path="/applications"
          element={<h1>Applications List Page</h1>}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  getApplication.mockResolvedValue(mockApplication);

  updateApplication.mockResolvedValue({
    ...mockApplication,
    status: 'Selected',
  });
});

describe('EditApplication page', () => {
  it('loads and displays the existing application', async () => {
    renderEditApplication();

    expect(
      await screen.findByRole('heading', {
        name: 'Edit Application',
      })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Company Name/)).toHaveValue(
      'Example Corp'
    );
    expect(screen.getByLabelText(/Job Title/)).toHaveValue(
      'Frontend Developer'
    );
    expect(screen.getByLabelText(/Location/)).toHaveValue('Hyderabad');
    expect(screen.getByLabelText(/Job Type/)).toHaveValue('Internship');
    expect(screen.getByLabelText(/Status/)).toHaveValue('Interview');

    expect(getApplication).toHaveBeenCalledWith('app123');
  });

  it('shows an error when loading the application fails', async () => {
    getApplication.mockRejectedValue(
      new Error('Unable to load record')
    );

    renderEditApplication();

    expect(
      await screen.findByText('Unable to load record', {
        selector: '.form-error',
      })
    ).toBeInTheDocument();
  });

  it('validates required fields before updating', async () => {
    const user = userEvent.setup();

    renderEditApplication();

    const companyInput = await screen.findByLabelText(/Company Name/);

    await user.clear(companyInput);
    await user.click(
      screen.getByRole('button', { name: 'Save Changes' })
    );

    expect(
      await screen.findByText('Company name is required.')
    ).toBeInTheDocument();

    expect(updateApplication).not.toHaveBeenCalled();
  });

  it('submits updated values and navigates to the detail page', async () => {
    const user = userEvent.setup();

    renderEditApplication();

    const titleInput = await screen.findByLabelText(/Job Title/);

    await user.clear(titleInput);
    await user.type(titleInput, 'Full Stack Developer');

    await user.selectOptions(
      screen.getByLabelText(/Status/),
      'Selected'
    );

    await user.click(
      screen.getByRole('button', { name: 'Save Changes' })
    );

    await waitFor(() => {
      expect(updateApplication).toHaveBeenCalledWith(
        'app123',
        expect.objectContaining({
          companyName: 'Example Corp',
          jobTitle: 'Full Stack Developer',
          status: 'Selected',
        })
      );
    });

    expect(
      await screen.findByRole('heading', {
        name: 'Application Details Page',
      })
    ).toBeInTheDocument();
  });

  it('shows an error when updating fails', async () => {
    const user = userEvent.setup();

    updateApplication.mockRejectedValue(
      new Error('Update failed')
    );

    renderEditApplication();

    await screen.findByRole('heading', {
      name: 'Edit Application',
    });

    await user.click(
      screen.getByRole('button', { name: 'Save Changes' })
    );

    expect(
      await screen.findByText('Update failed', {
        selector: '.form-error',
      })
    ).toBeInTheDocument();
  });
});
