// Tasks Page
// Display and manage tasks

import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { tasksAPI, modulesAPI } from '../api/api';

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    module_id: '',
    title: '',
    description: '',
    deadline: '',
    estimated_minutes: '',
    priority: 'medium',
    status: 'pending',
    preferred_start_time: '',
    preferred_end_time: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [tasksRes, modulesRes] = await Promise.all([
          tasksAPI.getTasks(),
          modulesAPI.getModules()
        ]);
        setTasks(tasksRes.data);
        setModules(modulesRes.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await tasksAPI.getTasks();
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.module_id || !formData.title || !formData.deadline) {
      setError('Module, title, and deadline are required');
      return;
    }

    try {
      await tasksAPI.createTask(formData);
      setFormData({
        module_id: '',
        title: '',
        description: '',
        deadline: '',
        estimated_minutes: '',
        priority: 'medium',
        status: 'pending',
        preferred_start_time: '',
        preferred_end_time: ''
      });
      setShowCreateForm(false);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.module_id || !formData.title || !formData.deadline) {
      setError('Module, title, and deadline are required');
      return;
    }

    try {
      await tasksAPI.updateTask(editingTask.id, formData);
      setEditingTask(null);
      setFormData({
        module_id: '',
        title: '',
        description: '',
        deadline: '',
        estimated_minutes: '',
        priority: 'medium',
        status: 'pending',
        preferred_start_time: '',
        preferred_end_time: ''
      });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksAPI.deleteTask(id);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await tasksAPI.updateTask(id, { status: 'completed' });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark task as completed');
    }
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setFormData({
      module_id: task.module_id,
      title: task.title,
      description: task.description || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      estimated_minutes: task.estimated_minutes || '',
      priority: task.priority,
      status: task.status,
      preferred_start_time: task.preferred_start_time || '',
      preferred_end_time: task.preferred_end_time || ''
    });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setFormData({
      module_id: '',
      title: '',
      description: '',
      deadline: '',
      estimated_minutes: '',
      priority: 'medium',
      status: 'pending',
      preferred_start_time: '',
      preferred_end_time: ''
    });
  };

  const getModuleName = (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.module_name : 'Unknown Module';
  };

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Tasks</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          {showCreateForm ? 'Cancel' : 'Create Task'}
        </button>

        {(showCreateForm || editingTask) && (
          <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="bg-gray-100 p-4 rounded mb-4">
            <div className="mb-2">
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
            <div className="mb-2">
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Deadline</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Estimated Minutes</label>
              <input
                type="number"
                value={formData.estimated_minutes}
                onChange={(e) => setFormData({ ...formData, estimated_minutes: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Preferred Start Time</label>
              <input
                type="time"
                value={formData.preferred_start_time}
                onChange={(e) => setFormData({ ...formData, preferred_start_time: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Preferred End Time</label>
              <input
                type="time"
                value={formData.preferred_end_time}
                onChange={(e) => setFormData({ ...formData, preferred_end_time: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
              {editingTask ? 'Update' : 'Create'}
            </button>
            {editingTask && (
              <button type="button" onClick={cancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded">
                Cancel
              </button>
            )}
          </form>
        )}

        {loading ? (
          <p>Loading tasks...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white p-4 rounded shadow">
                <h2 className="text-xl font-bold">{task.title}</h2>
                <p className="text-gray-600">Module: {getModuleName(task.module_id)}</p>
                <p className="text-gray-600">Deadline: {new Date(task.deadline).toLocaleString()}</p>
                <p className="text-gray-600">Priority: {task.priority}</p>
                <p className="text-gray-600">Status: {task.status}</p>
                {task.description && <p className="text-gray-600 mt-2">{task.description}</p>}
                <div className="mt-2 flex space-x-2">
                  <button onClick={() => startEdit(task)} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                    Delete
                  </button>
                  {task.status !== 'completed' && (
                    <button onClick={() => handleMarkComplete(task.id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
    </div>
  );
};
