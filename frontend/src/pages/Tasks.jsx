import { useCallback, useEffect, useState } from 'react';
import { modulesAPI, tasksAPI } from '../api/api';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import GuidedTaskCreator from '../components/tasks/GuidedTaskCreator';
import KanbanColumn from '../components/tasks/KanbanColumn';
import TaskForm from '../components/tasks/TaskForm';
import Toast from '../components/tasks/Toast';
import {
    EMPTY_GUIDED_FORM,
    EMPTY_TASK_FORM,
    TASK_COLUMNS,
    buildGuidedTaskPayload,
    buildTaskPayload,
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

                    {loading ? (
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
                    ) : (
                        <section
                            aria-label="Task board"
                            className="grid gap-3 lg:grid-cols-3 [&>div]:!overflow-hidden [&>div]:!rounded-[11px] [&>div]:!border-white/10 [&>div]:!bg-[#160e0be6] [&>div]:!shadow-[0_12px_26px_rgba(12,6,4,0.22)]"
                        >
                            {TASK_COLUMNS.map((column) => {
                                const columnTasks = tasks.filter(
                                    (task) => task.status === column.status
                                );
                                return (
                                    <KanbanColumn
                                        key={column.status}
                                        column={column}
                                        tasks={columnTasks}
                                        modules={modules}
                                        onStatusChange={handleUpdateTaskStatus}
                                        onEdit={startEdit}
                                        onDelete={handleDeleteTask}
                                    />
                                );
                            })}
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Tasks;
