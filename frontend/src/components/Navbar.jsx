// Navbar Component
// Navigation bar with logout button

import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const Navbar = () => {
  // TODO: Get user and logout function from AuthContext
  // TODO: Create navigate for programmatic routing

  // TODO: Create handleLogout function that:
  // 1. Calls logout()
  // 2. Navigates to login page

  // TODO: Build navbar with:
  // - Logo/title linking to dashboard
  // - Links to modules, tasks, schedule pages
  // - User name display
  // - Logout button
  // - Responsive design with Tailwind

  return (
    <nav className="bg-blue-600 text-white p-4">
      {/* TODO: Build navbar structure */}
    </nav>
  );
};
