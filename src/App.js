import React, { useState, useEffect } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import taskService from './services/taskService';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sort tasks by priority and due date
  const sortTasks = (tasksToSort) => {
    if (!Array.isArray(tasksToSort)) {
      console.warn('sortTasks received non-array data:', tasksToSort);
      return [];
    }
    
    const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
    
    return tasksToSort.sort((a, b) => {
      // First sort by priority (High first)
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by due date (earlier dates first)
      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);
      return dateA - dateB;
    });
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getAllTasks();
      
      // Ensure we have valid data and sort it
      const validData = Array.isArray(data) ? data : [];
      const sortedTasks = sortTasks(validData);
      setTasks(sortedTasks);
      setError(null);
    } catch (err) {
      setError(err.message);
      setTasks([]); // Clear tasks on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskAdded = (newTask) => {
    if (!newTask || typeof newTask !== 'object') {
      console.warn('handleTaskAdded received invalid task:', newTask);
      return;
    }
    
    // Add new task and sort the entire list
    const updatedTasks = sortTasks([...tasks, newTask]);
    setTasks(updatedTasks);
  };

  const handleTaskUpdated = (updatedTask) => {
    if (!updatedTask || typeof updatedTask !== 'object' || !updatedTask.id) {
      console.warn('handleTaskUpdated received invalid task:', updatedTask);
      return;
    }
    
    // Update task and sort the entire list
    const updatedTasks = sortTasks(
      tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    setTasks(updatedTasks);
  };

  const handleTaskDeleted = (taskId) => {
    if (!taskId) {
      console.warn('handleTaskDeleted received invalid taskId:', taskId);
      return;
    }
    
    // Remove task and sort the remaining list
    const updatedTasks = sortTasks(
      tasks.filter(task => task.id !== taskId)
    );
    setTasks(updatedTasks);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 text-center">
              Task Management System
            </h1>
            <p className="text-center text-gray-600 mt-2">
              Organize and track your tasks efficiently
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)]">
            <div className="lg:col-span-1">
              <TaskForm onTaskAdded={handleTaskAdded} />
            </div>
            
            <div className="lg:col-span-2">
              <TaskList 
                tasks={tasks}
                loading={loading}
                error={error}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
                onRefresh={fetchTasks}
              />
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
