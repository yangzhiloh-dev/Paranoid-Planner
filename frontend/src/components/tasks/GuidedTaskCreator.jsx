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
            className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 shadow-2xl text-slate-100"
        >
            <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <label className="text-lg font-bold text-white">Smart Guided Task Creator</label>
                </div>
                <p className="max-w-2xl text-slate-300">
                    Build a task quickly using module, task type, urgency, deadline, and optional duration.
                </p>
            </div>

            {!showGuidedForm ? (
                <PrimaryButton
                    type="button"
                    onClick={() => setShowGuidedForm(true)}
                    className="w-auto rounded-2xl px-8 py-4 font-bold"
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        color: '#ffffff'
                    }}
                >
                    + Create with Guided Form
                </PrimaryButton>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
                    <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Module *</label>
                                <select
                                    value={guidedTaskForm.module_id}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, module_id: e.target.value }))}
                                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-2 text-slate-900 shadow-sm"
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
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Task Type</label>
                                <select
                                    value={guidedTaskForm.taskType}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, taskType: e.target.value }))}
                                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-2 text-slate-900 shadow-sm"
                                >
                                    {TASK_TYPES.map((type) => (
                                        <option key={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Urgency *</label>
                                <select
                                    value={guidedTaskForm.urgency}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, urgency: e.target.value }))}
                                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-2 text-slate-900 shadow-sm"
                                >
                                    {Object.keys(URGENCY_PRIORITY).map((option) => (
                                        <option key={option}>{option}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Deadline *</label>
                                <input
                                    type="datetime-local"
                                    value={guidedTaskForm.deadline}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, deadline: e.target.value }))}
                                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-2 text-slate-900 shadow-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Estimated Duration (mins)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={guidedTaskForm.estimated_minutes}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, estimated_minutes: e.target.value }))}
                                    placeholder="Optional"
                                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-2 text-slate-900 shadow-sm"
                                />
                                {guidedDurationError && <p className="mt-1 text-xs text-rose-200">{guidedDurationError}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Task Title (Optional)</label>
                                <input
                                    type="text"
                                    value={guidedTaskForm.title}
                                    onChange={(e) => setGuidedTaskForm((s) => ({ ...s, title: e.target.value }))}
                                    placeholder={`e.g., ${previewTitle}`}
                                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-2 text-slate-900 shadow-sm"
                                />
                                <p className="mt-1 text-xs text-slate-300">Leave blank to use: {previewTitle}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">Notes</label>
                            <textarea
                                value={guidedTaskForm.description}
                                onChange={(e) => setGuidedTaskForm((s) => ({ ...s, description: e.target.value }))}
                                rows="3"
                                placeholder="Optional details to help you stay on track"
                                className="w-full rounded-3xl border-0 bg-slate-100 px-4 py-3 text-slate-900 shadow-sm"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    onCancel();
                                    setShowGuidedForm(false);
                                }}
                                className="rounded-xl bg-white/10 border border-white/20 px-6 py-2 font-semibold text-slate-100"
                            >
                                Cancel
                            </button>
                            <PrimaryButton type="submit" className="w-auto rounded-xl px-6 py-2 font-bold">
                                Add Task
                            </PrimaryButton>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/15 bg-slate-950/70 p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Preview</p>
                                <h3 className="text-xl font-bold text-white">Guided task summary</h3>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${URGENCY_STYLES[guidedTaskForm.urgency]}`}>
                                {guidedTaskForm.urgency}
                            </span>
                        </div>

                        <div className="space-y-3 text-slate-200">
                            <div className="rounded-2xl bg-slate-900/70 p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Module</p>
                                <p className="mt-2 font-semibold">
                                    {moduleInfo?.module_code || 'Select a module'}
                                    {guidedTaskForm.module_id && ` — ${moduleInfo?.module_name}`}
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-slate-900/70 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Type</p>
                                    <p className="mt-2 font-semibold">{guidedTaskForm.taskType}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-900/70 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Deadline</p>
                                    <p className="mt-2 font-semibold">
                                        {guidedTaskForm.deadline ? `${formatDate(guidedTaskForm.deadline)} • ${formatTime(guidedTaskForm.deadline)}` : 'Not set'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-slate-900/70 p-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Title</p>
                                    <p className="mt-2 font-semibold">{previewTitle}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-900/70 p-4">
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
