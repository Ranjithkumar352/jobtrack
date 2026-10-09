# Requirements Document

## Introduction

JobTrack is a single-user, production-quality MERN stack web application that allows a job seeker to create, view, edit, delete, search, filter, and track job applications in one place. The application exposes a REST API built with Node.js and Express.js, persists data in MongoDB via Mongoose, and presents a clean, responsive React/Vite frontend using plain CSS. There is no authentication, payment, or deployment scope in this version.

---

## Glossary

- **Application**: A record representing a single job application submitted by the user.
- **Dashboard**: The landing page that displays aggregate statistics and recent applications.
- **API**: The Express REST API that the frontend consumes.
- **Server**: The Node.js/Express.js backend process.
- **Client**: The React/Vite frontend application.
- **Database**: The MongoDB instance accessed through Mongoose.
- **Status**: The current stage of an Application in the hiring pipeline. Valid values: `Applied`, `Assessment`, `Interview`, `Selected`, `Rejected`.
- **Job_Type**: The employment classification of a job. Valid values: `Full-time`, `Part-time`, `Internship`, `Contract`.
- **Service_Layer**: The frontend module responsible for all HTTP calls to the API.
- **Validator**: The backend module responsible for validating incoming request data.
- **Error_Handler**: The centralized Express middleware that formats and returns error responses.
- **Stats**: Aggregate counts and summaries computed from Application records.

---

## Requirements

---

### Requirement 1: Application Data Model

**User Story:** As a developer, I want a well-defined Application schema, so that all data stored in the Database is consistent and queryable.

#### Acceptance Criteria

1. THE Database SHALL store each Application with the following fields: `companyName` (string, required), `jobTitle` (string, required), `location` (string, optional), `jobType` (enum: `Full-time`, `Part-time`, `Internship`, `Contract`, required), `applicationDate` (date, required), `status` (enum: `Applied`, `Assessment`, `Interview`, `Selected`, `Rejected`, required, default `Applied`), `jobUrl` (string, optional, max 2048 characters), `notes` (string, optional, max 1000 characters).
2. THE Database SHALL automatically add `createdAt` and `updatedAt` timestamps to every Application record.
3. THE Database SHALL enforce that `companyName` and `jobTitle` are non-empty strings with a maximum length of 200 characters each.
4. THE Database SHALL enforce that `status` is one of the five defined Status values; IF an invalid status is provided, THEN THE Database SHALL reject the record with a validation error.
5. THE Database SHALL enforce that `jobType` is one of the four defined Job_Type values; IF an invalid jobType is provided, THEN THE Database SHALL reject the record with a validation error.
6. THE Database SHALL create a compound index on `{ status, applicationDate }` to support efficient filtering and sorting queries.
7. IF `companyName` or `jobTitle` is provided as an empty string or exceeds 200 characters, THEN THE Database SHALL reject the record with a validation error indicating the field name and the violated constraint.

---

### Requirement 2: Create a Job Application

**User Story:** As a job seeker, I want to create a new job application record, so that I can start tracking a position I have applied for.

#### Acceptance Criteria

1. WHEN the Client sends a `POST /api/applications` request with a valid JSON body, THE Server SHALL create a new Application record in the Database and return it with HTTP status `201`.
2. THE Validator SHALL require `companyName`, `jobTitle`, `jobType`, and `applicationDate` in the request body; IF any required field is missing or is an empty/blank string, THEN THE Server SHALL return HTTP status `400` with a JSON error body listing the missing or empty fields.
3. IF `status` is omitted from the request body, THEN THE Server SHALL default the Application status to `Applied`.
4. IF `applicationDate` is provided but is not a parseable date string, THEN THE Server SHALL return HTTP status `400` with an error message indicating the field name and the reason it was rejected.
5. IF `jobUrl` is provided and is not empty, THEN THE Validator SHALL verify it begins with `http://` or `https://`; IF it does not, THEN THE Server SHALL return HTTP status `400` with an error message indicating the field name and the reason it was rejected.
6. IF `jobType` is provided with a value not in the allowed enum (`Full-time`, `Part-time`, `Internship`, `Contract`), THEN THE Server SHALL return HTTP status `400` with an error message indicating the field name and the list of allowed values.
7. IF `status` is provided with a value not in the allowed enum (`Applied`, `Assessment`, `Interview`, `Selected`, `Rejected`), THEN THE Server SHALL return HTTP status `400` with an error message indicating the field name and the list of allowed values.
8. THE Server SHALL return the newly created Application as a JSON object in the response body, including its `_id` and timestamps.

---

### Requirement 3: Retrieve All Job Applications

**User Story:** As a job seeker, I want to retrieve a list of all my job applications, so that I can see the full picture of my job search.

#### Acceptance Criteria

1. WHEN the Client sends a `GET /api/applications` request, THE Server SHALL return an array of all Application records from the Database with HTTP status `200`.
2. WHEN the Client sends a `GET /api/applications` request with a `search` query parameter (max 200 characters), THE Server SHALL return only Applications whose `companyName` or `jobTitle` contains the search string (case-insensitive).
3. WHEN the Client sends a `GET /api/applications` request with a `status` query parameter, THE Server SHALL return only Applications matching that status value; IF the `status` value is not one of the five defined Status values, THEN THE Server SHALL return HTTP status `400` with an error message listing the allowed values.
4. WHEN the Client sends a `GET /api/applications` request with a `jobType` query parameter, THE Server SHALL return only Applications matching that Job_Type value; IF the `jobType` value is not one of the four defined Job_Type values, THEN THE Server SHALL return HTTP status `400` with an error message listing the allowed values.
5. WHEN the Client sends a `GET /api/applications` request with a `sortBy` query parameter of `applicationDate`, THE Server SHALL sort results by `applicationDate` in descending order (newest first) by default.
6. WHEN the Client sends a `GET /api/applications` request with both `sortBy=applicationDate` and `order=asc`, THE Server SHALL sort results by `applicationDate` in ascending order.
7. IF the Client sends a `GET /api/applications` request with an `order` parameter value other than `asc` or `desc`, THEN THE Server SHALL return HTTP status `400` with an error message indicating the allowed values.
8. WHEN multiple query parameters are provided simultaneously, THE Server SHALL apply all filters and the sort together before returning results.
9. IF no Applications exist, THE Server SHALL return an empty array `[]` with HTTP status `200`.

---

### Requirement 4: Retrieve a Single Job Application

**User Story:** As a job seeker, I want to view the full details of a specific job application, so that I can review all information I recorded.

#### Acceptance Criteria

1. WHEN the Client sends a `GET /api/applications/:id` request with a valid Application `_id` that exists in the Database, THE Server SHALL return the matching Application record as a JSON object containing all stored fields with HTTP status `200`.
2. IF the provided `id` does not match any Application in the Database, THEN THE Server SHALL return HTTP status `404` with a JSON error message of `"Application not found"`.
3. IF the provided `id` is not a valid MongoDB ObjectId format, THEN THE Server SHALL return HTTP status `400` with a JSON error message of `"Invalid application ID"`.
4. IF the Database is unavailable when processing the request, THEN THE Server SHALL return HTTP status `500` with a JSON error message of `"Internal server error"`.

---

### Requirement 5: Edit a Job Application

**User Story:** As a job seeker, I want to update an existing job application, so that I can keep its details and status current.

#### Acceptance Criteria

1. WHEN the Client sends a `PUT /api/applications/:id` request with a valid `_id` and a JSON body containing one or more fields to update, THE Server SHALL update only the provided fields of the matching Application (immutable fields `_id` and `createdAt` supplied in the body SHALL be silently ignored) and return the updated record with HTTP status `200`.
2. IF any field in the update body violates a defined constraint (enum value, max length, URL format), THEN THE Server SHALL return HTTP status `400` with an error message indicating which field failed validation and the constraint that was violated.
3. IF the provided `id` does not match any Application, THEN THE Server SHALL return HTTP status `404` with a JSON error message of `"Application not found"`.
4. IF the provided `id` is not a valid MongoDB ObjectId format, THEN THE Server SHALL return HTTP status `400` with a JSON error message of `"Invalid application ID"`.
5. THE Server SHALL update the `updatedAt` timestamp on every successful update.
6. IF the request body is empty or contains no recognized Application fields, THEN THE Server SHALL return HTTP status `400` with an error message of `"No valid fields provided for update"`.

---

### Requirement 6: Delete a Job Application

**User Story:** As a job seeker, I want to delete a job application I no longer need to track, so that my list stays relevant.

#### Acceptance Criteria

1. WHEN the Client sends a `DELETE /api/applications/:id` request with a valid `_id`, THE Server SHALL permanently remove the matching Application from the Database.
2. WHEN deletion is successful, THE Server SHALL return HTTP status `200` with a JSON body of `{ "message": "Application deleted successfully" }`.
3. IF the provided `id` does not match any Application, THEN THE Server SHALL return HTTP status `404` with a JSON error message of `"Application not found"`.
4. IF the provided `id` is not a valid MongoDB ObjectId format, THEN THE Server SHALL return HTTP status `400` with a JSON error message of `"Invalid application ID"`.
5. IF the Database is unavailable when processing the delete request, THEN THE Server SHALL return HTTP status `500` with a JSON error message of `"Internal server error"`.

---

### Requirement 7: Dashboard Statistics

**User Story:** As a job seeker, I want to see a summary of my job search activity on a dashboard, so that I can quickly understand where I stand.

#### Acceptance Criteria

1. WHEN the Client sends a `GET /api/dashboard/stats` request, THE Server SHALL return a JSON object with HTTP status `200` containing: `total` (total number of Applications), `byStatus` (an object mapping each Status value to its count), and `recentApplications` (an array of at most 5 most recently created Applications sorted by `createdAt` descending, each containing all fields defined in Requirement 1).
2. THE Server SHALL include all five Status values (`Applied`, `Assessment`, `Interview`, `Selected`, `Rejected`) in the `byStatus` object even when the count for a particular status is `0`.
3. IF no Applications exist in the Database, THE Server SHALL return `total: 0`, all status counts as `0`, and `recentApplications` as an empty array `[]`.

---

### Requirement 8: Centralized Backend Error Handling

**User Story:** As a developer, I want a centralized error-handling middleware, so that all API errors are returned in a consistent JSON format.

#### Acceptance Criteria

1. THE Error_Handler SHALL intercept all errors passed via `next(err)` in any route or controller and return a JSON response body containing an `error` field with a non-empty string message.
2. WHEN a Mongoose validation error occurs, THE Error_Handler SHALL return HTTP status `400` and include an `errors` object in the response body where each key is the invalid field name and each value is the corresponding validation message string.
3. WHEN an unhandled error occurs, THE Error_Handler SHALL return HTTP status `500` with a response body containing `{ "error": "Internal server error" }` and SHALL log the error message and stack trace to the server console.
4. IF the server is running in production mode (NODE_ENV=production), THEN THE Server SHALL return only the defined JSON error body to the Client and SHALL NOT include stack traces or raw exception messages in the response body.

---

### Requirement 9: Backend Project Structure

**User Story:** As a developer, I want a clean, well-organized backend codebase, so that it is easy to maintain and extend.

#### Acceptance Criteria

1. THE Server SHALL organize backend code into the following directories: `routes/`, `controllers/`, `models/`, `middleware/`, and `config/`.
2. THE Server SHALL load all configuration values (MongoDB connection URI, server port) from environment variables; IF a required environment variable is missing at startup, THEN THE Server SHALL log an error message indicating which variable is missing and exit with a non-zero exit code.
3. THE Server SHALL use a `.env` file listed in `.gitignore` for local development environment variables so that secrets are never committed to version control.
4. THE Server SHALL serve only the REST API; static file serving is out of scope for the backend.
5. THE Server SHALL enable CORS with an allowed origin read from an environment variable (e.g., `CORS_ORIGIN`), defaulting to `http://localhost:5173` if the variable is not set.

---

### Requirement 10: Frontend Page — Dashboard

**User Story:** As a job seeker, I want a dashboard page as the home view of the application, so that I can immediately see a summary of my job search.

#### Acceptance Criteria

1. WHEN the user navigates to the root path `/`, THE Client SHALL display the Dashboard page.
2. THE Dashboard SHALL display the total number of Applications as returned by the `GET /api/dashboard/stats` response.
3. THE Dashboard SHALL display the count of Applications for each of the five Status values: `Applied`, `Assessment`, `Interview`, `Selected`, and `Rejected`.
4. THE Dashboard SHALL display a list of at most the 5 most recently added Applications, showing at minimum `companyName`, `jobTitle`, `status`, and `applicationDate`.
5. WHILE the Dashboard is loading data from the API, THE Client SHALL display a visible loading indicator in place of the summary counts and recent Applications list.
6. IF the API returns an error, THE Client SHALL display a message indicating that data could not be loaded and SHALL hide the summary counts and recent Applications list.
7. IF no Applications exist, THE Client SHALL display a message indicating no applications have been added yet and SHALL hide the summary counts and recent Applications list.

---

### Requirement 11: Frontend Page — Applications List

**User Story:** As a job seeker, I want a dedicated page that lists all my job applications with search and filter controls, so that I can find and manage specific applications.

#### Acceptance Criteria

1. WHEN the user navigates to `/applications`, THE Client SHALL display the Applications List page showing all Application records.
2. THE Applications List page SHALL display each Application's `companyName`, `jobTitle`, `location`, `status`, `jobType`, and `applicationDate`.
3. THE Client SHALL provide a search input that filters Applications by `companyName` or `jobTitle`.
4. WHEN the user types in the search input, THE Client SHALL update the displayed list within 300ms of the last keystroke.
5. THE Client SHALL provide a status filter dropdown; WHEN the user selects a status, THE Client SHALL display only Applications matching that status.
6. THE Client SHALL provide a job type filter dropdown; WHEN the user selects a job type, THE Client SHALL display only Applications matching that job type.
7. THE Client SHALL provide a sort control that allows sorting by `applicationDate` ascending or descending, with descending as the default sort order on initial page load.
8. WHILE the Applications List is loading, THE Client SHALL display a loading indicator.
9. IF no Applications match the current search or filter criteria, THE Client SHALL display an empty-state message indicating no results were found.
10. THE Applications List page SHALL include a button to navigate to the Add Application form, rendered as a persistently visible element on the page at all times.
11. IF the Client fails to fetch Application records from the server, THE Client SHALL display an error message indicating the data could not be loaded and SHALL not display a loading indicator.

---

### Requirement 12: Frontend Page — Add Application Form

**User Story:** As a job seeker, I want a form to add a new job application, so that I can record a position I have applied for.

#### Acceptance Criteria

1. WHEN the user navigates to `/applications/new`, THE Client SHALL display the Add Application form.
2. THE Add Application form SHALL include input fields for: `companyName` (text, max 200 characters), `jobTitle` (text, max 200 characters), `location` (text, max 200 characters), `jobType` (dropdown), `applicationDate` (date picker), `status` (dropdown), `jobUrl` (text, max 2048 characters), and `notes` (text, max 2000 characters).
3. THE Client SHALL validate that `companyName`, `jobTitle`, `jobType`, and `applicationDate` are provided before submitting; IF any required field is empty or exceeds its maximum character length, THE Client SHALL display an inline error message next to the offending field indicating which validation rule was violated.
4. WHEN the user submits a valid form, THE Client SHALL send a `POST /api/applications` request; WHEN the Server returns a `201` response, THE Client SHALL navigate to the Applications List page and display a success notification visible for at least 3 seconds.
5. IF the Server returns a `400` error, THE Client SHALL display the server-provided error messages inline next to the relevant fields without navigating away from the form, and all previously entered field values SHALL be preserved.
6. IF the Server returns a non-400 error response (5xx or network failure), THE Client SHALL display a general error notification indicating the submission failed without navigating away from the form, and all previously entered field values SHALL be preserved.
7. WHILE the form submission is in progress, THE Client SHALL disable the submit button to prevent duplicate submissions.
8. WHEN the user activates the cancel action, THE Client SHALL navigate back to the Applications List page without saving, discarding all entered field values.

---

### Requirement 13: Frontend Page — Edit Application Form

**User Story:** As a job seeker, I want to edit an existing job application, so that I can update its details or change its status.

#### Acceptance Criteria

1. WHEN the user navigates to `/applications/:id/edit`, THE Client SHALL load the existing Application data and pre-populate all form fields.
2. WHILE the existing Application data is loading, THE Client SHALL display a loading indicator.
3. IF the API returns a `404` or `400` error when loading Application data, or if a network error occurs, THE Client SHALL display an error message indicating the application could not be loaded and SHALL provide a link back to the Applications List page.
4. WHEN the user attempts to submit the edit form, IF any required field (`companyName`, `jobTitle`, `jobType`, `applicationDate`) is empty, THEN THE Client SHALL display an inline error message next to the offending field and SHALL NOT submit the form.
5. WHEN the user submits a valid update form, THE Client SHALL send a `PUT /api/applications/:id` request; WHEN the Server returns a `200` response, THE Client SHALL navigate to the Application detail page and display a success notification visible for at least 3 seconds.
6. IF the Server returns a `400` or `404` error on submission, THE Client SHALL display an error message indicating the specific failure reason without navigating away from the form.
7. IF the Server returns a `500` error or a network error occurs during submission, THE Client SHALL display a general error notification indicating the submission failed and SHALL allow the user to retry.
8. WHILE the form submission is in progress, THE Client SHALL disable the submit button to prevent duplicate submissions.
9. WHEN the user activates the cancel action, THE Client SHALL navigate back to the Application detail page without saving any changes.

---

### Requirement 14: Frontend Page — Application Detail View

**User Story:** As a job seeker, I want to view all details of a single job application on a dedicated page, so that I can review everything I have recorded.

#### Acceptance Criteria

1. WHEN the user navigates to `/applications/:id`, THE Client SHALL fetch and display all fields of the matching Application as defined in Requirement 1 (`companyName`, `jobTitle`, `location`, `jobType`, `applicationDate`, `status`, `jobUrl`, `notes`, `createdAt`, `updatedAt`).
2. WHILE the Application data is loading, THE Client SHALL display a loading indicator.
3. IF the API returns a `404`, THE Client SHALL display a not-found message and a link back to the Applications List page.
4. WHEN the Application detail page is displayed, THE Client SHALL render an "Edit" button that, when clicked, navigates to `/applications/:id/edit`.
5. WHEN the Application detail page is displayed, THE Client SHALL render a "Delete" button.
6. WHEN the user clicks the "Delete" button, THE Client SHALL display a confirmation dialog asking the user to confirm deletion before sending the `DELETE /api/applications/:id` request.
7. WHEN the user confirms deletion and the Server returns `200`, THE Client SHALL navigate to the Applications List page and display a success notification.
8. IF the deletion request fails (Server returns non-200 or network error), THE Client SHALL display an error message indicating deletion failed and SHALL remain on the Application detail page.
9. IF the user cancels the confirmation dialog, THE Client SHALL take no action and remain on the Application detail page.

---

### Requirement 15: Frontend Reusable Components and Service Layer

**User Story:** As a developer, I want reusable UI components and a dedicated API service layer, so that the frontend is maintainable and avoids duplicated code.

#### Acceptance Criteria

1. THE Client SHALL implement all HTTP calls to the API in a dedicated `services/api.js` module; no component SHALL call `fetch` or any other HTTP library directly.
2. THE Client SHALL implement reusable components for: a status badge (color-coded by Status value, displayed when mounted, hidden when the loading spinner is active), a loading spinner (displayed while an API request is in flight, hidden on completion or error), a confirmation dialog (renders a confirm button that triggers the confirmed action and a cancel button that closes the dialog without action), and a notification/toast.
3. THE Client SHALL apply styling using plain CSS files; no inline styles or CSS-in-JS libraries SHALL be used.
4. THE Client SHALL display a status badge with a distinct color for each of the five Status values: `Applied` (blue), `Assessment` (yellow), `Interview` (orange), `Selected` (green), `Rejected` (red).
5. THE Client SHALL use React Router for client-side navigation between pages.
6. THE Client SHALL read the API base URL from the `VITE_API_URL` environment variable; all API requests SHALL use this base URL.

---

### Requirement 16: Search and Filter — Round-Trip Consistency

**User Story:** As a developer, I want the search and filter state to be consistent between what the user sets and what the API receives, so that results are always accurate.

#### Acceptance Criteria

1. WHEN the user clears all search and filter controls (search input empty, status filter set to "All", job type filter set to "All"), THE Client SHALL send a `GET /api/applications` request with no filter parameters and SHALL display all returned Application records.
2. WHEN the user applies a filter and then navigates away and back to `/applications`, THE Client SHALL reset the search input, status filter, and job type filter to their default unfiltered state.
3. WHEN the Client sends a `GET /api/applications` request with `search`, `status`, and `jobType` parameters simultaneously, THE Server SHALL return only Applications that satisfy all active constraints simultaneously (logical AND / intersection, not union).

---

### Requirement 17: HTTP Status Code Contract

**User Story:** As a developer, I want the API to use correct HTTP status codes consistently, so that the frontend and any future clients can rely on standard semantics.

#### Acceptance Criteria

1. THE Server SHALL return `200 OK` for successful `GET` and `PUT` requests.
2. THE Server SHALL return `200 OK` for successful `DELETE` requests, accompanied by a JSON confirmation body.
3. THE Server SHALL return `201 Created` for successful `POST` requests.
4. THE Server SHALL return `400 Bad Request` for validation errors or malformed input.
5. THE Server SHALL return `404 Not Found` when a requested Application does not exist.
6. THE Server SHALL return `500 Internal Server Error` for unexpected server-side failures.

---

### Requirement 18: Frontend Loading, Empty, and Error States

**User Story:** As a job seeker, I want clear feedback in every possible UI state, so that I always know what is happening in the application.

#### Acceptance Criteria

1. WHILE an initial page-load API request is in flight, THE Client SHALL display a full-page loading spinner in place of the page content.
2. WHILE a form submission API request is in flight, THE Client SHALL display an inline loading indicator within the form and disable the submit button.
3. IF an API request fails due to a network error (no response received), THE Client SHALL display the message `"Unable to connect. Please check your connection and try again."` and SHALL remove any loading indicator.
4. IF a page loads with no data to display (empty dataset), THE Client SHALL render an empty-state component with a descriptive message; WHERE a relevant action exists (e.g., adding a first application), THE Client SHALL include a call-to-action link or button within the empty-state component.
5. IF an API request returns an error response, THE Client SHALL display a non-empty error message describing the failure and SHALL NOT render a blank or content-free page body.
