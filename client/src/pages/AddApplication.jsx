import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createApplication } from '../services/api';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import './AddApplication.css';

const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Contract',
];

const STATUSES = [
  'Applied',
  'Assessment',
  'Interview',
  'Selected',
  'Rejected',
];

function AddApplication() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [formData, setFormData] = useState({
    companyName: '',
    jobTitle: '',
    location: '',
    jobType: 'Full-time',
    applicationDate: '',
    status: 'Applied',
    jobUrl: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: '',
    }));

    setSubmitError('');
  }

  function validateForm() {
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required.';
    }

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required.';
    }

    if (!formData.jobType) {
      newErrors.jobType = 'Job type is required.';
    }

    if (!formData.applicationDate) {
      newErrors.applicationDate =
        'Application date is required.';
    }

    if (
      formData.jobUrl.trim() &&
      !/^https?:\/\//i.test(formData.jobUrl.trim())
    ) {
      newErrors.jobUrl =
        'Job URL must begin with http:// or https://';
    }

    if (formData.notes.length > 1000) {
      newErrors.notes =
        'Notes cannot exceed 1000 characters.';
    }

    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSaving(true);
      setSubmitError('');

      const payload = {
        companyName: formData.companyName.trim(),
        jobTitle: formData.jobTitle.trim(),
        location: formData.location.trim(),
        jobType: formData.jobType,
        applicationDate: formData.applicationDate,
        status: formData.status,
        jobUrl: formData.jobUrl.trim(),
        notes: formData.notes.trim(),
      };

      await createApplication(payload);

      navigate('/applications', {
        state: {
          toast: {
            message: 'Application created successfully!',
            type: 'success',
          },
        },
      });
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      }

      const message =
        err.message || 'Unable to create application.';

      setSubmitError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="add-application-page">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      <header className="form-page-header">
        <div>
          <h1>Add Application</h1>
          <p>
            Add a new job application to your JobTrack.
          </p>
        </div>

        <Link
          to="/applications"
          className="form-page-header__back"
        >
          ← Back to Applications
        </Link>
      </header>

      <form
        className="application-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {submitError && (
          <div className="form-error" role="alert">
            {submitError}
          </div>
        )}

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="companyName">Company Name *</label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              maxLength="200"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. Google"
              aria-invalid={Boolean(errors.companyName)}
            />
            {errors.companyName && (
              <span className="field-error">
                {errors.companyName}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="jobTitle">Job Title *</label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              maxLength="200"
              value={formData.jobTitle}
              onChange={handleChange}
              placeholder="e.g. Software Engineer"
              aria-invalid={Boolean(errors.jobTitle)}
            />
            {errors.jobTitle && (
              <span className="field-error">
                {errors.jobTitle}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Hyderabad"
            />
          </div>

          <div className="form-field">
            <label htmlFor="jobType">Job Type *</label>
            <select
              id="jobType"
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              aria-invalid={Boolean(errors.jobType)}
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.jobType && (
              <span className="field-error">
                {errors.jobType}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="applicationDate">
              Application Date *
            </label>
            <input
              id="applicationDate"
              name="applicationDate"
              type="date"
              value={formData.applicationDate}
              onChange={handleChange}
              aria-invalid={Boolean(errors.applicationDate)}
            />
            {errors.applicationDate && (
              <span className="field-error">
                {errors.applicationDate}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="jobUrl">Job URL</label>
            <input
              id="jobUrl"
              name="jobUrl"
              type="url"
              maxLength="2048"
              value={formData.jobUrl}
              onChange={handleChange}
              placeholder="https://example.com/job"
              aria-invalid={Boolean(errors.jobUrl)}
            />
            {errors.jobUrl && (
              <span className="field-error">
                {errors.jobUrl}
              </span>
            )}
          </div>

          <div className="form-field form-field--full">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows="5"
              maxLength="1000"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about this application..."
              aria-invalid={Boolean(errors.notes)}
            />

            <div className="character-count">
              {formData.notes.length}/1000
            </div>

            {errors.notes && (
              <span className="field-error">
                {errors.notes}
              </span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <Link
            to="/applications"
            className="form-button form-button--secondary"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="form-button form-button--primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Application'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddApplication;