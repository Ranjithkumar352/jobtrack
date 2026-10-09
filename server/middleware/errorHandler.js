'use strict';

/**
 * Centralized Express error-handling middleware.
 *
 * Mount LAST in server.js (after all routes) with:
 *   app.use(errorHandler);
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Extract clean field-level messages from a Mongoose ValidationError.
 * Returns { fieldName: "message", ... }
 */
function extractMongooseErrors(err) {
  const errors = {};
  Object.keys(err.errors).forEach(function (field) {
    errors[field] = err.errors[field].message;
  });
  return errors;
}

// ── Error handler ──────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Always log unexpected errors server-side for debugging
  if (!err.status || err.status >= 500) {
    console.error('[ErrorHandler]', err.stack || err.message || err);
  }

  // ── Mongoose ValidationError (schema-level failures) ──────────────────────
  // e.g. required field missing, enum mismatch, maxlength exceeded
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      errors: extractMongooseErrors(err),
    });
  }

  // ── Mongoose CastError (invalid ObjectId or type coercion failure) ─────────
  // e.g. malformed _id passed to findById
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid application ID',
    });
  }

  // ── MongoDB duplicate key error ────────────────────────────────────────────
  // Driver error code 11000 / 11001
  if (err.code === 11000 || err.code === 11001) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'field';
    return res.status(409).json({
      error: 'Duplicate value: a record with this ' + field + ' already exists',
    });
  }

  // ── Errors that carry an explicit HTTP status (thrown by controllers) ──────
  // e.g. createError(404, 'Application not found')
  if (err.status || err.statusCode) {
    const status = err.status || err.statusCode;
    return res.status(status).json({
      error: err.message || 'An error occurred',
    });
  }

  // ── Unknown / unhandled errors → 500 ──────────────────────────────────────
  const body = { error: 'Internal server error' };
  // In development, surface the message to ease debugging; never in production
  if (isDev && err.message) {
    body.detail = err.message;
  }
  return res.status(500).json(body);
}

module.exports = errorHandler;