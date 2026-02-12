import api from './api';

class TaskService {
  // Get all tasks
  async getAllTasks() {
    try {
      const response = await api.get('/tasks');
      return response.data || response;
    } catch (error) {
      throw new Error('Failed to fetch tasks: ' + error.message);
    }
  }

  // Create new task
  async createTask(taskData) {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data || response;
    } catch (error) {
      throw new Error('Failed to create task: ' + error.message);
    }
  }

  // Update task
  async updateTask(taskId, taskData) {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data || response;
    } catch (error) {
      throw new Error('Failed to update task: ' + error.message);
    }
  }

  // Delete task
  async deleteTask(taskId) {
    try {
      await api.delete(`/tasks/${taskId}`);
      return true;
    } catch (error) {
      throw new Error('Failed to delete task: ' + error.message);
    }
  }

  // Toggle task completion
  async toggleTaskCompletion(taskId, taskData) {
    try {
      const response = await api.patch(`/tasks/${taskId}/toggle`, taskData);
      return response.data || response;
    } catch (error) {
      throw new Error('Failed to update task completion: ' + error.message);
    }
  }
}

export default new TaskService();
