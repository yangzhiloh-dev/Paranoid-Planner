// Sidebar Component used in Dashboard, Modules, Tasks, Schedule pages. Provides navigation and logout functionality.

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { FaTachometerAlt, FaTasks, FaCalendarAlt, FaBook, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const navItems = [
    { path: '/dashboard', icon: FaTachometerAlt },
    { path: '/modules', icon: FaBook },
    { path: '/tasks', icon: FaTasks },
    { path: '/schedule', icon: FaCalendarAlt },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed top-4 left-4 z-40 h-[calc(100vh-2rem)] w-[72px] flex flex-col items-center py-5 rounded-[24px] border border-white/8 bg-white/4 backdrop-blur-2xl shadow-panel">
      {/* Logo mark */}
      <Link to="/dashboard" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 mb-8">
        <span className="text-base font-bold">P</span>
      </Link>

      {/* Nav icons */}
      <nav className="flex flex-col gap-3 flex-1">
        {navItems.map(({ path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isActive
                ? 'bg-orange-500/80 text-white shadow-[0_8px_24px_rgba(200,80,20,0.35)]'
                : 'text-slate-400 hover:bg-white/8 hover:text-white'
                }`}
            >
              <Icon size={18} />
            </Link>
          );
        })}
      </nav>

      {/* Bottom icons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/8 hover:text-white transition"
        >
          <FaCog size={16} />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/8 hover:text-white transition"
        >
          <FaSignOutAlt size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;