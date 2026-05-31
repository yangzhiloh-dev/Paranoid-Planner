import PrimaryButton from '../PrimaryButton';

const TaskForm = ({ modules, formData, setFormData, onSubmit, editingTask, onCancel }) => {
    return (
        <form
            onSubmit={onSubmit}
            className="mb-8 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-6 shadow-md space-y-4"
        >
            <h3 className="text-lg font-bold text-slate-900">{editingTask ? '✏️ Edit Task' : '✨ Create Task'}</h3>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
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

                <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2 border rounded"
                        rows="3"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Deadline</label>
                    <input
                        type="datetime-local"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <PrimaryButton type="submit" className="w-auto rounded-xl px-6 py-3 font-semibold">
                    {editingTask ? 'Update' : 'Create'}
                </PrimaryButton>

                {editingTask && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl bg-slate-400 text-white px-6 py-3 font-semibold"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default TaskForm;
