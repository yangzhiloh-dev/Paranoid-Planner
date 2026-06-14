// Schedule Page
// Display generated study schedule

import { useState, useEffect } from 'react';
import { Sidebar } from '../components/SideBar';
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
    <div className="min-h-screen bg-[#1a0f08] text-slate-100 pb-24">
      <Sidebar />
      <div className="w-full px-6 py-8 ml-[88px] w-full">
        <header className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Study Schedule</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Stay on pace with every session.</h1>
          <p className="mt-2 text-sm text-slate-400">
            Generate study sessions from your module deadlines and keep your rhythm on track.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-[28px] border border-red-400/20 bg-[#581c1c]/15 p-4 text-red-200">
            {error}
          </div>
        )}

        <PrimaryButton
          type="button"
          onClick={handleGenerateSchedule}
          loading={generating}
          disabled={generating}
          className="mb-6 w-full sm:w-auto rounded-full px-6 py-3 font-semibold"
        >
          {generating ? 'Generating...' : 'Generate Schedule'}
        </PrimaryButton>

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-slate-300 shadow-glow">
            Loading schedule...
          </div>
        ) : schedule.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-slate-300 shadow-glow">
            No schedule generated yet. Click "Generate Schedule" to create one.
          </div>
        ) : (
          <div className="grid gap-6">
            {schedule.map((session, index) => (
              <div key={index} className="glass-card p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{session.title || session.task_title}</h2>
                    <p className="mt-1 text-sm text-slate-400">Module: {session.module_code} - {session.module_name}</p>
                  </div>
                  <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                    {session.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-slate-300">
                  <p>Start: {new Date(session.scheduled_start).toLocaleString()}</p>
                  <p>End: {new Date(session.scheduled_end).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
