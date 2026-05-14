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

  // ============================================================
  // SMART PARSER HELPER FUNCTIONS
  // ============================================================

  const normalizeModuleCode = (code) => {
    return code.trim().toUpperCase().replace(/\s+/g, '');
  };

  const parseTime = (text) => {
    const lower = text.toLowerCase();
    
    // Match time formats: "8pm", "8 pm", "at 8pm", "20:00", "8:30am"
    const patterns = [
      { 
        regex: /\b(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
        getTime: (m) => {
          let hour = Number(m[1]);
          const minute = m[2] ? Number(m[2]) : 0;
          const meridiem = m[3]?.toLowerCase();
          if (meridiem === 'pm' && hour < 12) hour += 12;
          if (meridiem === 'am' && hour === 12) hour = 0;
          return { hour, minute };
        }
      },
      { 
        regex: /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
        getTime: (m) => {
          let hour = Number(m[1]);
          const minute = Number(m[2]);
          const meridiem = m[3]?.toLowerCase();
          if (meridiem === 'pm' && hour < 12) hour += 12;
          if (meridiem === 'am' && hour === 12) hour = 0;
          return { hour, minute };
        }
      },
      { 
        regex: /\b(\d{1,2})\s*(am|pm)\b/i,
        getTime: (m) => {
          let hour = Number(m[1]);
          const minute = 0;
          const meridiem = m[2]?.toLowerCase();
          if (meridiem === 'pm' && hour < 12) hour += 12;
          if (meridiem === 'am' && hour === 12) hour = 0;
          return { hour, minute };
        }
      }
    ];

    for (const { regex, getTime } of patterns) {
      const match = lower.match(regex);
      if (match) {
        return { ...getTime(match), matched: true };
      }
    }

    return { hour: 20, minute: 0, matched: false }; // Default 8pm
  };

  const parseRelativeDate = (text) => {
    const lower = text.toLowerCase();
    const now = new Date();
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const { hour, minute } = parseTime(text);

    const getTargetDate = (dayOffset) => {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(hour, minute, 0, 0);
      return date;
    };

    if (lower.match(/\b(today|tonight)\b/)) {
      return getTargetDate(0);
    }

    if (lower.match(/\b(tomorrow)\b/)) {
      return getTargetDate(1);
    }

    const nextDayMatch = lower.match(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
    const dayName = nextDayMatch ? nextDayMatch[1] : dayMatch ? dayMatch[1] : null;

    if (dayName) {
      const targetIndex = weekdays.indexOf(dayName);
      const currentIndex = now.getDay();
      let diff = targetIndex - currentIndex;
      if (diff <= 0) diff += 7; // Always future
      if (nextDayMatch && diff === 0) diff = 7;
      return getTargetDate(diff);
    }

    return null;
  };

  const parseSpecificDate = (text) => {
    const lower = text.toLowerCase();
    const { hour, minute } = parseTime(text);

    // Patterns for specific dates
    const patterns = [
      // 2026-05-20, 2026-05-20 20:00
      {
        regex: /(\d{4})-(\d{1,2})-(\d{1,2})/,
        parse: (m) => new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), hour, minute)
      },
      // 20/05/2026, 20/05
      {
        regex: /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/,
        parse: (m) => {
          const day = Number(m[1]);
          const month = Number(m[2]);
          const year = m[3] ? Number(m[3]) : new Date().getFullYear();
          return new Date(year, month - 1, day, hour, minute);
        }
      },
      // "20 May", "May 20", "20 May 2026"
      {
        regex: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*(?:\s+(\d{4}))?/i,
        parse: (m) => {
          const day = Number(m[1]);
          const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
          const month = months[m[2].toLowerCase().substring(0, 3)];
          const year = m[3] ? Number(m[3]) : new Date().getFullYear();
          return new Date(year, month, day, hour, minute);
        }
      },
      // "May 20", "May 20 2026"
      {
        regex: /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2})(?:\s+(\d{4}))?/i,
        parse: (m) => {
          const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
          const month = months[m[1].toLowerCase().substring(0, 3)];
          const day = Number(m[2]);
          const year = m[3] ? Number(m[3]) : new Date().getFullYear();
          return new Date(year, month, day, hour, minute);
        }
      }
    ];

    for (const { regex, parse } of patterns) {
      const match = lower.match(regex);
      if (match) {
        const date = parse(match);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  };

  const parseDeadline = (text) => {
    // Try specific date first
    let date = parseSpecificDate(text);
    if (date && !isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Fall back to relative date
    date = parseRelativeDate(text);
    if (date && !isNaN(date.getTime())) {
      return date.toISOString();
    }

    return null;
  };

  const detectPriority = (text) => {
    const lower = text.toLowerCase();
    if (lower.match(/\b(urgent|asap|critical|now)\b/)) return 5;
    if (lower.match(/\b(high|important|priority)\b/)) return 5;
    if (lower.match(/\b(low|later|whenever)\b/)) return 1;
    return 3; // Medium default
  };

  const detectModule = (text) => {
    if (modules.length === 0) return null;

    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);

    // Check for exact module code match
    for (const module of modules) {
      const moduleCodeNorm = normalizeModuleCode(module.module_code);
      for (const word of words) {
        if (normalizeModuleCode(word) === moduleCodeNorm) {
          return { id: module.id, code: module.module_code };
        }
      }
    }

    // Check for module name match (full or short)
    for (const module of modules) {
      const moduleName = module.module_name?.toLowerCase() || '';
      const shortName = moduleName.split(' ')[0];

      if (moduleName && lower.includes(moduleName)) {
        return { id: module.id, code: module.module_code };
      }

      if (shortName && shortName.length > 2 && lower.includes(shortName)) {
        return { id: module.id, code: module.module_code };
      }
    }

    return null;
  };

  const removeParsedFragmentsFromTitle = (text, moduleInfo, deadline, priority) => {
    let title = text;

    // Remove module code
    if (moduleInfo?.code) {
      const codePattern = new RegExp(`\\b${normalizeModuleCode(moduleInfo.code).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
      title = title.replace(codePattern, '');
    }

    // Remove priority keywords
    title = title.replace(/\b(urgent|asap|high|important|critical|now|priority|low|later|whenever)\b/gi, '');

    // Remove date/time expressions in various formats
    title = title.replace(/\b(today|tonight|tomorrow)\b/gi, '');
    title = title.replace(/\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
    title = title.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
    title = title.replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*/gi, '');
    
    // Remove dates: 2026-05-20, 20/05/2026, 20/05, 20-05
    title = title.replace(/\d{4}-\d{1,2}-\d{1,2}/g, '');
    title = title.replace(/\d{1,2}[/-]\d{1,2}(?:[/-]\d{4})?/g, '');
    
    // Remove time: at 8pm, 8pm, 20:00, 8:30am
    title = title.replace(/\b(?:at|@)\s*\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, '');
    title = title.replace(/\b\d{1,2}:\d{2}(?:\s*(am|pm))?\b/gi, ''); // 20:00 or 8:30pm
    title = title.replace(/\b\d{1,2}\s*(am|pm)\b/gi, ''); // 8pm

    // Remove connector words
    title = title.replace(/\b(by|due|deadline|at|on|this)\b/gi, '');

    // Clean up extra whitespace
    title = title.trim().replace(/\s{2,}/g, ' ').trim();

    return title;
  };

  const parseQuickTaskInput = (text) => {
    const moduleInfo = detectModule(text);
    const priority = detectPriority(text);
    const deadline = parseDeadline(text);

    const title = removeParsedFragmentsFromTitle(text, moduleInfo, deadline, priority);

    return {
      title: title || text.trim(),
      priority,
      module_id: moduleInfo?.id || null,
      moduleLabel: moduleInfo?.code || '',
      deadline,
    };
  };

  const updateQuickPreview = (value) => {
    const parsed = parseQuickTaskInput(value);
    const deadlineDate = parsed.deadline ? new Date(parsed.deadline) : null;
    const deadlineStr = deadlineDate ? deadlineDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No deadline';
    const priorityLabel = parsed.priority === 5 ? 'High' : parsed.priority === 1 ? 'Low' : 'Medium';

    setQuickParsePreview({
      title: parsed.title || '(title will be extracted)',
      module: parsed.moduleLabel || '(not detected)',
      deadline: deadlineStr,
      priority: priorityLabel
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

  const renderTaskCard = (task) => {
    const statusColor = task.status === 'pending' ? 'blue' : task.status === 'in_progress' ? 'amber' : 'emerald';
    const statusBorderMap = {
      pending: 'border-l-4 border-l-blue-500',
      in_progress: 'border-l-4 border-l-amber-500',
      completed: 'border-l-4 border-l-emerald-500'
    };
    const statusIcon = task.status === 'pending' ? '○' : task.status === 'in_progress' ? '◐' : '✓';

    return (
      <div
        key={task.id}
        className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-xl hover:-translate-y-1 ${statusBorderMap[task.status]} ${task.status === 'completed' ? 'opacity-85' : ''}`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${
                task.status === 'pending' ? 'text-blue-500' : 
                task.status === 'in_progress' ? 'text-amber-500' : 
                'text-emerald-500'
              }`}>{statusIcon}</span>
              <h3 className={`text-base font-semibold ${
                task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
              }`}>{task.title}</h3>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
            task.priority === 5 ? 'bg-red-500' :
            task.priority === 4 ? 'bg-orange-500' :
            task.priority === 3 ? 'bg-amber-500' :
            task.priority === 2 ? 'bg-blue-500' :
            'bg-slate-500'
          }`}>{getPriorityLabel(task.priority)}</span>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          {modules.find(m => m.id === task.module_id) && (
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full`} style={{ backgroundColor: modules.find(m => m.id === task.module_id)?.color || '#e2e8f0' }}></span>
              <span className="font-medium">{getModuleName(task.module_id)}</span>
            </div>
          )}
          {task.deadline && <p>📅 {new Date(task.deadline).toLocaleDateString()} at {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
          {task.description && <p className="mt-2 text-slate-600">{task.description}</p>}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {task.status === 'pending' && (
            <button
              onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-200 active:scale-95"
            >
              Start
            </button>
          )}
          {task.status !== 'completed' && (
            <button
              onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
              className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 active:scale-95"
            >
              Complete
            </button>
          )}
          {task.status === 'completed' && (
            <button
              onClick={() => handleUpdateTaskStatus(task.id, 'pending')}
              className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 active:scale-95"
            >
              Reopen
            </button>
          )}
          <button
            onClick={() => startEdit(task)}
            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-200 active:scale-95"
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteTask(task.id)}
            className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-200 active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Task Management</h1>
          <p className="text-slate-600">Organize, prioritize, and track your work efficiently</p>
        </div>

        {showToast && (
          <div className="fixed right-4 top-24 z-50 max-w-xs rounded-2xl bg-emerald-600 px-4 py-3 text-sm text-white shadow-xl transition duration-300 sm:right-8">
            {toastMessage}
          </div>
        )}

        {error && <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p>}

        <form onSubmit={handleQuickAddSubmit} className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8 shadow-2xl transition duration-300 hover:shadow-3xl">
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <label htmlFor="quick-task" className="text-lg font-bold text-white">AI Quick Add</label>
            </div>
            <p className="text-blue-100">Type naturally. We'll parse the deadline, priority, and module automatically.</p>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <input
                id="quick-task"
                type="text"
                value={quickTaskInput}
                onChange={(e) => handleQuickInputChange(e.target.value)}
                placeholder="e.g. finish cs2030 assignment friday 8pm"
                className="w-full rounded-2xl border-0 bg-white/90 px-5 py-4 text-slate-900 placeholder-slate-500 shadow-lg backdrop-blur transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <p className="mt-2 text-sm text-blue-100">Try: finish CS2030S assignment Friday 8pm high priority</p>
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-white px-8 py-4 font-bold text-blue-600 transition hover:scale-105 hover:shadow-lg active:scale-95"
            >
              Add Task
            </button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 text-sm text-white border border-white/20 transition hover:bg-white/20 hover:border-white/40 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <div>
                  <span className="block font-bold text-white/80 text-xs uppercase">Priority</span>
                  <span className={`${quickParsePreview.priority === 'High' ? 'text-red-300' : quickParsePreview.priority === 'Low' ? 'text-blue-300' : 'text-amber-300'} font-semibold`}>{quickParsePreview.priority}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 text-sm text-white border border-white/20 transition hover:bg-white/20 hover:border-white/40 animate-in fade-in duration-300 delay-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">📅</span>
                <div>
                  <span className="block font-bold text-white/80 text-xs uppercase">Due</span>
                  <span className="font-semibold text-emerald-300 truncate">{quickParsePreview.deadline}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 text-sm text-white border border-white/20 transition hover:bg-white/20 hover:border-white/40 animate-in fade-in duration-300 delay-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">📚</span>
                <div>
                  <span className="block font-bold text-white/80 text-xs uppercase">Module</span>
                  <span className={`font-semibold ${quickParsePreview.module.includes('not detected') ? 'text-slate-300' : 'text-blue-300'}`}>{quickParsePreview.module}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 text-sm text-white border border-white/20 transition hover:bg-white/20 hover:border-white/40 animate-in fade-in duration-300 delay-300">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg flex-shrink-0">✨</span>
                <div className="min-w-0">
                  <span className="block font-bold text-white/80 text-xs uppercase">Title</span>
                  <span className="font-semibold text-slate-200 truncate">{quickParsePreview.title || '(type to preview)'}</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white transition hover:shadow-lg hover:-translate-y-1 active:scale-95"
          >
            {showCreateForm ? '✕ Cancel' : '+ Create Task'}
          </button>
          <button
            onClick={() => setShowBulkImportModal(true)}
            className="rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-3 font-semibold text-white transition hover:shadow-lg hover:-translate-y-1 active:scale-95"
          >
            📥 Bulk Import
          </button>
        </div>

        {showBulkImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">📥 Bulk Import Tasks</h2>
                  <p className="mt-1 text-sm text-slate-600">Paste one task per line. Each line is parsed automatically.</p>
                </div>
                <button
                  onClick={() => setShowBulkImportModal(false)}
                  className="text-slate-400 transition hover:text-slate-900 text-xl"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleBulkImportSubmit} className="space-y-4">
                <textarea
                  rows="8"
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder="CS2030 Assignment 1 - Friday\nST2334 Quiz - Sunday\nOrbital Slides - Next Tuesday"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {bulkImportFeedback && (
                  <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 border border-slate-200">{bulkImportFeedback}</p>
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBulkImportModal(false)}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 font-semibold text-white transition hover:shadow-lg hover:-translate-y-1 active:scale-95"
                  >
                    Import Tasks
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {(showCreateForm || editingTask) && (
          <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">{editingTask ? '✏️ Edit Task' : '✨ Create Task'}</h3>
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
            <button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 font-semibold transition hover:shadow-lg hover:-translate-y-1 active:scale-95 mr-2">
              {editingTask ? 'Update' : 'Create'}
            </button>
            {editingTask && (
              <button type="button" onClick={cancelEdit} className="rounded-xl bg-slate-400 text-white px-6 py-3 font-semibold transition hover:bg-slate-500 active:scale-95">
                Cancel
              </button>
            )}
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="space-y-4 text-center">
              <div className="animate-spin text-4xl">⚙️</div>
              <p className="text-slate-600 font-medium">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { title: 'To Do', status: 'pending', color: 'blue', icon: '📋' },
              { title: 'In Progress', status: 'in_progress', color: 'amber', icon: '⚡' },
              { title: 'Completed', status: 'completed', color: 'emerald', icon: '✅' }
            ].map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column.status);
              const colorClasses = {
                blue: 'bg-blue-50 border-blue-200',
                amber: 'bg-amber-50 border-amber-200',
                emerald: 'bg-emerald-50 border-emerald-200'
              };
              const headerClasses = {
                blue: 'from-blue-500 to-blue-600',
                amber: 'from-amber-500 to-amber-600',
                emerald: 'from-emerald-500 to-emerald-600'
              };
              return (
                <div key={column.status} className={`rounded-2xl border-2 ${colorClasses[column.color]} overflow-hidden shadow-sm transition hover:shadow-md`}>
                  <div className={`bg-gradient-to-r ${headerClasses[column.color]} px-6 py-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{column.icon}</span>
                        <div>
                          <h2 className="text-lg font-bold text-white">{column.title}</h2>
                          <p className="text-sm text-white/80">{columnTasks.length} {columnTasks.length === 1 ? 'task' : 'tasks'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    {columnTasks.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
                        <div className="text-4xl mb-2">
                          {column.status === 'pending'
                            ? '🎯'
                            : column.status === 'in_progress'
                            ? '🚀'
                            : '🎉'}
                        </div>
                        <p className="text-sm text-slate-500">
                          {column.status === 'pending'
                            ? 'No tasks waiting. Add one with quick add.'
                            : column.status === 'in_progress'
                            ? 'No tasks in progress. Start one from To Do.'
                            : 'No completed tasks yet. Mark a task complete.'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {columnTasks.map(renderTaskCard)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

