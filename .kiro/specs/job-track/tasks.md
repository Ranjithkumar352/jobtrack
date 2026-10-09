# Implementation Plan: JobTrack

## Overview

Build a single-user MERN stack job application tracker. The backend is a Node.js/Express REST API with MongoDB/Mongoose, living in `server/`. The frontend is a React/Vite SPA with plain CSS, living in `client/`. The two communicate exclusively over HTTP/JSON. Implementation proceeds from scaffolding → backend data layer → backend routes → frontend service → frontend components → frontend pages → tests.

## Tasks

- [ ] 1. Scaffold project structure and environment configuration
  - [-] 1.1 Initialize backend project
    - Create `server/` directory with `package.json` (dependencies: express, mongoose, cors, dotenv; devDependencies: vitest, supertest, mongodb-memory-server, fast-check)
    - Create `server/.env.example` with `PORT`, `MONGODB_URI`, `NODE_ENV`, `CORS_ORIGIN` placeholders
    - Create `server/.env` (git-ignored) with local development values
    - Create `server/.gitignore` excluding `.env` and `node_modules`
    - Create `server/server.js` entry point: loads dotenv, validates `MONGODB_URI` (exit code 1 if missing), configures CORS from `CORS_ORIGIN` env var (default `http://localhost:5173`), mounts route placeholders, starts listening on `PORT` (default 5000)
    - _Requirements: 9.2, 9.3, 9.5_

  - [-] 1.2 Initialize frontend project
    - Scaffold `client/` with Vite + React template (`npm create vite@latest client -- --template react`)
    - Add dependencies: react-router-dom; devDependencies: vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, msw, fast-check
    - Create `client/.env.example` with `VITE_API_URL` placeholder
    - Create `client/.env` (git-ignored) with `VITE_API_URL=http://localhost:5000`
    - Create `client/vite.config.js` with Vitest configuration
    - _Requirements: 15.5, 15.6, 9.3_

  - [x] 1.3 Configure Mongoose DB connection
    - Create `server/config/db.js`: exports `connectDB()` that calls `mongoose.connect(process.env.MONGODB_URI)`, logs success, and throws on failure
    - Import and call `connectDB()` in `server/server.js` before starting the listener
    - _Requirements: 9.1, 9.2_

- [x] 2. Implement Application Mongoose model
  - [x] 2.1 Create Application schema and model
    - Create `server/models/Application.js` with the full Mongoose schema: all fields, types, required flags, enum values, defaults, maxlength constraints, custom URL validator, and `{ timestamps: true }`
    - Add compound index `{ status: 1, applicationDate: -1 }`
    - Export the compiled model
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.2 Write property tests for Application model (P2, P3, P4, P5, P6)
    - Create `server/models/__tests__/Application.test.js`
    - **Property 2: Required-Field Rejection** — generate bodies with missing/blank required fields, assert Mongoose throws `ValidationError`; **Validates: Requirements 2.2**
    - **Property 3: Default Status on Create** — generate valid bodies without `status`, assert saved doc has `status === "Applied"`; **Validates: Requirements 2.3**
    - **Property 4: Enum Field Validation** — generate out-of-enum `status` and `jobType` strings, assert `ValidationError`; **Validates: Requirements 1.4, 1.5, 2.6, 2.7**
    - **Property 5: String Length Validation** — generate empty and >200-char `companyName`/`jobTitle`, assert `ValidationError`; **Validates: Requirements 1.3, 1.7**
    - **Property 6: URL Format Validation** — generate non-http(s) `jobUrl` strings, assert `ValidationError`; **Validates: Requirements 2.5**
    - Use `mongodb-memory-server` for an in-process database; minimum 100 iterations each; tag each test `// Feature: job-track, Property N: <text>`
    - _Requirements: 1.1–1.7, 2.2–2.7_

- [ ] 3. Implement backend middleware
  - [x] 3.1 Create validation middleware
    - Create `server/middleware/validate.js` exporting:
      - `validateObjectId(req, res, next)` — returns 400 `{ error: "Invalid application ID" }` if `:id` is not a 24-hex MongoDB ObjectId
      - `validateCreate(req, res, next)` — checks required fields, enum values, date parseability, URL format; calls `next(createError(400, ...))` on failure
      - `validateUpdate(req, res, next)` — rejects empty body / no recognised fields (400 `"No valid fields provided for update"`); then applies same field-level rules as `validateCreate` for supplied fields
      - `validateListQuery(req, res, next)` — validates `status`, `jobType`, and `order` query params if present
    - All validators collect all errors before responding
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 2.7, 3.3, 3.4, 3.7, 5.2, 5.4, 5.6_

  - [ ] 3.2 Create centralized error handler middleware
    - Create `server/middleware/errorHandler.js` exporting an Express 4-arg error middleware
    - Mongoose `ValidationError` → 400 + `{ error, errors: { field: msg } }`
    - `err.status === 400 || 404` → `err.status` + `{ error: err.message }`
    - All others → 500 + `{ error: "Internal server error" }`
    - `console.error(err.stack)` always; omit stack from response body when `NODE_ENV=production`
    - Mount in `server.js` after all routes
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 3.3 Write property tests for middleware (P14, P15)
    - Create `server/middleware/__tests__/middleware.test.js`
    - **Property 14: Error Handler Response Format** — generate mock errors of various types (ValidationError, status errors, generic), assert response is valid JSON with non-empty `error` string and correct status code; **Validates: Requirements 8.1, 8.2**
    - **Property 15: ObjectId Format Validation** — generate strings that are not valid 24-hex ObjectIds, assert `validateObjectId` responds 400 without calling `next`; **Validates: Requirements 4.3, 5.4, 6.4**
    - Minimum 100 iterations each
    - _Requirements: 8.1, 8.2, 4.3, 5.4, 6.4_

- [ ] 4. Implement backend routes and controllers
  - [ ] 4.1 Create Application controller — CRUD operations
    - Create `server/controllers/applicationController.js` with:
      - `createApplication` — saves new Application, returns 201 + full object
      - `getApplications` — builds Mongoose query from `search` (case-insensitive regex on `companyName`/`jobTitle`), `status`, `jobType`, `sortBy`/`order`; returns 200 + array
      - `getApplication` — finds by id, returns 200 + object or 404
      - `updateApplication` — `findByIdAndUpdate` with `{ new: true, runValidators: true }`, silently ignores `_id`/`createdAt`; returns 200 + updated object or 404
      - `deleteApplication` — `findByIdAndDelete`; returns 200 + `{ message: "Application deleted successfully" }` or 404
    - All async functions use try/catch and call `next(err)` on error
    - _Requirements: 2.1, 2.8, 3.1, 3.2, 3.8, 4.1, 4.2, 5.1, 5.5, 6.1, 6.2_

  - [ ] 4.2 Create Dashboard controller
    - Create `server/controllers/dashboardController.js` with `getDashboardStats`:
      - Uses `Application.countDocuments()` for total and per-status counts (all 5 statuses always present, zero if no docs)
      - Fetches `recentApplications` as ≤5 docs sorted by `createdAt` desc
      - Returns 200 + `{ total, byStatus, recentApplications }`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 4.3 Wire routes
    - Create `server/routes/applicationRoutes.js`:
      - `POST /` → `[validateCreate, createApplication]`
      - `GET /` → `[validateListQuery, getApplications]`
      - `GET /:id` → `[validateObjectId, getApplication]`
      - `PUT /:id` → `[validateObjectId, validateUpdate, updateApplication]`
      - `DELETE /:id` → `[validateObjectId, deleteApplication]`
    - Create `server/routes/dashboardRoutes.js`: `GET /stats` → `getDashboardStats`
    - Mount in `server.js`: `app.use('/api/applications', applicationRoutes)` and `app.use('/api/dashboard', dashboardRoutes)`
    - _Requirements: 2.1, 3.1–3.8, 4.1–4.4, 5.1–5.6, 6.1–6.5, 7.1–7.3, 17.1–17.6_

  - [ ]* 4.4 Write property-based integration tests for API (P1, P7–P13)
    - Create `server/__tests__/api.test.js` using Vitest + Supertest + `mongodb-memory-server`
    - **Property 1: Application Create Round-Trip** — generate valid bodies, POST then GET, assert field equality and non-null `_id`/timestamps; **Validates: Requirements 1.1, 1.2, 2.1, 2.8**
    - **Property 7: Search Filter Correctness** — generate datasets + search strings, assert response contains exactly matching docs; **Validates: Requirements 3.2**
    - **Property 8: Status/JobType Filter Correctness** — generate datasets + filter values, assert exact match set; **Validates: Requirements 3.3, 3.4**
    - **Property 9: Sort Order Invariant** — generate datasets, assert `applicationDate` ordering for both `asc` and `desc`; **Validates: Requirements 3.5, 3.6**
    - **Property 10: Compound Filter AND Semantics** — generate datasets + multi-param combos, assert intersection; **Validates: Requirements 3.8, 16.3**
    - **Property 11: Partial Update Invariant** — generate apps + update subsets, assert changed fields, unchanged fields, and `updatedAt > createdAt`; **Validates: Requirements 5.1, 5.5**
    - **Property 12: Delete Round-Trip** — create, delete, assert 404 on subsequent GET; **Validates: Requirements 6.1, 6.2**
    - **Property 13: Dashboard Stats Consistency** — generate datasets, assert `total === sum(byStatus)`, all 5 keys present, `recentApplications ≤ 5`; **Validates: Requirements 7.1, 7.2**
    - Minimum 100 iterations each
    - _Requirements: 1.1, 1.2, 2.1, 2.8, 3.2–3.8, 5.1, 5.5, 6.1, 6.2, 7.1, 7.2_

- [ ] 5. Checkpoint — Backend complete
  - Ensure all backend tests pass, the server starts without error, and the API responds correctly to manual smoke-test requests. Ask the user if any questions arise before proceeding to the frontend.

- [ ] 6. Implement frontend service layer
  - [ ] 6.1 Create `services/api.js`
    - Create `client/src/services/api.js`
    - Internal helpers: `get(path, params)`, `post(path, body)`, `put(path, body)`, `del(path)` — each builds URL from `import.meta.env.VITE_API_URL + path`, calls `fetch` with `Content-Type: application/json`, parses JSON, throws `{ status, message, errors }` on non-2xx
    - Named exports: `getApplications`, `getApplication`, `createApplication`, `updateApplication`, `deleteApplication`, `getDashboardStats`
    - No component may import `fetch` directly
    - _Requirements: 15.1, 15.6_

  - [ ]* 6.2 Write unit tests for `services/api.js`
    - Create `client/src/services/__tests__/api.test.js`
    - Use `msw` to mock the Express API at the `VITE_API_URL` base
    - Test: correct URL construction, query string encoding, structured error thrown on non-2xx, each exported function calls the right HTTP method and path
    - _Requirements: 15.1, 15.6_

- [ ] 7. Implement reusable frontend components
  - [ ] 7.1 Implement `StatusBadge` component
    - Create `client/src/components/StatusBadge.jsx` and `StatusBadge.css`
    - Renders `<span class="badge badge--{status-lowercase}">{status}</span>`
    - CSS defines colors: Applied → blue, Assessment → yellow, Interview → orange, Selected → green, Rejected → red
    - Hidden (not rendered) when a sibling Spinner is active (controlled by prop or parent logic)
    - _Requirements: 15.2, 15.4_

  - [ ] 7.2 Implement `Spinner` component
    - Create `client/src/components/Spinner.jsx` and `Spinner.css`
    - Props: `size?: "inline" | "page"` (default `"page"`)
    - `size="page"` fills the viewport; `size="inline"` is form-scoped
    - Unmounted (not just hidden) on completion or error
    - _Requirements: 15.2, 18.1, 18.2_

  - [ ] 7.3 Implement `ConfirmDialog` component
    - Create `client/src/components/ConfirmDialog.jsx` and `ConfirmDialog.css`
    - Props: `message`, `onConfirm`, `onCancel`
    - Renders as a modal portal overlay with Confirm and Cancel buttons
    - Confirm triggers `onConfirm` then closes; Cancel triggers `onCancel` and closes
    - No action taken until a button is clicked
    - _Requirements: 15.2, 14.6, 14.9_

  - [ ] 7.4 Implement `Toast` component and `useToast` hook
    - Create `client/src/components/Toast.jsx`, `Toast.css`, and `client/src/hooks/useToast.js`
    - Toast props: `message`, `type: "success" | "error"`, `duration?: number` (default 3000 ms), `onClose`
    - Renders as a fixed-position notification; auto-dismissed after `duration` ms via `setTimeout`
    - `useToast` hook: holds `{ message, type, visible }` state; exposes `showToast(message, type)`
    - _Requirements: 15.2, 12.4, 13.5, 14.7_

  - [ ]* 7.5 Write unit tests for reusable components
    - Create `client/src/components/__tests__/components.test.jsx`
    - Test `StatusBadge`: renders correct CSS class for each of the 5 statuses
    - Test `ConfirmDialog`: cancel → `onCancel` called, `onConfirm` not called; confirm → `onConfirm` called
    - Test `Toast`: auto-dismisses after duration, calls `onClose`
    - Test `Spinner`: renders `spinner--page` by default, `spinner--inline` when `size="inline"`
    - _Requirements: 15.2, 15.4_

- [ ] 8. Implement frontend pages
  - [ ] 8.1 Set up React Router and App shell
    - Create/update `client/src/App.jsx` with React Router v6 `<BrowserRouter>` and `<Routes>`
    - Define routes: `/` → `Dashboard`, `/applications` → `ApplicationList`, `/applications/new` → `AddApplication`, `/applications/:id` → `ApplicationDetail`, `/applications/:id/edit` → `EditApplication`
    - Create `client/src/App.css` for global styles
    - _Requirements: 15.5_

  - [ ] 8.2 Implement `Dashboard` page
    - Create `client/src/pages/Dashboard.jsx` and `Dashboard.css`
    - State: `{ stats, loading, error }`; on mount calls `api.getDashboardStats()`
    - Renders: total count, five status-count tiles (one per Status value), list of ≤5 recent applications showing `companyName`, `jobTitle`, `status` (via `StatusBadge`), `applicationDate`
    - Loading state: full-page `<Spinner size="page" />` replacing content
    - Error state: error message, hides stats and list
    - Empty state: message indicating no applications yet, hides stats and list
    - _Requirements: 10.1–10.7_

  - [ ] 8.3 Implement `ApplicationList` page
    - Create `client/src/pages/ApplicationList.jsx` and `ApplicationList.css`
    - State: `{ applications, loading, error, search, statusFilter, jobTypeFilter, sortOrder }`
    - On mount and on filter change: calls `api.getApplications({ search, status, jobType, sortBy: 'applicationDate', order: sortOrder })`; search debounced to 300 ms
    - Renders: search input, status dropdown, job-type dropdown, sort toggle (default desc), application rows with `companyName`, `jobTitle`, `location`, `status` (via `StatusBadge`), `jobType`, `applicationDate`; persistent "Add Application" button
    - Loading: `<Spinner size="page" />`; error: error message (no spinner); empty: empty-state message
    - On route re-entry: reset all filters to defaults (Requirements 16.2)
    - _Requirements: 11.1–11.11, 16.1, 16.2_

  - [ ] 8.4 Implement `AddApplication` page
    - Create `client/src/pages/AddApplication.jsx` and `AddApplication.css`
    - State: `{ fields, fieldErrors, submitting, serverError }`
    - Client-side pre-flight: validate required fields and max-length before submit; show inline errors if invalid
    - On valid submit: calls `api.createApplication(body)`; on 201 → navigate to `/applications` + success toast; on 400 → display server field errors inline, preserve values; on 5xx/network → general error toast, preserve values
    - Submit button disabled while `submitting === true`; Cancel → navigate to `/applications`
    - Inline form spinner (`<Spinner size="inline" />`) while submitting
    - _Requirements: 12.1–12.8, 18.2, 18.3_

  - [ ] 8.5 Implement `EditApplication` page
    - Create `client/src/pages/EditApplication.jsx` and `EditApplication.css`
    - State: `{ fields, fieldErrors, submitting, loadError, saveError }`
    - On mount: calls `api.getApplication(id)` to pre-populate fields; loading → `<Spinner size="page" />`; load error (404/400/network) → error message + link back to list
    - On valid submit: calls `api.updateApplication(id, body)`; on 200 → navigate to `/applications/:id` + success toast; on 400/404 → inline error; on 500/network → general error toast
    - Client-side validation mirrors `AddApplication`
    - Submit button disabled while `submitting === true`; Cancel → navigate to `/applications/:id`
    - _Requirements: 13.1–13.9, 18.2, 18.3_

  - [ ] 8.6 Implement `ApplicationDetail` page
    - Create `client/src/pages/ApplicationDetail.jsx` and `ApplicationDetail.css`
    - State: `{ application, loading, error, showConfirm }`
    - On mount: calls `api.getApplication(id)`; loading → `<Spinner size="page" />`; 404 → not-found message + link to list
    - Renders all fields from Requirement 1; status displayed via `StatusBadge`
    - "Edit" button → navigate to `/applications/:id/edit`
    - "Delete" button → sets `showConfirm = true`, renders `<ConfirmDialog />`; on confirm → calls `api.deleteApplication(id)`; on 200 → navigate to `/applications` + success toast; on error → error message, stay on page
    - Cancel in dialog → `showConfirm = false`, no action
    - _Requirements: 14.1–14.9_

  - [ ]* 8.7 Write unit/integration tests for frontend pages
    - Create `client/src/pages/__tests__/pages.test.jsx`
    - Use React Testing Library + `msw` for API mocking
    - Dashboard: renders total, 5 status tiles, recent list (mock success); shows Spinner on load; shows error message on API failure; shows empty-state on empty dataset
    - ApplicationList: renders application rows; search input triggers filtered API call after 300 ms debounce; status/jobType dropdowns filter; filter reset on route re-entry
    - AddApplication: submit success → navigates to list + success toast; submit 400 → inline field errors, no navigation, values preserved
    - EditApplication: pre-populates fields from GET response; submit 200 → navigates to detail + toast
    - ApplicationDetail: renders all fields; Delete → shows ConfirmDialog; confirm delete success → navigates to list; cancel → stays on page; deletion error → shows error message, stays on page
    - _Requirements: 10.1–10.7, 11.1–11.11, 12.1–12.8, 13.1–13.9, 14.1–14.9_

- [ ] 9. Final checkpoint — Full stack integration
  - Ensure all frontend and backend tests pass. Verify the React Router routes render correctly. Check all loading, error, and empty states. Ask the user if any questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Each task references specific requirements for traceability
- Property tests use `fast-check` integrated into Vitest; each run is tagged `// Feature: job-track, Property N: <text>` and executes a minimum of 100 iterations
- `mongodb-memory-server` provides an in-process MongoDB for backend integration tests — no external DB needed for tests
- `msw` (Mock Service Worker) provides API mocking for frontend tests
- Checkpoints (tasks 5 and 9) are natural breakpoints to validate the full layer before moving on

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3", "4.1"] },
    { "id": 6, "tasks": ["4.2"] },
    { "id": 7, "tasks": ["4.3"] },
    { "id": 8, "tasks": ["4.4", "6.1"] },
    { "id": 9, "tasks": ["6.2", "7.1", "7.2", "7.3", "7.4"] },
    { "id": 10, "tasks": ["7.5", "8.1"] },
    { "id": 11, "tasks": ["8.2", "8.3"] },
    { "id": 12, "tasks": ["8.4", "8.5"] },
    { "id": 13, "tasks": ["8.6"] },
    { "id": 14, "tasks": ["8.7"] }
  ]
}
```
