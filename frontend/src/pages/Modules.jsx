// Modules Page
// Display and manage modules

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { modulesAPI } from '../api/api';

const ModuleCard = ({ module, onEdit, onDelete }) => (
  <div
    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200 group cursor-pointer"
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
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Edit"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(module.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>

    {/* Content */}
    <h3 className="text-lg font-bold text-gray-900 mb-2">
      {module.module_code}
    </h3>
    <p className="text-gray-600 text-sm leading-relaxed">
      {module.module_name}
    </p>
  </div>
);

const FormModal = ({ isOpen, onClose, onSubmit, initialData, isEditing }) => {
  const [formData, setFormData] = useState(
    initialData || { module_code: '', module_name: '', color: '#3B82F6' }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ module_code: '', module_name: '', color: '#3B82F6' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Module' : 'Create Module'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Module Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Module Code
            </label>
            <input
              type="text"
              value={formData.module_code}
              onChange={(e) =>
                setFormData({ ...formData, module_code: e.target.value })
              }
              placeholder="CS2030"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Module Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Module Name
            </label>
            <input
              type="text"
              value={formData.module_name}
              onChange={(e) =>
                setFormData({ ...formData, module_name: e.target.value })
              }
              placeholder="Programming Methodology II"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Module Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className="w-16 h-11 border border-gray-300 rounded-xl cursor-pointer"
              />
              <div
                className="flex-1 rounded-xl border-2 border-gray-300"
                style={{ backgroundColor: formData.color }}
              ></div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 rounded-xl font-semibold transition-all"
            >
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Modules = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
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

  const handleCreateModule = async (data) => {
    setError('');

    if (!data.module_code || !data.module_name) {
      setError('Module code and name are required');
      return;
    }

    try {
      await modulesAPI.createModule(data);
      setShowForm(false);
      setFormData({ module_code: '', module_name: '', color: '#3B82F6' });
      fetchModules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create module');
    }
  };

  const handleUpdateModule = async (data) => {
    setError('');

    if (!data.module_code || !data.module_name) {
      setError('Module code and name are required');
      return;
    }

    try {
      await modulesAPI.updateModule(editingModule.id, data);
      setEditingModule(null);
      setFormData({ module_code: '', module_name: '', color: '#3B82F6' });
      setShowForm(false);
      fetchModules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update module');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Modules</h1>
            <p className="text-gray-600">
              Organize your coursework and learning materials
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            + Create Module
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Form Modal */}
        <FormModal
          isOpen={showForm}
          onClose={closeForm}
          onSubmit={
            editingModule ? handleUpdateModule : handleCreateModule
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
        />

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-block">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">
              Loading modules...
            </p>
          </div>
        ) : modules.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No modules yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first module to start organizing your courses and
              learning materials
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Create first module
            </button>
          </div>
        ) : (
          // Module Grid
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
