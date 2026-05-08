// Protected Route Component
// Wraps routes that require authentication

import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = ({ children }) => {
  // TODO: Get isAuthenticated and loading from AuthContext

  // TODO: If loading, show loading spinner

  // TODO: If not authenticated, redirect to login page

  // TODO: Otherwise render children

  return children;
};
