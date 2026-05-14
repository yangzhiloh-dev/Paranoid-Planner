// Tasks Page
// Display and manage tasks

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
  const [formData, setFormData] = useState({
    module_id: '',
    title: '',
    description: '',
    deadline: '',
    estimated_minutes: '',
    priority: 3,
    status: 'pending',
    preferred_start_time: '',
    preferred_end_time: ''
  });
  const [quickTaskInput, setQuickTaskInput] = useState('');
  const [quickParsePreview, setQuickParsePreview] = useState({
    title: '',
    module: '',
    deadline: '',
    priority: 'Medium'
  });
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [bulkImportFeedback, setBulkImportFeedback] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tasksRes, modulesRes] = await Promise.all([
          tasksAPI.getTasks(),
          modulesAPI.getModules()
        ]);
        setTasks(tasksRes.data.tasks || []);
        setModules(modulesRes.data.modules || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await tasksAPI.getTasks();
      setTasks(res.data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
    }
  };

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 2600);
    return () => clearTimeout(timer);
  }, [showToast]);

  const normalizeText = (text) => text.trim().replace(/\b(at|due|by|on|this|next)\b/gi, '').replace(/\s{2,}/g, ' ').trim();

  const parseDeadline = (text) => {
    const lower = text.toLowerCase();
    const now = new Date();
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const timeMatch =
      lower.match(/\b(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ||
      lower.match(/\b(\d{1,2}):(\d{2})\b/) ||
      lower.match(/\b(\d{1,2})\s*(am|pm)\b/);

    let hour = 20;
    let minute = 0;

    if (timeMatch) {
      hour = Number(timeMatch[1]);
      minute = timeMatch[2] && timeMatch[2].length === 2 ? Number(timeMatch[2]) : 0;
      if (timeMatch[3]) {
        const meridiem = timeMatch[3].toLowerCase();
        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
      }
    }

    const getTargetDate = (dayOffset) => {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(hour, minute, 0, 0);
      return date.toISOString();
    };

    if (lower.match(/\b(today|tonight)\b/)) {
      return getTargetDate(0);
    }

    if (lower.match(/\b(tomorrow)\b/)) {
      return getTargetDate(1);
    }

    const nextDayMatch = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    const dayMatch = lower.match(/\b(this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    const dayName = nextDayMatch ? nextDayMatch[1] : dayMatch ? dayMatch[2] : null;

    if (dayName) {
      const targetIndex = weekdays.indexOf(dayName);
      const currentIndex = now.getDay();
      let diff = targetIndex - currentIndex;
      if (diff < 0) diff += 7;
      if (nextDayMatch && diff === 0) diff = 7;
      return getTargetDate(diff);
    }

    return null;
  };

  const findModuleId = (text) => {
    const lower = text.toLowerCase();
    for (const module of modules) {
      const code = module.module_code?.toLowerCase();
      const name = module.module_name?.toLowerCase();
      if (code && new RegExp(`\\b${code.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`).test(lower)) {
        return module.id;
      }
      if (name && lower.includes(name)) {
        return module.id;
      }
      const shortName = name?.split(' ')[0];
      if (shortName && lower.includes(shortName) && shortName.length > 2) {
        return module.id;
      }
    }
    return null;
  };

  const parseQuickTaskInput = (text) => {
    const lower = text.toLowerCase();
    const priorityScore = lower.match(/\b(urgent|asap|high|important|critical|now|priority)\b/) ? 5 : lower.match(/\b(low|later|whenever)\b/) ? 1 : 3;
    const moduleId = findModuleId(text);
    const deadline = parseDeadline(text);

    const title = normalizeText(
      text
        .replace(/\b(urgent|asap|high|important|critical|now|priority)\b/gi, '')
        .replace(/\b(today|tomorrow|next\s+\w+|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
        .replace(/@?\s*\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, '')
        .replace(/\b(by|due|deadline|at|on)\b/gi, '')
    );

    const moduleLabel = moduleId
      ? `${modules.find((m) => m.id === moduleId)?.module_code || ''}`
      : '';

    return {
      title: title || text.trim(),
      priority: priorityScore,
      module_id: moduleId,
      moduleLabel,
      deadline,
    };
  };

  const updateQuickPreview = (value) => {
    const parsed = parseQuickTaskInput(value);
    setQuickParsePreview({
      title: parsed.title,
      module: parsed.moduleLabel || 'Not detected',
      deadline: parsed.deadline ? new Date(parsed.deadline).toLocaleString() : 'No deadline found',
      priority: parsed.priority === 5 ? 'High' : parsed.priority === 1 ? 'Low' : 'Medium'
    });
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsed = parseQuickTaskInput(quickTaskInput);
    let moduleId = parsed.module_id;
    if (!moduleId && modules.length === 1) {
      moduleId = modules[0].id;
    }

    if (!parsed.title) {
      setError('Please type a task to add.');
      return;
    }

    if (!moduleId) {
      setError('Quick add needs a module keyword. Use module code or name in your sentence.');
      return;
    }

    try {
      await tasksAPI.createTask({
        title: parsed.title,
        module_id: moduleId,
        deadline: parsed.deadline || null,
        priority: parsed.priority,
        description: ''
      });
      setQuickTaskInput('');
      setQuickParsePreview({ title: '', module: '', deadline: '', priority: 'Medium' });
      setToastMessage('Task created successfully');
      setShowToast(true);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add task');
    }
  };

  const handleQuickInputChange = (value) => {
    setQuickTaskInput(value);
    updateQuickPreview(value);
  };

  const handleUpdateTaskStatus = async (id, status) => {
    try {
      await tasksAPI.updateTask(id, { status });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task status');
    }
  };

  const parseBulkImportTasks = (text) =>
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ ...parseQuickTaskInput(line), raw: line }));

  const handleBulkImportSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBulkImportFeedback('');

    const parsedLines = parseBulkImportTasks(bulkImportText);
    if (parsedLines.length === 0) {
      setBulkImportFeedback('Enter at least one task line.');
      return;
    }

    const moduleFallback = modules.length === 1 ? modules[0].id : null;
    const created = [];
    const skipped = [];

    for (const item of parsedLines) {
      const moduleId = item.module_id || moduleFallback;
      if (!moduleId) {
        skipped.push(item.raw || item.title || 'Unknown task');
        continue;
      }

      try {
        await tasksAPI.createTask({
          title: item.title,
          module_id: moduleId,
          deadline: item.deadline || null,
          priority: item.priority,
          description: ''
        });
        created.push(item.title);
      } catch (err) {
        skipped.push(`${item.title}: ${err.response?.data?.error || err.message}`);
      }
    }

    if (created.length) {
      await fetchTasks();
      setBulkImportText('');
    }

    const summary = [
      created.length ? `${created.length} task${created.length > 1 ? 's' : ''} added` : null,
      skipped.length ? `${skipped.length} skipped` : null
    ]
      .filter(Boolean)
      .join('. ');

    setBulkImportFeedback(summary || 'No tasks were imported.');
    if (created.length && skipped.length === 0) {
      setShowBulkImportModal(false);
    }
  };

  const renderTaskCard = (task) => (
    <div
      key={task.id}
      className={`rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg ${task.status === 'completed' ? 'opacity-90 ring-1 ring-emerald-100' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{task.status === 'pending' ? 'To Do' : task.status === 'in_progress' ? 'In Progress' : 'Completed'}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{getPriorityLabel(task.priority)}</span>
      </div>
      <p className="mt-3 text-sm text-slate-600">Module: {getModuleName(task.module_id)}</p>
      {task.deadline && <p className="mt-2 text-sm text-slate-600">Deadline: {new Date(task.deadline).toLocaleString()}</p>}
      {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {task.status === 'pending' && (
          <button
            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
            className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-600"
          >
            Start
          </button>
        )}
        {task.status !== 'completed' && (
          <button
            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
            className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-600"
          >
            Complete
          </button>
        )}
        {task.status === 'completed' && (
          <button
            onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
            className="rounded-full bg-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 transition hover:bg-slate-400"
          >
            Reopen
          </button>
        )}
        <button
          onClick={() => startEdit(task)}
          className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-amber-500"
        >
          Edit
        </button>
        <button
          onClick={() => handleDeleteTask(task.id)}
          className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-600"
        >
          Delete
        </button>
      </div>
    </div>
  );

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.module_id || !formData.title || !formData.deadline) {
      setError('Module, title, and deadline are required');
      return;
    }

    try {
      const taskData = {
        ...formData,
        priority: Number(formData.priority),
        estimated_minutes: formData.estimated_minutes ? Number(formData.estimated_minutes) : null
      };
      await tasksAPI.createTask(taskData);
      setFormData({
        module_id: '',
        title: '',
        description: '',
        deadline: '',
        estimated_minutes: '',
        priority: 3,
        status: 'pending',
        preferred_start_time: '',
        preferred_end_time: ''
      });
      setShowCreateForm(false);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.module_id || !formData.title || !formData.deadline) {
      setError('Module, title, and deadline are required');
      return;
    }

    try {
      const taskData = {
        ...formData,
        priority: Number(formData.priority),
        estimated_minutes: formData.estimated_minutes ? Number(formData.estimated_minutes) : null
      };
      await tasksAPI.updateTask(editingTask.id, taskData);
      setEditingTask(null);
      setFormData({
        module_id: '',
        title: '',
        description: '',
        deadline: '',
        estimated_minutes: '',
        priority: 3,
        status: 'pending',
        preferred_start_time: '',
        preferred_end_time: ''
      });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksAPI.deleteTask(id);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await tasksAPI.updateTask(id, { status: 'completed' });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark task as completed');
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setFormData({
      module_id: task.module_id,
      title: task.title,
      description: task.description || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      estimated_minutes: task.estimated_minutes || '',
      priority: Number(task.priority) || 3,
      status: task.status,
      preferred_start_time: task.preferred_start_time || '',
      preferred_end_time: task.preferred_end_time || ''
    });
  };

  const getPriorityLabel = (priority) => {
    const p = Number(priority);
    switch (p) {
      case 1:
        return 'Low';
      case 2:
        return 'Low-Medium';
      case 3:
        return 'Medium';
      case 4:
        return 'Medium-High';
      case 5:
        return 'High';
      default:
        return 'Medium';
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setFormData({
      module_id: '',
      title: '',
      description: '',
      deadline: '',
      estimated_minutes: '',
      priority: 3,
      status: 'pending',
      preferred_start_time: '',
      preferred_end_time: ''
    });
  };

  const getModuleName = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.module_name : 'Unknown Module';
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Tasks</h1>

        {showToast && (
          <div className="fixed right-4 top-24 z-50 max-w-xs rounded-2xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-xl transition duration-300 sm:right-8">
            {toastMessage}
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleQuickAddSubmit} className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <label htmlFor="quick-task" className="text-sm font-semibold text-slate-700 block mb-1">Quick Add Task</label>
              <input
                id="quick-task"
                type="text"
                value={quickTaskInput}
                onChange={(e) => handleQuickInputChange(e.target.value)}
                placeholder="e.g. finish cs2030 assignment friday 8pm"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <p className="mt-2 text-sm text-slate-500">Try: finish CS2030S assignment Friday 8pm high priority</p>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4 text-sm text-slate-600">
            <span className="rounded-full bg-white px-3 py-2 shadow-sm">Priority: {quickParsePreview.priority}</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-sm">Due: {quickParsePreview.deadline || 'No deadline'}</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-sm">Module: {quickParsePreview.module || 'Not detected'}</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-sm">Title preview: {quickParsePreview.title || 'Type to preview'}</span>
          </div>
        </form>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {showCreateForm ? 'Cancel' : 'Create Task'}
          </button>
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="bg-slate-800 text-white px-4 py-2 rounded"
          >
            Bulk Import Tasks
          </button>
        </div>

        {showBulkImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Bulk Import Tasks</h2>
                  <p className="text-sm text-slate-600">Paste one task per line. Example: CS2030 Assignment 1 - Friday</p>
                </div>
                <button
                  onClick={() => setShowBulkImportModal(false)}
                  className="text-slate-500 transition hover:text-slate-900"
                >
                  Close
                </button>
              </div>
              <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                <textarea
                  rows="8"
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="CS2030 Assignment 1 - Friday\nST2334 Quiz - Sunday\nOrbital Slides - Next Tuesday"
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 p-4 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {bulkImportFeedback && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{bulkImportFeedback}</p>
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBulkImportModal(false)}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Import Tasks
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {(showCreateForm || editingTask) && (
          <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="bg-gray-100 p-4 rounded mb-4">
            <div className="mb-2">
              <label className="block text-sm font-medium">Module</label>
              <select
                value={formData.module_id}
                onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Module</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.module_code} - {module.module_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {showAdvancedOptions ? 'Hide' : 'Show'} advanced options
            </button>
            {showAdvancedOptions && (
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="mb-2">
                  <label className="block text-sm font-medium">Estimated Minutes</label>
                  <input
                    type="number"
                    value={formData.estimated_minutes}
                    onChange={(e) => setFormData({ ...formData, estimated_minutes: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="1">Low</option>
                    <option value="3">Medium</option>
                    <option value="5">High</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium">Preferred Start Time</label>
                  <input
                    type="time"
                    value={formData.preferred_start_time}
                    onChange={(e) => setFormData({ ...formData, preferred_start_time: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-sm font-medium">Preferred End Time</label>
                  <input
                    type="time"
                    value={formData.preferred_end_time}
                    onChange={(e) => setFormData({ ...formData, preferred_end_time: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            )}
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
              {editingTask ? 'Update' : 'Create'}
            </button>
            {editingTask && (
              <button type="button" onClick={cancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded">
                Cancel
              </button>
            )}
          </form>
        )}

        {loading ? (
          <p>Loading tasks...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: 'To Do', status: 'pending' },
              { title: 'In Progress', status: 'in_progress' },
              { title: 'Completed', status: 'completed' }
            ].map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column.status);
              return (
                <div key={column.status} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{column.title}</h2>
                      <p className="text-sm text-slate-500">{columnTasks.length} {columnTasks.length === 1 ? 'task' : 'tasks'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">{column.title}</span>
                  </div>
                  {columnTasks.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                      {column.status === 'pending'
                        ? 'No tasks waiting. Add one with quick add.'
                        : column.status === 'in_progress'
                        ? 'No tasks in progress. Start one from To Do.'
                        : 'No completed tasks yet. Mark a task complete.'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {columnTasks.map(renderTaskCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

