import PrimaryButton from '../PrimaryButton';
import { TASK_TYPES, URGENCY_PRIORITY, URGENCY_STYLES, getModule, generateTaskTitle, formatDate, formatTime } from './taskConstants';

const GuidedTaskCreator = ({
    modules,
    guidedTaskForm,
    setGuidedTaskForm,
    showGuidedForm,
    setShowGuidedForm,
    onCreateTask,
    onCancel,
    guidedDurationError
}) => {
    const previewTitle = generateTaskTitle(guidedTaskForm, modules);
    const moduleInfo = getModule(modules, guidedTaskForm.module_id);

    return (
        <form
            onSubmit={onCreateTask}
            className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-2xl text-slate-100"
        >
            <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <label className="text-lg font-semibold text-white">Smart Guided Task Creator</label>
                </div>
                <p className="max-w-2xl text-slate-400">
                    Build a task quickly using module, task type, urgency, deadline, and optional duration.
                </p>
            </div>

            {!showGuidedForm ? (
                <PrimaryButton
                    type="button"
                    onClick={() => setShowGuidedForm(true)}
                    className="w-auto rounded-full px-8 py-4 font-bold"
                    variant="glass"
                >
                    + Create with Guided Form
                </PrimaryButton>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Module *</label>
                                <select
                                    value={guidedTaskForm.module_id}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, module_id: e.target.value }))}
                                    className="glass-input w-full"
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
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Task Type</label>
                                <select
                                    value={guidedTaskForm.taskType}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, taskType: e.target.value }))}
                                    className="glass-input w-full"
                                >
                                    {TASK_TYPES.map((type) => (
                                        <option key={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Urgency *</label>
                                <select
                                    value={guidedTaskForm.urgency}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, urgency: e.target.value }))}
                                    className="glass-input w-full"
                                >
                                    {Object.keys(URGENCY_PRIORITY).map((option) => (
                                        <option key={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Deadline *</label>
                                <input
                                    type="datetime-local"
                                    value={guidedTaskForm.deadline}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, deadline: e.target.value }))}
                                    className="glass-input w-full"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Estimated Duration (mins)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={guidedTaskForm.estimated_minutes}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, estimated_minutes: e.target.value }))}
                                    placeholder="Optional"
                                    className="glass-input w-full"
                                />
                                {guidedDurationError && <p className="mt-1 text-xs text-rose-300">{guidedDurationError}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Task Title (Optional)</label>
                                <input
                                    type="text"
                                    value={guidedTaskForm.title}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, title: e.target.value }))}
                                    placeholder={`e.g., ${previewTitle}`}
                                    className="glass-input w-full"
                                />
                                <p className="mt-1 text-xs text-slate-400">Leave blank to use: {previewTitle}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Notes</label>
                            <textarea
                                value={guidedTaskForm.description}
                                onChange={(e) => setGuidedTaskForm((s) => ({ ...s, description: e.target.value }))}
                                rows="3"
                                placeholder="Optional details to help you stay on track"
                                className="glass-input w-full min-h-[100px]"
                            />
                        </div>

                        <div className="flex flex-col gap-3 justify-end pt-4 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => {
                                    onCancel();
                                    setShowGuidedForm(false);
                                }}
                                className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <PrimaryButton type="submit" className="w-full sm:w-auto rounded-full px-6 py-3 font-bold">
                                Add Task
                            </PrimaryButton>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-glow">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Preview</p>
                                <h3 className="text-xl font-semibold text-white">Guided task summary</h3>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${URGENCY_STYLES[guidedTaskForm.urgency]}`}>
                                {guidedTaskForm.urgency}
                            </span>
                        </div>

                        <div className="space-y-3 text-slate-200">
                            <div className="rounded-2xl bg-slate-900/75 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Module</p>
                                <p className="mt-2 font-semibold">
                                    {moduleInfo?.module_code || 'Select a module'}
                                    {guidedTaskForm.module_id && ` — ${moduleInfo?.module_name}`}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-slate-900/75 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</p>
                                    <p className="mt-2 font-semibold">{guidedTaskForm.taskType}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-900/75 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Deadline</p>
                                    <p className="mt-2 font-semibold">
                                        {guidedTaskForm.deadline ? `${formatDate(guidedTaskForm.deadline)} • ${formatTime(guidedTaskForm.deadline)}` : 'Not set'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-slate-900/75 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Title</p>
                                    <p className="mt-2 font-semibold">{previewTitle}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-900/75 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Duration</p>
                                    <p className="mt-2 font-semibold">
                                        {guidedTaskForm.estimated_minutes ? `${guidedTaskForm.estimated_minutes} mins` : 'Optional'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

export default GuidedTaskCreator;
