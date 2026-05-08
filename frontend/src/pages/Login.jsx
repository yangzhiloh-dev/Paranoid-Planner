// Login Page
// User login form

import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const Login = () => {
  // TODO: Create state for:
  // - email
  // - password
  // - error message
  // - loading state

  // TODO: Get login function from AuthContext
  // TODO: Get navigate for routing

  // TODO: Create handleSubmit function that:
  // 1. Validates inputs
  // 2. Calls login(email, password)
  // 3. On success, navigate to dashboard
  // 4. On error, display error message

  // TODO: Build form with:
  // - Email input field
  // - Password input field
  // - Submit button
  // - Link to register page
  // - Error message display
  // - Tailwind styling

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* TODO: Build login form */}
    </div>
  );
};
