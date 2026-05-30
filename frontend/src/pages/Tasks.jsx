// Tasks Page — simplified and compact
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { tasksAPI, modulesAPI } from '../api/api';

export const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({ module_id: '', title: '', description: '', deadline: '', estimated_minutes: '', priority: 3, status: 'pending' });
    const [guidedTaskForm, setGuidedTaskForm] = useState({ module_id: '', taskType: 'Assignment', title: '', urgency: 'Medium', deadline: '', estimated_minutes: '', description: '' });
    const [showGuidedForm, setShowGuidedForm] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [bulkImportText, setBulkImportText] = useState('');
    const [bulkImportFeedback, setBulkImportFeedback] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    useEffect(() => { const load = async () => { setLoading(true); try { const [t, m] = await Promise.all([tasksAPI.getTasks(), modulesAPI.getModules()]); setTasks(t.data.tasks || []); setModules(m.data.modules || []); } catch (e) { setError(e.response?.data?.error || 'Load failed'); } finally { setLoading(false); } }; load(); }, []);
    useEffect(() => { if (!showToast) return; const t = setTimeout(() => setShowToast(false), 2600); return () => clearTimeout(t); }, [showToast]);

    const fetchTasks = async () => { try { const r = await tasksAPI.getTasks(); setTasks(r.data.tasks || []); } catch (e) { setError(e.response?.data?.error || 'Failed to fetch tasks'); } }

    const urgencyToPriority = u => ({ Low: 1, Medium: 3, High: 5, Critical: 5 })[u] || 3;
    const generateTaskTitle = g => g.title || (modules.find(m => m.id === g.module_id)?.module_code || 'Task') + ' ' + g.taskType;

    const handleGuidedTaskSubmit = async e => {
        e.preventDefault();
        setError('');
        if (!guidedTaskForm.module_id || !guidedTaskForm.deadline) {
            setError('Module and deadline required');
            return;
        }

        const est = guidedTaskForm.estimated_minutes === '' || guidedTaskForm.estimated_minutes == null
            ? null
            : Number(guidedTaskForm.estimated_minutes);
        if (est !== null && (!Number.isFinite(est) || est <= 0)) {
            setError('Estimated minutes must be a positive number');
            return;
        }

        try {
            await tasksAPI.createTask({
                module_id: guidedTaskForm.module_id,
                title: generateTaskTitle(guidedTaskForm),
                description: guidedTaskForm.description,
                deadline: guidedTaskForm.deadline,
                priority: urgencyToPriority(guidedTaskForm.urgency),
                estimated_minutes: est,
                status: 'pending'
            });
            setGuidedTaskForm({ module_id: '', taskType: 'Assignment', title: '', urgency: 'Medium', deadline: '', estimated_minutes: '', description: '' });
            setShowGuidedForm(false);
            setToastMessage('Task created successfully');
            setShowToast(true);
            fetchTasks();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create task');
        }
    };

    const handleCreateOrUpdate = async e => {
        e.preventDefault();
        setError('');
        if (!formData.module_id || !formData.title || !formData.deadline) {
            setError('Module, title, and deadline required');
            return;
        }

        const est = formData.estimated_minutes === '' || formData.estimated_minutes == null
            ? null
            : Number(formData.estimated_minutes);
        if (est !== null && (!Number.isFinite(est) || est <= 0)) {
            setError('Estimated minutes must be a positive number');
            return;
        }

        try {
            const payload = { ...formData, priority: Number(formData.priority), estimated_minutes: est };
            if (editingTask) {
                await tasksAPI.updateTask(editingTask.id, payload);
                setEditingTask(null);
            } else {
                await tasksAPI.createTask(payload);
                setShowCreateForm(false);
            }
            setFormData({ module_id: '', title: '', description: '', deadline: '', estimated_minutes: '', priority: 3, status: 'pending' });
            fetchTasks();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed');
        }
    };

    const handleUpdateTaskStatus = async (id, status) => { try { await tasksAPI.updateTask(id, { status }); fetchTasks(); } catch (e) { setError(e.response?.data?.error || 'Status update failed'); } };
    const handleDeleteTask = async id => { if (!confirm('Delete this task?')) return; try { await tasksAPI.deleteTask(id); fetchTasks(); } catch (e) { setError(e.response?.data?.error || 'Delete failed'); } };
    const startEdit = t => { setEditingTask(t); setFormData({ module_id: t.module_id, title: t.title, description: t.description || '', deadline: t.deadline ? new Date(t.deadline).toISOString().slice(0, 16) : '', estimated_minutes: t.estimated_minutes || '', priority: Number(t.priority) || 3, status: t.status }); setShowCreateForm(true); };
    const getPriorityLabel = p => ({ 1: 'Low', 2: 'Low-Medium', 3: 'Medium', 4: 'Medium-High', 5: 'High' })[Number(p)] || 'Medium';
    const getModuleName = id => modules.find(m => m.id === id)?.module_name || 'Unknown Module';

    const handleBulkImportSubmit = async e => { e.preventDefault(); setBulkImportFeedback(''); const lines = bulkImportText.split(/\r?\n/).map(l => l.trim()).filter(Boolean); if (!lines.length) { setBulkImportFeedback('Enter at least one task line.'); return; } const fallback = modules.length === 1 ? modules[0].id : null; const created = [], skipped = []; for (const line of lines) { try { let moduleId = modules.find(m => line.toUpperCase().includes(m.module_code.toUpperCase()))?.id || fallback; if (!moduleId) { skipped.push(line); continue; } const title = line.replace(new RegExp(modules.find(m => m.id === moduleId).module_code, 'gi'), '').trim() || line; await tasksAPI.createTask({ title, module_id: moduleId, priority: 3, description: '' }); created.push(title); } catch (e) { skipped.push(line); } } if (created.length) { await fetchTasks(); setBulkImportText(''); } setBulkImportFeedback([created.length ? `${created.length} added` : null, skipped.length ? `${skipped.length} skipped` : null].filter(Boolean).join('. ')); if (created.length && skipped.length === 0) setShowBulkImportModal(false); };

    const renderTaskCard = task => (
        <div key={task.id} className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${task.status === 'pending' ? 'border-l-4 border-l-blue-500' : task.status === 'in_progress' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`text-lg ${task.status === 'pending' ? 'text-blue-500' : task.status === 'in_progress' ? 'text-amber-500' : 'text-emerald-500'}`}>{task.status === 'pending' ? '○' : task.status === 'in_progress' ? '◐' : '✓'}</span>
                        <h3 className={`text-base font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>{task.title}</h3>
                    </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${task.priority === 5 ? 'bg-red-500' : task.priority === 4 ? 'bg-orange-500' : task.priority === 3 ? 'bg-amber-500' : task.priority === 2 ? 'bg-blue-500' : 'bg-slate-500'}`}>{getPriorityLabel(task.priority)}</span>
            </div>
            <div className="space-y-2 text-sm text-slate-600">{modules.find(m => m.id === task.module_id) && <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: modules.find(m => m.id === task.module_id)?.color || '#e2e8f0' }}></span><span className="font-medium">{getModuleName(task.module_id)}</span></div>}{task.deadline && <p>📅 {new Date(task.deadline).toLocaleDateString()} at {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}{task.description && <p className="mt-2 text-slate-600">{task.description}</p>}</div>
            <div className="mt-4 flex flex-wrap gap-2">{task.status === 'pending' && <button onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Start</button>}{task.status !== 'completed' && <button onClick={() => handleUpdateTaskStatus(task.id, 'completed')} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Complete</button>}{task.status === 'completed' && <button onClick={() => handleUpdateTaskStatus(task.id, 'pending')} className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">Reopen</button>}<button onClick={() => startEdit(task)} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Edit</button><button onClick={() => handleDeleteTask(task.id)} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Delete</button></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 space-y-2"><h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Task Management</h1><p className="text-slate-600">Organize, prioritize, and track your work efficiently</p></div>
                {showToast && <div className="fixed right-4 top-24 z-50 max-w-xs rounded-2xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-xl">{toastMessage}</div>}
                {error && <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>}

                {/* Guided Creator */}
                <form onSubmit={handleGuidedTaskSubmit} className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500 p-8 shadow-2xl">
                    <div className="mb-6 space-y-2"><div className="flex items-center gap-2"><span className="text-2xl">🎯</span><label className="text-lg font-bold text-white">Smart Guided Task Creator</label></div><p className="text-purple-100">Create tasks quickly by selecting module, task type, urgency, and deadline.</p></div>
                    {!showGuidedForm ? <button type="button" onClick={() => setShowGuidedForm(true)} className="rounded-2xl bg-white px-8 py-4 font-bold text-purple-600">+ Create with Guided Form</button> : (
                        <div className="space-y-4">{/* form fields compacted */}
                            <div className="grid gap-4 sm:grid-cols-2"><div><label className="block text-sm font-semibold text-white mb-2">Module *</label><select value={guidedTaskForm.module_id} onChange={e => setGuidedTaskForm(s => ({ ...s, module_id: e.target.value }))} className="w-full rounded-xl border-0 bg-white/90 px-4 py-2 text-slate-900 shadow-md"><option value="">Select Module</option>{modules.map(m => <option key={m.id} value={m.id}>{m.module_code} - {m.module_name}</option>)}</select></div>
                                <div><label className="block text-sm font-semibold text-white mb-2">Task Type</label><select value={guidedTaskForm.taskType} onChange={e => setGuidedTaskForm(s => ({ ...s, taskType: e.target.value }))} className="w-full rounded-xl border-0 bg-white/90 px-4 py-2 text-slate-900 shadow-md"><option>Assignment</option><option>Quiz</option><option>Project</option><option>Reading</option><option>Revision</option><option>Exam</option><option>Other</option></select></div>
                                <div><label className="block text-sm font-semibold text-white mb-2">Urgency *</label><select value={guidedTaskForm.urgency} onChange={e => setGuidedTaskForm(s => ({ ...s, urgency: e.target.value }))} className="w-full rounded-xl border-0 bg-white/90 px-4 py-2 text-slate-900 shadow-md"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></div>
                                <div><label className="block text-sm font-semibold text-white mb-2">Deadline *</label><input type="datetime-local" value={guidedTaskForm.deadline} onChange={e => setGuidedTaskForm(s => ({ ...s, deadline: e.target.value }))} className="w-full rounded-xl border-0 bg-white/90 px-4 py-2 text-slate-900 shadow-md" required /></div></div>
                            <div><label className="block text-sm font-semibold text-white mb-2">Task Title (Optional)</label><input type="text" value={guidedTaskForm.title} onChange={e => setGuidedTaskForm(s => ({ ...s, title: e.target.value }))} placeholder={`e.g., ${generateTaskTitle(guidedTaskForm)}`} className="w-full rounded-xl border-0 bg-white/90 px-4 py-2 text-slate-900 shadow-md" /><p className="mt-1 text-xs text-purple-100">Leave empty to auto-generate: {generateTaskTitle(guidedTaskForm)}</p></div>
                            <div className="flex gap-3 justify-end pt-4"><button type="button" onClick={() => { setShowGuidedForm(false); setGuidedTaskForm({ module_id: '', taskType: 'Assignment', title: '', urgency: 'Medium', deadline: '', estimated_minutes: '', description: '' }); }} className="rounded-xl bg-white/20 border border-white/30 px-6 py-2 font-semibold text-white">Cancel</button><button type="submit" className="rounded-xl bg-white px-6 py-2 font-bold text-purple-600">Create Task</button></div></div>)}
                </form>

                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => setShowCreateForm(!showCreateForm)} className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white">{showCreateForm ? '✕ Cancel' : '+ Create Task'}</button><button onClick={() => setShowBulkImportModal(true)} className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-3 font-semibold text-white">📥 Bulk Import</button></div>

                {showBulkImportModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-2xl font-bold text-slate-900">📥 Bulk Import Tasks</h2><p className="mt-1 text-sm text-slate-600">Paste one task per line. If module code is present it will be used, otherwise first module is fallback.</p></div><button onClick={() => setShowBulkImportModal(false)} className="text-slate-400 text-xl">✕</button></div><form onSubmit={handleBulkImportSubmit} className="space-y-4"><textarea rows="8" value={bulkImportText} onChange={e => setBulkImportText(e.target.value)} placeholder="CS2030 Assignment 1 - Friday\nST2334 Quiz - Sunday" className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4" />{bulkImportFeedback && <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 border border-slate-200">{bulkImportFeedback}</p>}<div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowBulkImportModal(false)} className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700">Cancel</button><button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 font-semibold text-white">Import Tasks</button></div></form></div></div>)}

                {(showCreateForm || editingTask) && (<form onSubmit={handleCreateOrUpdate} className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-md space-y-4"><h3 className="text-lg font-bold text-slate-900">{editingTask ? '✏️ Edit Task' : '✨ Create Task'}</h3><div className="grid gap-4 sm:grid-cols-2"><div><label className="block text-sm font-medium">Module</label><select value={formData.module_id} onChange={e => setFormData({ ...formData, module_id: e.target.value })} className="w-full p-2 border rounded" required><option value="">Select Module</option>{modules.map(m => <option key={m.id} value={m.id}>{m.module_code} - {m.module_name}</option>)}</select></div><div><label className="block text-sm font-medium">Title</label><input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-2 border rounded" required /></div><div><label className="block text-sm font-medium">Description</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded" rows="3" /></div><div><label className="block text-sm font-medium">Deadline</label><input type="datetime-local" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full p-2 border rounded" required /></div></div><div className="flex gap-3"><button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 font-semibold">{editingTask ? 'Update' : 'Create'}</button>{editingTask && <button type="button" onClick={() => { setEditingTask(null); setFormData({ module_id: '', title: '', description: '', deadline: '', estimated_minutes: '', priority: 3, status: 'pending' }); }} className="rounded-xl bg-slate-400 text-white px-6 py-3 font-semibold">Cancel</button>}</div></form>)}

                {loading ? (<div className="flex items-center justify-center py-12"><div className="space-y-4 text-center"><div className="animate-spin text-4xl">⚙️</div><p className="text-slate-600 font-medium">Loading tasks...</p></div></div>) : (
                    <div className="grid gap-6 lg:grid-cols-3">{
                        (() => {
                            const columns = [
                                { title: 'To Do', status: 'pending', color: 'blue', icon: '📋' },
                                { title: 'In Progress', status: 'in_progress', color: 'amber', icon: '⚡' },
                                { title: 'Completed', status: 'completed', color: 'emerald', icon: '✅' }
                            ];
                            const colorClasses = { blue: 'bg-blue-50 border-blue-200', amber: 'bg-amber-50 border-amber-200', emerald: 'bg-emerald-50 border-emerald-200' };
                            const headerClasses = { blue: 'from-blue-500 to-blue-600', amber: 'from-amber-500 to-amber-600', emerald: 'from-emerald-500 to-emerald-600' };
                            return columns.map(column => {
                                const columnTasks = tasks.filter(t => t.status === column.status);
                                return (
                                    <div key={column.status} className={`rounded-2xl border-2 ${colorClasses[column.color]} overflow-hidden shadow-sm`}>
                                        <div className={`bg-gradient-to-r ${headerClasses[column.color]} px-6 py-4`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{column.icon}</span>
                                                <div>
                                                    <h2 className="text-lg font-bold text-white">{column.title}</h2>
                                                    <p className="text-sm text-white/80">{columnTasks.length} {columnTasks.length === 1 ? 'task' : 'tasks'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            {columnTasks.length === 0 ? (
                                                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
                                                    <div className="text-4xl mb-2">{column.status === 'pending' ? '🎯' : column.status === 'in_progress' ? '🚀' : '🎉'}</div>
                                                    <p className="text-sm text-slate-500">{column.status === 'pending' ? 'No tasks waiting. Add one with guided creator.' : column.status === 'in_progress' ? 'No tasks in progress. Start one from To Do.' : 'No completed tasks yet. Mark a task complete.'}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">{columnTasks.map(renderTaskCard)}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()
                    }</div>)}

            </div>
        </div>
    );
};
