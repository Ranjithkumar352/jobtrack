# Design Document — JobTrack

## Overview

JobTrack is a single-user job-application tracker built on the MERN stack (MongoDB, Express.js, React/Vite, Node.js). The system is split into two independent processes:

- **Server** — a Node.js/Express REST API that owns all persistence and business logic.
- **Client** — a React/Vite SPA that consumes the REST API and owns all presentation logic.

The two processes communicate exclusively over HTTP/JSON. No authentication is in scope; every request is treated as coming from the single trusted user.

### Key Design Goals

1. **Clear layer separation** — routes, controllers, models, and middleware are distinct backend modules; frontend components never call `fetch` directly.
2. **Consistent error contract** — every error response is `{ error: "...", errors?: { field: "msg" } }`.
3. **Minimal dependencies** — plain CSS for styling, React state/hooks for client state, no Redux.
4. **Correctness by specification** — all validation rules are defined once (Mongoose schema + backend validator) and mirrored as client-side pre-flight checks.

---

## Architecture

### System Context

```
Browser
  └── React/Vite SPA  (localhost:5173)
        └── services/api.js  ──HTTP/JSON──▶  Express API  (localhost:5000)
                                                  └── Mongoose ODM
                                                        └── MongoDB
```

### Backend Directory Structure

```
server/
├── config/
│   └── db.js               # Mongoose connection setup
├── controllers/
│   ├── applicationController.js
│   └── dashboardController.js
├── middleware/
│   ├── errorHandler.js     # Centralised error middleware
│   └── validate.js         # Request validation helpers
├── models/
│   └── Application.js      # Mongoose schema + model
├── routes/
│   ├── applicationRoutes.js
│   └── dashboardRoutes.js
├── .env                    # Local env vars (git-ignored)
├── .env.example
└── server.js               # Entry point
```

### Frontend Directory Structure

```
client/
├── public/
├── src/
│   ├── components/
│   │   ├── ConfirmDialog.jsx
│   │   ├── ConfirmDialog.css
│   │   ├── Spinner.jsx
│   │   ├── Spinner.css
│   │   ├── StatusBadge.jsx
│   │   ├── StatusBadge.css
│   │   ├── Toast.jsx
│   │   └── Toast.css
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Dashboard.css
│   │   ├── ApplicationList.jsx
│   │   ├── ApplicationList.css
│   │   ├── ApplicationDetail.jsx
│   │   ├── ApplicationDetail.css
│   │   ├── AddApplication.jsx
│   │   ├── AddApplication.css
│   │   ├── EditApplication.jsx
│   │   └── EditApplication.css
│   ├── services/
│   │   └── api.js          # All HTTP calls — the only place fetch is used
│   ├── hooks/
│   │   └── useToast.js     # Toast state management hook
│   ├── App.jsx             # Router root
│   ├── App.css
│   └── main.jsx
├── .env                    # VITE_API_URL (git-ignored)
├── .env.example
└── vite.config.js
```

### Request/Response Flow

```
User Action
  │
  ▼
Page Component
  │  calls
  ▼
services/api.js        ──POST /api/applications──▶  applicationRoutes.js
                                                           │
                                                     validate.js (middleware)
                                                           │ (400 on failure)
                                                     applicationController.js
                                                           │
                                                     Application.js (Mongoose)
                                                           │
                                                     MongoDB
                                                           │ (success / error)
                                                     errorHandler.js
                                                           │
  Page Component  ◀──── JSON Response ───────────────────────
```

---

## Components and Interfaces

### Routing Table (React Router v6)

| Path                       | Component           | Description                        |
|----------------------------|---------------------|------------------------------------|
| `/`                        | `Dashboard`         | Stats + recent applications        |
| `/applications`            | `ApplicationList`   | Searchable / filterable list       |
| `/applications/new`        | `AddApplication`    | Create form                        |
| `/applications/:id`        | `ApplicationDetail` | Read-only detail + edit/delete     |
| `/applications/:id/edit`   | `EditApplication`   | Pre-populated edit form            |

### Reusable Components

#### `StatusBadge`

```
Props:  status: "Applied" | "Assessment" | "Interview" | "Selected" | "Rejected"
Output: <span class="badge badge--{status-lowercase}">{status}</span>
Colors: Applied → blue  | Assessment → yellow | Interview → orange
        Selected → green | Rejected → red
```

Rendered whenever a status value is displayed. Hidden (not rendered) when its sibling Spinner is active.

#### `Spinner`

```
Props:  size?: "inline" | "page"  (default "page")
Output: <div class="spinner spinner--{size}"><div class="spinner__ring" /></div>
```

`size="page"` fills the viewport; `size="inline"` is form-scoped. Displayed while an API request is in flight; unmounted on completion or error.

#### `ConfirmDialog`

```
Props:  message: string
        onConfirm: () => void
        onCancel: () => void
Output: Modal overlay with message, "Confirm" button, "Cancel" button
```

Rendered as a portal. Confirm button triggers `onConfirm` then closes; Cancel triggers `onCancel` and closes. No action is taken until one of the two buttons is clicked.

#### `Toast`

```
Props:  message: string
        type: "success" | "error"
        duration?: number  (default 3000 ms)
        onClose: () => void
Output: Fixed-position notification, auto-dismissed after `duration` ms
```

Managed by the `useToast` hook which holds `{ message, type, visible }` state. The hook exposes `showToast(message, type)` which sets visibility and schedules auto-dismiss via `setTimeout`.

### Page Components

#### `Dashboard`

State: `{ stats, loading, error }`  
On mount: calls `api.getDashboardStats()`.  
Renders: total count, five status-count tiles, list of ≤ 5 recent applications.  
States handled: loading (Spinner), error (error message, hides stats), empty (message, hides stats).

#### `ApplicationList`

State: `{ applications, loading, error, search, statusFilter, jobTypeFilter, sortOrder }`  
On mount + filter change: calls `api.getApplications({ search, status, jobType, sortBy, order })`.  
Search debounced to 300 ms.  
Renders: search input, status dropdown, job-type dropdown, sort toggle, application rows, "Add Application" button.  
States: loading (Spinner), error (error message), empty (empty-state message).

#### `AddApplication`

State: `{ fields, fieldErrors, submitting, serverError }`  
Client validates before submit; calls `api.createApplication(body)`.  
On 201: navigate to `/applications`, show success toast.  
On 400: display server field errors inline, preserve field values.  
On 5xx / network: display general error toast, preserve field values.  
Submit button disabled while `submitting === true`.

#### `EditApplication`

State: `{ fields, fieldErrors, submitting, loadError, saveError }`  
On mount: calls `api.getApplication(id)` to pre-populate fields.  
On save: calls `api.updateApplication(id, body)`.  
On 200: navigate to `/applications/:id`, show success toast.  
Error handling mirrors `AddApplication`.

#### `ApplicationDetail`

State: `{ application, loading, error, showConfirm }`  
On mount: calls `api.getApplication(id)`.  
Renders all fields, Edit button → `/applications/:id/edit`, Delete button.  
Delete button opens `ConfirmDialog`; on confirm calls `api.deleteApplication(id)`.  
On 200: navigate to `/applications`, show toast.  
On error: show error message, stay on page.

### Service Layer — `services/api.js`

All HTTP calls live here. Components import named functions; no component imports `fetch`.

```js
const BASE = import.meta.env.VITE_API_URL;

// Applications
export const getApplications  = (params = {}) => get('/api/applications', params);
export const getApplication   = (id)           => get(`/api/applications/${id}`);
export const createApplication= (body)         => post('/api/applications', body);
export const updateApplication= (id, body)     => put(`/api/applications/${id}`, body);
export const deleteApplication= (id)           => del(`/api/applications/${id}`);

// Dashboard
export const getDashboardStats = ()            => get('/api/dashboard/stats');

// Internal helpers
async function get(path, params) { ... }
async function post(path, body) { ... }
async function put(path, body) { ... }
async function del(path) { ... }
```

Each helper:
1. Builds the URL from `BASE + path` (appends query string for `get`).
2. Calls `fetch` with `Content-Type: application/json`.
3. Parses the JSON response.
4. Throws a structured error `{ status, message, errors }` on non-2xx so callers don't need to check `res.ok`.

---

## Data Models

### Mongoose Application Schema

```js
const applicationSchema = new Schema(
  {
    companyName:     { type: String, required: true, trim: true, maxlength: 200 },
    jobTitle:        { type: String, required: true, trim: true, maxlength: 200 },
    location:        { type: String, trim: true, default: '' },
    jobType:         {
      type: String,
      required: true,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    },
    applicationDate: { type: Date, required: true },
    status:          {
      type: String,
      required: true,
      enum: ['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'],
      default: 'Applied',
    },
    jobUrl:          {
      type: String,
      default: '',
      maxlength: 2048,
      validate: {
        validator: (v) => v === '' || /^https?:\/\//.test(v),
        message: 'jobUrl must begin with http:// or https://',
      },
    },
    notes:           { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

// Compound index for efficient filter + sort queries
applicationSchema.index({ status: 1, applicationDate: -1 });
```

### Field Summary

| Field             | Type     | Required | Default   | Constraints                              |
|-------------------|----------|----------|-----------|------------------------------------------|
| `companyName`     | String   | Yes      | —         | non-empty, max 200 chars                 |
| `jobTitle`        | String   | Yes      | —         | non-empty, max 200 chars                 |
| `location`        | String   | No       | `""`      | —                                        |
| `jobType`         | String   | Yes      | —         | enum: Full-time, Part-time, Internship, Contract |
| `applicationDate` | Date     | Yes      | —         | must be parseable date                   |
| `status`          | String   | Yes      | `Applied` | enum: Applied, Assessment, Interview, Selected, Rejected |
| `jobUrl`          | String   | No       | `""`      | max 2048, must start with http/https if set |
| `notes`           | String   | No       | `""`      | max 1000 chars                           |
| `createdAt`       | Date     | Auto     | now       | Mongoose timestamps                      |
| `updatedAt`       | Date     | Auto     | now       | Mongoose timestamps                      |

### API Endpoint Contract

#### `POST /api/applications`

Request body (JSON):
```json
{
  "companyName": "Acme Corp",
  "jobTitle": "Software Engineer",
  "location": "Remote",
  "jobType": "Full-time",
  "applicationDate": "2024-06-01",
  "status": "Applied",
  "jobUrl": "https://acme.com/jobs/1",
  "notes": "Referral from Alice"
}
```
Success: `201` + full Application object (all fields + `_id`, `createdAt`, `updatedAt`).  
Errors: `400` (validation), `500` (server).

#### `GET /api/applications`

Query params: `search`, `status`, `jobType`, `sortBy=applicationDate`, `order=asc|desc`  
Success: `200` + `[...Application]`  
Errors: `400` (invalid filter value), `500`.

#### `GET /api/applications/:id`

Success: `200` + Application object.  
Errors: `400` (bad ObjectId), `404` (not found), `500`.

#### `PUT /api/applications/:id`

Request body: partial Application fields (any subset; `_id` and `createdAt` silently ignored).  
Success: `200` + updated Application object.  
Errors: `400` (bad ObjectId or validation), `404`, `500`.

#### `DELETE /api/applications/:id`

Success: `200` + `{ "message": "Application deleted successfully" }`.  
Errors: `400` (bad ObjectId), `404`, `500`.

#### `GET /api/dashboard/stats`

Success `200`:
```json
{
  "total": 12,
  "byStatus": {
    "Applied": 5,
    "Assessment": 2,
    "Interview": 3,
    "Selected": 1,
    "Rejected": 1
  },
  "recentApplications": [ /* ≤5 Application objects, sorted createdAt desc */ ]
}
```
Errors: `500`.

### Backend Middleware Design

#### Validation Middleware (`middleware/validate.js`)

Exports named validator functions used as route middleware:

- `validateCreate` — checks required fields, enum values, date parseability, URL format.
- `validateUpdate` — checks that body is non-empty and contains at least one recognised field; then applies same field-level rules as `validateCreate` for any field present.
- `validateObjectId` — checks that `:id` is a valid MongoDB ObjectId; returns `400` early if not.
- `validateListQuery` — checks `status`, `jobType`, and `order` query params if provided.

All validators collect errors and call `next()` on success or `next(createError(400, message, errors))` on failure.

#### Error Handler Middleware (`middleware/errorHandler.js`)

```
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError')   → 400, { error, errors: { field: msg } }
  else if (err.status === 400|404)      → err.status, { error: err.message }
  else                                  → 500, { error: 'Internal server error' }

  In dev: console.error(err.stack)
  In prod (NODE_ENV=production): stack never sent to client
})
```

### Environment Variables

#### Server (`.env`)

| Variable        | Required | Default                  | Purpose                      |
|-----------------|----------|--------------------------|------------------------------|
| `PORT`          | No       | `5000`                   | Express listen port          |
| `MONGODB_URI`   | Yes      | —                        | Mongoose connection string   |
| `NODE_ENV`      | No       | `development`            | Controls error verbosity     |
| `CORS_ORIGIN`   | No       | `http://localhost:5173`  | Allowed CORS origin          |

Server exits with code 1 and logs the missing variable name if `MONGODB_URI` is absent at startup.

#### Client (`.env`)

| Variable        | Required | Default                       | Purpose               |
|-----------------|----------|-------------------------------|-----------------------|
| `VITE_API_URL`  | No       | `http://localhost:5000`       | Base URL for API calls|

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Application Create Round-Trip

*For any* valid Application body (with all required fields set to valid values), submitting a `POST /api/applications` request and then retrieving the created record via `GET /api/applications/:id` SHALL return a document whose field values match the submitted body, and the response SHALL include non-null `_id`, `createdAt`, and `updatedAt` timestamps.

**Validates: Requirements 1.1, 1.2, 2.1, 2.8**

---

### Property 2: Required-Field Rejection

*For any* Application body in which at least one of `companyName`, `jobTitle`, `jobType`, or `applicationDate` is missing, null, or a blank/whitespace-only string, the `POST /api/applications` endpoint SHALL return HTTP `400`.

**Validates: Requirements 2.2**

---

### Property 3: Default Status on Create

*For any* valid Application body that omits the `status` field, the created Application returned by the server SHALL have `status` equal to `"Applied"`.

**Validates: Requirements 2.3**

---

### Property 4: Enum Field Validation

*For any* `status` value not in `{ Applied, Assessment, Interview, Selected, Rejected }`, or any `jobType` value not in `{ Full-time, Part-time, Internship, Contract }`, any endpoint that accepts those fields SHALL return HTTP `400`.

**Validates: Requirements 1.4, 1.5, 2.6, 2.7**

---

### Property 5: String Length Validation

*For any* `companyName` or `jobTitle` that is an empty string or has length > 200, the relevant create or update endpoint SHALL return HTTP `400` with an error message naming the offending field.

**Validates: Requirements 1.3, 1.7**

---

### Property 6: URL Format Validation

*For any* non-empty `jobUrl` value that does not begin with `http://` or `https://`, any endpoint that accepts that field SHALL return HTTP `400`.

**Validates: Requirements 2.5**

---

### Property 7: Search Filter Correctness

*For any* dataset of Applications and any non-empty search string S, a `GET /api/applications?search=S` response SHALL contain only Applications where `companyName` or `jobTitle` includes S (case-insensitive), and SHALL exclude no Application that satisfies that condition.

**Validates: Requirements 3.2**

---

### Property 8: Status and JobType Filter Correctness

*For any* dataset and any valid `status` or `jobType` filter value, a filtered `GET /api/applications` response SHALL contain only Applications matching the requested value, and SHALL include every Application in the dataset that matches that value.

**Validates: Requirements 3.3, 3.4**

---

### Property 9: Sort Order Invariant

*For any* dataset of Applications returned by `GET /api/applications?sortBy=applicationDate`, the `applicationDate` of each element SHALL be ≥ the `applicationDate` of the next element when `order=desc` (default), and ≤ the next when `order=asc`.

**Validates: Requirements 3.5, 3.6**

---

### Property 10: Compound Filter AND Semantics

*For any* simultaneous combination of `search`, `status`, and `jobType` filters, every Application in the response SHALL satisfy all active filter conditions at once; no Application satisfying all conditions SHALL be absent from the response.

**Validates: Requirements 3.8, 16.3**

---

### Property 11: Partial Update Invariant

*For any* existing Application and any non-empty subset of valid mutable fields provided in a `PUT /api/applications/:id` request, the updated Application SHALL reflect the new values for the submitted fields, all unsubmitted fields SHALL remain unchanged, `_id` and `createdAt` SHALL be identical to the original, and `updatedAt` SHALL be strictly greater than the original `updatedAt`.

**Validates: Requirements 5.1, 5.5**

---

### Property 12: Delete Round-Trip

*For any* Application that exists in the database, sending `DELETE /api/applications/:id` SHALL return HTTP `200` with `{ "message": "Application deleted successfully" }`, and a subsequent `GET /api/applications/:id` for the same id SHALL return HTTP `404`.

**Validates: Requirements 6.1, 6.2**

---

### Property 13: Dashboard Stats Consistency

*For any* dataset of Applications, the `GET /api/dashboard/stats` response SHALL satisfy all of the following simultaneously: `total` equals the sum of all values in `byStatus`; `byStatus` contains exactly the five keys `Applied`, `Assessment`, `Interview`, `Selected`, `Rejected`; each value in `byStatus` equals the count of Applications with that status; `recentApplications` contains at most 5 elements; and the `createdAt` of each element in `recentApplications` is ≥ the `createdAt` of the next.

**Validates: Requirements 7.1, 7.2**

---

### Property 14: Error Handler Response Format

*For any* error passed through Express `next(err)`, the HTTP response body SHALL be valid JSON containing a non-empty `error` string field; for Mongoose ValidationError instances the response status SHALL be `400` and the body SHALL additionally contain an `errors` object where each key is a field name and each value is a non-empty string.

**Validates: Requirements 8.1, 8.2**

---

### Property 15: ObjectId Format Validation

*For any* string provided as `:id` that is not a valid 24-hex-character MongoDB ObjectId, any endpoint that accepts an `:id` parameter SHALL return HTTP `400` with `{ "error": "Invalid application ID" }` without querying the database.

**Validates: Requirements 4.3, 5.4, 6.4**

---

## Error Handling

### Backend Error Taxonomy

| Scenario                         | HTTP Status | Response Body                                    |
|----------------------------------|-------------|--------------------------------------------------|
| Missing / blank required field   | 400         | `{ error, errors: { field: msg } }`              |
| Invalid enum value               | 400         | `{ error: "...", errors: { field: msg } }`       |
| Invalid URL format               | 400         | `{ error: "...", errors: { jobUrl: msg } }`      |
| Invalid ObjectId format          | 400         | `{ error: "Invalid application ID" }`            |
| Empty / no-op update body        | 400         | `{ error: "No valid fields provided for update"}`|
| Application not found            | 404         | `{ error: "Application not found" }`             |
| Unexpected server error          | 500         | `{ error: "Internal server error" }`             |

### Frontend Error Handling Strategy

Each page component handles three distinct error categories:

1. **Load errors** (GET fails on page mount) — display an error message in place of content; provide a navigation link back to the list. No data is rendered.
2. **Submit errors (400)** — display server-provided field errors inline next to the relevant inputs. Do not navigate away. Preserve all field values.
3. **Submit errors (5xx / network)** — display a general Toast notification. Do not navigate away. Preserve all field values.

Network errors (no response) display: `"Unable to connect. Please check your connection and try again."`

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are used, covering complementary concerns:

- **Unit / integration tests** — specific examples, page-level behaviour, error state rendering, navigation flows.
- **Property-based tests** — universal properties across generated inputs; verifies the API layer and business logic with many input combinations.

### Property-Based Testing

**Library**: [fast-check](https://fast-check.dev/) (JavaScript, works with Vitest/Jest).

Each property-based test runs a **minimum of 100 iterations**. Each test is tagged with a comment referencing its design property.

Tag format:
```js
// Feature: job-track, Property N: <property_text>
```

**Properties and test targets:**

| Property | Target Layer | Test Approach |
|----------|-------------|---------------|
| P1 — Create round-trip | Express route + Mongoose (in-memory MongoDB via `mongodb-memory-server`) | Generate valid bodies, POST, GET, compare |
| P2 — Required-field rejection | Validator middleware (unit) | Generate bodies with missing/blank fields, assert 400 |
| P3 — Default status on create | Controller (unit) | Generate bodies without status, assert `status === "Applied"` |
| P4 — Enum validation | Validator + Mongoose | Generate out-of-enum strings, assert 400 |
| P5 — String length validation | Validator + Mongoose | Generate empty and >200-char strings, assert 400 |
| P6 — URL format validation | Validator | Generate non-http strings, assert 400 |
| P7 — Search filter correctness | Controller + DB (in-memory) | Generate datasets + search strings, assert result set |
| P8 — Status/jobType filter correctness | Controller + DB | Generate datasets + filter values, assert result set |
| P9 — Sort order invariant | Controller + DB | Generate datasets, check ordering of response array |
| P10 — Compound filter AND | Controller + DB | Generate datasets + multi-param combos, assert intersection |
| P11 — Partial update invariant | Controller + DB | Generate apps + update subsets, assert field changes and timestamps |
| P12 — Delete round-trip | Controller + DB | Create, delete, assert 404 on GET |
| P13 — Dashboard stats consistency | Controller + DB | Generate datasets, assert stats arithmetic |
| P14 — Error handler format | errorHandler middleware (unit) | Generate mock errors, assert response shape |
| P15 — ObjectId format validation | validateObjectId middleware (unit) | Generate invalid-format strings, assert 400 |

### Unit / Integration Tests (Example-Based)

- Dashboard renders total, 5 status tiles, recent list (with mock API responses)
- Empty dataset renders empty-state message on Dashboard, ApplicationList, ApplicationDetail
- Loading state shows Spinner; error state hides data
- `AddApplication` submit success: navigates to list + shows Toast
- `AddApplication` submit 400: shows inline field errors, preserves field values
- `EditApplication` pre-populates fields from GET response
- `ConfirmDialog` cancel → no action; confirm → calls onConfirm
- `StatusBadge` renders correct colour class for each of the five statuses
- `services/api.js` throws structured error on non-2xx (using `msw` mock service worker)
- Server startup exits with non-zero code when `MONGODB_URI` is missing
- `NODE_ENV=production` → no stack traces in 500 response body
- Filter reset on route re-entry resets all filter controls

### Test Infrastructure

- **Backend**: Vitest + Supertest + `mongodb-memory-server` (in-process MongoDB for integration tests)
- **Frontend**: Vitest + React Testing Library + `msw` (service worker mocks for API calls)
- **Property-based**: `fast-check` integrated into Vitest for both layers
