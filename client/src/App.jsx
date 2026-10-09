import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import ApplicationList from './pages/ApplicationList';
import AddApplication from './pages/AddApplication';
import ApplicationDetail from './pages/ApplicationDetail';
import EditApplication from './pages/EditApplication';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <NavLink to="/" className="app-brand">
            JobTrack
          </NavLink>

          <nav className="app-nav" aria-label="Main navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? 'app-nav__link active' : 'app-nav__link'
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/applications"
              className={({ isActive }) =>
                isActive || window.location.pathname.startsWith('/applications')
                  ? 'app-nav__link active'
                  : 'app-nav__link'
              }
            >
              Applications
            </NavLink>

            <NavLink to="/applications/new" className="app-nav__add">
              + Add Application
            </NavLink>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/applications" element={<ApplicationList />} />
            <Route path="/applications/new" element={<AddApplication />} />
            <Route
              path="/applications/:id/edit"
              element={<EditApplication />}
            />
            <Route
              path="/applications/:id"
              element={<ApplicationDetail />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;