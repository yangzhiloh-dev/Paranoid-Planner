import { getModule, formatDate, formatTime, getPriorityLabel } from './taskConstants';

const TaskCard = ({ task, modules, onStatusChange, onEdit, onDelete }) => {
    const moduleInfo = getModule(modules, task.module_id);

    const statusBadge = task.status === 'pending' ? 'Pending' : task.status === 'in_progress' ? 'In progress' : 'Completed';
    const statusColor = task.status === 'pending' ? 'text-blue-300 bg-blue-800/30' : task.status === 'in_progress' ? 'text-amber-300 bg-amber-800/25' : 'text-emerald-300 bg-emerald-800/25';

    return (
        <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 ${statusColor}`}>
                            <span className="text-base font-semibold">{task.status === 'pending' ? '○' : task.status === 'in_progress' ? '◐' : '✓'}</span>
                        </div>
                        <h3 className={`truncate text-base font-semibold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'}`}>
                            {task.title}
                        </h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        {moduleInfo ? moduleInfo.module_name : 'No module assigned'}
                    </p>
                </div>

                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${task.priority === 5
                    ? 'bg-red-500/15 text-red-200 border border-red-400/20'
                    : task.priority === 4
                        ? 'bg-amber-500/15 text-amber-200 border border-amber-400/20'
                        : task.priority === 3
                            ? 'bg-slate-700/70 text-slate-100 border border-slate-600/40'
                            : task.priority === 2
                                ? 'bg-blue-500/15 text-blue-200 border border-blue-400/20'
                                : 'bg-slate-700/70 text-slate-100 border border-slate-600/40'
                    }`}>
                    {getPriorityLabel(task.priority)}
                </span>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
                {task.deadline && (
                    <p className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatDate(task.deadline)} at {formatTime(task.deadline)}</span>
                    </p>
                )}

                {task.description && <p>{task.description}</p>}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                {task.status === 'pending' && (
                    <button
                        type="button"
                        onClick={() => onStatusChange(task.id, 'in_progress')}
                        className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                    >
                        Start
                    </button>
                )}

                {task.status !== 'completed' && (
                    <button
                        type="button"
                        onClick={() => onStatusChange(task.id, 'completed')}
                        className="rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
                    >
                        Complete
                    </button>
                )}

                {task.status === 'completed' && (
                    <button
                        type="button"
                        onClick={() => onStatusChange(task.id, 'pending')}
                        className="rounded-full bg-slate-700/70 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-700"
                    >
                        Reopen
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onEdit(task)}
                    className="rounded-full bg-amber-300/15 px-4 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-300/25"
                >
                    Edit
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    className="rounded-full bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default TaskCard;
