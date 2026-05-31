// Dashboard Page - Modern Study OS Interface
// Highly engaging, gamified productivity dashboard

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { modulesAPI, tasksAPI, scheduleAPI } from '../api/api';
import PrimaryButton from '../components/PrimaryButton';

// ============ MODERN STAT CARD ============
const ModernStatCard = ({ icon, label, value, color, trend, unitLabel }) => (
  <div className={`group relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:shadow-lg hover:scale-105 ${color}`}>
    {/* Gradient background */}
    <div className="absolute inset-0 opacity-5"></div>
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-black/70 mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-4xl font-bold text-black">{value}</p>
            {unitLabel && <p className="text-sm text-black/60">{unitLabel}</p>}
          </div>
        </div>
        <div className="text-3xl opacity-80 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-sm text-black/70">
          <span>↑</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  </div>
);

// ============ TODAY'S FOCUS CARD ============
const TodaysFocusCard = ({ task, module }) => {
  if (!task) return null;

  const getPriorityIcon = (priority) => {
    const p = Number(priority);
    if (p >= 4) return '🔥';
    if (p >= 3) return '⚡';
    return '✨';
  };

  const daysUntilDue = task.deadline 
    ? Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-black overflow-hidden relative group hover:shadow-xl transition-all duration-300 border border-blue-400/20">
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-black-100 text-sm font-semibold mb-1">TODAY'S PRIMARY FOCUS</p>
            <h3 className="text-2xl font-bold leading-tight">{task.title}</h3>
          </div>
          <span className="text-4xl">{getPriorityIcon(task.priority)}</span>
        </div>
        
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/20">
          {module && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: module.color }}></span>
              <span className="text-sm">{module.module_code}</span>
            </div>
          )}
          {daysUntilDue !== null && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <span>📅</span>
              <span className="text-sm">{daysUntilDue === 0 ? 'Due Today' : daysUntilDue === 1 ? 'Due Tomorrow' : `Due in ${daysUntilDue}d`}</span>
            </div>
          )}
          {task.estimated_minutes && (
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
              <span>⏱️</span>
              <span className="text-sm">{task.estimated_minutes} min</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ WEEKLY PROGRESS WIDGET ============
const WeeklyProgressWidget = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const studyData = [4, 5, 3, 6, 5, 2, 0]; // Example data (hours studied)
  const maxHours = 6;

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Study Progress</h3>
      
      <div className="flex items-end justify-between gap-2 h-32">
        {days.map((day, idx) => {
          const hours = studyData[idx];
          const percentage = (hours / maxHours) * 100;
          const isToday = new Date().toLocaleString('en-US', { weekday: 'short' }).slice(0, 3) === day;
          
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gray-200 rounded-lg overflow-hidden h-24 flex items-end hover:bg-gray-300 transition-colors">
                <div
                  className={`w-full transition-all duration-300 rounded-sm ${
                    isToday 
                      ? 'bg-gradient-to-t from-blue-600 to-blue-400' 
                      : hours > 0 
                      ? 'bg-gradient-to-t from-blue-400 to-blue-300'
                      : 'bg-gray-300'
                  }`}
                  style={{ height: `${percentage || 5}%` }}
                ></div>
              </div>
              <p className={`text-xs font-semibold ${isToday ? 'text-black-600' : 'text-gray-600'}`}>{day}</p>
              <p className="text-xs text-gray-500">{hours}h</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ MODULE SHOWCASE ============
const ModuleShowcase = ({ modules }) => {
  if (modules.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-900">Your Modules</h3>
        <Link to="/modules" className="text-sm text-black-600 hover:text-black-700 font-medium flex items-center gap-1">
          View all <span>→</span>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        {modules.slice(0, 6).map((module) => (
          <div key={module.id} className="group relative">
            <div
              className="w-12 h-12 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center font-bold text-black text-sm"
              style={{ backgroundColor: module.color || '#3B82F6' }}
              title={module.module_name}
            >
              {module.module_code.substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-balck text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              {module.module_code}
            </div>
          </div>
        ))}
        {modules.length > 6 && (
          <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-sm">
            +{modules.length - 6}
          </div>
        )}
      </div>
    </div>
  );
};

// ============ TASK TIMELINE CARD ============
const TaskTimelineCard = ({ task, index }) => {
  const getPriorityColor = (priority) => {
    const p = Number(priority);
    if (p >= 4) return 'from-red-500 to-red-600';
    if (p >= 3) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const daysUntilDue = task.deadline 
    ? Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const isOverdue = daysUntilDue < 0;
  const isToday = daysUntilDue === 0;

  return (
    <div className="group relative flex gap-4 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${getPriorityColor(task.priority)} shadow-lg`}></div>
        {index !== 4 && <div className="w-0.5 h-12 bg-gradient-to-b from-gray-300 to-transparent mt-2"></div>}
      </div>

      {/* Task content */}
      <div className="flex-1 pt-1">
        <div className={`rounded-xl p-4 transition-all duration-300 border hover:shadow-md ${
          isOverdue 
            ? 'bg-red-50 border-red-200' 
            : isToday 
            ? 'bg-blue-50 border-blue-200' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{task.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{task.description?.substring(0, 60)}{task.description?.length > 60 ? '...' : ''}</p>
            </div>
            {isToday && <span className="px-2 py-1 bg-blue-600 text-black text-xs font-bold rounded-lg">TODAY</span>}
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap text-xs text-gray-600">
            {task.deadline && (
              <span className={`${isOverdue ? 'text-red-600 font-bold' : isToday ? 'text-black-600' : ''}`}>
                📅 {isOverdue ? 'Overdue' : isToday ? 'Due today' : `Due ${new Date(task.deadline).toLocaleDateString()}`}
              </span>
            )}
            {task.estimated_minutes && (
              <span>⏱️ {task.estimated_minutes} min</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ EMPTY STATE CARDS ============
const EmptyStateCard = ({ icon, title, description, buttonText, buttonLink }) => (
  <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-12 text-center hover:shadow-lg transition-all duration-300">
    <div className="text-5xl mb-4">{icon}</div>
    <p className="font-semibold text-gray-900 mb-1">{title}</p>
    <p className="text-gray-600 text-sm mb-6">{description}</p>
    <Link to={buttonLink} className="inline-block">
      <PrimaryButton
        type="button"
        className="px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 text-sm"
        style={{ width: 'auto', backgroundColor: '#2563eb', color: '#000000' }}
      >
        {buttonText}
      </PrimaryButton>
    </Link>
  </div>
);

export const Dashboard = () => {
  const [modules, setModules] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good Morning';
    if (hour < 18) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  // Calculate productivity points (gamified metric)
  const getProductivityPoints = () => {
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const scheduledSessions = schedule.length;
    return completedTasks * 10 + scheduledSessions * 5;
  };

  // Calculate study hours (sum of estimated minutes from completed tasks)
  const getStudyHours = () => {
    const completed = allTasks.filter(t => t.status === 'completed');
    const minutes = completed.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    return (minutes / 60).toFixed(1);
  };

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

        const moduleData = modulesRes.data.modules || [];
        const taskData = tasksRes.data.tasks || [];
        const scheduleData = scheduleRes.data.sessions || [];

        const pendingTasks = taskData
          .filter((task) => task.status !== 'completed')
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 5);

        setModules(moduleData);
        setAllTasks(taskData);
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

  const primaryTask = upcomingTasks.length > 0 ? upcomingTasks[0] : null;
  const primaryTaskModule = primaryTask 
    ? modules.find(m => m.id === primaryTask.module_id) 
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-300 font-medium">Loading your study dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* HERO GREETING SECTION */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {getGreeting()},
              </h1>
              <p className="text-xl text-gray-600 font-medium">
                {user?.name || 'Student'}, let's make today productive!
              </p>
            </div>
            <div className="hidden md:block text-6xl">📊</div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium flex items-start gap-3">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* MODERN STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatCard
              icon="⚡"
              label="Productivity Points"
              value={getProductivityPoints()}
              color="bg-gradient-to-br from-amber-500 to-orange-600"
              trend="↑ +12 this week"
            />
            <ModernStatCard
              icon="🔥"
              label="Study Streak"
              value="5"
              color="bg-gradient-to-br from-red-500 to-pink-600"
              unitLabel="days"
              trend="Keep it up!"
            />
            <ModernStatCard
              icon="✅"
              label="Pending Tasks"
              value={upcomingTasks.length}
              color="bg-gradient-to-br from-blue-500 to-cyan-600"
              trend={upcomingTasks.length === 0 ? '✨ All done!' : 'Focus time'}
            />
            <ModernStatCard
              icon="⏱️"
              label="Study Hours"
              value={getStudyHours()}
              color="bg-gradient-to-br from-purple-500 to-indigo-600"
              unitLabel="hrs"
              trend="30.5h this month"
            />
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        {upcomingTasks.length > 0 || modules.length > 0 ? (
          <>
            {/* TODAY'S FOCUS & WEEKLY PROGRESS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Today's Focus - 2 columns on desktop */}
              <div className="lg:col-span-2">
                {primaryTask && <TodaysFocusCard task={primaryTask} module={primaryTaskModule} />}
              </div>

              {/* Quick Stats */}
              <div className="rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Module Progress</span>
                      <span className="text-sm font-bold text-black-600">{modules.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((modules.length / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                      <span className="text-sm font-bold text-green-600">{allTasks.length > 0 ? Math.round((allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${allTasks.length > 0 ? (allTasks.filter(t => t.status === 'completed').length / allTasks.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Scheduled Sessions</span>
                      <span className="text-sm font-bold text-purple-600">{schedule.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((schedule.length / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* WEEKLY PROGRESS & MODULES ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <WeeklyProgressWidget />
              </div>
              <ModuleShowcase modules={modules} />
            </div>

            {/* TASK TIMELINE SECTION */}
            {upcomingTasks.length > 0 && (
              <div className="rounded-2xl bg-white border border-gray-200 p-8 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Task Timeline</h2>
                    <p className="text-sm text-gray-600 mt-1">Your upcoming priorities</p>
                  </div>
                  <Link to="/tasks" className="text-black-600 hover:text-black-700 font-medium text-sm flex items-center gap-1">
                    View all <span>→</span>
                  </Link>
                </div>

                <div>
                  {upcomingTasks.map((task, idx) => (
                    <TaskTimelineCard key={task.id} task={task} index={idx} />
                  ))}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <Link
                to="/modules"
                className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-black hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-3xl mb-3">📚</div>
                  <p className="font-bold text-lg">Manage Modules</p>
                  <p className="text-black-100 text-sm mt-1">Organize your coursework</p>
                </div>
              </Link>

              <Link
                to="/tasks"
                className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-purple-700 p-6 text-black hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-3xl mb-3">✨</div>
                  <p className="font-bold text-lg">Manage Tasks</p>
                  <p className="text-black-100 text-sm mt-1">Plan your work</p>
                </div>
              </Link>

              <Link
                to="/schedule"
                className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-600 to-orange-700 p-6 text-black hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="text-3xl mb-3">📅</div>
                  <p className="font-bold text-lg">Generate Schedule</p>
                  <p className="text-black-100 text-sm mt-1">Optimize your time</p>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <EmptyStateCard
              icon="📚"
              title="No Modules Yet"
              description="Create your first module to get started with ParanoidPlanner"
              buttonText="Create Module"
              buttonLink="/modules"
            />
            <EmptyStateCard
              icon="✨"
              title="No Tasks Yet"
              description="Add tasks to start planning your study schedule"
              buttonText="Create Task"
              buttonLink="/tasks"
            />
          </div>
        )}
      </main>
    </div>
  );
};