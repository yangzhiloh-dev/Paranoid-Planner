import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaBook,
  FaCalendarAlt,
  FaCog,
  FaHome,
  FaSignOutAlt,
  FaTasks,
} from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';

// Dashboard-only sidebar keeps the reference proportions without changing other pages.
export const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const items = [
    { path: '/dashboard', label: 'Dashboard', icon: FaHome },
    { path: '/modules', label: 'Modules', icon: FaBook },
    { path: '/tasks', label: 'Tasks', icon: FaTasks },
    { path: '/schedule', label: 'Schedule', icon: FaCalendarAlt },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="replica-sidebar" aria-label="Primary navigation">
      <Link
        to="/dashboard"
        className="sidebar-brand"
        aria-label="Paranoid Planner home"
      >
        P
      </Link>
      <nav>
        {items.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              to={path}
              key={path}
              className={active ? 'active' : ''}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              title={label}
            >
              <Icon aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <button
          type="button"
          disabled
          aria-label="Settings coming soon"
          title="Settings coming soon"
        >
          <FaCog aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
        >
          <FaSignOutAlt aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
