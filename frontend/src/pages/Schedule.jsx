import { useCallback, useEffect, useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Sidebar } from '../components/SideBar';
import PrimaryButton from '../components/PrimaryButton';
import { scheduleAPI } from '../api/api';

const ACTIVITY_STYLES = {
  LEC: { backgroundColor: '#1e3a8a', borderColor: '#3b82f6', label: 'Lecture' },
  TUT: { backgroundColor: '#5b21b6', borderColor: '#8b5cf6', label: 'Tutorial' },
  LAB: { backgroundColor: '#0f766e', borderColor: '#2dd4bf', label: 'Lab' },
};

const getAssignmentStyle = (priority) => {
  const value = Number(priority);

  if (value >= 5) return { backgroundColor: '#991b1b', borderColor: '#ef4444' };
  if (value >= 3) return { backgroundColor: '#92400e', borderColor: '#f59e0b' };
  return { backgroundColor: '#334155', borderColor: '#64748b' };
};

const toCalendarDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toCalendarTime = (value) => (value ? String(value).slice(0, 8) : null);

const formatDateTime = (value) => {
  const date = toCalendarDate(value);

  return date
    ? date.toLocaleString([], {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not set';
};

// Lessons become recurring, read-only FullCalendar events.
const lessonToEvent = (lesson) => {
  const activityType = String(lesson.activity_type || 'LEC').toUpperCase();
  const style = ACTIVITY_STYLES[activityType] || ACTIVITY_STYLES.LEC;
  const dayOfWeek = Number(lesson.day_of_week);
  const startTime = toCalendarTime(lesson.start_time);
  const endTime = toCalendarTime(lesson.end_time);

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6 || !startTime || !endTime) {
    return null;
  }

  return {
    id: `lesson-${lesson.id}`,
    daysOfWeek: [dayOfWeek],
    startTime,
    endTime,
    title: `${lesson.module_code || 'Module'} ${style.label}`,
    editable: false,
    startEditable: false,
    durationEditable: false,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    textColor: '#ffffff',
    extendedProps: {
      eventType: 'lesson',
      moduleCode: lesson.module_code || 'Module',
      moduleName: lesson.module_name || 'Module name unavailable',
      activityLabel: style.label,
      startTime,
      endTime,
    },
  };
};

// Generated study sessions become draggable FullCalendar events.
const sessionToEvent = (session) => {
  const start = toCalendarDate(session.scheduled_start || session.start);
  const end = toCalendarDate(session.scheduled_end || session.end);
  const assignmentTitle = session.task_title || session.title || 'Study session';
  const priority = session.task_priority ?? session.priority;

  if (!start || !end) return null;

  return {
    id: `session-${session.id}`,
    title: `${session.module_code || 'Module'} - ${assignmentTitle}`,
    start,
    end,
    editable: true,
    ...getAssignmentStyle(priority),
    textColor: '#ffffff',
    extendedProps: {
      eventType: 'session',
      moduleCode: session.module_code || 'Module',
      moduleName: session.module_name || 'Module name unavailable',
      assignmentTitle,
      priority,
    },
  };
};

export const Schedule = () => {
  const [lessons, setLessons] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await scheduleAPI.getSchedule();
      const data = response.data || {};

      setLessons(Array.isArray(data.lessons) ? data.lessons : []);
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      setLessons([]);
      setSessions([]);
      setError(err.response?.data?.error || 'Failed to fetch the schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const calendarEvents = useMemo(() => {
    const lessonEvents = lessons.map(lessonToEvent).filter(Boolean);
    const sessionEvents = sessions.map(sessionToEvent).filter(Boolean);

    return [...lessonEvents, ...sessionEvents];
  }, [lessons, sessions]);

  const handleGenerateSchedule = async () => {
    if (generating) return;

    try {
      setGenerating(true);
      setError('');
      setNotice('');
      await scheduleAPI.generateSchedule();
      await fetchSchedule();
      setNotice('Schedule generated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate the schedule. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEventMount = ({ event, el }) => {
    const details = event.extendedProps;

    if (details.eventType === 'lesson') {
      el.title = `${details.moduleCode} - ${details.moduleName}\n${details.activityLabel}\n${details.startTime} - ${details.endTime}`;
      return;
    }

    el.title = `${details.moduleCode} - ${details.moduleName}\n${details.assignmentTitle}\n${formatDateTime(event.start)} - ${formatDateTime(event.end)}`;
  };

  const handleSessionMove = (changeInfo) => {
    changeInfo.revert();
    setNotice('Session rescheduling is ready for a future backend update.');
  };

  const renderEventContent = ({ event, timeText }) => {
    const details = event.extendedProps;
    const subtitle =
      details.eventType === 'session' ? details.assignmentTitle : details.activityLabel;

    return (
      <div className="min-w-0 overflow-hidden px-1 py-0.5 leading-tight">
        {timeText && <p className="truncate text-[10px] font-medium opacity-80">{timeText}</p>}
        <p className="truncate text-xs font-bold">{details.moduleCode}</p>
        <p className="truncate text-[11px] opacity-90">{subtitle}</p>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#1a0f08] text-white">
      <Sidebar />

      <main className="ml-[88px] w-full flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Study Schedule</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Plan every class and study session.
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Lessons stay fixed while assignment sessions are prioritized around your timetable.
              </p>
            </div>

            <PrimaryButton
              type="button"
              onClick={handleGenerateSchedule}
              loading={generating}
              disabled={generating}
              className="w-full shrink-0 rounded-full px-6 py-3 font-semibold sm:w-auto"
            >
              {generating ? 'Generating...' : 'Generate Schedule'}
            </PrimaryButton>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-[28px] border border-red-400/20 bg-[#581c1c]/20 p-4 text-red-200">
            {error}
          </div>
        )}
        {notice && !error && (
          <div className="mb-6 rounded-[28px] border border-amber-400/20 bg-amber-900/20 p-4 text-amber-100">
            {notice}
          </div>
        )}

        {!loading && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-blue-400/20 bg-blue-900/20 px-3 py-1.5 text-blue-200">
              {lessons.length} fixed NUS timetable event{lessons.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-full border border-amber-400/20 bg-amber-900/20 px-3 py-1.5 text-amber-200">
              {sessions.length} assignment session{sessions.length === 1 ? '' : 's'}
            </span>
            {lessons.length === 0 && (
              <span>Re-import a NUSMods share link containing selected class groups.</span>
            )}
          </div>
        )}

        <section className="schedule-calendar overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-glow backdrop-blur-xl sm:p-6">
          {loading ? (
            <div className="flex min-h-[560px] items-center justify-center text-slate-400">
              Loading schedule...
            </div>
          ) : (
            <>
              {calendarEvents.length === 0 && (
                <div className="mb-4 rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
                  No lessons or study sessions yet. Import a NUSMods timetable or generate a schedule to populate the calendar.
                </div>
              )}
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                events={calendarEvents}
                editable
                eventDrop={handleSessionMove}
                eventResize={handleSessionMove}
                eventContent={renderEventContent}
                eventDidMount={handleEventMount}
                nowIndicator
                allDaySlot={false}
                slotMinTime="07:00:00"
                slotMaxTime="23:00:00"
                slotDuration="00:30:00"
                scrollTime="08:00:00"
                height="auto"
                expandRows
                stickyHeaderDates
                dayMaxEvents
                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: 'short' }}
              />
            </>
          )}
        </section>

        <style>{`
          .schedule-calendar {
            --fc-border-color: rgba(255, 255, 255, 0.1);
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: rgba(255, 255, 255, 0.04);
            --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.08);
            --fc-today-bg-color: rgba(245, 158, 11, 0.08);
            --fc-now-indicator-color: #f59e0b;
          }
          .schedule-calendar .fc { color: #cbd5e1; }
          .schedule-calendar .fc-toolbar-title { color: #fff; font-size: 1.15rem; }
          .schedule-calendar .fc-button-primary {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.12);
            box-shadow: none;
            text-transform: capitalize;
          }
          .schedule-calendar .fc-button-primary:hover,
          .schedule-calendar .fc-button-primary:not(:disabled).fc-button-active {
            background: rgba(245, 158, 11, 0.3);
            border-color: rgba(245, 158, 11, 0.45);
          }
          .schedule-calendar .fc-col-header-cell-cushion,
          .schedule-calendar .fc-daygrid-day-number { color: #cbd5e1; padding: 0.5rem; }
          .schedule-calendar .fc-timegrid-slot-label-cushion { color: #64748b; font-size: 0.75rem; }
          .schedule-calendar .fc-event { border-radius: 0.5rem; cursor: default; overflow: hidden; }
          .schedule-calendar .fc-event.fc-event-draggable { cursor: grab; }
          @media (max-width: 767px) {
            .schedule-calendar .fc-header-toolbar { align-items: stretch; flex-direction: column; gap: 0.75rem; }
            .schedule-calendar .fc-toolbar-chunk { display: flex; justify-content: center; }
            .schedule-calendar .fc-toolbar-title { font-size: 1rem; }
            .schedule-calendar .fc-button { font-size: 0.75rem; padding: 0.4rem 0.55rem; }
          }
        `}</style>
      </main>
    </div>
  );
};

export default Schedule;
