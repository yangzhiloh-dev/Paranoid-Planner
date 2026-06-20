import { useState, useEffect } from 'react';
import randomColor from 'randomcolor';
import { Sidebar } from '../components/SideBar';
import { modulesAPI } from '../api/api';
import PrimaryButton from '../components/PrimaryButton';

const NUSMODS_ACADEMIC_YEAR = '2023-2024';

//changed from manual color selection to using a npm package to do it for me lol
const getRandomModuleColor = () =>
  randomColor({
    luminosity: 'bright',
    format: 'hex',
  });

  //we decided to use nusmods share link to import modules instead of manual
  //can explore esaier nad more ocnveneient alternatives option in teh future
const parseNusModsShareLink = (shareLink) => {
  let url;

  try {
    url = new URL(shareLink.trim());
  } catch {
    throw new Error('Enter a valid NUSMods share link');
  }

  if (!url.hostname.endsWith('nusmods.com') || !url.pathname.includes('/timetable/')) {
    throw new Error('Enter a valid NUSMods timetable share link');
  }

  const moduleCodes = [...url.searchParams.keys()]
    .map((moduleCode) => moduleCode.trim().toUpperCase())
    .filter(Boolean);

  const uniqueModuleCodes = [...new Set(moduleCodes)];

  if (uniqueModuleCodes.length === 0) {
    throw new Error('No module codes were found in the NUSMods link');
  }

  return uniqueModuleCodes;//ensure no dups exists
};

const fetchNusModsModule = async (moduleCode) => {
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

  return {
    module_code: moduleCode,
    module_name: module.title,
    color: getRandomModuleColor(),
  };
};

const ModuleCard = ({ module, onEdit, onDelete }) => (
  <div
    className="glass-card group p-6 transition-all duration-200 hover:border-amber-300/30"
  >
    {/* Color Indicator */}
    <div className="flex items-start justify-between mb-4">
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: module.color }}
      ></div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(module)}
          className="p-2 text-slate-300 hover:bg-white/10 rounded-lg transition-colors"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(module.id)}
          className="p-2 text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete"
        >
          -
        </button>
      </div>
    </div>

    {/* Content */}
    <h3 className="text-lg font-bold text-white mb-2">
      {module.module_code}
    </h3>
    <p className="text-slate-400 text-sm leading-relaxed">
      {module.module_name}
    </p>
  </div>
);

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

  return (//return modal with the following info: module code, module name, color
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="glass-panel max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          {isEditing ? 'Edit Module' : 'Import from NUSMods'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Module Code
                </label>
                <input
                  type="text"
                  value={formData.module_code}
                  onChange={(e) =>
                    setFormData({ ...formData, module_code: e.target.value })
                  }
                  placeholder="CS2030"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Module Name
                </label>
                <input
                  type="text"
                  value={formData.module_name}
                  onChange={(e) =>
                    setFormData({ ...formData, module_name: e.target.value })
                  }
                  placeholder="Programming Methodology II"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Module Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-16 h-11 border border-white/10 rounded-xl cursor-pointer bg-white/5"
                    disabled={loading}
                  />
                  <div
                    className="flex-1 rounded-xl border-2 border-white/10"
                    style={{ backgroundColor: formData.color }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                NUSMods Share Link
              </label>
              <input
                type="url"
                value={shareLink}
                onChange={(e) => setShareLink(e.target.value)}
                placeholder="https://nusmods.com/timetable/sem-2/share?CFG1002=&CS2030S=LAB:(1);REC:(13);LEC:(44)"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-transparent transition-all"
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
              className="flex-1 px-4 py-3 text-slate-200 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
              style={{ width: 'auto', backgroundColor: '#2563eb', color: '#000000' }}
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

//just a bunch of use state calls for different states of the webpage
export const Modules = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    module_code: '',
    module_name: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await modulesAPI.getModules();
      setModules(res.data.modules || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  const handleImportModules = async (shareLink) => {
    setError('');

    if (!shareLink.trim()) {
      setError('NUSMods share link is required');
      return false;
    }

    try {
      setSubmitting(true);
      const moduleCodes = parseNusModsShareLink(shareLink);
      const importedModules = await Promise.all(
        moduleCodes.map((moduleCode) => fetchNusModsModule(moduleCode))
      );

      for (const moduleData of importedModules) {
        try {
          await modulesAPI.createModule(moduleData);
        } catch (err) {
          if (err.response?.status !== 409) {
            throw err;
          }
        }
      }

      setShowForm(false);
      setFormData({ module_code: '', module_name: '', color: '#3B82F6' });
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
      setFormData({ module_code: '', module_name: '', color: '#3B82F6' });
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
    setFormData({
      module_code: module.module_code,
      module_name: module.module_name,
      color: module.color,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingModule(null);
    setFormData({ module_code: '', module_name: '', color: '#3B82F6' });
  };

  return (//just rendering ocmponents and passing in props to sidebar, module cards
    <div className="flex min-h-screen bg-[#1a0f08] text-white">
      <Sidebar />

      <main className="flex-1 px-6 py-8 ml-[88px] w-full">
        
        <header className="mb-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow backdrop-blur-2xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Modules</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Organize your coursework.</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Manage modules and learning materials in one place.
              </p>
            </div>
          <PrimaryButton
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto rounded-full px-6 py-3 font-semibold"
          >
            Import from NUSMods
          </PrimaryButton>
        </div>
      </header>

        
        {error && (
          <div className="mb-6 rounded-[28px] border border-red-400/20 bg-[#581c1c]/20 p-4 text-red-200">
            {error}
          </div>
        )}

        
        <FormModal
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={
            editingModule ? handleUpdateModule : handleImportModules
          }
          initialData={
            editingModule
              ? {
                  module_code: formData.module_code,
                  module_name: formData.module_name,
                  color: formData.color,
                }
              : null
          }
          isEditing={!!editingModule}
          loading={submitting}
        />

        
        {loading ? (
          <div className="glass-panel p-12 text-center">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-amber-300/20 border-t-amber-300 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-slate-400 font-medium">
              Loading modules...
            </p>
          </div>
        ) : modules.length === 0 ? (
         
          <div className="glass-panel p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              No modules yet
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Create your first module to start organizing your courses and
              learning materials
            </p>
            <PrimaryButton
           type="button"
           onClick={() => setShowForm(true)}
           className="rounded-full px-6 py-3 font-semibold"
            >
              Import from NUSMods
            </PrimaryButton>
          </div>
        ) : (
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onEdit={startEdit}
                onDelete={handleDeleteModule}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Modules;
