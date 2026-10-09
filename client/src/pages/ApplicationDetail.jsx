
import { useEffect, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  getApplication,
  deleteApplication,
} from '../services/api';

import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import useToast from '../hooks/useToast';

import './ApplicationDetail.css';

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  // Display success notifications received from other pages.
  useEffect(() => {
    const notification = location.state?.toast;

    if (notification?.message) {
      showToast(
        notification.message,
        notification.type || 'success'
      );

      navigate(
        location.pathname + location.search,
        { replace: true, state: null }
      );
    }
  }, [
    location.pathname,
    location.search,
    location.state,
    navigate,
    showToast,
  ]);

  // Load the selected application.
  useEffect(() => {
    let mounted = true;

    async function loadApplication() {
      try {
        setLoading(true);
        setError('');

        const data = await getApplication(id);

        if (mounted) {
          setApplication(data);
        }
      } catch (err) {
        if (mounted) {
          const message =
            err.message || 'Unable to load application.';

          setError(message);
          showToast(message, 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadApplication();

    return () => {
      mounted = false;
    };
  }, [id, showToast]);

  // Delete only after the user confirms the action.
  async function handleDelete() {
    try {
      setDeleting(true);

      await deleteApplication(id);

      setShowDeleteDialog(false);

      navigate('/applications', {
        state: {
          toast: {
            message: 'Application deleted successfully!',
            type: 'success',
          },
        },
      });
    } catch (err) {
      const message =
        err.message || 'Unable to delete application.';

      showToast(message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="application-detail-state">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="application-detail">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />

        <div
          className="application-detail-error"
          role="alert"
        >
          <h2>Unable to load application</h2>
          <p>{error}</p>

          <button
            type="button"
            className="detail-button detail-button--secondary"
            onClick={() => navigate('/applications')}
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="application-detail">
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />

        <div className="application-detail-error">
          <h2>Application not found</h2>

          <button
            type="button"
            className="detail-button detail-button--secondary"
            onClick={() => navigate('/applications')}
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="application-detail">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      <header className="detail-header">
        <div>
          <Link
            to="/applications"
            className="detail-back-link"
          >
            ← Back to Applications
          </Link>

          <h1>{application.jobTitle}</h1>

          <p className="detail-company">
            {application.companyName}
          </p>
        </div>

        <StatusBadge status={application.status} />
      </header>

      <section className="detail-card">
        <h2>Application Details</h2>

        <div className="detail-grid">
          <div className="detail-field">
            <span className="detail-field__label">
              Company
            </span>
            <strong>{application.companyName}</strong>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">
              Job Title
            </span>
            <strong>{application.jobTitle}</strong>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">
              Location
            </span>
            <strong>
              {application.location || 'Not specified'}
            </strong>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">
              Job Type
            </span>
            <strong>{application.jobType}</strong>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">
              Application Date
            </span>
            <strong>
              {new Date(
                application.applicationDate
              ).toLocaleDateString()}
            </strong>
          </div>

          <div className="detail-field">
            <span className="detail-field__label">
              Status
            </span>
            <StatusBadge status={application.status} />
          </div>
        </div>
      </section>

      {application.jobUrl && (
        <section className="detail-card">
          <h2>Job Link</h2>

          <a
            href={application.jobUrl}
            target="_blank"
            rel="noreferrer"
            className="job-url"
          >
            {application.jobUrl}
          </a>
        </section>
      )}

      <section className="detail-card">
        <h2>Notes</h2>

        <p className="detail-notes">
          {application.notes || 'No notes added.'}
        </p>
      </section>

      <section className="detail-card detail-card--metadata">
        <div>
          <span className="detail-field__label">
            Created
          </span>

          <span>
            {application.createdAt
              ? new Date(
                  application.createdAt
                ).toLocaleString()
              : 'Not available'}
          </span>
        </div>

        <div>
          <span className="detail-field__label">
            Last Updated
          </span>

          <span>
            {application.updatedAt
              ? new Date(
                  application.updatedAt
                ).toLocaleString()
              : 'Not available'}
          </span>
        </div>
      </section>

      <div className="detail-actions">
        <Link
          to={`/applications/${application._id}/edit`}
          className="detail-button detail-button--primary"
        >
          Edit Application
        </Link>

        <button
          type="button"
          className="detail-button detail-button--danger"
          onClick={() => setShowDeleteDialog(true)}
          disabled={deleting}
        >
          Delete Application
        </button>

        <Link
          to="/applications"
          className="detail-button detail-button--secondary"
        >
          Back to Applications
        </Link>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        message={
          `Are you sure you want to delete the application for ${application.companyName}? This action cannot be undone.`
        }
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        loading={deleting}
      />
    </div>
  );
}

export default ApplicationDetail;
