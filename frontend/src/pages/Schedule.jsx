// Schedule Page
// Display generated study schedule

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../api/api';

export const Schedule = () => {
  // TODO: Create state for:
  // - schedule (list of study sessions)
  // - loading state
  // - error state

  // TODO: useEffect to fetch schedule on component mount

  // TODO: Create handleGenerateSchedule function that:
  // 1. Calls api.generateSchedule()
  // 2. Refreshes the displayed schedule
  // 3. Shows success message

  // TODO: Build page with:
  // - Navbar
  // - "Generate Schedule" button
  // - Display schedule as:
  //   - Timeline view grouped by date, or
  //   - List view with study sessions
  // - Show for each session: task title, module, scheduled time, duration
  // - Last generated time information
  // - Tailwind styling
  // - Loading and error states

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        {/* TODO: Build schedule page layout */}
      </div>
    </div>
  );
};
