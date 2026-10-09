
import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getDashboardStats,
} from './api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockResponse(data, options = {}) {
  const { ok = true, status = 200 } = options;

  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

describe('JobTrack API service', () => {
  it('fetches applications without query parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse([])
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getApplications()).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/applications',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('includes supported application filters in the URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse([])
    );
    vi.stubGlobal('fetch', fetchMock);

    await getApplications({
      search: 'Frontend Developer',
      status: 'Interview',
      jobType: 'Internship',
      sortBy: 'applicationDate',
      order: 'desc',
      ignored: 'value',
    });

    const requestedUrl = fetchMock.mock.calls[0][0];
    const url = new URL(requestedUrl);

    expect(url.pathname).toBe('/api/applications');
    expect(url.searchParams.get('search')).toBe('Frontend Developer');
    expect(url.searchParams.get('status')).toBe('Interview');
    expect(url.searchParams.get('jobType')).toBe('Internship');
    expect(url.searchParams.get('sortBy')).toBe('applicationDate');
    expect(url.searchParams.get('order')).toBe('desc');
    expect(url.searchParams.has('ignored')).toBe(false);
  });

  it('fetches one application by ID', async () => {
    const application = { _id: 'abc123', companyName: 'Example' };
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(application)
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getApplication('abc123')).resolves.toEqual(application);

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:5000/api/applications/abc123'
    );
  });

  it('creates an application using POST and JSON', async () => {
    const input = {
      companyName: 'Example',
      jobTitle: 'Frontend Developer',
    };
    const created = { _id: 'abc123', ...input };

    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(created)
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(createApplication(input)).resolves.toEqual(created);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/applications',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    );
  });

  it('updates an application using PUT', async () => {
    const input = { status: 'Interview' };
    const updated = { _id: 'abc123', ...input };

    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(updated)
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      updateApplication('abc123', input)
    ).resolves.toEqual(updated);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/applications/abc123',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(input),
      })
    );
  });

  it('deletes an application using DELETE', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse({ message: 'Application deleted successfully' })
    );
    vi.stubGlobal('fetch', fetchMock);

    await deleteApplication('abc123');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/applications/abc123',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('fetches dashboard statistics', async () => {
    const stats = { total: 3, byStatus: {} };
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(stats)
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getDashboardStats()).resolves.toEqual(stats);

    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://localhost:5000/api/dashboard/stats'
    );
  });

  it('throws the backend error message and preserves status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      mockResponse(
        { error: 'Application not found', errors: { id: 'Invalid ID' } },
        { ok: false, status: 404 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      await getApplication('missing');
      throw new Error('Expected the request to fail');
    } catch (error) {
      expect(error.message).toBe('Application not found');
      expect(error.status).toBe(404);
      expect(error.errors).toEqual({ id: 'Invalid ID' });
    }
  });

  it('handles network connection failures', async () => {
    const fetchMock = vi.fn().mockRejectedValue(
      new Error('Network unavailable')
    );
    vi.stubGlobal('fetch', fetchMock);

    try {
      await getApplications();
      throw new Error('Expected the request to fail');
    } catch (error) {
      expect(error.message).toContain('Unable to connect');
      expect(error.status).toBe(0);
    }
  });
});
