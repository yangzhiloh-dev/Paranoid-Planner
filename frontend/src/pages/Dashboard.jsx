// Dashboard Page
// Main page showing overview of modules, upcoming tasks, and schedule

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import api from '../api/api';

export const Dashboard = () => {
  // TODO: Create state for:
  // - modules (list)
  // - upcomingTasks (list)
  // - loading state
  // - error state

  // TODO: Get user from AuthContext

  // TODO: useEffect to fetch:
  // 1. List of modules
  // 2. List of tasks (filter for upcoming/pending)
  // 3. Current schedule

  // TODO: Build dashboard showing:
  // - Welcome message with user name
  // - Quick stats (number of modules, pending tasks)
  // - List of recent modules
  // - List of upcoming tasks
  // - Quick action buttons (create module, create task, generate schedule)
  // - Navigation to other pages
  // - Tailwind styling

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        {/* TODO: Build dashboard layout */}
      </div>
    </div>
  );
};
