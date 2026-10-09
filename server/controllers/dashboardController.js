'use strict';

const Application = require('../models/Application');

// All five valid statuses - must appear in byStatus even when count is zero.
const ALL_STATUSES = ['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'];

// getDashboardStats
// GET /api/dashboard/stats
// Requirements: 7.1, 7.2, 7.3
async function getDashboardStats(req, res, next) {
  try {
    // Run three queries in parallel to minimise round-trips:
    //   1. Total document count
    //   2. Per-status counts via aggregation
    //   3. Five most recently created applications
    const [total, statusCounts, recentApplications] = await Promise.all([
      Application.countDocuments(),

      Application.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      Application.find()
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Build byStatus with all five keys present, defaulting to 0.
    const byStatus = {};
    ALL_STATUSES.forEach(function (s) { byStatus[s] = 0; });
    statusCounts.forEach(function (row) {
      if (Object.prototype.hasOwnProperty.call(byStatus, row._id)) {
        byStatus[row._id] = row.count;
      }
    });

    return res.status(200).json({ total, byStatus, recentApplications });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats };
