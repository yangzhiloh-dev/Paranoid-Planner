import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisH,
  FaFire,
} from 'react-icons/fa';
import {
  DAY_MS,
  getModule,
  shortDate,
  shortTime,
  startOfWeek,
  validDate,
} from './dashboardUtils';

const DashboardCard = ({ className = '', children, ...props }) => (
  <section className={`replica-card ${className}`} {...props}>
    {children}
  </section>
);

const CardHeader = ({ eyebrow, title, titleId, action }) => (
  <header className="replica-card-header">
    <div>
      {eyebrow && <span>{eyebrow}</span>}
      <h2 id={titleId}>{title}</h2>
    </div>
    {action}
  </header>
);

export const WeeklyPlanner = ({ tasks, schedule, modules }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = useMemo(
    () => new Date(startOfWeek().getTime() + weekOffset * 7 * DAY_MS),
    [weekOffset]
  );
  const days = useMemo(
    () =>
      Array.from(
        { length: 6 },
        (_, index) => new Date(weekStart.getTime() + index * DAY_MS)
      ),
    [weekStart]
  );

  const events = useMemo(() => {
    const sessions = schedule.map((session) => ({
      id: `session-${session.id}`,
      title: session.task_title || session.title || 'Study session',
      date: validDate(session.scheduled_start),
      end: validDate(session.scheduled_end),
      type: 'session',
    }));
    const deadlines = tasks
      .filter((task) => task.status !== 'completed')
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        date: validDate(task.deadline),
        module: getModule(modules, task.module_id)?.module_code || 'Task',
        type: 'task',
      }));

    return [...sessions, ...deadlines].filter((event) => event.date);
  }, [modules, schedule, tasks]);

  const monthLabel = days[0].toLocaleDateString([], { month: 'long' });
  const dateRange = `${monthLabel} ${days[0].getDate()}-${days[5].getDate()}`;

  return (
    <DashboardCard
      className="weekly-planner"
      aria-labelledby="weekly-planner-title"
    >
      <div className="week-toolbar">
        <button
          type="button"
          onClick={() => setWeekOffset((value) => value - 1)}
        >
          <FaChevronLeft aria-hidden="true" /> Last week
        </button>
        <div className="week-toolbar-title">
          <span>Weekly Study Plan</span>
          <h2 id="weekly-planner-title">{dateRange}</h2>
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((value) => value + 1)}
        >
          Next week <FaChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="week-grid">
        <div className="time-column" aria-hidden="true">
          <span />
          {['8:00 am', '9:00 am', '10:00 am', '11:00 am'].map((time) => (
            <span key={time}>{time}</span>
          ))}
        </div>

        {days.map((day) => {
          const dayEvents = events
            .filter((event) => event.date.toDateString() === day.toDateString())
            .slice(0, 2);

          return (
            <div className="day-column" key={day.toISOString()}>
              <div className="day-heading">
                <span>
                  {day.toLocaleDateString([], { weekday: 'short' })}
                </span>
                <strong>{day.getDate()}</strong>
              </div>
              <div className="day-slots">
                {dayEvents.map((event, index) => (
                  <Link
                    to={event.type === 'session' ? '/schedule' : '/tasks'}
                    className={`calendar-event calendar-event-${index + 1}`}
                    key={event.id}
                    title={`${event.title}${
                      event.end
                        ? `, ${shortTime(event.date)}-${shortTime(event.end)}`
                        : ''
                    }`}
                  >
                    <strong>{event.title}</strong>
                    <span>{event.module || shortTime(event.date)}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
};

export const ModulePressureCard = ({ modules }) => {
  return (
    <DashboardCard
      className="study-areas-card module-pressure-card"
      aria-labelledby="module-pressure-title"
    >
      <div className="study-shape" aria-hidden="true" />
      <div className="module-pressure-content">
        <span className="card-kicker">Current semester</span>
        <h2 id="module-pressure-title">Module Pressure</h2>
        <div className="module-pressure-list">
          {modules.length ? (
            modules.slice(0, 3).map((module) => (
              <Link to="/modules" key={module.id}>
                <div className="module-pressure-heading">
                  <strong>{module.module_code}</strong>
                  <em className={module.pressure.toLowerCase()}>
                    {module.pressure}
                  </em>
                </div>
                <span>
                  {module.pendingCount
                    ? `${module.pendingCount} pending${
                        module.dueThisWeek
                          ? ` / ${module.dueThisWeek} due this week`
                          : ''
                      }`
                    : 'No urgent work'}
                </span>
                {module.nearestDeadline && (
                  <small>
                    Nearest deadline {shortDate(module.nearestDeadline)}
                  </small>
                )}
              </Link>
            ))
          ) : (
            <Link to="/modules" className="module-pressure-empty">
              <strong>Add your first module</strong>
              <span>Module pressure will appear here.</span>
            </Link>
          )}
        </div>
      </div>
    </DashboardCard>
  );
};

export const TaskOverviewCard = ({ tasks, modules }) => (
  <DashboardCard
    className="task-overview-card"
    aria-labelledby="task-overview-title"
  >
    <CardHeader
      eyebrow="Assignments"
      title="Tasks"
      titleId="task-overview-title"
      action={
        <Link
          to="/tasks"
          className="icon-action"
          aria-label="Open task board"
        >
          <FaEllipsisH aria-hidden="true" />
        </Link>
      }
    />
    <div className="task-summary-line">
      <span>Documents</span>
      <strong>{tasks.length} total</strong>
    </div>
    <div className="task-document-grid">
      {tasks.length ? (
        tasks.slice(0, 3).map((task, index) => (
          <Link
            to="/tasks"
            className={`task-document document-tone-${index + 1}`}
            key={task.id}
          >
            <span>
              {getModule(modules, task.module_id)?.module_code || 'General'}
            </span>
            <strong>{task.title}</strong>
            <small>{shortDate(task.deadline)}</small>
          </Link>
        ))
      ) : (
        <Link to="/tasks" className="task-document task-document-empty">
          <strong>Create your first task</strong>
          <small>Start planning</small>
        </Link>
      )}
    </div>
    <div className="focus-note">
      <span>Goal</span>
      <strong>{tasks[0]?.title || 'Build a steady study rhythm'}</strong>
      <p>
        {tasks.length
          ? 'Keep the next deadline visible and finish one clear step at a time.'
          : 'Add modules and tasks to turn this space into your personal study command centre.'}
      </p>
    </div>
  </DashboardCard>
);

export const PriorityCard = ({ highPriorityCount }) => (
  <DashboardCard className="score-card" aria-labelledby="priority-load-title">
    <div>
      <span id="priority-load-title">Priority load</span>
      <strong>{highPriorityCount}</strong>
      <p>high-priority pending</p>
    </div>
    <div className="dot-matrix" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => <i key={index} />)}
    </div>
  </DashboardCard>
);

/*show cases points, streaks*/

export const ProductivityCard = ({ summary }) => {
  const totalPoints = Number(summary?.total_points || 0);
  const weeklyPoints = Number(summary?.weekly_points || 0);
  const streak = Number(summary?.current_streak || 0);
  const completedToday = Boolean(summary?.completed_today);
  const streakLabel = completedToday
    ? 'Maintained today'
    : streak > 0
      ? 'Complete one today'
      : 'Start a streak';

  return (
    <DashboardCard
      className="score-card productivity-card"
      aria-labelledby="productivity-points-title"
    >
      <div>
        <span id="productivity-points-title">Productivity points</span>
        <strong>
          {totalPoints}
          <small>pts</small>
        </strong>
        <p>{weeklyPoints} pts this week</p>
      </div>
      <div className="productivity-streak" aria-label={`${streak} day streak`}>
        <FaFire aria-hidden="true" />
        <strong>{streak}d</strong>
        <span>{streakLabel}</span>
      </div>
    </DashboardCard>
  );
};

export const ProgressCard = ({ progress }) => (
  <DashboardCard className="progress-card" aria-labelledby="progress-title">
    <CardHeader
      eyebrow="Current week"
      title="Weekly Progress"
      titleId="progress-title"
    />
    <div
      className="progress-ring"
      style={{ '--progress-angle': `${progress.rate * 3.6}deg` }}
    >
      <div>
        <strong>{progress.rate}%</strong>
        <span>complete</span>
      </div>
    </div>
    <p className="progress-summary">
      {progress.completed} of {progress.total} tasks completed
    </p>
    <Link to="/tasks">
      View details <FaArrowRight aria-hidden="true" />
    </Link>
  </DashboardCard>
);

export const AssistantCard = ({ modules, pendingTasks, nextMove }) => {
  const now = Date.now();
  const nextWeek = now + 7 * DAY_MS;
  const dueSoon = pendingTasks.filter((task) => {
    const deadline = validDate(task.deadline)?.getTime();
    return deadline && deadline >= now && deadline <= nextWeek;
  });
  const overdue = pendingTasks.filter((task) => {
    const deadline = validDate(task.deadline)?.getTime();
    return deadline && deadline < now;
  });
  const highPriority = pendingTasks.filter(
    (task) => Number(task.priority || 0) >= 5
  );
  const health =
    overdue.length > 0
      ? 'Behind'
      : dueSoon.length >= 5 || highPriority.length >= 3
        ? 'Heavy'
        : 'On track';
  const rows = [
    {
      label: 'Due this week',
      value: String(dueSoon.length),
      status: dueSoon.length > 3 ? 'attention' : 'done',
    },
    {
      label: 'High priority',
      value: String(highPriority.length),
      status: highPriority.length ? 'progress' : 'done',
    },
    {
      label: 'Active modules',
      value: String(modules.length),
      status: 'neutral',
    },
  ];

  const statusLabel = (status) => {
    if (status === 'attention') return 'check now';
    if (status === 'progress') return 'in progress';
    return 'ready';
  };

  return (
    <DashboardCard
      className="assistant-card"
      aria-labelledby="assistant-title"
    >
      <CardHeader
        eyebrow="Planner assistant"
        title="Workload check"
        titleId="assistant-title"
        action={
          <Link
            to="/tasks"
            className="icon-action"
            aria-label="Open workload tasks"
          >
            <FaEllipsisH aria-hidden="true" />
          </Link>
        }
      />
      <p className="assistant-copy">
        A live summary of the study pressure currently in your planner.
      </p>
      <div className="assistant-health">
        <span>Workload status</span>
        <strong>{health}</strong>
      </div>
      <Link to="/tasks" className="recommended-move">
        <span>Recommended next move</span>
        <strong>{nextMove?.task.title || 'No urgent task right now'}</strong>
        {nextMove ? (
          <>
            <small>
              {nextMove.module?.module_code || 'General'} / Due{' '}
              {shortDate(nextMove.task.deadline)} / {nextMove.priorityLabel}
            </small>
            <em>
              Start with a {nextMove.sessionMinutes}-minute session today.
            </em>
          </>
        ) : (
          <small>Your active task queue is clear.</small>
        )}
      </Link>
      <div className="assistant-rows">
        {rows.map((row) => (
          <Link
            to={row.label === 'Active modules' ? '/modules' : '/tasks'}
            key={row.label}
          >
            <span>{row.label}</span>
            <strong>{row.value}</strong>
            <em className={row.status}>{statusLabel(row.status)}</em>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
};

export const DashboardLoading = () => (
  <div className="replica-stage">
    <div className="replica-shell replica-loading" aria-live="polite">
      <span>Loading your planner</span>
    </div>
  </div>
);
