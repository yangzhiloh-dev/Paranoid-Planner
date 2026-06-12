import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { tasksAPI, modulesAPI } from '../api/api';
import PrimaryButton from '../components/PrimaryButton';
import TaskForm from '../components/tasks/TaskForm';
import GuidedTaskCreator from '../components/tasks/GuidedTaskCreator';
import KanbanColumn from '../components/tasks/KanbanColumn';
import BulkImportModal from '../components/tasks/BulkImportModal';
import Toast from '../components/tasks/Toast';
import { EMPTY_TASK_FORM, EMPTY_GUIDED_FORM, TASK_COLUMNS, buildTaskPayload, buildGuidedTaskPayload, parseOptionalPositiveNumber } from '../components/tasks/taskConstants';

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
            const [taskRes, moduleRes] = await Promise.all([tasksAPI.getTasks(), modulesAPI.getModules()]);
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
            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
            estimated_minutes: task.estimated_minutes || ''
        });
        setShowCreateForm(true);
    };

    const handleBulkImportSubmit = async (e) => {
        e.preventDefault();
        setBulkImportFeedback('');

        const lines = bulkImportText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (!lines.length) {
            setBulkImportFeedback('Enter at least one task line.');
            return;
        }

        const fallbackId = modules.length === 1 ? modules[0].id : null;
        const created = [];
        const skipped = [];

        for (const line of lines) {
            try {
                const moduleMatch = modules.find((m) => line.toUpperCase().includes(m.module_code.toUpperCase()));
                const moduleId = moduleMatch?.id || fallbackId;
                if (!moduleId) {
                    skipped.push(line);
                    continue;
                }
                const title = line.replace(new RegExp(moduleMatch?.module_code || '', 'gi'), '').trim() || line;
                await tasksAPI.createTask({ title, module_id: moduleId, priority: 3, description: '' });
                created.push(title);
            } catch {
                skipped.push(line);
            }
        }

        if (created.length) loadTasksAndModules();
        setBulkImportText('');
        setBulkImportFeedback([created.length ? `${created.length} added` : null, skipped.length ? `${skipped.length} skipped` : null].filter(Boolean).join('. '));
        if (created.length && skipped.length === 0) setShowBulkImportModal(false);
    };

    return (
        <div className="min-h-screen bg-[#1a0f08] text-slate-100 pb-24">
            <Navbar />
            <div className="w-full px-4 pt-28 pb-10 lg:pl-[88px] lg:px-10">
                <header className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-2xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Task Management</p>
                            <h1 className="text-4xl font-semibold text-white">Build a productive task workflow.</h1>
                            <p className="max-w-2xl text-sm text-slate-400">
                                Organize, prioritize, and track your work in a premium dark workspace.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:flex sm:items-center">
                            <PrimaryButton
                                type="button"
                                onClick={() => {
                                    setShowCreateForm((s) => !s);
                                    setEditingTask(null);
                                    resetTaskForm();
                                }}
                                className="w-full sm:w-auto rounded-full px-6 py-3 font-semibold"
                            >
                                {showCreateForm ? 'Cancel' : '+ Create Task'}
                            </PrimaryButton>
                            <PrimaryButton
                                type="button"
                                variant="glass"
                                onClick={() => setShowBulkImportModal(true)}
                                className="w-full sm:w-auto rounded-full px-6 py-3 font-semibold"
                            >
                                📥 Bulk Import
                            </PrimaryButton>
                        </div>
                    </div>
                </header>

                <Toast message={showToast ? toastMessage : ''} />
                {error && (
                    <div className="mb-6 rounded-[28px] border border-red-400/20 bg-[#581c1c]/15 p-4 text-red-200">
                        {error}
                    </div>
                )}

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

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <PrimaryButton
                        type="button"
                        onClick={() => {
                            setShowCreateForm((s) => !s);
                            setEditingTask(null);
                            resetTaskForm();
                        }}
                        className="w-full sm:w-auto rounded-full px-6 py-3 font-semibold"
                    >
                        {showCreateForm ? 'Cancel' : '+ Create Task'}
                    </PrimaryButton>
                    <PrimaryButton
                        type="button"
                        variant="glass"
                        onClick={() => setShowBulkImportModal(true)}
                        className="w-full sm:w-auto rounded-full px-6 py-3 font-semibold"
                    >
                        📥 Bulk Import
                    </PrimaryButton>
                </div>

                {showBulkImportModal && <BulkImportModal bulkImportText={bulkImportText} setBulkImportText={setBulkImportText} onClose={() => setShowBulkImportModal(false)} onSubmit={handleBulkImportSubmit} feedback={bulkImportFeedback} />}

                {(showCreateForm || editingTask) && <TaskForm modules={modules} formData={formData} setFormData={setFormData} onSubmit={handleCreateOrUpdate} editingTask={editingTask} onCancel={() => { setEditingTask(null); setShowCreateForm(false); resetTaskForm(); }} />}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="space-y-4 text-center">
                            <svg className="animate-spin h-10 w-10 text-amber-300 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            <p className="text-slate-300 font-medium">Loading tasks...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {TASK_COLUMNS.map((column) => {
                            const columnTasks = tasks.filter((t) => t.status === column.status);
                            return <KanbanColumn key={column.status} column={column} tasks={columnTasks} modules={modules} onStatusChange={handleUpdateTaskStatus} onEdit={startEdit} onDelete={handleDeleteTask} />;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tasks;
