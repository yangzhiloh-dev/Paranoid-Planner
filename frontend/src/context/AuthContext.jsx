// Authentication Context
// Manages global authentication state

import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.getMe();

        setUser(res.data.user);
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('token');

        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    setError('');

    try {
      const res = await authAPI.login(email, password);

      const newToken = res.data.token;

      localStorage.setItem('token', newToken);

      setToken(newToken);
      setUser(res.data.user);
      setIsAuthenticated(true);

      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.error || 'Login failed';

      setError(message);

      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError('');

    try {
      const res = await authAPI.register(name, email, password);

      const newToken = res.data.token;

      localStorage.setItem('token', newToken);

      setToken(newToken);
      setUser(res.data.user);
      setIsAuthenticated(true);

      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.error || 'Registration failed';

      setError(message);

      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');

    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};