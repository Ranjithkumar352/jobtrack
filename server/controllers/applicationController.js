'use strict';

const Application = require('../models/Application');

// Immutable fields that must never be overwritten via an update request.
const IMMUTABLE_FIELDS = ['_id', 'createdAt', '__v'];

// ── createApplication ─────────────────────────────────────────────────────────
// POST /api/applications
// validateCreate middleware has already confirmed required fields are present
// and valid.  The controller just persists and returns the new document.
// Requirements: 2.1, 2.8, 17.3
async function createApplication(req, res, next) {
  try {
    const application = await Application.create(req.body);
    return res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

// ── getApplications ───────────────────────────────────────────────────────────
// GET /api/applications[?search=&status=&jobType=&sortBy=&order=]
// validateListQuery middleware has already validated the query params.
// Requirements: 3.1–3.9, 16.3, 17.1
async function getApplications(req, res, next) {
  try {
    const { search, status, jobType, sortBy, order } = req.query;

    // Build a Mongoose filter object incrementally
    const filter = {};

    // Case-insensitive partial match across companyName OR jobTitle
    if (search) {
      const pattern = new RegExp(search.trim(), 'i');
      filter['$or'] = [{ companyName: pattern }, { jobTitle: pattern }];
    }

    if (status)  filter.status  = status;
    if (jobType) filter.jobType = jobType;

    // Sort: default to applicationDate descending (newest first)
    const sortField = sortBy === 'applicationDate' ? 'applicationDate' : 'applicationDate';
    const sortDir   = order === 'asc' ? 1 : -1;
    const sortObj   = {};
    sortObj[sortField] = sortDir;

    const applications = await Application.find(filter).sort(sortObj);
    return res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
}

// ── getApplicationById ────────────────────────────────────────────────────────
// GET /api/applications/:id
// validateObjectId middleware has already rejected non-ObjectId strings.
// Requirements: 4.1, 4.2, 4.3, 17.1
async function getApplicationById(req, res, next) {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      const err = new Error('Application not found');
      err.status = 404;
      return next(err);
    }
    return res.status(200).json(application);
  } catch (err) {
    next(err);
  }
}

// ── updateApplication ─────────────────────────────────────────────────────────
// PUT /api/applications/:id
// validateObjectId + validateUpdate middleware have already run.
// Requirements: 5.1, 5.2, 5.3, 5.5, 17.1
async function updateApplication(req, res, next) {
  try {
    // Strip immutable fields so they can never be overwritten
    const updateBody = Object.assign({}, req.body);
    IMMUTABLE_FIELDS.forEach(function (f) { delete updateBody[f]; });

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      updateBody,
      {
        new: true,          // return the updated document
        runValidators: true, // enforce schema validation on the update fields
      }
    );

    if (!application) {
      const err = new Error('Application not found');
      err.status = 404;
      return next(err);
    }

    return res.status(200).json(application);
  } catch (err) {
    next(err);
  }
}

// ── deleteApplication ─────────────────────────────────────────────────────────
// DELETE /api/applications/:id
// validateObjectId middleware has already run.
// Requirements: 6.1, 6.2, 17.2
async function deleteApplication(req, res, next) {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      const err = new Error('Application not found');
      err.status = 404;
      return next(err);
    }
    return res.status(200).json({ message: 'Application deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
};