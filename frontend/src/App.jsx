// Main App Component
// Router configuration and layout

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Modules } from './pages/Modules';
import { Tasks } from './pages/Tasks';
import { Schedule } from './pages/Schedule';
import './index.css';

function App() {
  // TODO: Set up React Router with the following routes:
  // - / -> Dashboard (protected)
  // - /login -> Login (public)
  // - /register -> Register (public)
  // - /modules -> Modules (protected)
  // - /tasks -> Tasks (protected)
  // - /schedule -> Schedule (protected)
  //
  // Routes should be wrapped in:
  // 1. Router
  // 2. AuthProvider
  // 3. Use ProtectedRoute for protected routes

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* TODO: Add routes here */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
