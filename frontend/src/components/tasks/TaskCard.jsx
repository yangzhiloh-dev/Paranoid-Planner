import { getModule, formatDate, formatTime, getPriorityLabel } from './taskConstants';

const TaskCard = ({ task, modules, onStatusChange, onEdit, onDelete }) => {
    const moduleInfo = getModule(modules, task.module_id);

    return (
        <div
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${task.status === 'pending'
                    ? 'border-l-4 border-l-blue-500'
                    : task.status === 'in_progress'
                        ? 'border-l-4 border-l-amber-500'
                        : 'border-l-4 border-l-emerald-500'
                }`}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-lg ${task.status === 'pending'
                                    ? 'text-blue-500'
                                    : task.status === 'in_progress'
                                        ? 'text-amber-500'
                                        : 'text-emerald-500'
                                }`}
                        >
                            {task.status === 'pending' ? '○' : task.status === 'in_progress' ? '◐' : '✓'}
                        </span>
                        <h3 className={`text-base font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.title}
                        </h3>
                    </div>
                </div>
                <span
                    className={`rounded-full px-3 py-1 text-xs font-bold text-white ${task.priority === 5
                            ? 'bg-red-500'
                            : task.priority === 4
                                ? 'bg-orange-500'
                                : task.priority === 3
                                    ? 'bg-amber-500'
                                    : task.priority === 2
                                        ? 'bg-blue-500'
                                        : 'bg-slate-500'
                        }`}
                >
                    {getPriorityLabel(task.priority)}
                </span>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
                {moduleInfo && (
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: moduleInfo.color || '#e2e8f0' }} />
                        <span className="font-medium">{moduleInfo.module_name}</span>
                    </div>
                )}

                {task.deadline && (
                    <p>
                        📅 {formatDate(task.deadline)} at {formatTime(task.deadline)}
                    </p>
                )}

                {task.description && <p className="mt-2 text-slate-600">{task.description}</p>}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {task.status === 'pending' && (
                    <button
                        type="button"
                        onClick={() => onStatusChange(task.id, 'in_progress')}
                        className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                        Start
                    </button>
                )}

                {task.status !== 'completed' && (
                    <button
                        type="button"
                        onClick={() => onStatusChange(task.id, 'completed')}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                        Complete
                    </button>
                )}

                {task.status === 'completed' && (
                    <button
                        type="button"
                        onClick={() => onStatusChange(task.id, 'pending')}
                        className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                        Reopen
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => onEdit(task)}
                    className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700"
                >
                    Edit
                </button>

                <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default TaskCard;
