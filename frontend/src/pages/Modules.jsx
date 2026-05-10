// Modules Page
// Display and manage modules

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { modulesAPI } from '../api/api';

export const Modules = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState({ module_code: '', module_name: '', color: '#000000' });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await modulesAPI.getModules();
      setModules(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.module_code || !formData.module_name) {
      setError('Module code and name are required');
      return;
    }

    try {
      await modulesAPI.createModule(formData);
      setFormData({ module_code: '', module_name: '', color: '#000000' });
      setShowCreateForm(false);
      fetchModules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create module');
    }
  };

  const handleUpdateModule = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.module_code || !formData.module_name) {
      setError('Module code and name are required');
      return;
    }

    try {
      await modulesAPI.updateModule(editingModule.id, formData);
      setEditingModule(null);
      setFormData({ module_code: '', module_name: '', color: '#000000' });
      fetchModules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update module');
    }
  };

  const handleDeleteModule = async (id) => {
    if (!confirm('Are you sure you want to delete this module?')) return;

    try {
      await modulesAPI.deleteModule(id);
      fetchModules();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete module');
    }
  };

  const startEdit = (module) => {
    setEditingModule(module);
    setFormData({ module_code: module.module_code, module_name: module.module_name, color: module.color });
  };

  const cancelEdit = () => {
    setEditingModule(null);
    setFormData({ module_code: '', module_name: '', color: '#000000' });
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Modules</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          {showCreateForm ? 'Cancel' : 'Create Module'}
        </button>

        {(showCreateForm || editingModule) && (
          <form onSubmit={editingModule ? handleUpdateModule : handleCreateModule} className="bg-gray-100 p-4 rounded mb-4">
            <div className="mb-2">
              <label className="block text-sm font-medium">Module Code</label>
              <input
                type="text"
                value={formData.module_code}
                onChange={(e) => setFormData({ ...formData, module_code: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Module Name</label>
              <input
                type="text"
                value={formData.module_name}
                onChange={(e) => setFormData({ ...formData, module_name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
              {editingModule ? 'Update' : 'Create'}
            </button>
            {editingModule && (
              <button type="button" onClick={cancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded">
                Cancel
              </button>
            )}
          </form>
        )}

        {loading ? (
          <p>Loading modules...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((module) => (
              <div key={module.id} className="bg-white p-4 rounded shadow" style={{ borderLeft: `4px solid ${module.color}` }}>
                <h2 className="text-xl font-bold">{module.module_code}</h2>
                <p className="text-gray-600">{module.module_name}</p>
                <div className="mt-2 flex space-x-2">
                  <button onClick={() => startEdit(module)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteModule(module.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
