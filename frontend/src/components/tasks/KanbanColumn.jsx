import TaskCard from './TaskCard';
import { BOARD_STYLES, HEADER_STYLES } from './taskConstants';

const KanbanColumn = ({ column, tasks, modules, onStatusChange, onEdit, onDelete }) => {
    return (
        <div className={`rounded-2xl border-2 ${BOARD_STYLES[column.color]} overflow-hidden shadow-sm`}>
            <div className={`bg-gradient-to-r ${HEADER_STYLES[column.color]} px-6 py-4`}>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{column.icon}</span>
                    <div>
                        <h2 className="text-lg font-bold text-white">{column.title}</h2>
                        <p className="text-sm text-white/80">
                            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="p-4">
                {tasks.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
                        <div className="text-4xl mb-2">
                            {column.status === 'pending' ? '🎯' : column.status === 'in_progress' ? '🚀' : '🎉'}
                        </div>
                        <p className="text-sm text-slate-500">{column.emptyText}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
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
