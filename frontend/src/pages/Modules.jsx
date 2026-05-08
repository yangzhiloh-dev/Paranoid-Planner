// Modules Page
// Display and manage modules

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../api/api';

export const Modules = () => {
  // TODO: Create state for:
  // - modules (list)
  // - loading state
  // - error state
  // - showCreateForm (boolean)
  // - form data for creating/editing modules

  // TODO: useEffect to fetch modules on component mount

  // TODO: Create handleCreateModule function that:
  // 1. Validates form input
  // 2. Calls api.createModule(data)
  // 3. Refreshes module list
  // 4. Resets form

  // TODO: Create handleUpdateModule function for editing

  // TODO: Create handleDeleteModule function for deletion with confirmation

  // TODO: Build page with:
  // - Navbar
  // - "Create Module" button/form
  // - List of modules displayed as cards
  // - Edit and delete buttons for each module
  // - Tailwind styling
  // - Loading and error states

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        {/* TODO: Build modules page layout */}
      </div>
    </div>
  );
};
