// Schedule Page
// Display generated study schedule

import { useState, useEffect } from 'react';
import { Sidebar } from '../components/SideBar';
import { scheduleAPI } from '../api/api';
import PrimaryButton from '../components/PrimaryButton';

// Priority styling for schedule sessions
const getPriorityStyle = (priority) => {
  const value = Number(priority);
  if (value >= 5) return 'bg-red-900/30 text-red-300 border-red-500/20';
  if (value >= 3) return 'bg-amber-900/25 text-amber-300 border-amber-500/20';
  return 'bg-slate-700/40 text-slate-300 border-slate-500/20';
};

const getPriorityLabel = (priority) => {
  const value = Number(priority);
  if (value >= 5) return 'High';
  if (value >= 3) return 'Medium';
  return 'Low';
};
 
const getStatusStyle = (status) => {
  if (status === 'completed') return 'bg-emerald-800/30 text-emerald-300 border border-emerald-600/20';
  if (status === 'in_progress') return 'bg-amber-800/25 text-amber-300 border border-amber-500/20';
  return 'bg-slate-900/70 text-slate-200 border border-white/10';
};
 
const formatStatusLabel = (status) => {
  if (!status) return 'Scheduled';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
 
// Safely format a date string; falls back to a placeholder if missing/invalid.
const formatDateTime = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString();
};

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
      setError('');
      const res = await scheduleAPI.getSchedule();
      const sessions = res.data?.sessions;
      setSchedule(Array.isArray(sessions) ? sessions : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch schedule. Please check your connection and try again.');
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    if (generating) return; // Prevent multiple clicks
    setError('');
    try {
      setGenerating(true);
      await scheduleAPI.generateSchedule();
      await fetchSchedule();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate schedule. Please check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#1a0f08] text-slate-100 pb-24">
      <Sidebar />
      <div className="flex-1 px-6 py-8 w-full ml-[88px]">
        <header className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-2xl">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Study Schedule</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Stay on pace with every session.</h1>
           <p className="mt-2 text-sm text-slate-400">
            Generate study sessions from your module deadlines and keep your rhythm on track.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            This schedule is generated automatically from your tasks' deadlines and priorities. Each card below
            is one study session &mdash; check its status badge to see whether it's still scheduled, in progress, or complete.
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
            {schedule.map((session, index) => {
              const title = session?.title || session?.task_title || 'Untitled session';
              const moduleCode = session?.module_code;
              const moduleName = session?.module_name;
              const hasModuleInfo = moduleCode || moduleName;
              
              return (
              <div key={session?.id ?? index} className="glass-card p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {hasModuleInfo 
                        ? [moduleCode, moduleName].filter(Boolean).join(' - ')
                        : "No module assigned"}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {session?.priority != null && ( <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] 
                      ${getPriorityStyle(session.priority)}`}>
                      {getPriorityLabel(session.priority)}
                  </span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${getStatusStyle(session?.status)}`}>
                      {formatStatusLabel(session?.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-slate-300">
                  <p>Start: {formatDateTime(session?.scheduled_start)}</p>
                  <p>End: {formatDateTime(session?.scheduled_end)}</p>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
