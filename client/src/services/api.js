/**
 * api.js — JobTrack API service layer
 *
 * All HTTP communication with the Express backend lives here.
 * No component may import fetch or any HTTP library directly.
 * Requirements: 15.1, 15.6
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Internal request helper ───────────────────────────────────────────────────
/**
 * Make an HTTP request and return the parsed JSON body.
 *
 * On a non-2xx response the function throws an Error with:
 *   err.status  — the HTTP status code
 *   err.message — the backend's top-level error string
 *   err.errors  — the backend's field-level errors object (when present)
 *
 * @param {string} method  HTTP verb
 * @param {string} path    Path relative to BASE_URL (must start with '/')
 * @param {object} [body]  Request body (serialised to JSON)
 * @returns {Promise<any>} Parsed response body
 */
async function request(method, path, body) {
  const options = {
    method,
    headers: {},
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(BASE_URL + path, options);
  } catch (networkError) {
    // fetch() itself threw — no response received (network failure)
    const err = new Error('Unable to connect. Please check your connection and try again.');
    err.status = 0;
    throw err;
  }

  // Parse JSON regardless of status so we can forward backend error messages
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const err = new Error(
      (data && data.error) || 'An unexpected error occurred'
    );
    err.status = response.status;
    err.errors = (data && data.errors) || null;
    throw err;
  }

  return data;
}

// ── Public API functions ──────────────────────────────────────────────────────

/**
 * GET /api/applications
 * Supports: search, status, jobType, sortBy, order query params.
 * Only non-empty/non-undefined params are appended to the URL.
 * Requirements: 3.1–3.9
 *
 * @param {object} [params]
 * @param {string} [params.search]
 * @param {string} [params.status]
 * @param {string} [params.jobType]
 * @param {string} [params.sortBy]
 * @param {string} [params.order]
 */
export function getApplications(params = {}) {
  const qs = new URLSearchParams();
  const allowed = ['search', 'status', 'jobType', 'sortBy', 'order'];
  allowed.forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, value);
    }
  });
  const queryString = qs.toString();
  const path = queryString ? '/api/applications?' + queryString : '/api/applications';
  return request('GET', path);
}

/**
 * GET /api/applications/:id
 * Requirements: 4.1
 */
export function getApplication(id) {
  return request('GET', '/api/applications/' + id);
}

/**
 * POST /api/applications
 * Requirements: 2.1
 */
export function createApplication(data) {
  return request('POST', '/api/applications', data);
}

/**
 * PUT /api/applications/:id
 * Requirements: 5.1
 */
export function updateApplication(id, data) {
  return request('PUT', '/api/applications/' + id, data);
}

/**
 * DELETE /api/applications/:id
 * Requirements: 6.1
 */
export function deleteApplication(id) {
  return request('DELETE', '/api/applications/' + id);
}

/**
 * GET /api/dashboard/stats
 * Requirements: 7.1
 */
export function getDashboardStats() {
  return request('GET', '/api/dashboard/stats');
}
