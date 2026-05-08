// Tasks Page
// Display and manage tasks

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../api/api';

export const Tasks = () => {
  // TODO: Create state for:
  // - tasks (list)
  // - modules (for module selection in create form)
  // - loading state
  // - error state
  // - showCreateForm (boolean)
  // - form data for creating/editing tasks

  // TODO: useEffect to fetch:
  // 1. Tasks on component mount
  // 2. Modules for the dropdown

  // TODO: Create handleCreateTask function that:
  // 1. Validates form input
  // 2. Calls api.createTask(data)
  // 3. Refreshes task list
  // 4. Resets form

  // TODO: Create handleUpdateTask function for editing

  // TODO: Create handleDeleteTask function for deletion with confirmation

  // TODO: Create handleMarkComplete function that:
  // 1. Updates task status to 'completed'
  // 2. Refreshes task list

  // TODO: Build page with:
  // - Navbar
  // - "Create Task" button/form
  // - Filter options (by module, by status)
  // - List of tasks displayed as cards
  // - Edit, delete, and mark complete buttons
  // - Show task details (title, module, deadline, priority, status)
  // - Tailwind styling
  // - Loading and error states

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        {/* TODO: Build tasks page layout */}
      </div>
    </div>
  );
};
