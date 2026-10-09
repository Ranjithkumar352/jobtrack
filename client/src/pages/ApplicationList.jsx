import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getApplications } from '../services/api';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import useToast from '../hooks/useToast';
import './ApplicationList.css';

const STATUSES = [
  'Applied',
  'Assessment',
  'Interview',
  'Selected',
  'Rejected',
];

const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Contract',
];

function ApplicationList() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [jobType, setJobType] = useState('');
  const [order, setOrder] = useState('desc');

  // Display a message passed from another page, such as Add Application.
  useEffect(() => {
    const notification = location.state?.toast;

    if (notification?.message) {
      showToast(
        notification.message,
        notification.type || 'success'
      );

      // Clear navigation state so refreshing doesn't repeat the toast.
      navigate(location.pathname + location.search, {
        replace: true,
        state: null,
      });
    }
  }, [
    location.state,
    location.pathname,
    location.search,
    navigate,
    showToast,
  ]);

  async function loadApplications() {
    try {
      setLoading(true);
      setError('');

      const params = {
        search,
        status,
        jobType,
        sortBy: 'applicationDate',
        order,
      };

      const data = await getApplications(params);
      setApplications(data);
    } catch (err) {
      const message =
        err.message || 'Unable to load applications.';

      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, [search, status, jobType, order]);

  return (
    <div className="applications-page">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />

      <header className="applications-header">
        <div>
          <h1>Job Applications</h1>
          <p>View and manage all your job applications.</p>
        </div>

        <Link
          to="/applications/new"
          className="applications-header__button"
        >
          + Add Application
        </Link>
      </header>

      <section className="filters">
        <div className="filter-group filter-group--search">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="search"
            placeholder="Search company or job title..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="jobType">Job Type</label>
          <select
            id="jobType"
            value={jobType}
            onChange={(event) => setJobType(event.target.value)}
          >
            <option value="">All job types</option>
            {JOB_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="order">Sort Date</label>
          <select
            id="order"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
      </section>

      {loading && (
        <div className="applications-state">
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <div className="applications-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="applications-empty">
          <h2>No applications found</h2>
          <p>
            Start tracking your job applications by adding
            your first application.
          </p>

          <Link
            to="/applications/new"
            className="applications-empty__button"
          >
            Add Application
          </Link>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <section className="applications-list">
          {applications.map((application) => (
            <article
              className="application-card"
              key={application._id}
            >
              <div className="application-card__main">
                <div>
                  <h2>{application.jobTitle}</h2>
                  <p className="application-card__company">
                    {application.companyName}
                  </p>
                </div>

                <StatusBadge status={application.status} />
              </div>

              <div className="application-card__details">
                {application.location && (
                  <span>📍 {application.location}</span>
                )}

                <span>💼 {application.jobType}</span>

                <span>
                  📅{' '}
                  {new Date(
                    application.applicationDate
                  ).toLocaleDateString()}
                </span>
              </div>

              <div className="application-card__actions">
                <Link
                  to={`/applications/${application._id}`}
                  className="application-action application-action--view"
                >
                  View
                </Link>

                <Link
                  to={`/applications/${application._id}/edit`}
                  className="application-action application-action--edit"
                >
                  Edit
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default ApplicationList;