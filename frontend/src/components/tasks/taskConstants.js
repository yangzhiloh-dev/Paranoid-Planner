export const EMPTY_TASK_FORM = {
    module_id: '',
    title: '',
    description: '',
    deadline: '',
    estimated_minutes: '',
    priority: 3,
    status: 'pending'
};

export const EMPTY_GUIDED_FORM = {
    module_id: '',
    taskType: 'Assignment',
    title: '',
    urgency: 'Medium',
    deadline: '',
    estimated_minutes: '',
    description: ''
};

export const URGENCY_PRIORITY = { Low: 1, Medium: 3, High: 5, Critical: 5 };
export const URGENCY_STYLES = {
    Low: 'bg-emerald-100 text-emerald-700',
    Medium: 'bg-amber-100 text-amber-700',
    High: 'bg-orange-100 text-orange-700',
    Critical: 'bg-rose-100 text-rose-700'
};

export const TASK_TYPES = ['Assignment', 'Quiz', 'Project', 'Reading', 'Revision', 'Exam', 'Other'];

export const TASK_COLUMNS = [
    {
        title: 'To Do',
        status: 'pending',
        color: 'blue',
        icon: '📋',
        emptyText: 'No tasks waiting. Add one with guided creator.'
    },
    {
        title: 'In Progress',
        status: 'in_progress',
        color: 'amber',
        icon: '⚡',
        emptyText: 'No tasks in progress. Start one from To Do.'
    },
    {
        title: 'Completed',
        status: 'completed',
        color: 'emerald',
        icon: '✅',
        emptyText: 'No completed tasks yet. Mark a task complete.'
    }
];

export const BOARD_STYLES = {
    blue: 'bg-blue-50 border-blue-200',
    amber: 'bg-amber-50 border-amber-200',
    emerald: 'bg-emerald-50 border-emerald-200'
};

export const HEADER_STYLES = {
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600'
};

export const PRIORITY_LABEL = {
    1: 'Low',
    2: 'Low-Medium',
    3: 'Medium',
    4: 'Medium-High',
    5: 'High'
};

export const getPriorityLabel = (priority) => PRIORITY_LABEL[Number(priority)] || 'Medium';

export const getModule = (modules, id) => modules.find((module) => module.id === id) || null;
export const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '');
export const formatTime = (value) =>
    value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

export const parseOptionalPositiveNumber = (value) => {
    if (value === '' || value === null || value === undefined) return null;

    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) return NaN;

    return number;
};

export const buildTaskPayload = (data) => {
    const estimated = parseOptionalPositiveNumber(data.estimated_minutes);
    return { ...data, priority: Number(data.priority), estimated_minutes: estimated };
};

export const buildGuidedTaskPayload = (guided, modules) => {
    const moduleCode = getModule(modules, guided.module_id)?.module_code || 'Task';
    const estimated = parseOptionalPositiveNumber(guided.estimated_minutes);

    return {
        module_id: guided.module_id,
        title: guided.title.trim() || `${moduleCode} ${guided.taskType}`,
        description: guided.description,
        deadline: guided.deadline,
        priority: URGENCY_PRIORITY[guided.urgency] ?? 3,
        estimated_minutes: estimated,
        status: 'pending'
    };
};

export const generateTaskTitle = (guided, modules) => {
    const moduleCode = getModule(modules, guided.module_id)?.module_code || 'Task';
    return guided.title.trim() || `${moduleCode} ${guided.taskType}`;
};
