// Protected Route Component
// Wraps routes that require authentication

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // TODO: Get isAuthenticated and loading from AuthContext

  // TODO: If loading, show loading spinner

  // TODO: If not authenticated, redirect to login page

  // TODO: Otherwise render children

  return children;
};
