import React, { useState } from 'react';
import { format } from 'date-fns';
import taskService from '../services/taskService';
import { useToast } from '../contexts/ToastContext';
import { validateTaskData, getFieldError } from '../utils/validation';

const TaskForm = ({ onTaskAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  console.log("fieldErrors", fieldErrors);
  const { showSuccess, showError } = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    // Frontend validation
    const validationErrors = validateTaskData(formData);
    if (validationErrors.length > 0) {
      const errors = {};
      validationErrors.forEach(error => {
        if (error.toLowerCase().includes('title')) errors.title = error;
        if (error.toLowerCase().includes('due date')) errors.due_date = error;
        if (error.toLowerCase().includes('priority')) errors.priority = error;
        if (error.toLowerCase().includes('description')) errors.description = error;
      });
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const newTask = await taskService.createTask(formData);
      onTaskAdded(newTask);
      showSuccess('Task created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 'Medium'
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Task</h2>
      
      {Object.keys(fieldErrors).length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          {Object.values(fieldErrors).map((error, index) => (
            <p key={index} className="text-red-600 text-sm">{error}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              fieldErrors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter task title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Task Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              fieldErrors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter task description (optional)"
          />
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>
          )}
        </div>

        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            min={today}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              fieldErrors.due_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {fieldErrors.due_date && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.due_date}</p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              fieldErrors.priority ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          {fieldErrors.priority && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.priority}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Adding Task...' : 'Add Task'}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
