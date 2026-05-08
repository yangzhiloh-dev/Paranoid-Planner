// Register Page
// User registration form

import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const Register = () => {
  // TODO: Create state for:
  // - name
  // - email
  // - password
  // - confirmPassword
  // - error message
  // - loading state

  // TODO: Get register function from AuthContext
  // TODO: Get navigate for routing

  // TODO: Create handleSubmit function that:
  // 1. Validates inputs (password matching, email format)
  // 2. Calls register(email, name, password)
  // 3. On success, navigate to dashboard
  // 4. On error, display error message

  // TODO: Build form with:
  // - Name input field
  // - Email input field
  // - Password input field
  // - Confirm password input field
  // - Submit button
  // - Link to login page
  // - Error message display
  // - Tailwind styling

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* TODO: Build registration form */}
    </div>
  );
};
