import React, { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import taskService from '../services/taskService';
import { useToast } from '../contexts/ToastContext';
import { validateTaskData } from '../utils/validation';

const TaskList = ({ tasks, loading, error, onTaskUpdated, onTaskDeleted, onRefresh }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'completed'
  const { showSuccess, showError } = useToast();

  const handleEdit = (task) => {
    setEditingTask(task.id);
    setEditFormData({
      title: task.title,
      description: task.description,
      due_date: task.due_date.split('T')[0],
      priority: task.priority,
      completed: task.completed
    });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditFormData({});
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdate = async (taskId) => {
    try {
      // Frontend validation for edit
      const validationErrors = validateTaskData(editFormData, true);
      if (validationErrors.length > 0) {
        const errors = {};
        validationErrors.forEach(error => {
          if (error.toLowerCase().includes('title')) errors.title = error;
          if (error.toLowerCase().includes('due date')) errors.due_date = error;
          if (error.toLowerCase().includes('priority')) errors.priority = error;
          if (error.toLowerCase().includes('description')) errors.description = error;
        });
        setEditFieldErrors(errors);
        return;
      }

      const updatedTask = await taskService.updateTask(taskId, editFormData);
      onTaskUpdated(updatedTask);
      showSuccess('Task updated successfully!');
      setEditingTask(null);
      setEditFormData({});
      setEditFieldErrors({});
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      onTaskDeleted(taskId);
      showSuccess('Task deleted successfully!');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteClick = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      handleDelete(taskId);
    }
  };

  const handleToggleComplete = async (task) => {
    try {
      const updatedTask = await taskService.toggleTaskCompletion(task.id, { completed: !task.completed });
      onTaskUpdated(updatedTask);
      showSuccess(`Task marked as ${!task.completed ? 'completed' : 'incomplete'}!`);
    } catch (err) {
      showError(err.message);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDueDateColor = (dueDate) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return 'text-red-600 font-medium';
    }
    if (isToday(date)) {
      return 'text-orange-600 font-medium';
    }
    return 'text-gray-600';
  };

  const getStatusBadge = (task) => {
    if (task.completed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3"/>
          </svg>
          Completed
        </span>
      );
    } else {
      const isOverdue = isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          isOverdue 
            ? 'bg-red-100 text-red-800 border-red-200' 
            : 'bg-blue-100 text-blue-800 border-blue-200'
        }`}>
          <svg className="-ml-0.5 mr-1.5 h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" className={isOverdue ? 'text-red-400' : 'text-blue-400'}/>
          </svg>
          {isOverdue ? 'Overdue' : 'Active'}
        </span>
      );
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus === 'completed') return task.completed;
    if (filterStatus === 'active') return !task.completed;
    return true;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onRefresh}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {filterStatus === 'completed' 
              ? 'No completed tasks found.' 
              : filterStatus === 'active' 
              ? 'No active tasks found.' 
              : 'No tasks found. Add your first task to get started!'
            }
          </p>
          {filterStatus !== 'all' && (
            <button
              onClick={() => setFilterStatus('all')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Show all tasks
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md pl-6 pr-6 pb-6 h-[515px] overflow-y-auto">
      {/* Sticky Header Section */}
      <div className="sticky top-0 bg-white p-3 z-10 pb-4 border-b border-gray-200 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tasks ({filteredTasks.length})</h2>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-gray-500">
                Total: <span className="font-medium text-gray-700">{taskStats.total}</span>
              </span>
              <span className="text-blue-600">
                Active: <span className="font-medium">{taskStats.active}</span>
              </span>
              <span className="text-green-600">
                Completed: <span className="font-medium">{taskStats.completed}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filterStatus === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filterStatus === 'active' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  filterStatus === 'completed' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed
              </button>
            </div>
            <button
              onClick={onRefresh}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Tasks Section */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`border rounded-lg p-4 transition-all ${
              task.completed 
                ? 'bg-gray-50 border-gray-200 opacity-75' 
                : 'bg-white border-gray-300 hover:shadow-md'
            }`}
          >
            {editingTask === task.id ? (
              <div className="space-y-3">
                {Object.keys(editFieldErrors).length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    {Object.values(editFieldErrors).map((error, index) => (
                      <p key={index} className="text-red-600 text-sm">{error}</p>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    editFieldErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {editFieldErrors.title && (
                  <p className="text-xs text-red-600">{editFieldErrors.title}</p>
                )}
                <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditChange}
                  rows="2"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    editFieldErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {editFieldErrors.description && (
                  <p className="text-xs text-red-600">{editFieldErrors.description}</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="date"
                      name="due_date"
                      value={editFormData.due_date}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        editFieldErrors.due_date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {editFieldErrors.due_date && (
                      <p className="text-xs text-red-600">{editFieldErrors.due_date}</p>
                    )}
                  </div>
                  <div>
                    <select
                      name="priority"
                      value={editFormData.priority}
                      onChange={handleEditChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        editFieldErrors.priority ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    {editFieldErrors.priority && (
                      <p className="text-xs text-red-600">{editFieldErrors.priority}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="completed"
                      checked={editFormData.completed}
                      onChange={handleEditChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mark as completed
                    </span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(task.id)}
                    className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
                          task.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400 bg-white'
                        }`}
                        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.completed && (
                          <svg className="w-3 h-3 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <h3 className={`font-medium text-gray-900 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {getStatusBadge(task)}
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-2 ml-7">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 ml-7 text-sm">
                      <span className={getDueDateColor(task.due_date)}>
                        📅 Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </span>
                     
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(task.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;
