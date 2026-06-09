import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { modulesAPI, tasksAPI, scheduleAPI } from '../api/api';

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

  if (value >= 5) {
    return 'bg-red-50 text-red-700 border-red-200';
  }

  if (value >= 3) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const getPriorityLabel = (priority) => {
  const value = Number(priority);

  if (value >= 5) return 'High';
  if (value >= 3) return 'Medium';
  return 'Low';
};

// Sidebar navigation used only for the dashboard layout.
const DashboardSidebar = ({ user }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Modules', path: '/modules' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Schedule', path: '/schedule' },
  ];

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 bg-slate-950 p-5 text-white lg:block">
      <div className="mb-8 rounded-2xl bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-blue-300">
          ParanoidPlanner
        </p>
        <h1 className="mt-2 text-xl font-bold">Workload Dashboard</h1>
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-2xl bg-white/5 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 font-bold">
          {user?.name?.charAt(0)?.toUpperCase() || 'S'}
        </div>

        <div>
          <p className="font-semibold">{user?.name || 'Student'}</p>
          <p className="text-xs text-slate-400">Academic workspace</p>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-semibold">MS2 Focus</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Scheduling engine, progress tracking, points system, and schedule
          visualisation.
        </p>
      </div>
    </aside>
  );
};

// Reusable section wrapper, keeps every dashboard block visually consistent
const Panel = ({ title, subtitle, children }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>

    {children}
  </section>
);

const MetricCard = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
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
  let healthStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (dueSoonTasks.length >= 5 || highPriorityTasks.length >= 3) {
    workloadHealth = 'High';
    healthStyle = 'bg-red-50 text-red-700 border-red-200';
  } else if (dueSoonTasks.length >= 2 || highPriorityTasks.length >= 1) {
    workloadHealth = 'Moderate';
    healthStyle = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border p-4 ${healthStyle}`}>
        <p className="text-sm font-semibold">Workload Health</p>
        <p className="mt-1 text-2xl font-bold">{workloadHealth}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Due within 7 days</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">
            {dueSoonTasks.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">High priority tasks</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">
            {highPriorityTasks.length}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Most demanding module</p>
        <p className="mt-1 font-bold text-slate-950">
          {mostDemandingModule?.pendingCount > 0
            ? `${mostDemandingModule.module_code} — ${mostDemandingModule.pendingCount} pending`
            : 'No module pressure yet'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Recommended next focus</p>
        <p className="mt-1 font-bold text-slate-950">
          {dueSoonTasks[0]?.title ||
            highPriorityTasks[0]?.title ||
            pendingTasks[0]?.title ||
            'No urgent task right now'}
        </p>
      </div>
    </div>
  );
};

// Main focus card.
// It uses the most urgent pending task calculated from real task data.
const TodayFocus = ({ task, modules }) => {
  if (!task) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <p className="font-semibold text-slate-800">No pending tasks.</p>
        <p className="mt-1 text-sm text-slate-500">
          Create a task to start building your study plan.
        </p>

        <Link
          to="/tasks"
          className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Create task
        </Link>
      </div>
    );
  }

  const module = getModuleById(modules, task.module_id);

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {module?.module_code || 'Module'}
          </p>

          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            {task.title}
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            Due {formatDate(task.deadline)} {formatTime(task.deadline)}
          </p>

          {task.estimated_minutes && (
            <p className="mt-1 text-sm text-slate-500">
              Estimated duration: {task.estimated_minutes} mins
            </p>
          )}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-sm font-semibold ${getPriorityStyle(
            task.priority
          )}`}
        >
          {getPriorityLabel(task.priority)}
        </span>
      </div>

      <Link
        to="/tasks"
        className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Open task board
      </Link>
    </div>
  );
};

const UpcomingDeadlines = ({ tasks, modules }) => {
  if (tasks.length === 0) {
    return <p className="text-sm text-slate-500">No upcoming deadlines yet.</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const module = getModuleById(modules, task.module_id);

        return (
          <div
            key={task.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-semibold text-slate-950">{task.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {module?.module_code || 'Module'} · {formatDate(task.deadline)}
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityStyle(
                task.priority
              )}`}
            >
              {getPriorityLabel(task.priority)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ModuleSnapshot = ({ modules, tasks }) => {
  if (modules.length === 0) {
    return <p className="text-sm text-slate-500">No modules created yet.</p>;
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
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-950">{module.module_code}</p>
                <p className="text-sm text-slate-500">{module.module_name}</p>
              </div>

              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: module.color || '#2563eb' }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-600">
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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <p className="font-semibold text-slate-800">No schedule generated yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Generate a schedule after creating tasks with deadlines.
        </p>

        <Link
          to="/schedule"
          className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
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
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <p className="font-semibold text-slate-950">
            {session.task_title || session.title || 'Study Session'}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formatDate(session.scheduled_start)} ·{' '}
            {formatTime(session.scheduled_start)} -{' '}
            {formatTime(session.scheduled_end)}
          </p>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const { user } = useAuth();

  const [modules, setModules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all dashboard data in parallel.
  // This makes the dashboard faster than loading modules, tasks, and schedules one by one.
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
      <div className="flex min-h-screen bg-slate-100">
        <DashboardSidebar user={user} />

        <main className="flex-1 px-6 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <DashboardSidebar user={user} />

      <main className="flex-1 px-6 py-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              ParanoidPlanner
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Nothing falls through the cracks
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Monitor deadlines, track progress, and stay ahead of your workload
            </p>
          </div>

          <Link
            to="/tasks"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Task
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
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
            helper="Calculated from your tasks"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Panel
              title="Today’s Focus"
              subtitle="Your most urgent pending task based on deadline and priority."
            >
              <TodayFocus task={todaysFocus} modules={modules} />
            </Panel>

            <Panel
              title="Upcoming Deadlines"
              subtitle="The next five tasks that need your attention."
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
              title="Quick Actions"
              subtitle="Common actions for planning your workload."
            >
              <div className="grid gap-3">
                <Link
                  to="/modules"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Add or manage modules
                </Link>

                <Link
                  to="/tasks"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Create a task
                </Link>

                <Link
                  to="/schedule"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Generate schedule
                </Link>
              </div>
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