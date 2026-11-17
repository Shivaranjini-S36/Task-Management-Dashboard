const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { getStatus } = require('../config/db');
const fs = require('fs');
const path = require('path');

// Local fallback store path
const LOCAL_DATA_FILE = path.join(__dirname, '..', 'data', 'tasks.json');

// Helper to ensure data directory exists
const ensureDataDir = () => {
  const dir = path.dirname(LOCAL_DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Fallback in-memory/file storage helpers
const readLocalTasks = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(LOCAL_DATA_FILE)) {
      // Seed default sample tasks matching college record
      const initial = [
        {
          _id: '67399812a3b1234567890001',
          name: 'FSWD Lab',
          description: 'on 26/11/26',
          reminderDate: new Date('2026-11-19T11:01:00').toISOString(),
          status: 'Pending',
          createdAt: new Date('2026-11-17T11:01:00').toISOString(),
          updatedAt: new Date('2026-11-17T11:01:00').toISOString()
        },
        {
          _id: '67399812a3b1234567890002',
          name: 'alr restest',
          description: 'study well',
          reminderDate: new Date('2026-11-19T10:57:00').toISOString(),
          status: 'Pending',
          createdAt: new Date('2026-11-17T10:57:00').toISOString(),
          updatedAt: new Date('2026-11-17T10:57:00').toISOString()
        }
      ];
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading local tasks:', err.message);
    return [];
  }
};

const writeLocalTasks = (tasks) => {
  try {
    ensureDataDir();
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(tasks, null, 2));
  } catch (err) {
    console.error('Error writing local tasks:', err.message);
  }
};

// Task history audit log
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'history.json');
const logHistory = (action, taskName, details) => {
  try {
    ensureDataDir();
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8') || '[]');
    }
    history.unshift({
      id: Date.now().toString(),
      action,
      taskName,
      details,
      timestamp: new Date().toISOString()
    });
    // Keep last 100 history entries
    if (history.length > 100) history = history.slice(0, 100);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.warn('History logging error:', err.message);
  }
};

/**
 * GET /api/tasks/stats
 * Get task counts by status
 */
router.get('/stats', async (req, res) => {
  try {
    const dbStatus = getStatus();

    if (dbStatus.connected) {
      const [total, pending, inProgress, completed] = await Promise.all([
        Task.countDocuments(),
        Task.countDocuments({ status: 'Pending' }),
        Task.countDocuments({ status: 'In Progress' }),
        Task.countDocuments({ status: 'Completed' })
      ]);

      return res.json({
        success: true,
        stats: { total, pending, inProgress, completed },
        dataSource: 'MongoDB Atlas',
        database: dbStatus.dbName
      });
    }

    // Local fallback
    const tasks = readLocalTasks();
    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'Pending').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      completed: tasks.filter((t) => t.status === 'Completed').length
    };

    return res.json({
      success: true,
      stats,
      dataSource: 'Local Fallback (Configure MONGODB_URI to connect Atlas)',
      database: 'taskmanagement'
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Server error fetching statistics' });
  }
});

/**
 * GET /api/tasks
 * Get all tasks with optional search query & status filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const dbStatus = getStatus();

    if (dbStatus.connected) {
      const query = {};
      if (status && ['Pending', 'In Progress', 'Completed'].includes(status)) {
        query.status = status;
      }
      if (search && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: regex }, { description: regex }];
      }

      const tasks = await Task.find(query).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: tasks.length,
        tasks,
        dataSource: 'MongoDB Atlas'
      });
    }

    // Local fallback
    let tasks = readLocalTasks();
    if (status && ['Pending', 'In Progress', 'Completed'].includes(status)) {
      tasks = tasks.filter((t) => t.status === status);
    }
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      tasks = tasks.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      count: tasks.length,
      tasks,
      dataSource: 'Local Fallback'
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving tasks' });
  }
});

/**
 * GET /api/tasks/:id
 * Get single task
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getStatus();

    if (dbStatus.connected) {
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      return res.json({ success: true, task });
    }

    const tasks = readLocalTasks();
    const task = tasks.find((t) => t._id === id || t.id === id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    return res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving task' });
  }
});

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, reminderDate, status } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task name is required'
      });
    }

    const taskStatus = ['Pending', 'In Progress', 'Completed'].includes(status)
      ? status
      : 'Pending';

    const dbStatus = getStatus();

    if (dbStatus.connected) {
      const newTask = new Task({
        name: name.trim(),
        description: description ? description.trim() : '',
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        status: taskStatus
      });

      const savedTask = await newTask.save();
      logHistory('Task Created', savedTask.name, `Initial status: ${savedTask.status}`);

      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        task: savedTask,
        dataSource: 'MongoDB Atlas'
      });
    }

    // Local fallback
    const tasks = readLocalTasks();
    const newTask = {
      _id: 'task_' + Date.now() + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      description: description ? description.trim() : '',
      reminderDate: reminderDate ? new Date(reminderDate).toISOString() : null,
      status: taskStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    newTask.id = newTask._id;

    tasks.unshift(newTask);
    writeLocalTasks(tasks);
    logHistory('Task Created', newTask.name, `Initial status: ${newTask.status}`);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: newTask,
      dataSource: 'Local Fallback'
    });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error creating task' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update task details (name, description, reminderDate, status)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, reminderDate, status } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Task name is required'
      });
    }

    const dbStatus = getStatus();

    if (dbStatus.connected) {
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      task.name = name.trim();
      if (description !== undefined) task.description = description.trim();
      if (reminderDate !== undefined) {
        task.reminderDate = reminderDate ? new Date(reminderDate) : null;
      }
      if (status && ['Pending', 'In Progress', 'Completed'].includes(status)) {
        task.status = status;
      }

      const updated = await task.save();
      logHistory('Task Updated', updated.name, `Updated details, status: ${updated.status}`);

      return res.json({
        success: true,
        message: 'Task updated successfully',
        task: updated,
        dataSource: 'MongoDB Atlas'
      });
    }

    // Local fallback
    const tasks = readLocalTasks();
    const index = tasks.findIndex((t) => t._id === id || t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    tasks[index].name = name.trim();
    if (description !== undefined) tasks[index].description = description.trim();
    if (reminderDate !== undefined) {
      tasks[index].reminderDate = reminderDate ? new Date(reminderDate).toISOString() : null;
    }
    if (status && ['Pending', 'In Progress', 'Completed'].includes(status)) {
      tasks[index].status = status;
    }
    tasks[index].updatedAt = new Date().toISOString();

    writeLocalTasks(tasks);
    logHistory('Task Updated', tasks[index].name, `Updated details, status: ${tasks[index].status}`);

    return res.json({
      success: true,
      message: 'Task updated successfully',
      task: tasks[index],
      dataSource: 'Local Fallback'
    });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error updating task' });
  }
});

/**
 * PATCH /api/tasks/:id/status
 * Update only task status (Pending, In Progress, Completed)
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Pending, In Progress, or Completed'
      });
    }

    const dbStatus = getStatus();

    if (dbStatus.connected) {
      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      const oldStatus = task.status;
      task.status = status;
      const updated = await task.save();
      logHistory('Status Changed', updated.name, `Changed from "${oldStatus}" to "${status}"`);

      return res.json({
        success: true,
        message: `Task status updated to ${status}`,
        task: updated,
        dataSource: 'MongoDB Atlas'
      });
    }

    // Local fallback
    const tasks = readLocalTasks();
    const index = tasks.findIndex((t) => t._id === id || t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const oldStatus = tasks[index].status;
    tasks[index].status = status;
    tasks[index].updatedAt = new Date().toISOString();
    writeLocalTasks(tasks);
    logHistory('Status Changed', tasks[index].name, `Changed from "${oldStatus}" to "${status}"`);

    return res.json({
      success: true,
      message: `Task status updated to ${status}`,
      task: tasks[index],
      dataSource: 'Local Fallback'
    });
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete task by ID
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dbStatus = getStatus();

    if (dbStatus.connected) {
      const task = await Task.findByIdAndDelete(id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      logHistory('Task Deleted', task.name, `Task was permanently removed`);

      return res.json({
        success: true,
        message: 'Task deleted successfully',
        deletedId: id,
        dataSource: 'MongoDB Atlas'
      });
    }

    // Local fallback
    const tasks = readLocalTasks();
    const index = tasks.findIndex((t) => t._id === id || t.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const deleted = tasks.splice(index, 1)[0];
    writeLocalTasks(tasks);
    logHistory('Task Deleted', deleted.name, `Task was permanently removed`);

    return res.json({
      success: true,
      message: 'Task deleted successfully',
      deletedId: id,
      dataSource: 'Local Fallback'
    });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ success: false, message: 'Server error deleting task' });
  }
});

/**
 * GET /api/tasks/history/all
 * Retrieve activity history
 */
router.get('/history/all', (req, res) => {
  try {
    ensureDataDir();
    if (fs.existsSync(HISTORY_FILE)) {
      const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8') || '[]');
      return res.json({ success: true, history });
    }
    return res.json({ success: true, history: [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving task history' });
  }
});

module.exports = router;
