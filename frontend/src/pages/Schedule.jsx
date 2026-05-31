// Schedule Page
// Display generated study schedule

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { scheduleAPI } from '../api/api';
import PrimaryButton from '../components/PrimaryButton';

export const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await scheduleAPI.getSchedule();
      setSchedule(res.data.sessions || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    setError('');
    try {
      setGenerating(true);
      await scheduleAPI.generateSchedule();
      fetchSchedule();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Study Schedule</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <PrimaryButton
          type="button"
          onClick={handleGenerateSchedule}
          loading={generating}
          disabled={generating}
          className="w-auto px-4 py-2 rounded mb-4"
        >
          {generating ? 'Generating...' : 'Generate Schedule'}
        </PrimaryButton>

        {loading ? (
          <p>Loading schedule...</p>
        ) : schedule.length === 0 ? (
          <p className="text-gray-600">No schedule generated yet. Click "Generate Schedule" to create one.</p>
        ) : (
          <div className="space-y-4">
            {schedule.map((session, index) => (
              <div key={index} className="bg-white p-4 rounded shadow">
                <h2 className="text-xl font-bold">{session.title || session.task_title}</h2>
                <p className="text-gray-600">Module: {session.module_code} - {session.module_name}</p>
                <p className="text-gray-600">Start: {new Date(session.scheduled_start).toLocaleString()}</p>
                <p className="text-gray-600">End: {new Date(session.scheduled_end).toLocaleString()}</p>
                <p className="text-gray-600">Status: {session.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
