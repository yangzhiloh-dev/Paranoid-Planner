import PrimaryButton from '../PrimaryButton';

const TaskForm = ({ modules, formData, setFormData, onSubmit, editingTask, onCancel }) => {
    return (
        <form
            onSubmit={onSubmit}
            className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl space-y-4"
        >
            <h3 className="text-lg font-semibold text-white">{editingTask ? '✏️ Edit Task' : '✨ Create Task'}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Module</label>
                    <select
                        value={formData.module_id}
                        onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                        className="glass-input w-full"
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

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="glass-input w-full"
                        required
                    />
                </div>

                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="glass-input w-full min-h-[120px] resize-none"
                        rows="3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Deadline</label>
                    <input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="glass-input w-full"
                        required
                    />
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {editingTask && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        Cancel
                    </button>
                )}
                <PrimaryButton type="submit" className="w-full sm:w-auto rounded-full px-6 py-3 font-semibold">
                    {editingTask ? 'Update' : 'Create'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default TaskForm;
