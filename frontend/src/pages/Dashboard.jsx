import { useEffect, useMemo, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { modulesAPI, productivityAPI, scheduleAPI, tasksAPI } from '../api/api';
import {
  AssistantCard,
  DashboardLoading,
  ModulePressureCard,
  ProductivityCard,
  ProgressCard,
  TaskOverviewCard,
  WeeklyPlanner,
} from '../components/dashboard/DashboardCards';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import {
  getModulePressure,
  getPendingTasks,
  getRecommendedNextMove,
  getWeeklyProgress,
} from '../components/dashboard/dashboardUtils';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

/* Main dashboard page shows overview of points and streaks and work completed
* Default state for all points, streaks = 0
*
*
*/
const EMPTY_PRODUCTIVITY_SUMMARY = {
  total_points: 0,
  weekly_points: 0,
  today_points: 0,
  current_streak: 0,
  best_streak: 0,
  completed_today: false,
  recent_events: [],
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [productivity, setProductivity] = useState(EMPTY_PRODUCTIVITY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(false);

  /* 
  * fetch  mdoules, tasks, schedule and productivity at the same time
  * allow partial data to load if some requests fail
  * setloaading to false only after all requests have completed 
  * 
  */
  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [moduleResult, taskResult, scheduleResult, productivityResult] = await Promise.allSettled([
          modulesAPI.getModules(),
          tasksAPI.getTasks(),
          scheduleAPI.getSchedule(),
          productivityAPI.getSummary(),
        ]);

        if (!active) return;
        if (moduleResult.status === 'rejected' ||  taskResult.status === 'rejected') {
          throw moduleResult.reason || taskResult.reason;
        }

        setModules(moduleResult.value.data.modules || []);
        setTasks(taskResult.value.data.tasks || []);
        setSchedule(
          scheduleResult.status === 'fulfilled'
            ? scheduleResult.value.data?.sessions || []
            : []
        );
        setProductivity(
          productivityResult.status === 'fulfilled'
            ? productivityResult.value.data?.summary || EMPTY_PRODUCTIVITY_SUMMARY
            : EMPTY_PRODUCTIVITY_SUMMARY
        );
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.error ||
               'Dashboard data could not be loaded.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  // memoise the dervied val to avoid expensive recalculations on every render
  const pendingTasks = useMemo(() => getPendingTasks(tasks), [tasks]);
  const modulePressure = useMemo(
    () => getModulePressure(modules, tasks),
    [modules, tasks]
  );
  const recommendedNextMove = useMemo(
    () =>   getRecommendedNextMove(tasks, modules),
    [modules, tasks]
  );
  const weeklyProgress  = useMemo(() => getWeeklyProgress(tasks), [tasks]);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Student';

  if (loading) return <DashboardLoading />;

  return (
    <div className="replica-stage">
      <div className="replica-shell">
        <DashboardSidebar />

        <main className="replica-main">
          <header className="replica-topbar">
            <div className="topbar-profile">
              <button
                type="button"
                aria-label="Open notifications"
                aria-expanded={noticeOpen}
                onClick={() => setNoticeOpen((value) => !value)}
              >
                <FaBell aria-hidden="true" />
              </button>
              <div className="profile-avatar" title={user?.name || 'Student'}>
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>

          {noticeOpen && (
            <div className="topbar-popover" role="status">
              <strong>{pendingTasks.length} tasks need attention</strong>
              <span>
                {pendingTasks[0]
                  ? `${pendingTasks[0].title} is next.`
                  : 'You are all caught up.'}
              </span>
            </div>
          )}

          {error && (
            <div className="replica-error" role="alert">
              {error}
            </div>
          )}

          <div className="replica-content-grid">
            <WeeklyPlanner
              tasks={tasks}
              schedule={schedule}
              modules={modules}
            />
            <ModulePressureCard modules={modulePressure} />
            <TaskOverviewCard tasks={tasks} modules={modules} />
            <div className="metric-stack">
              <ProductivityCard summary={productivity} />
              <ProgressCard progress={weeklyProgress} />
            </div>
            <AssistantCard
              modules={modules}
              pendingTasks={pendingTasks}
              nextMove={recommendedNextMove}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
