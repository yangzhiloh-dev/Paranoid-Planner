import { useCallback, useEffect, useState } from 'react';
import { modulesAPI, tasksAPI } from '../api/api';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import GuidedTaskCreator from '../components/tasks/GuidedTaskCreator';
import TaskForm from '../components/tasks/TaskForm';
import Toast from '../components/tasks/Toast';
import {
    EMPTY_GUIDED_FORM,
    EMPTY_TASK_FORM,
    buildGuidedTaskPayload,
    buildTaskPayload,
    formatDate,
    formatTime,
    getModule,
    getPriorityLabel,
    parseOptionalPositiveNumber,
} from '../components/tasks/taskConstants';
import './Dashboard.css';

const COMPLETED_STATUS = 'completed';
const TASK_VIEW_FILTERS = {
    overdue: 'overdue',
    dueThisWeek: 'due-this-week',
    highPriority: 'high-priority',
    completed: 'completed',
};
const TASK_BOARD_VIEWS = {
    priority: 'priority',
    module: 'module',
};
const PRIORITY_BUCKETS = [
    {
        id: 'overdue',
        title: 'Overdue',
        emptyText: 'Nothing overdue. Good.',
        accent: 'bg-rose-300',
    },
    {
        id: 'dueThisWeek',
        title: 'Due this week',
        emptyText: 'No tasks due this week.',
        accent: 'bg-amber-300',
    },
    {
        id: 'highPriority',
        title: 'High priority',
        emptyText: 'No high-priority tasks left.',
        accent: 'bg-orange-300',
    },
    {
        id: 'upcomingNext14Days',
        title: 'Upcoming next 14 days',
        emptyText: 'No upcoming tasks in the next two weeks.',
        accent: 'bg-emerald-300',
    },
];

const getTaskDeadlineDate = (task) => {
    if (!task.deadline) return null;

    const deadline = new Date(task.deadline);
    return Number.isNaN(deadline.getTime()) ? null : deadline;
};

const isIncompleteTask = (task) => task.status !== COMPLETED_STATUS;

const isOverdueTask = (task, now) => {
    const deadline = getTaskDeadlineDate(task);
    return Boolean(deadline && deadline < now && isIncompleteTask(task));
};

const isDueThisWeekTask = (task, now) => {
    const deadline = getTaskDeadlineDate(task);
    if (!deadline || !isIncompleteTask(task)) return false;

    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return deadline >= now && deadline <= weekFromNow;
};

const isHighPriorityTask = (task) =>
    Number(task.priority) >= 5 && isIncompleteTask(task);

const isCompletedTask = (task) => task.status === COMPLETED_STATUS;

const countTasksByRule = (tasks, rule, now = new Date()) =>
    tasks.filter((task) => rule(task, now)).length;

const isWithinDays = (deadline, now, days) => {
    if (!deadline || deadline < now) return false;

    const limit = new Date(now);
    limit.setDate(limit.getDate() + days);
    return deadline <= limit;
};

const sortTasksByDeadlineAndPriority = (a, b) => {
    const firstDeadline = getTaskDeadlineDate(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const secondDeadline = getTaskDeadlineDate(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (firstDeadline !== secondDeadline) return firstDeadline - secondDeadline;

    return Number(b.priority || 0) - Number(a.priority || 0);
};

const buildPriorityBuckets = (tasks, now = new Date()) => {
    const activeTasks = tasks.filter(isIncompleteTask);
    const assignedTaskIds = new Set();
    const bucketTasks = {
        overdue: [],
        dueThisWeek: [],
        highPriority: [],
        upcomingNext14Days: [],
    };

    const assignMatchingTasks = (bucketId, predicate) => {
        activeTasks.forEach((task) => {
            if (assignedTaskIds.has(task.id) || !predicate(task)) return;

            bucketTasks[bucketId].push(task);
            assignedTaskIds.add(task.id);
        });
    };

    assignMatchingTasks('overdue', (task) => {
        const deadline = getTaskDeadlineDate(task);
        return Boolean(deadline && deadline < now);
    });
    assignMatchingTasks('dueThisWeek', (task) =>
        isWithinDays(getTaskDeadlineDate(task), now, 7)
    );
    assignMatchingTasks('highPriority', (task) => Number(task.priority) >= 5);
    assignMatchingTasks('upcomingNext14Days', (task) =>
        isWithinDays(getTaskDeadlineDate(task), now, 14)
    );

    Object.keys(bucketTasks).forEach((bucketId) => {
        bucketTasks[bucketId].sort(sortTasksByDeadlineAndPriority);
    });

    const laterHiddenCount = activeTasks.filter(
        (task) => !assignedTaskIds.has(task.id)
    ).length;

    return { bucketTasks, laterHiddenCount };
};

const getStatusLabel = (status) => {
    if (status === 'in_progress') return 'In progress';
    if (status === COMPLETED_STATUS) return 'Completed';
    return 'Pending';
};

const getStatusBadgeClass = (status) => {
    if (status === 'in_progress') {
        return 'border-amber-300/20 bg-amber-300/15 text-amber-100';
    }
    if (status === COMPLETED_STATUS) {
        return 'border-emerald-300/20 bg-emerald-300/15 text-emerald-100';
    }
    return 'border-sky-300/20 bg-sky-300/15 text-sky-100';
};

const getPriorityBadgeClass = (priority) => {
    const numericPriority = Number(priority);
    if (numericPriority >= 5) {
        return 'border-rose-300/25 bg-rose-300/15 text-rose-100';
    }
    if (numericPriority >= 4) {
        return 'border-orange-300/25 bg-orange-300/15 text-orange-100';
    }
    if (numericPriority >= 3) {
        return 'border-amber-300/20 bg-amber-300/10 text-amber-100';
    }
    return 'border-white/10 bg-white/[0.08] text-[#d8c8bb]';
};

export const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState(EMPTY_TASK_FORM);
    const [guidedTaskForm, setGuidedTaskForm] = useState(EMPTY_GUIDED_FORM);
    const [guidedDurationError, setGuidedDurationError] = useState('');
    const [showGuidedForm, setShowGuidedForm] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [activeTaskView, setActiveTaskView] = useState(null);
    const [showCompletedTasks, setShowCompletedTasks] = useState(true);
    const [activeView, setActiveView] = useState(TASK_BOARD_VIEWS.priority);
    const [visiblePriorityBuckets, setVisiblePriorityBuckets] = useState([]);

    const resetTaskForm = () => setFormData(EMPTY_TASK_FORM);
    const resetGuidedForm = () => {
        setGuidedTaskForm(EMPTY_GUIDED_FORM);
        setGuidedDurationError('');
    };

    const loadTasksAndModules = useCallback(async () => {
        setLoading(true);
        try {
            const [taskRes, moduleRes] = await Promise.all([
                tasksAPI.getTasks(),
                modulesAPI.getModules(),
            ]);
            setTasks(taskRes.data.tasks || []);
            setModules(moduleRes.data.modules || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load tasks and modules');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasksAndModules();
    }, [loadTasksAndModules]);

    useEffect(() => {
        if (!showToast) return undefined;
        const timer = setTimeout(() => setShowToast(false), 2600);
        return () => clearTimeout(timer);
    }, [showToast]);

    useEffect(() => {
        if (loading) return;

        const { bucketTasks } = buildPriorityBuckets(tasks);
        const bucketsWithTasks = PRIORITY_BUCKETS
            .filter((bucket) => bucketTasks[bucket.id].length > 0)
            .map((bucket) => bucket.id);

        if (!bucketsWithTasks.length) return;

        setVisiblePriorityBuckets((current) => [
            ...new Set([...current, ...bucketsWithTasks]),
        ]);
    }, [loading, tasks]);

    const showSuccessToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
    };

    const handleGuidedTaskSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setGuidedDurationError('');

        if (!guidedTaskForm.module_id || !guidedTaskForm.deadline) {
            setError('Module and deadline required');
            return;
        }

        const estimated = parseOptionalPositiveNumber(guidedTaskForm.estimated_minutes);
        if (estimated !== null && (!Number.isFinite(estimated) || estimated <= 0)) {
            setGuidedDurationError('Estimated duration must be a positive number');
            return;
        }

        try {
            await tasksAPI.createTask(buildGuidedTaskPayload(guidedTaskForm, modules));
            resetGuidedForm();
            setShowGuidedForm(false);
            showSuccessToast('Task added successfully');
            loadTasksAndModules();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add task');
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.module_id || !formData.title || !formData.deadline) {
            setError('Module, title, and deadline required');
            return;
        }

        const payload = buildTaskPayload(formData);
        const estimated = parseOptionalPositiveNumber(formData.estimated_minutes);
        if (estimated !== null && (!Number.isFinite(estimated) || estimated <= 0)) {
            setError('Estimated minutes must be a positive number');
            return;
        }

        try {
            if (editingTask) {
                await tasksAPI.updateTask(editingTask.id, payload);
                setEditingTask(null);
                showSuccessToast('Task updated successfully');
            }
            resetTaskForm();
            loadTasksAndModules();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save task');
        }
    };

    const handleUpdateTaskStatus = async (taskId, status) => {
        try {
            await tasksAPI.updateTask(taskId, { status });
            showSuccessToast('Task status updated');
            loadTasksAndModules();
        } catch (err) {
            setError(err.response?.data?.error || 'Status update failed');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!confirm('Delete this task?')) return;
        try {
            await tasksAPI.deleteTask(taskId);
            showSuccessToast('Task deleted successfully');
            loadTasksAndModules();
        } catch (err) {
            setError(err.response?.data?.error || 'Delete failed');
        }
    };

    const startEdit = (task) => {
        setEditingTask(task);
        setFormData({
            ...task,
            deadline: task.deadline
                ? new Date(task.deadline).toISOString().slice(0, 16)
                : '',
            estimated_minutes: task.estimated_minutes || '',
        });
    };

    const summaryCountTime = new Date();
    const taskSummaryCards = [
        {
            id: TASK_VIEW_FILTERS.overdue,
            label: 'Overdue',
            count: countTasksByRule(tasks, isOverdueTask, summaryCountTime),
            accent: 'bg-rose-300',
            onClick: () => setActiveTaskView(TASK_VIEW_FILTERS.overdue),
        },
        {
            id: TASK_VIEW_FILTERS.dueThisWeek,
            label: 'Due this week',
            count: countTasksByRule(tasks, isDueThisWeekTask, summaryCountTime),
            accent: 'bg-amber-300',
            onClick: () => setActiveTaskView(TASK_VIEW_FILTERS.dueThisWeek),
        },
        {
            id: TASK_VIEW_FILTERS.highPriority,
            label: 'High priority',
            count: countTasksByRule(tasks, isHighPriorityTask, summaryCountTime),
            accent: 'bg-orange-300',
            onClick: () => setActiveTaskView(TASK_VIEW_FILTERS.highPriority),
        },
        {
            id: TASK_VIEW_FILTERS.completed,
            label: 'Completed',
            count: countTasksByRule(tasks, isCompletedTask, summaryCountTime),
            accent: 'bg-emerald-300',
            onClick: () => {
                setActiveTaskView(TASK_VIEW_FILTERS.completed);
                setShowCompletedTasks((current) => !current);
            },
        },
    ];
    const taskBoardViewOptions = [
        {
            id: TASK_BOARD_VIEWS.priority,
            label: 'Priority View',
        },
        {
            id: TASK_BOARD_VIEWS.module,
            label: 'Module View',
        },
    ];
    const { bucketTasks, laterHiddenCount } = buildPriorityBuckets(
        tasks,
        summaryCountTime
    );
    const visibleBuckets = PRIORITY_BUCKETS.filter(
        (bucket) =>
            bucketTasks[bucket.id].length > 0 ||
            visiblePriorityBuckets.includes(bucket.id)
    );

    return (
        <div className="replica-stage">
            <div className="replica-shell">
                <DashboardSidebar />

                <main className="replica-main">
                    <header className="replica-card mb-3 p-6 sm:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <span className="card-kicker">Task management</span>
                                <h1 className="mb-0 mt-1 text-3xl font-bold tracking-tight text-[#fff7ed] sm:text-4xl">
                                    Tasks
                                </h1>
                                <p className="mb-0 mt-2 max-w-2xl text-sm text-[#b9a99d]">
                                    Organize, prioritize, and track your work in one focused workspace.
                                </p>
                            </div>
                        </div>
                    </header>

                    <section
                        aria-label="Task summary"
                        className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        {taskSummaryCards.map((card) => {
                            const isActive = activeTaskView === card.id;
                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    onClick={card.onClick}
                                    aria-pressed={
                                        card.id === TASK_VIEW_FILTERS.completed
                                            ? !showCompletedTasks
                                            : isActive
                                    }
                                    className={`group rounded-[11px] border p-5 text-left shadow-[0_12px_26px_rgba(12,6,4,0.22)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-200/30 focus:outline-none focus:ring-2 focus:ring-amber-200/35 ${
                                        isActive
                                            ? 'border-amber-200/35 bg-[#1d120ee8]'
                                            : 'border-white/10 bg-[#160e0be6]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9a99d]">
                                            {card.label}
                                        </span>
                                        <span
                                            className={`h-2.5 w-2.5 rounded-full ${card.accent} shadow-[0_0_18px_rgba(251,191,36,0.24)]`}
                                        />
                                    </div>
                                    <div className="mt-4 text-3xl font-bold tracking-tight text-[#fff7ed]">
                                        {card.count}
                                    </div>
                                </button>
                            );
                        })}
                    </section>

                    <Toast message={showToast ? toastMessage : ''} />

                    {error && (
                        <div className="replica-error" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="[&>form]:!mb-3 [&>form]:!rounded-[11px] [&>form]:!border-white/10 [&>form]:!bg-[#160e0be6] [&>form]:!p-6 [&>form]:!shadow-[0_12px_26px_rgba(12,6,4,0.22)] sm:[&>form]:!p-8">
                        <GuidedTaskCreator
                            modules={modules}
                            guidedTaskForm={guidedTaskForm}
                            setGuidedTaskForm={setGuidedTaskForm}
                            showGuidedForm={showGuidedForm}
                            setShowGuidedForm={setShowGuidedForm}
                            onCreateTask={handleGuidedTaskSubmit}
                            onCancel={resetGuidedForm}
                            guidedDurationError={guidedDurationError}
                        />
                    </div>

                    {editingTask && (
                        <div className="[&>form]:!mb-3 [&>form]:!rounded-[11px] [&>form]:!border-white/10 [&>form]:!bg-[#160e0be6] [&>form]:!shadow-[0_12px_26px_rgba(12,6,4,0.22)]">
                            <TaskForm
                                modules={modules}
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={handleCreateOrUpdate}
                                editingTask={editingTask}
                                onCancel={() => {
                                    setEditingTask(null);
                                    resetTaskForm();
                                }}
                            />
                        </div>
                    )}

                    <div className="mb-3 flex flex-col gap-3 rounded-[11px] border border-white/10 bg-[#160e0be6] p-3 shadow-[0_12px_26px_rgba(12,6,4,0.22)] sm:flex-row sm:items-center sm:justify-between">
                        <span className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b9a99d]">
                            Task view
                        </span>
                        <div className="grid gap-2 rounded-[9px] border border-white/10 bg-[#0f0907]/70 p-1 sm:flex">
                            {taskBoardViewOptions.map((option) => {
                                const isActive = activeView === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setActiveView(option.id)}
                                        aria-pressed={isActive}
                                        className={`rounded-[8px] px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-amber-200/35 ${
                                            isActive
                                                ? 'bg-amber-200 text-[#20120d] shadow-[0_10px_22px_rgba(251,191,36,0.18)]'
                                                : 'text-[#d8c8bb] hover:bg-white/5 hover:text-[#fff7ed]'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {activeView === TASK_BOARD_VIEWS.module ? (
                        <section className="replica-card grid min-h-72 place-items-center p-12 text-center">
                            <div>
                                <span className="card-kicker">Module View</span>
                                <p className="mb-0 mt-3 text-lg font-semibold text-[#fff7ed]">
                                    Module View coming next
                                </p>
                            </div>
                        </section>
                    ) : loading ? (
                        <section
                            className="replica-card grid min-h-72 place-items-center p-12 text-center"
                            aria-live="polite"
                        >
                            <div>
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-300/20 border-t-amber-300" />
                                <p className="mb-0 mt-4 font-medium text-[#b9a99d]">
                                    Loading tasks...
                                </p>
                            </div>
                        </section>
                    ) : visibleBuckets.length === 0 ? (
                        <section className="replica-card grid min-h-72 place-items-center p-12 text-center">
                            <div>
                                <span className="card-kicker">Priority View</span>
                                <p className="mb-0 mt-3 text-lg font-semibold text-[#fff7ed]">
                                    No active priority tasks right now.
                                </p>
                            </div>
                        </section>
                    ) : (
                        <>
                            <section
                                aria-label="Priority task buckets"
                                className="grid gap-3 xl:grid-cols-2"
                            >
                                {visibleBuckets.map((bucket) => {
                                    const tasksInBucket = bucketTasks[bucket.id];
                                    return (
                                        <div
                                            key={bucket.id}
                                            className="overflow-hidden rounded-[11px] border border-white/10 bg-[#160e0be6] shadow-[0_12px_26px_rgba(12,6,4,0.22)]"
                                        >
                                            <div className="border-b border-white/10 bg-[#0f0907]/70 px-5 py-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <h2 className="mb-0 text-lg font-semibold text-[#fff7ed]">
                                                            {bucket.title}
                                                        </h2>
                                                        <p className="mb-0 mt-1 text-sm text-[#b9a99d]">
                                                            {tasksInBucket.length}{' '}
                                                            {tasksInBucket.length === 1
                                                                ? 'task'
                                                                : 'tasks'}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`h-2.5 w-2.5 rounded-full ${bucket.accent} shadow-[0_0_18px_rgba(251,191,36,0.24)]`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3 p-4">
                                                {tasksInBucket.length === 0 ? (
                                                    <div className="rounded-[10px] border border-dashed border-white/10 bg-white/[0.04] p-6 text-center text-sm font-medium text-[#d8c8bb]">
                                                        {bucket.emptyText}
                                                    </div>
                                                ) : (
                                                    tasksInBucket.map((task) => {
                                                        const moduleInfo = getModule(
                                                            modules,
                                                            task.module_id
                                                        );
                                                        const deadlineLabel = task.deadline
                                                            ? `${formatDate(
                                                                  task.deadline
                                                              )} at ${formatTime(
                                                                  task.deadline
                                                              )}`
                                                            : 'No deadline';
                                                        return (
                                                            <article
                                                                key={task.id}
                                                                className="rounded-[10px] border border-white/10 bg-[#120b08]/80 p-4 shadow-[0_10px_22px_rgba(12,6,4,0.18)]"
                                                            >
                                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                    <div className="min-w-0">
                                                                        <h3 className="mb-0 text-base font-semibold text-[#fff7ed]">
                                                                            {task.title}
                                                                        </h3>
                                                                        <p className="mb-0 mt-1 text-sm text-[#b9a99d]">
                                                                            {moduleInfo
                                                                                ? `${moduleInfo.module_code} - ${moduleInfo.module_name}`
                                                                                : 'No module assigned'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <span
                                                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(
                                                                                task.priority
                                                                            )}`}
                                                                        >
                                                                            {getPriorityLabel(
                                                                                task.priority
                                                                            )}
                                                                        </span>
                                                                        <span
                                                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                                                                                task.status
                                                                            )}`}
                                                                        >
                                                                            {getStatusLabel(
                                                                                task.status
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-4 flex flex-wrap gap-2 text-sm text-[#d8c8bb]">
                                                                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                                                                        {deadlineLabel}
                                                                    </span>
                                                                    {task.estimated_minutes && (
                                                                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                                                                            {
                                                                                task.estimated_minutes
                                                                            }{' '}
                                                                            min
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="mt-4 flex flex-wrap gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleUpdateTaskStatus(
                                                                                task.id,
                                                                                'in_progress'
                                                                            )
                                                                        }
                                                                        className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-[#fff7ed] transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-amber-200/35"
                                                                    >
                                                                        {task.status ===
                                                                        'in_progress'
                                                                            ? 'Resume'
                                                                            : 'Start'}
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleUpdateTaskStatus(
                                                                                task.id,
                                                                                COMPLETED_STATUS
                                                                            )
                                                                        }
                                                                        className="rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-200/35"
                                                                    >
                                                                        Complete
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            startEdit(task)
                                                                        }
                                                                        className="rounded-full bg-amber-300/15 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/25 focus:outline-none focus:ring-2 focus:ring-amber-200/35"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleDeleteTask(
                                                                                task.id
                                                                            )
                                                                        }
                                                                        className="rounded-full bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/25 focus:outline-none focus:ring-2 focus:ring-rose-200/35"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </article>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </section>

                            {laterHiddenCount > 0 && (
                                <div className="mt-3 rounded-[11px] border border-white/10 bg-[#160e0be6] px-5 py-4 text-sm font-medium text-[#b9a99d] shadow-[0_12px_26px_rgba(12,6,4,0.22)]">
                                    {laterHiddenCount}{' '}
                                    {laterHiddenCount === 1
                                        ? 'later task hidden'
                                        : 'later tasks hidden'}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Tasks;
