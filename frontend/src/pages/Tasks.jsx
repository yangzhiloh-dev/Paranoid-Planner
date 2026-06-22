import { useCallback, useEffect, useState } from 'react';
import { modulesAPI, tasksAPI } from '../api/api';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import PrimaryButton from '../components/PrimaryButton';
import BulkImportModal from '../components/tasks/BulkImportModal';
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

export const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState(EMPTY_TASK_FORM);
    const [guidedTaskForm, setGuidedTaskForm] = useState(EMPTY_GUIDED_FORM);
    const [guidedDurationError, setGuidedDurationError] = useState('');
    const [showGuidedForm, setShowGuidedForm] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [bulkImportText, setBulkImportText] = useState('');
    const [bulkImportFeedback, setBulkImportFeedback] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

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
            } else {
                await tasksAPI.createTask(payload);
                setShowCreateForm(false);
                showSuccessToast('Task created successfully');
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
        setShowCreateForm(true);
    };

    const handleBulkImportSubmit = async (e) => {
        e.preventDefault();
        setBulkImportFeedback('');

        const lines = bulkImportText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        if (!lines.length) {
            setBulkImportFeedback('Enter at least one task line.');
            return;
        }

        const fallbackId = modules.length === 1 ? modules[0].id : null;
        const created = [];
        const skipped = [];

        for (const line of lines) {
            try {
                const moduleMatch = modules.find((module) =>
                    line.toUpperCase().includes(module.module_code.toUpperCase())
                );
                const moduleId = moduleMatch?.id || fallbackId;
                if (!moduleId) {
                    skipped.push(line);
                    continue;
                }
                const title = line
                    .replace(new RegExp(moduleMatch?.module_code || '', 'gi'), '')
                    .trim() || line;
                await tasksAPI.createTask({
                    title,
                    module_id: moduleId,
                    priority: 3,
                    description: '',
                });
                created.push(title);
            } catch {
                skipped.push(line);
            }
        }

        if (created.length) loadTasksAndModules();
        setBulkImportText('');
        setBulkImportFeedback(
            [
                created.length ? `${created.length} added` : null,
                skipped.length ? `${skipped.length} skipped` : null,
            ]
                .filter(Boolean)
                .join('. ')
        );
        if (created.length && skipped.length === 0) setShowBulkImportModal(false);
    };

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

                            <div className="grid gap-3 sm:flex sm:items-center">
                                <PrimaryButton
                                    type="button"
                                    onClick={() => {
                                        setShowCreateForm((current) => !current);
                                        setEditingTask(null);
                                        resetTaskForm();
                                    }}
                                    className="w-full px-6 py-3 font-semibold sm:w-auto"
                                >
                                    {showCreateForm ? 'Cancel' : 'Create Task'}
                                </PrimaryButton>
                                <PrimaryButton
                                    type="button"
                                    variant="glass"
                                    onClick={() => setShowBulkImportModal(true)}
                                    className="w-full px-6 py-3 font-semibold sm:w-auto"
                                >
                                    Bulk Import
                                </PrimaryButton>
                            </div>
                        </div>
                    </header>

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

                    {showBulkImportModal && (
                        <div className="[&>div]:!bg-[#120b08]/85 [&>div]:backdrop-blur-sm [&>div>div]:!rounded-[11px] [&>div>div]:!bg-[#160e0bf2]">
                            <BulkImportModal
                                bulkImportText={bulkImportText}
                                setBulkImportText={setBulkImportText}
                                onClose={() => setShowBulkImportModal(false)}
                                onSubmit={handleBulkImportSubmit}
                                feedback={bulkImportFeedback}
                            />
                        </div>
                    )}

                    {(showCreateForm || editingTask) && (
                        <div className="[&>form]:!mb-3 [&>form]:!rounded-[11px] [&>form]:!border-white/10 [&>form]:!bg-[#160e0be6] [&>form]:!shadow-[0_12px_26px_rgba(12,6,4,0.22)]">
                            <TaskForm
                                modules={modules}
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={handleCreateOrUpdate}
                                editingTask={editingTask}
                                onCancel={() => {
                                    setEditingTask(null);
                                    setShowCreateForm(false);
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
