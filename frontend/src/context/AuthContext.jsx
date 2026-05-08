// Authentication Context
// Manages global authentication state

import { createContext, useState, useEffect } from 'react';
import api from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // TODO: Create state for:
  // - user (current user object)
  // - token (JWT token)
  // - isAuthenticated (boolean)
  // - loading (boolean for initial load)
  // - error (error message)

  // TODO: On component mount:
  // 1. Check if token exists in localStorage
  // 2. If yes, call api.getMe() to verify and load user
  // 3. Set loading to false when done

  // TODO: Create login function that:
  // 1. Calls api.login(email, password)
  // 2. Saves token to localStorage
  // 3. Sets user state
  // 4. Sets isAuthenticated to true

  // TODO: Create register function that:
  // 1. Calls api.register(email, name, password)
  // 2. Automatically logs in the user
  // 3. Sets user state and token

  // TODO: Create logout function that:
  // 1. Clears localStorage token
  // 2. Clears user state
  // 3. Sets isAuthenticated to false

  return (
    <AuthContext.Provider value={{
      // TODO: Export all auth state and functions
    }}>
      {children}
    </AuthContext.Provider>
  );
};
