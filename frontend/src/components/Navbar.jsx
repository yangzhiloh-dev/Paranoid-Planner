// Navbar Component
// Navigation bar with logout button

import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
        
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-2xl font-bold hover:text-gray-200"
          >
            ParanoidPlanner
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4 md:mt-0">
          
          <div className="flex gap-4">
            <Link
              to="/dashboard"
              className="hover:text-gray-200"
            >
              Dashboard
            </Link>

            <Link
              to="/modules"
              className="hover:text-gray-200"
            >
              Modules
            </Link>

            <Link
              to="/tasks"
              className="hover:text-gray-200"
            >
              Tasks
            </Link>

            <Link
              to="/schedule"
              className="hover:text-gray-200"
            >
              Schedule
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-100">
              {user?.name ? `Hi, ${user.name}` : 'User'}
            </span>

            <button
              onClick={handleLogout}
              className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};