// Dashboard Page
// Main page showing overview of modules, upcoming tasks, and schedule

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { modulesAPI, tasksAPI, scheduleAPI } from '../api/api';

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className={`text-4xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl ${icon} flex items-center justify-center`}>
        <span className="text-2xl">📚</span>
      </div>
    </div>
  </div>
);

const ActionButton = ({ to, label, icon }) => (
  <Link
    to={to}
    className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200"
  >
    <div className="text-3xl mb-3">{icon}</div>
    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
      {label}
    </p>
  </Link>
);

const ModuleCard = ({ module }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          {module.module_code}
        </p>
        <p className="font-semibold text-gray-900 mt-1">
          {module.module_name}
        </p>
      </div>
      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
    </div>
  </div>
);

const TaskCard = ({ task }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
        {task.priority && (
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-2 ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">
        {task.deadline
          ? `Due: ${new Date(task.deadline).toLocaleDateString()}`
          : 'No deadline'}
      </p>
    </div>
  );
};

export const Dashboard = () => {
  const [modules, setModules] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();

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

        const moduleData = modulesRes.data;
        const taskData = tasksRes.data;
        const scheduleData = scheduleRes.data;

        const pendingTasks = taskData
          .filter((task) => task.status !== 'completed')
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 5);

        setModules(moduleData);
        setUpcomingTasks(pendingTasks);
        setSchedule(scheduleData);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="text-lg text-gray-600">
            Here's your study progress at a glance
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <StatCard
                icon="bg-blue-100"
                label="Modules"
                value={modules.length}
                color="text-blue-600"
              />
              <StatCard
                icon="bg-amber-100"
                label="Pending Tasks"
                value={upcomingTasks.length}
                color="text-amber-600"
              />
              <StatCard
                icon="bg-purple-100"
                label="Study Sessions"
                value={schedule.length}
                color="text-purple-600"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <ActionButton
                to="/modules"
                label="Manage Modules"
                icon="📚"
              />
              <ActionButton
                to="/tasks"
                label="Manage Tasks"
                icon="✓"
              />
              <ActionButton
                to="/schedule"
                label="Generate Schedule"
                icon="📅"
              />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Modules */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Modules
                  </h2>
                  {modules.length > 0 && (
                    <Link
                      to="/modules"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View all →
                    </Link>
                  )}
                </div>

                {modules.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-4xl mb-3">📚</div>
                    <p className="font-medium text-gray-900 mb-1">No modules yet</p>
                    <p className="text-gray-600 text-sm mb-4">
                      Create your first module to get started
                    </p>
                    <Link
                      to="/modules"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Add module
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modules.slice(0, 5).map((module) => (
                      <ModuleCard key={module.id} module={module} />
                    ))}
                  </div>
                )}
              </section>

              {/* Upcoming Tasks */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Upcoming Tasks
                  </h2>
                  {upcomingTasks.length > 0 && (
                    <Link
                      to="/tasks"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      View all →
                    </Link>
                  )}
                </div>

                {upcomingTasks.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                    <div className="text-4xl mb-3">✓</div>
                    <p className="font-medium text-gray-900 mb-1">All caught up!</p>
                    <p className="text-gray-600 text-sm mb-4">
                      You have no pending tasks
                    </p>
                    <Link
                      to="/tasks"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Add task
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
};