import { useEffect, useState } from 'react';
import { getDashboardStats } from '../services/api';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import './Dashboard.css';

const STATUSES = [
  'Applied',
  'Assessment',
  'Interview',
  'Selected',
  'Rejected',
];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const data = await getDashboardStats();

        if (mounted) {
          setStats(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.message || 'Unable to load dashboard data.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-error" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <div className="dashboard-empty">
          No dashboard data available.
        </div>
      </div>
    );
  }

  const byStatus = stats.byStatus || {};

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>JobTrack Dashboard</h1>
          <p>Track and manage your job applications.</p>
        </div>
      </header>

      <section className="stats-grid" aria-label="Application statistics">
        <div className="stat-card stat-card--total">
          <span className="stat-card__label">Total Applications</span>
          <strong className="stat-card__value">
            {stats.total ?? 0}
          </strong>
        </div>

        {STATUSES.map((status) => (
          <div className="stat-card" key={status}>
            <span className="stat-card__label">{status}</span>
            <strong className="stat-card__value">
              {byStatus[status] ?? 0}
            </strong>
          </div>
        ))}
      </section>

      <section className="recent-section">
        <div className="section-header">
          <h2>Recent Applications</h2>
        </div>

        {!stats.recentApplications ||
        stats.recentApplications.length === 0 ? (
          <div className="dashboard-empty">
            No applications yet.
          </div>
        ) : (
          <div className="recent-list">
            {stats.recentApplications.map((application) => (
              <article
                className="recent-card"
                key={application._id}
              >
                <div className="recent-card__main">
                  <h3>{application.jobTitle}</h3>
                  <p>{application.companyName}</p>

                  {application.location && (
                    <span>{application.location}</span>
                  )}
                </div>

                <div className="recent-card__meta">
                  <StatusBadge status={application.status} />

                  <time dateTime={application.applicationDate}>
                    {new Date(
                      application.applicationDate
                    ).toLocaleDateString()}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;