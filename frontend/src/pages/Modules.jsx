import { useEffect, useState } from 'react';
import randomColor from 'randomcolor';
import { FaBookOpen, FaEdit, FaTrash } from 'react-icons/fa';
import { modulesAPI, scheduleAPI, tasksAPI } from '../api/api';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import PrimaryButton from '../components/PrimaryButton';
import './Dashboard.css';

// NUSMods academic years begin in August.
const NUSMODS_ACADEMIC_YEAR = (() => {
  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${startYear + 1}`;
})();

const getRandomModuleColor = () =>
  randomColor({
    luminosity: 'bright',
    format: 'hex',
  });

const DAY_OF_WEEK = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const MODULE_CODE_REGEX = /^[A-Z]{2,4}\d{4}[A-Z]{0,3}$/;
const COMPLETED_STATUS = 'completed';

const isActiveTask = (task) => task.status !== COMPLETED_STATUS;

const parseTaskDeadline = (deadline) => {
  if (!deadline) return null;

  const parsedDeadline = new Date(deadline);
  return Number.isNaN(parsedDeadline.getTime()) ? null : parsedDeadline;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getTasksForModule = (tasks, moduleId) =>
  tasks.filter((task) => String(task.module_id) === String(moduleId));

const getActiveTasksForModule = (tasks, moduleId) =>
  getTasksForModule(tasks, moduleId).filter(isActiveTask);

const getDueThisWeekCount = (tasks, now = new Date()) => {
  const weekEnd = addDays(now, 7);

  return tasks.filter((task) => {
    const deadline = parseTaskDeadline(task.deadline);
    return Boolean(deadline && deadline >= now && deadline <= weekEnd);
  }).length;
};

const getHighPriorityCount = (tasks) =>
  tasks.filter((task) => Number(task.priority) >= 5).length;

const getNextDeadline = (tasks, now = new Date()) =>
  tasks
    .map((task) => parseTaskDeadline(task.deadline))
    .filter((deadline) => deadline && deadline >= now)
    .sort((firstDeadline, secondDeadline) => firstDeadline - secondDeadline)[0] || null;

const getLessonCountForModule = (module, lessons) => {
  if (Array.isArray(lessons)) {
    return lessons.filter((lesson) => String(lesson.module_id) === String(module.id)).length;
  }

  if (Array.isArray(module.lessons)) return module.lessons.length;

  return null;
};

const formatModuleDeadline = (deadline) => {
  if (!deadline) return null;

  const date = deadline instanceof Date ? deadline : parseTaskDeadline(deadline);
  if (!date) return null;

  const options = {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
  };

  return new Intl.DateTimeFormat('en', options).format(date);
};

const normalizeActivityType = (lessonType) => {
  const type = lessonType.toUpperCase();
  if (type === 'LEC' || type.includes('LECTURE')) return 'LEC';
  if (type === 'LAB' || type.includes('LABORATORY')) return 'LAB';
  if (['TUT', 'REC', 'SEC'].includes(type) || type.includes('TUTORIAL') || type.includes('RECITATION') || type.includes('SECTIONAL')) return 'TUT';
  return null;
};

const formatNusModsTime = (time) => `${time.slice(0, 2)}:${time.slice(2)}`;

const getShareParams = (url) => {
  if ([...url.searchParams].length > 0) return url.searchParams;

  // Some copied links place their query parameters after a hash fragment.
  const hashQuery = url.hash.includes('?') ? url.hash.slice(url.hash.indexOf('?') + 1) : '';
  return new URLSearchParams(hashQuery);
};

// Parse the semester, modules, and selected class groups from a NUSMods share URL.
const parseNusModsShareLink = (shareLink) => {
  let url;

  try {
    url = new URL(shareLink.trim());
  } catch {
    throw new Error('Enter a valid NUSMods share link');
  }

  if ((url.hostname !== 'nusmods.com' && !url.hostname.endsWith('.nusmods.com')) || !url.pathname.includes('/timetable/')) {
    throw new Error('Enter a valid NUSMods timetable share link');
  }

  const semesterMatch = url.pathname.match(/\/timetable\/sem-(\d)/);
  if (!semesterMatch || !['1', '2'].includes(semesterMatch[1])) {
    throw new Error('The NUSMods link must specify semester 1 or 2');
  }

  const shareParams = getShareParams(url);
  const selections = [...shareParams.entries()]
    .map(([moduleCode, value]) => ({
      moduleCode: moduleCode.trim().toUpperCase(),
      selectedClasses: [...value.matchAll(/([A-Z]+):\(([^)]+)\)/g)].map((match) => ({
        activityType: normalizeActivityType(match[1]),
        classNo: match[2],
      })).filter((selection) => selection.activityType),
    }))
    .filter(({ moduleCode }) => MODULE_CODE_REGEX.test(moduleCode));

  const uniqueSelections = [...new Map(selections.map((selection) => [selection.moduleCode, selection])).values()];

  if (uniqueSelections.length === 0) {
    throw new Error(
      'This timetable URL has no shared modules. In NUSMods, click Share, then copy the generated link (it should contain module codes after "?").'
    );
  }

  return { semester: Number(semesterMatch[1]), selections: uniqueSelections };
};

const fetchNusModsModule = async ({ moduleCode, selectedClasses }, semester) => {
  const res = await fetch(
    `https://api.nusmods.com/v2/${NUSMODS_ACADEMIC_YEAR}/modules/${encodeURIComponent(moduleCode)}.json`
  );

  if (!res.ok) {
    throw new Error(`Could not fetch ${moduleCode} from NUSMods`);
  }

  const module = await res.json();

  if (!module.title) {
    throw new Error(`NUSMods did not return a title for ${moduleCode}`);
  }

  const semesterData = module.semesterData?.find((entry) => entry.semester === semester);
  if (!semesterData) throw new Error(`${moduleCode} is not offered in semester ${semester}`);

  const normalizeClassNo = (classNo) => String(classNo).trim().toUpperCase();
  const matchesSelection = (lesson, selection) =>
    normalizeClassNo(selection.classNo) === normalizeClassNo(lesson.classNo)
    && selection.activityType === normalizeActivityType(lesson.lessonType);

  // A stale share link can point at class numbers from a different academic year.
  // Fail visibly instead of silently importing a module with no timetable blocks.
  const unmatchedClasses = selectedClasses.filter(
    (selection) => !semesterData.timetable.some((lesson) => matchesSelection(lesson, selection))
  );
  if (unmatchedClasses.length > 0) {
    const labels = unmatchedClasses
      .map((selection) => `${selection.activityType} ${selection.classNo}`)
      .join(', ');
    throw new Error(
      `${moduleCode}: ${labels} did not match the NUSMods ${NUSMODS_ACADEMIC_YEAR} semester ${semester} timetable. Copy a fresh share link from NUSMods.`
    );
  }

  // Keep exactly the class numbers selected in the share link.
  const lessons = semesterData.timetable
    .filter((lesson) => selectedClasses.some((selection) => matchesSelection(lesson, selection)))
    .map((lesson) => ({
      day_of_week: DAY_OF_WEEK[lesson.day],
      start_time: formatNusModsTime(lesson.startTime),
      end_time: formatNusModsTime(lesson.endTime),
      activity_type: normalizeActivityType(lesson.lessonType),
    }));

  return {
    module_code: moduleCode,
    module_name: module.title,
    color: getRandomModuleColor(),
    lessons,
    // NUSMods has no assignment feed; this field matches the backend import contract.
    assignments: [],
  };
};

const ModuleCard = ({ module, taskSummary, lessonCount, onEdit, onDelete }) => {
  const nextDeadlineLabel = formatModuleDeadline(taskSummary.nextDeadline);
  const hasActiveTasks = taskSummary.activeCount > 0;

  return (
    <article className="replica-card group flex min-h-56 flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/30 sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <div
          className="h-3.5 w-3.5 rounded-full ring-4 ring-white/5"
          style={{
            backgroundColor: module.color,
            boxShadow: `0 0 18px ${module.color}66`,
          }}
          aria-label={`Module color ${module.color}`}
        />
        <div className="flex gap-1 opacity-70 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(module)}
            className="grid h-9 w-9 place-items-center rounded-full border-0 bg-transparent text-[#b9a99d] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300"
            title="Edit"
            aria-label={`Edit ${module.module_code}`}
          >
            <FaEdit aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(module.id)}
            className="grid h-9 w-9 place-items-center rounded-full border-0 bg-transparent text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300"
            title="Delete"
            aria-label={`Delete ${module.module_code}`}
          >
            <FaTrash aria-hidden="true" />
          </button>
        </div>
      </div>

      <span className="card-kicker">Module</span>
      <h2 className="mb-2 text-xl font-bold tracking-tight text-[#fff7ed]">
        {module.module_code}
      </h2>
      <p className="m-0 text-sm leading-relaxed text-[#b9a99d]">
        {module.module_name}
      </p>

      <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
        {hasActiveTasks ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2">
                <span className="block text-base font-bold text-[#fff7ed]">
                  {taskSummary.activeCount}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#b9a99d]">
                  Active
                </span>
              </div>
              <div className="rounded-[10px] border border-amber-300/20 bg-amber-300/10 px-3 py-2">
                <span className="block text-base font-bold text-amber-100">
                  {taskSummary.dueThisWeekCount}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d8c8bb]">
                  Due week
                </span>
              </div>
              <div className="rounded-[10px] border border-orange-300/20 bg-orange-300/10 px-3 py-2">
                <span className="block text-base font-bold text-orange-100">
                  {taskSummary.highPriorityCount}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d8c8bb]">
                  High
                </span>
              </div>
            </div>

            {nextDeadlineLabel && (
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-white/10 bg-[#120b08]/70 px-3 py-2 text-sm">
                <span className="font-medium text-[#b9a99d]">Next deadline</span>
                <span className="font-semibold text-[#fff7ed]">{nextDeadlineLabel}</span>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-[10px] border border-dashed border-white/10 bg-white/[0.035] px-3 py-3 text-sm font-medium text-[#b9a99d]">
            No active tasks
          </div>
        )}

        {lessonCount !== null && (
          <div className="flex items-center justify-between gap-3 text-sm text-[#b9a99d]">
            <span>Fixed lessons</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-semibold text-[#f6e9df]">
              {lessonCount > 0
                ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}`
                : 'No fixed lessons'}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

const FormModal = ({ isOpen, onClose, onSubmit, initialData, isEditing, loading }) => {
  const [shareLink, setShareLink] = useState('');
  const [formData, setFormData] = useState(
    initialData || { module_code: '', module_name: '', color: '#3B82F6' }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ module_code: '', module_name: '', color: '#3B82F6' });
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) {
      setShareLink('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const succeeded = await onSubmit(isEditing ? formData : shareLink);

    if (!succeeded) return;

    if (isEditing) {
      setFormData({ module_code: '', module_name: '', color: '#3B82F6' });
    } else {
      setShareLink('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120b08]/85 p-4 backdrop-blur-sm">
      <div className="replica-card max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto p-6 sm:p-8">
        <span className="card-kicker">{isEditing ? 'Module details' : 'NUSMods timetable'}</span>
        <h2 className="mb-6 mt-0 text-2xl font-bold tracking-tight text-[#fff7ed]">
          {isEditing ? 'Edit Module' : 'Import from NUSMods'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isEditing ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#f6e9df]">
                  Module Code
                </label>
                <input
                  type="text"
                  value={formData.module_code}
                  onChange={(e) =>
                    setFormData({ ...formData, module_code: e.target.value })
                  }
                  placeholder="CS2030"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-[#806f64] transition-all focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#f6e9df]">
                  Module Name
                </label>
                <input
                  type="text"
                  value={formData.module_name}
                  onChange={(e) =>
                    setFormData({ ...formData, module_name: e.target.value })
                  }
                  placeholder="Programming Methodology II"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-[#806f64] transition-all focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-[#f6e9df]">
                  Module Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-white/[0.06]"
                    disabled={loading}
                  />
                  <div
                    className="flex-1 rounded-xl border border-white/10"
                    style={{ backgroundColor: formData.color }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#f6e9df]">
                NUSMods Share Link
              </label>
              <input
                type="url"
                value={shareLink}
                onChange={(e) => setShareLink(e.target.value)}
                placeholder="https://nusmods.com/timetable/sem-2/share?CFG1002=&CS2030S=LAB:(1);REC:(13);LEC:(44)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-white placeholder-[#806f64] transition-all focus:border-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-300/20"
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 font-semibold text-[#f6e9df] transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
              style={{ width: 'auto' }}
              loading={loading}
            >
              {isEditing ? 'Update' : 'Import'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Modules = () => {
  const [modules, setModules] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [lessons, setLessons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError('');
      const [moduleResult, taskResult, scheduleResult] = await Promise.allSettled([
        modulesAPI.getModules(),
        tasksAPI.getTasks(),
        scheduleAPI.getSchedule(),
      ]);

      if (moduleResult.status === 'rejected' || taskResult.status === 'rejected') {
        throw moduleResult.reason || taskResult.reason;
      }

      setModules(moduleResult.value.data.modules || []);
      setTasks(taskResult.value.data.tasks || []);
      setLessons(
        scheduleResult.status === 'fulfilled'
          ? scheduleResult.value.data?.lessons || []
          : null
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  const handleImportModules = async (shareLink) => {
    setError('');
    setNotice('');

    if (!shareLink.trim()) {
      setError('NUSMods share link is required');
      return false;
    }

    try {
      setSubmitting(true);
      const { semester, selections } = parseNusModsShareLink(shareLink);
      const importedModules = await Promise.all(
        selections.map((selection) => fetchNusModsModule(selection, semester))
      );

      const selectedClassCount = selections.reduce(
        (total, selection) => total + selection.selectedClasses.length,
        0
      );
      if (selectedClassCount === 0) {
        throw new Error(
          'The share link contains modules but no selected lecture, tutorial, or lab groups. Select your class groups in NUSMods and copy a new Share link.'
        );
      }

      // One transactional request persists modules and their fixed lesson blocks.
      const response = await modulesAPI.importModules(importedModules);
      const lessonCount = response.data?.summary?.lessons_imported
        ?? importedModules.reduce((total, module) => total + module.lessons.length, 0);

      setShowForm(false);
      setNotice(
        `Imported ${lessonCount} fixed timetable event${lessonCount === 1 ? '' : 's'}. They are now available on the Schedule page.`
      );
      fetchModules();
      return true;
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to import modules');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateModule = async (data) => {
    setError('');

    if (!data.module_code || !data.module_name) {
      setError('Module code and name are required');
      return false;
    }

    try {
      setSubmitting(true);
      await modulesAPI.updateModule(editingModule.id, data);
      setEditingModule(null);
      setShowForm(false);
      fetchModules();
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update module');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this module? This action cannot be undone.'
      )
    )
      return;

    try {
      await modulesAPI.deleteModule(id);
      fetchModules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete module');
    }
  };

  const startEdit = (module) => {
    setEditingModule(module);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingModule(null);
  };

  return (
    <div className="replica-stage">
      <div className="replica-shell">
        <DashboardSidebar />

        <main className="replica-main">
          <header className="replica-card mb-3 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="card-kicker">Course workspace</span>
              <h1 className="mb-0 mt-1 text-3xl font-bold tracking-tight text-[#fff7ed] sm:text-4xl">
                Modules
              </h1>
              <p className="mb-0 mt-2 max-w-2xl text-sm text-[#b9a99d]">
                Manage modules and learning materials in one place.
              </p>
            </div>
              <PrimaryButton
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full px-6 py-3 font-semibold sm:w-auto"
              >
                Import from NUSMods
              </PrimaryButton>
            </div>
          </header>

          {error && (
            <div className="replica-error" role="alert">
              {error}
            </div>
          )}

          {notice && !error && (
            <div className="mb-3 rounded-lg border border-emerald-300/25 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100" role="status">
              {notice}
            </div>
          )}

          <FormModal
            isOpen={showForm}
            onClose={closeForm}
            onSubmit={editingModule ? handleUpdateModule : handleImportModules}
            initialData={
              editingModule
                ? {
                    module_code: editingModule.module_code,
                    module_name: editingModule.module_name,
                    color: editingModule.color,
                  }
                : null
            }
            isEditing={!!editingModule}
            loading={submitting}
          />

          {loading ? (
            <section className="replica-card grid min-h-72 place-items-center p-12 text-center" aria-live="polite">
              <div>
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-amber-300/20 border-t-amber-300" />
                <p className="mb-0 mt-4 font-medium text-[#b9a99d]">Loading modules...</p>
              </div>
            </section>
          ) : modules.length === 0 ? (
            <section className="replica-card min-h-72 p-12 text-center">
              <FaBookOpen className="mx-auto mb-4 text-5xl text-amber-300" aria-hidden="true" />
              <h2 className="mb-2 text-2xl font-bold text-[#fff7ed]">No modules yet</h2>
              <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-[#b9a99d]">
                Import your NUSMods timetable to start organizing your courses and learning materials.
              </p>
              <PrimaryButton type="button" onClick={() => setShowForm(true)} className="px-6 py-3 font-semibold">
                Import from NUSMods
              </PrimaryButton>
            </section>
          ) : (
            <section aria-label="Your modules" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => {
                const activeModuleTasks = getActiveTasksForModule(tasks, module.id);
                const taskSummary = {
                  activeCount: activeModuleTasks.length,
                  dueThisWeekCount: getDueThisWeekCount(activeModuleTasks),
                  highPriorityCount: getHighPriorityCount(activeModuleTasks),
                  nextDeadline: getNextDeadline(activeModuleTasks),
                };

                return (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    taskSummary={taskSummary}
                    lessonCount={getLessonCountForModule(module, lessons)}
                    onEdit={startEdit}
                    onDelete={handleDeleteModule}
                  />
                );
              })}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Modules;
