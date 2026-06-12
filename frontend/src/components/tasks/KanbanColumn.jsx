import TaskCard from './TaskCard';
import { BOARD_STYLES, HEADER_STYLES } from './taskConstants';

const KanbanColumn = ({ column, tasks, modules, onStatusChange, onEdit, onDelete }) => {
    const statusEmoji = column.status === 'pending' ? '🎯' : column.status === 'in_progress' ? '🚀' : '🎉';

    return (
        <div className="rounded-[32px] border border-white/10 bg-white/5 shadow-glow backdrop-blur-xl overflow-hidden">
            <div className={`bg-slate-950/90 border-b border-white/10 px-5 py-5`}>
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{column.icon}</span>
                    <div>
                        <h2 className="text-lg font-semibold text-white">{column.title}</h2>
                        <p className="text-sm text-slate-400">
                            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="p-5">
                {tasks.length === 0 ? (
                    <div className="glass-card border-dashed border-white/10 p-8 text-center">
                        <div className="text-4xl mb-3">{statusEmoji}</div>
                        <p className="text-sm text-slate-400">{column.emptyText}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                modules={modules}
                                onStatusChange={onStatusChange}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
