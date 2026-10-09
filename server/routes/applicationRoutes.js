'use strict';

const express = require('express');
const router  = express.Router();

const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');

const {
  validateObjectId,
  validateCreate,
  validateUpdate,
  validateListQuery,
} = require('../middleware/validate');

// GET /api/applications
router.get('/', validateListQuery, getApplications);

// GET /api/applications/:id
router.get('/:id', validateObjectId, getApplicationById);

// POST /api/applications
router.post('/', validateCreate, createApplication);

// PUT /api/applications/:id
router.put('/:id', validateObjectId, validateUpdate, updateApplication);

// DELETE /api/applications/:id
router.delete('/:id', validateObjectId, deleteApplication);

module.exports = router;
