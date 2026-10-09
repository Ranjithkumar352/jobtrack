'use strict';

const mongoose = require('mongoose');

// Constants

const VALID_STATUSES  = ['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'];
const VALID_JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract'];
const VALID_SORT_BY   = ['applicationDate'];
const VALID_ORDERS    = ['asc', 'desc'];

const MUTABLE_FIELDS = [
  'companyName', 'jobTitle', 'location', 'jobType',
  'applicationDate', 'status', 'jobUrl', 'notes',
];

// Helpers

function isNonBlank(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateFields(body, requireFields) {
  const errors = {};

  if (requireFields || 'companyName' in body) {
    if (!isNonBlank(body.companyName)) {
      errors.companyName = 'companyName is required and must be a non-empty string';
    } else if (body.companyName.trim().length > 200) {
      errors.companyName = 'companyName must not exceed 200 characters';
    }
  }

  if (requireFields || 'jobTitle' in body) {
    if (!isNonBlank(body.jobTitle)) {
      errors.jobTitle = 'jobTitle is required and must be a non-empty string';
    } else if (body.jobTitle.trim().length > 200) {
      errors.jobTitle = 'jobTitle must not exceed 200 characters';
    }
  }

  if (requireFields || 'jobType' in body) {
    if (!body.jobType) {
      errors.jobType = 'jobType is required';
    } else if (!VALID_JOB_TYPES.includes(body.jobType)) {
      errors.jobType = 'jobType must be one of: Full-time, Part-time, Internship, Contract';
    }
  }

  if (requireFields || 'applicationDate' in body) {
    if (!body.applicationDate) {
      errors.applicationDate = 'applicationDate is required';
    } else if (isNaN(Date.parse(body.applicationDate))) {
      errors.applicationDate = 'applicationDate must be a valid date (e.g. 2024-06-01)';
    }
  }

  if ('status' in body) {
    if (!body.status) {
      errors.status = 'status must not be empty';
    } else if (!VALID_STATUSES.includes(body.status)) {
      errors.status = 'status must be one of: Applied, Assessment, Interview, Selected, Rejected';
    }
  }

  if ('jobUrl' in body && body.jobUrl !== '' && body.jobUrl != null) {
    if (typeof body.jobUrl !== 'string') {
      errors.jobUrl = 'jobUrl must be a string';
    } else if (body.jobUrl.trim().length > 2048) {
      errors.jobUrl = 'jobUrl must not exceed 2048 characters';
    } else if (!/^https?:\/\//i.test(body.jobUrl.trim())) {
      errors.jobUrl = 'jobUrl must begin with http:// or https://';
    }
  }

  if ('notes' in body && body.notes != null) {
    if (typeof body.notes !== 'string') {
      errors.notes = 'notes must be a string';
    } else if (body.notes.length > 1000) {
      errors.notes = 'notes must not exceed 1000 characters';
    }
  }

  return errors;
}

function sendValidationError(res, errors) {
  return res.status(400).json({ error: 'Validation failed', errors });
}

// Middleware exports

function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid application ID' });
  }
  next();
}

function validateCreate(req, res, next) {
  const errors = validateFields(req.body, true);
  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }
  next();
}

function validateUpdate(req, res, next) {
  const body = req.body;
  const hasRecognisedField = MUTABLE_FIELDS.some(function(f) { return f in body; });
  if (!body || typeof body !== 'object' || !hasRecognisedField) {
    return sendValidationError(res, { _body: 'No valid fields provided for update' });
  }
  const errors = validateFields(body, false);
  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }
  next();
}

function validateListQuery(req, res, next) {
  const status  = req.query.status;
  const jobType = req.query.jobType;
  const sortBy  = req.query.sortBy;
  const order   = req.query.order;
  const errors  = {};

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.status = 'status must be one of: Applied, Assessment, Interview, Selected, Rejected';
  }
  if (jobType !== undefined && !VALID_JOB_TYPES.includes(jobType)) {
    errors.jobType = 'jobType must be one of: Full-time, Part-time, Internship, Contract';
  }
  if (sortBy !== undefined && !VALID_SORT_BY.includes(sortBy)) {
    errors.sortBy = 'sortBy must be one of: applicationDate';
  }
  if (order !== undefined && !VALID_ORDERS.includes(order)) {
    errors.order = 'order must be one of: asc, desc';
  }

  if (Object.keys(errors).length > 0) {
    return sendValidationError(res, errors);
  }
  next();
}

module.exports = { validateObjectId, validateCreate, validateUpdate, validateListQuery };