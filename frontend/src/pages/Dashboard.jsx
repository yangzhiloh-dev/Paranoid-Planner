// Dashboard Page
// Main page showing overview of modules, upcoming tasks, and schedule

import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { modulesAPI, tasksAPI, scheduleAPI } from '../api/api';

export const Dashboard = () => {
  const [modules, setModules] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useContext(AuthContext);

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
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name || 'Student'}.
          </h1>
          <p className="text-gray-600 mt-1">
            Here is a quick overview of your modules, tasks, and study planning progress.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white p-6 rounded shadow">
            Loading dashboard...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-5 rounded shadow">
                <h2 className="text-gray-500 text-sm">Modules</h2>
                <p className="text-3xl font-bold">{modules.length}</p>
              </div>

              <div className="bg-white p-5 rounded shadow">
                <h2 className="text-gray-500 text-sm">Pending Tasks</h2>
                <p className="text-3xl font-bold">{upcomingTasks.length}</p>
              </div>

              <div className="bg-white p-5 rounded shadow">
                <h2 className="text-gray-500 text-sm">Scheduled Sessions</h2>
                <p className="text-3xl font-bold">{schedule.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Link
                to="/modules"
                className="bg-blue-600 text-white p-4 rounded shadow hover:bg-blue-700 text-center"
              >
                Manage Modules
              </Link>

              <Link
                to="/tasks"
                className="bg-green-600 text-white p-4 rounded shadow hover:bg-green-700 text-center"
              >
                Manage Tasks
              </Link>

              <Link
                to="/schedule"
                className="bg-purple-600 text-white p-4 rounded shadow hover:bg-purple-700 text-center"
              >
                Generate Schedule
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white p-5 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Recent Modules</h2>

                {modules.length === 0 ? (
                  <p className="text-gray-500">No modules added yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {modules.slice(0, 5).map((module) => (
                      <li key={module.id} className="border p-3 rounded">
                        <p className="font-semibold">
                          {module.module_code}
                        </p>
                        <p className="text-gray-600">
                          {module.module_name}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="bg-white p-5 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Upcoming Tasks</h2>

                {upcomingTasks.length === 0 ? (
                  <p className="text-gray-500">No pending tasks yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {upcomingTasks.map((task) => (
                      <li key={task.id} className="border p-3 rounded">
                        <p className="font-semibold">{task.title}</p>
                        <p className="text-gray-600">
                          Deadline:{' '}
                          {task.deadline
                            ? new Date(task.deadline).toLocaleDateString()
                            : 'No deadline'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Priority: {task.priority || 'N/A'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};