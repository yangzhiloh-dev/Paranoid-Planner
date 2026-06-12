import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { modulesAPI, tasksAPI, scheduleAPI } from '../api/api';
import {FaTachometerAlt,FaTasks,FaCalendarAlt,FaBook,FaMoon,FaCog,FaSearch,FaBell,FaSignOutAlt} from 'react-icons/fa'; // icons for sidebar
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import IconWrap from '../components/ui/IconWrap';
import PrimaryButton from '../components/PrimaryButton';

// Helper: match a task to its module.
// This avoids repeating modules.find(...) throughout the dashboard.
const getModuleById = (modules, moduleId) =>
  modules.find((module) => module.id === moduleId);

// Helper: format dates consistently across the dashboard.
const formatDate = (dateValue) => {
  if (!dateValue) return 'No deadline';

  return new Date(dateValue).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Helper: format study session times.
const formatTime = (dateValue) => {
  if (!dateValue) return '';

  return new Date(dateValue).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Sort pending tasks by urgency.
// Earlier deadlines come first; if deadlines are equal, higher priority comes first.
const sortByDeadlineAndPriority = (taskList) =>
  [...taskList].sort((a, b) => {
    const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity;

    if (dateA !== dateB) return dateA - dateB;

    return Number(b.priority || 0) - Number(a.priority || 0);
  });

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

const TopBar = ({ user }) => (
  <div className="mb-6 flex items-center gap-4 rounded-[20px] border border-white/8 bg-white/4 px-5 py-3 backdrop-blur-xl">
    {/* Left icons */}
    <div className="flex items-center gap-3 text-slate-400">
      <FaMoon size={16} />
      <FaCog size={16} />
    </div>

    {/* Search bar */}
    <div className="flex flex-1 items-center gap-3 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-sm text-slate-500">
      <FaSearch size={13} />
      <span>Enter your search request</span>
    </div>

    {/* Right side */}
    <div className="flex items-center gap-3">
      <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-slate-300">
        <FaBell size={15} />
      </button>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/30 text-amber-200 text-sm font-semibold">
        {user?.name?.charAt(0)?.toUpperCase() || 'S'}
      </div>
    </div>
  </div>
);

// Sidebar navigation used only for the dashboard layout.
const DashboardSidebar = ({ user }) => {
  const location = useLocation();
  const navItems = [
    { path: '/dashboard', icon: FaTachometerAlt },
    { path: '/modules', icon: FaBook },
    { path: '/tasks', icon: FaTasks },
    { path: '/schedule', icon: FaCalendarAlt },
  ];

  return (
    <aside className="fixed top-4 left-4 z-40 h-[calc(100vh-2rem)] w-[72px] flex flex-col items-center py-5 rounded-[24px] border border-white/8 bg-white/4 backdrop-blur-2xl shadow-panel">
      {/* Logo mark */}
      <Link to="/dashboard" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300 mb-8">
        <span className="text-base font-bold">P</span>
      </Link>

      {/* Nav icons */}
      <nav className="flex flex-col gap-3 flex-1">
        {navItems.map(({ path, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${isActive
                ? 'bg-orange-500/80 text-white shadow-[0_8px_24px_rgba(200,80,20,0.35)]'
                : 'text-slate-400 hover:bg-white/8 hover:text-white'
                }`}
            >
              <Icon size={18} />
            </Link>
          );
        })}
      </nav>

      {/* Bottom icons */}
      <div className="flex flex-col gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/8 hover:text-white transition">
          <FaCog size={16} />
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white/8 hover:text-white transition">
          <FaSignOutAlt size={16} />
        </button>
      </div>
    </aside>
  );
};

// Reusable section wrapper with editorial styling.
// Visual notes: keep panels soft, dark, and elevated with glass blur.
const Panel = ({ title, subtitle, children }) => (
  <section className="glass-panel p-6">
    <div className="mb-6 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
    </div>

    {children}
  </section>
);

// MetricCard: premium mini cards used for the dashboard summary strip.
const MetricCard = ({ label, value, helper, progress }) => (
  <div className="glass-card p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{label}</p>
    <div className="mt-3 flex items-end justify-between gap-3">
      <p className="text-3xl font-semibold text-white">{value}</p>
      {helper && <Badge className="ml-auto" variant={progress ? 'muted' : 'high'}>{helper}</Badge>}
    </div>

    {typeof progress === 'number' && (
      <div className="mt-4">
        <ProgressBar value={progress} />
      </div>
    )}
  </div>
);

const WorkloadIntelligence = ({ tasks, modules }) => {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const pendingTasks = tasks.filter((task) => task.status !== 'completed');

  const dueSoonTasks = pendingTasks.filter((task) => {
    if (!task.deadline) return false;

    const deadline = new Date(task.deadline);
    return deadline >= now && deadline <= sevenDaysFromNow;
  });

  const highPriorityTasks = pendingTasks.filter(
    (task) => Number(task.priority) >= 5
  );

  const moduleWorkload = modules.map((module) => {
    const modulePendingTasks = pendingTasks.filter(
      (task) => task.module_id === module.id
    );

    return {
      ...module,
      pendingCount: modulePendingTasks.length,
    };
  });

  const mostDemandingModule = [...moduleWorkload].sort(
    (a, b) => b.pendingCount - a.pendingCount
  )[0];

  let workloadHealth = 'Low';
  let healthStyle = 'bg-emerald-900/25 text-emerald-300 border-emerald-500/20';

  if (dueSoonTasks.length >= 5 || highPriorityTasks.length >= 3) {
    workloadHealth = 'High';
    healthStyle = 'bg-red-900/30 text-red-300 border-red-500/20';
  } else if (dueSoonTasks.length >= 2 || highPriorityTasks.length >= 1) {
    workloadHealth = 'Moderate';
    healthStyle = 'bg-amber-900/25 text-amber-300 border-amber-500/20';
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${healthStyle}`}>
        <p className="text-sm font-semibold">Workload Health</p>
        <p className="mt-1 text-2xl font-bold">{workloadHealth}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <p className="text-sm text-slate-400">Due within 7 days</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {dueSoonTasks.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <p className="text-sm text-slate-400">High priority tasks</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {highPriorityTasks.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
        <p className="text-sm text-slate-400">Most demanding module</p>
        <p className="mt-1 font-bold text-white">
          {mostDemandingModule?.pendingCount > 0
            ? `${mostDemandingModule.module_code} — ${mostDemandingModule.pendingCount} pending`
            : 'No module pressure yet'}
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
        <p className="text-sm text-slate-400">Recommended next focus</p>
        <p className="mt-1 font-bold text-white">
          {dueSoonTasks[0]?.title ||
            highPriorityTasks[0]?.title ||
            pendingTasks[0]?.title ||
            'No urgent task right now'}
        </p>
      </div>
    </div>
  );
};


// Main focus card which uses the most urgent pending task calculated from real task data.
const TodayFocus = ({ task, modules }) => {
  if (!task) {
    return (
      <div className="glass-card p-6">
        <EmptyState title="No pending tasks." subtitle="Create a task to start building your study plan." />

        <div className="mt-4">
          <PrimaryButton type="button" variant="primary" className="px-5 py-3">
            Create task
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const module = getModuleById(modules, task.module_id);

  return (
    <div className="glass-card p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{module?.module_code || 'Module'}</p>
          <h3 className="text-3xl font-semibold text-white">{task.title}</h3>
          <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
            <span>Due {formatDate(task.deadline)}</span>
            <span>{formatTime(task.deadline)}</span>
          </div>
          {task.estimated_minutes && (
            <p className="text-sm text-slate-400">Estimated: {task.estimated_minutes} mins</p>
          )}
        </div>

        <div className="flex flex-col items-start gap-4 sm:items-end">
          <Badge variant={Number(task.priority) >= 5 ? 'high' : Number(task.priority) >= 3 ? 'warn' : 'muted'}>
            {getPriorityLabel(task.priority)}
          </Badge>
          <Link to="/tasks" className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            Open task board
          </Link>
        </div>
      </div>
    </div>
  );
};

const UpcomingDeadlines = ({ tasks, modules }) => {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-400">No upcoming deadlines yet.</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const module = getModuleById(modules, task.module_id);

        return (
          <div
            key={task.id}
            className="glass-card flex flex-col gap-3 border border-white/10 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{task.title}</p>
                <p className="mt-1 truncate text-sm text-slate-400">
                  {module?.module_code || 'Module'} · {formatDate(task.deadline)}
                </p>
              </div>

              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityStyle(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ModuleSnapshot = ({ modules, tasks }) => {
  if (modules.length === 0) {
    return <p className="text-sm text-slate-400">No modules created yet.</p>;
  }

  return (
    <div className="space-y-3">
      {modules.slice(0, 5).map((module) => {
        const moduleTasks = tasks.filter((task) => task.module_id === module.id);
        const pending = moduleTasks.filter((task) => task.status !== 'completed').length;
        const completed = moduleTasks.filter((task) => task.status === 'completed').length;

        return (
          <div
            key={module.id}
            className="glass-card flex flex-col gap-4 border border-white/10 p-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{module.module_code}</p>
                <p className="text-sm text-slate-400">{module.module_name}</p>
              </div>

              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: module.color || '#F59E0B' }}
              />
            </div>

            <p className="text-sm text-slate-400">
              {pending} pending · {completed} completed
            </p>
          </div>
        );
      })}
    </div>
  );
};

const SchedulePreview = ({ schedule }) => {
  if (schedule.length === 0) {
    return (
      <div className="glass-card border border-dashed border-white/10 p-6">
        <p className="font-semibold text-white">No schedule generated yet.</p>
        <p className="mt-2 text-sm text-slate-400">
          Generate a schedule after creating tasks with deadlines.
        </p>

        <Link
          to="/schedule"
          className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Go to schedule
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {schedule.slice(0, 5).map((session) => (
        <div
          key={session.id}
          className="glass-card border border-white/10 p-5"
        >
          <p className="font-semibold text-white">
            {session.task_title || session.title || 'Study Session'}
          </p>

          <p className="mt-2 text-sm text-slate-400">
            {formatDate(session.scheduled_start)} · {formatTime(session.scheduled_start)} - {formatTime(session.scheduled_end)}
          </p>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all dashboard data in parallel.
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [modulesRes, tasksRes, scheduleRes] = await Promise.all([
          modulesAPI.getModules(),
          tasksAPI.getTasks(),
          scheduleAPI.getSchedule(),
        ]);

        setModules(modulesRes.data.modules || []);
        setTasks(tasksRes.data.tasks || []);
        setSchedule(scheduleRes.data.sessions || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Derived values are calculated from real task data.
  // This avoids fake dashboard statistics and keeps the UI honest.
  const pendingTasks = sortByDeadlineAndPriority(
    tasks.filter((task) => task.status !== 'completed')
  );

  const completedTasks = tasks.filter((task) => task.status === 'completed');

  const completionRate =
    tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

  const todaysFocus = pendingTasks[0];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#1a0f08]">
        <DashboardSidebar user={user} />

        <main className="flex-1 px-6 py-8 ml-[88px] w-full">
          <div className="glass-panel p-8">
            <p className="text-slate-400">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#1a0f08] text-white">
      <DashboardSidebar user={user} />

      <main className="flex-1 px-6 py-8 ml-[88px] w-full">
        <header className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-2xl">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Good afternoon, {user?.name?.split(' ')[0] || 'Student'}</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white">A calmer, clearer study flow.</h1>
              <p className="max-w-2xl text-sm text-slate-400">
                See what matters today and keep your modules, tasks, and schedule aligned with your goals.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-4 backdrop-blur-xl">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Today’s focus</p>
                <p className="mt-3 text-2xl font-semibold text-white">{todaysFocus?.title || 'No urgent task yet'}</p>
              </div>
              <PrimaryButton type="button" variant="primary" className="px-5 py-3">
                Create Task
              </PrimaryButton>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-[28px] border border-red-400/20 bg-[#581c1c]/20 p-4 text-red-200">
            {error}
          </div>
        )}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Modules" value={modules.length} />
          <MetricCard label="Pending Tasks" value={pendingTasks.length} />
          <MetricCard label="Completed Tasks" value={completedTasks.length} />
          <MetricCard
            label="Completion Rate"
            value={`${completionRate}%`}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <Panel
              title="Today’s Focus"
              subtitle="Your most urgent pending task based on deadline and priority."
            >
              <TodayFocus task={todaysFocus} modules={modules} />
            </Panel>

            <Panel
              title="Upcoming Deadlines"
              subtitle="Next tasks needing your attention."
            >
              <UpcomingDeadlines tasks={pendingTasks.slice(0, 5)} modules={modules} />
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              title="Workload Intelligence"
              subtitle="A quick risk check based on deadlines and priority."
            >
              <WorkloadIntelligence tasks={tasks} modules={modules} />
            </Panel>

            <Panel
              title="Schedule Preview"
              subtitle="A preview of your generated study sessions."
            >
              <SchedulePreview schedule={schedule} />
            </Panel>
          </div>
        </section>

        <section className="mt-6">
          <Panel
            title="Module Snapshot"
            subtitle="A quick look at how tasks are distributed across your modules."
          >
            <ModuleSnapshot modules={modules} tasks={tasks} />
          </Panel>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;