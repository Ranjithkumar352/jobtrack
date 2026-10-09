const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    location: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    jobType: {
      type: String,
      required: true,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    },
    applicationDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected'],
      default: 'Applied',
    },
    jobUrl: {
      type: String,
      required: false,
      trim: true,
      default: '',
      maxlength: 2048,
      validate: {
        validator: function (value) {
          return value === '' || /^https?:\/\//.test(value);
        },
        message: 'jobUrl must begin with http:// or https://',
      },
    },
    notes: {
      type: String,
      required: false,
      trim: true,
      default: '',
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ status: 1, applicationDate: -1 });

module.exports = mongoose.model('Application', applicationSchema);
