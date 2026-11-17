/**
 * TaskFlow - Task Management Dashboard Frontend Application
 * Fully functional task manager with offline-first responsiveness and Express/MongoDB Atlas synchronization
 */

(function () {
  'use strict';

  // Seed default tasks matching the practical record screenshots
  const DEFAULT_TASKS = [
    {
      _id: 'task_default_1',
      id: 'task_default_1',
      name: 'FSWD Lab',
      description: 'on 26/11/26',
      reminderDate: '2026-11-19T11:01:00.000Z',
      status: 'Pending',
      createdAt: '2026-11-17T11:01:00.000Z',
      updatedAt: '2026-11-17T11:01:00.000Z'
    },
    {
      _id: 'task_default_2',
      id: 'task_default_2',
      name: 'alr restest',
      description: 'study well',
      reminderDate: '2026-11-19T10:57:00.000Z',
      status: 'Pending',
      createdAt: '2026-11-17T10:57:00.000Z',
      updatedAt: '2026-11-17T10:57:00.000Z'
    }
  ];

  // State
  const state = {
    tasks: [],
    history: [],
    stats: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    activeView: 'dashboard',
    searchQuery: '',
    editingTaskId: null,
    deletingTaskId: null,
    backendHealthy: false
  };

  // DOM Elements
  const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    mobileCloseBtn: document.getElementById('mobileCloseBtn'),
    navItems: document.querySelectorAll('.nav-item'),
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),
    sectionTitle: document.getElementById('sectionTitle'),
    sectionSubtitle: document.getElementById('sectionSubtitle'),
    statsSection: document.getElementById('statsSection'),
    sectionHeader: document.getElementById('sectionHeader'),
    tasksContainer: document.getElementById('tasksContainer'),
    tasksGrid: document.getElementById('tasksGrid'),
    emptyState: document.getElementById('emptyState'),
    loadingState: document.getElementById('loadingState'),
    historyContainer: document.getElementById('historyContainer'),
    historyList: document.getElementById('historyList'),

    // DB Status
    dbStatusDot: document.getElementById('dbStatusDot'),
    dbStatusText: document.getElementById('dbStatusText'),
    dbStatusBadge: document.getElementById('dbStatusBadge'),

    // Stats
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    statInProgress: document.getElementById('statInProgress'),
    statCompleted: document.getElementById('statCompleted'),

    // Search
    searchInput: document.getElementById('searchInput'),

    // Add Modal
    openAddTaskBtn: document.getElementById('openAddTaskBtn'),
    emptyAddTaskBtn: document.getElementById('emptyAddTaskBtn'),
    addTaskModal: document.getElementById('addTaskModal'),
    closeAddModalBtn: document.getElementById('closeAddModalBtn'),
    cancelAddModalBtn: document.getElementById('cancelAddModalBtn'),
    addTaskForm: document.getElementById('addTaskForm'),
    taskNameInput: document.getElementById('taskNameInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    taskReminderInput: document.getElementById('taskReminderInput'),
    nameError: document.getElementById('nameError'),

    // Edit Modal
    editTaskModal: document.getElementById('editTaskModal'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),
    cancelEditModalBtn: document.getElementById('cancelEditModalBtn'),
    editTaskForm: document.getElementById('editTaskForm'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskNameInput: document.getElementById('editTaskNameInput'),
    editTaskDescInput: document.getElementById('editTaskDescInput'),
    editTaskReminderInput: document.getElementById('editTaskReminderInput'),
    editTaskStatusInput: document.getElementById('editTaskStatusInput'),
    editNameError: document.getElementById('editNameError'),

    // Delete Modal
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    deleteTaskTargetName: document.getElementById('deleteTaskTargetName'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  /* ==========================================================================
     Formatters & Utilities
     ========================================================================== */

  function formatDate(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const day = date.getDate();
    const months = [
      'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr',
      'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'
    ];
    // Exact month index
    const allMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = allMonths[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  }

  function formatForDateTimeInput(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${y}-${m}-${d}T${hh}:${mm}`;
  }

  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Safe fetch with strict timeout to prevent endless hanging
   */
  async function fetchWithTimeout(url, options = {}, timeoutMs = 3500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /* ==========================================================================
     Storage & Statistics
     ========================================================================== */

  function saveLocalTasks() {
    try {
      localStorage.setItem('taskflow_tasks_cache', JSON.stringify(state.tasks));
    } catch (e) {
      console.warn('Storage save warning:', e);
    }
  }

  function computeStats() {
    const total = state.tasks.length;
    const pending = state.tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = state.tasks.filter((t) => t.status === 'In Progress').length;
    const completed = state.tasks.filter((t) => t.status === 'Completed').length;
    state.stats = { total, pending, inProgress, completed };
    updateStatsUI();
  }

  function updateStatsUI() {
    if (elements.statTotal) elements.statTotal.textContent = state.stats.total;
    if (elements.statPending) elements.statPending.textContent = state.stats.pending;
    if (elements.statInProgress) elements.statInProgress.textContent = state.stats.inProgress;
    if (elements.statCompleted) elements.statCompleted.textContent = state.stats.completed;
  }

  function addLocalHistory(action, taskName, details) {
    const entry = {
      id: Date.now().toString(),
      action,
      taskName,
      details,
      timestamp: new Date().toISOString()
    };
    state.history.unshift(entry);
    try {
      localStorage.setItem('taskflow_history_cache', JSON.stringify(state.history.slice(0, 50)));
    } catch (e) {}
  }

  /* ==========================================================================
     API Calls & Background Synchronization
     ========================================================================== */

  /**
   * Check Server & Database Health in the background
   */
  async function checkHealth() {
    try {
      const url = window.CONFIG ? window.CONFIG.getHealthUrl() : '/api/health';
      const res = await fetchWithTimeout(url, {}, 3500);
      if (!res.ok) throw new Error('Health check not ok');
      const data = await res.json();

      if (data && data.database) {
        state.backendHealthy = true;
        if (data.database.connected) {
          elements.dbStatusDot.className = 'status-dot connected';
          elements.dbStatusText.textContent = 'MongoDB Atlas: Connected';
          elements.dbStatusBadge.title = `Connected to ${data.database.databaseName} on MongoDB Atlas`;
        } else {
          elements.dbStatusDot.className = 'status-dot fallback';
          elements.dbStatusText.textContent = 'Storage: Local Fallback';
          elements.dbStatusBadge.title = 'Local database active. Configure MONGODB_URI to connect Atlas.';
        }
        return;
      }
    } catch (err) {
      // Backend asleep or unreachable - show local mode ready
      elements.dbStatusDot.className = 'status-dot fallback';
      elements.dbStatusText.textContent = 'Storage: Local (Active)';
      elements.dbStatusBadge.title = 'Dashboard is fully operational using local storage.';
    }
  }

  /**
   * Background task synchronization
   */
  async function syncWithServer() {
    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const res = await fetchWithTimeout(baseUrl, {}, 3500);
      if (res.ok) {
        const data = await res.json();
        if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
          state.tasks = data.tasks;
          saveLocalTasks();
          computeStats();
          renderTasks();
        }
      }
    } catch (err) {
      console.log('Using local task cache:', err.message);
    } finally {
      if (elements.loadingState) elements.loadingState.style.display = 'none';
    }
  }

  /* ==========================================================================
     Render Functions
     ========================================================================== */

  /**
   * Render Task Cards matching the College Record Screenshots
   */
  function renderTasks() {
    saveLocalTasks();

    let filtered = state.tasks;

    if (state.searchQuery.trim()) {
      const q = state.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    if (state.activeView === 'pending') {
      filtered = filtered.filter((t) => t.status === 'Pending');
    } else if (state.activeView === 'in-progress') {
      filtered = filtered.filter((t) => t.status === 'In Progress');
    } else if (state.activeView === 'completed') {
      filtered = filtered.filter((t) => t.status === 'Completed');
    }

    if (filtered.length === 0) {
      elements.tasksGrid.innerHTML = '';
      elements.emptyState.style.display = 'block';
      return;
    }

    elements.emptyState.style.display = 'none';

    const cardsHtml = filtered
      .map((task) => {
        const taskId = task._id || task.id;
        const taskName = escapeHtml(task.name);
        const taskDesc = escapeHtml(task.description || '');
        const reminderStr = formatDate(task.reminderDate);
        const createdStr = formatDate(task.createdAt || new Date());
        const status = task.status || 'Pending';

        return `
        <article class="task-card" data-id="${taskId}">
          <div class="task-header">
            <h3 class="task-name">${taskName}</h3>
          </div>
          
          <div class="task-desc">${taskDesc}</div>
          
          <div class="task-meta">
            ${
              reminderStr
                ? `<div class="task-reminder">
                     <span class="reminder-bell">🔔</span>
                     <span>Reminder: ${reminderStr}</span>
                   </div>`
                : ''
            }
            <div class="task-created">Created: ${createdStr}</div>
          </div>
          
          <div class="task-actions">
            <div class="status-select-wrap">
              <select class="status-select" data-id="${taskId}" aria-label="Change Task Status">
                <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
              </select>
            </div>
            
            <div class="task-btn-group">
              <button class="btn-card-edit" data-id="${taskId}">Edit</button>
              <button class="btn-card-delete" data-id="${taskId}" data-name="${taskName}">Delete</button>
            </div>
          </div>
        </article>
      `;
      })
      .join('');

    elements.tasksGrid.innerHTML = cardsHtml;
    attachCardListeners();
  }

  function attachCardListeners() {
    // Status Change dropdowns
    elements.tasksGrid.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async (e) => {
        const taskId = e.target.getAttribute('data-id');
        const newStatus = e.target.value;
        await handleStatusChange(taskId, newStatus);
      });
    });

    // Edit buttons
    elements.tasksGrid.querySelectorAll('.btn-card-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-id');
        openEditModal(taskId);
      });
    });

    // Delete buttons
    elements.tasksGrid.querySelectorAll('.btn-card-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const taskId = btn.getAttribute('data-id');
        const taskName = btn.getAttribute('data-name');
        openDeleteModal(taskId, taskName);
      });
    });
  }

  function renderHistory() {
    if (!state.history || state.history.length === 0) {
      elements.historyList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--text-muted);">
          No activity recorded yet. Create, edit, or update tasks to view history here.
        </div>
      `;
      return;
    }

    elements.historyList.innerHTML = state.history
      .map((item) => {
        let modifier = '';
        if (item.action.includes('Deleted')) modifier = 'delete';
        else if (item.action.includes('Status')) modifier = 'status';

        return `
          <div class="history-item ${modifier}">
            <div class="history-content">
              <div class="history-action">${escapeHtml(item.action)}: <strong>${escapeHtml(item.taskName)}</strong></div>
              <div class="history-detail">${escapeHtml(item.details)}</div>
            </div>
            <div class="history-time">${formatDate(item.timestamp)}</div>
          </div>
        `;
      })
      .join('');
  }

  /* ==========================================================================
     Task Actions (CRUD)
     ========================================================================== */

  /**
   * Handle Task Status Change with Instant UI Update
   */
  async function handleStatusChange(taskId, newStatus) {
    const task = state.tasks.find((t) => (t._id || t.id) === taskId);
    if (!task) return;

    const oldStatus = task.status;
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();

    computeStats();
    saveLocalTasks();
    showToast(`Status updated to "${newStatus}"`, 'success');
    addLocalHistory('Status Changed', task.name, `Changed from "${oldStatus}" to "${newStatus}"`);

    if (state.activeView !== 'dashboard' && state.activeView !== 'all-tasks') {
      renderTasks();
    }

    // Background sync to backend
    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      await fetchWithTimeout(`${baseUrl}/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }, 3000);
    } catch (err) {
      console.log('Background status sync note:', err.message);
    }
  }

  /**
   * Save New Task with Instant UI Update
   */
  async function handleSaveNewTask(e) {
    e.preventDefault();

    const name = elements.taskNameInput.value.trim();
    const description = elements.taskDescInput.value.trim();
    const reminderDate = elements.taskReminderInput.value;

    if (!name) {
      elements.nameError.textContent = 'Please enter a task name';
      elements.taskNameInput.focus();
      return;
    }
    elements.nameError.textContent = '';

    const newTask = {
      _id: 'task_' + Date.now() + Math.random().toString(36).substring(2, 6),
      id: 'task_' + Date.now(),
      name,
      description,
      reminderDate: reminderDate ? new Date(reminderDate).toISOString() : null,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Instant local add
    state.tasks.unshift(newTask);
    saveLocalTasks();
    computeStats();
    renderTasks();
    addLocalHistory('Task Created', newTask.name, 'Initial status: Pending');

    showToast('Task added successfully!', 'success');
    closeAddModal();
    elements.addTaskForm.reset();

    // Background sync to backend
    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const res = await fetchWithTimeout(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTask.name,
          description: newTask.description,
          reminderDate: newTask.reminderDate,
          status: 'Pending'
        })
      }, 3500);

      if (res.ok) {
        const result = await res.json();
        if (result.task && result.task._id) {
          newTask._id = result.task._id;
          saveLocalTasks();
        }
      }
    } catch (err) {
      console.log('Background task creation saved locally.');
    }
  }

  /**
   * Edit Modal Controls
   */
  function openEditModal(taskId) {
    const task = state.tasks.find((t) => (t._id || t.id) === taskId);
    if (!task) return;

    state.editingTaskId = taskId;
    elements.editTaskId.value = taskId;
    elements.editTaskNameInput.value = task.name || '';
    elements.editTaskDescInput.value = task.description || '';
    elements.editTaskReminderInput.value = formatForDateTimeInput(task.reminderDate);
    elements.editTaskStatusInput.value = task.status || 'Pending';
    elements.editNameError.textContent = '';

    elements.editTaskModal.classList.add('active');
  }

  function closeEditModal() {
    elements.editTaskModal.classList.remove('active');
    state.editingTaskId = null;
    elements.editTaskForm.reset();
  }

  /**
   * Submit Edit Task with Instant UI Update
   */
  async function handleUpdateTask(e) {
    e.preventDefault();

    const taskId = elements.editTaskId.value;
    const name = elements.editTaskNameInput.value.trim();
    const description = elements.editTaskDescInput.value.trim();
    const reminderDate = elements.editTaskReminderInput.value;
    const status = elements.editTaskStatusInput.value;

    if (!name) {
      elements.editNameError.textContent = 'Please enter a task name';
      elements.editTaskNameInput.focus();
      return;
    }
    elements.editNameError.textContent = '';

    const task = state.tasks.find((t) => (t._id || t.id) === taskId);
    if (task) {
      task.name = name;
      task.description = description;
      task.reminderDate = reminderDate ? new Date(reminderDate).toISOString() : null;
      task.status = status;
      task.updatedAt = new Date().toISOString();

      saveLocalTasks();
      computeStats();
      renderTasks();
      addLocalHistory('Task Updated', task.name, `Updated details, status: ${status}`);
    }

    showToast('Task updated successfully!', 'success');
    closeEditModal();

    // Background sync to backend
    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      await fetchWithTimeout(`${baseUrl}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          reminderDate: reminderDate ? new Date(reminderDate).toISOString() : null,
          status
        })
      }, 3500);
    } catch (err) {
      console.log('Background update sync note:', err.message);
    }
  }

  /**
   * Delete Modal Controls
   */
  function openDeleteModal(taskId, taskName) {
    state.deletingTaskId = taskId;
    elements.deleteTaskTargetName.textContent = `"${taskName}"`;
    elements.deleteConfirmModal.classList.add('active');
  }

  function closeDeleteModal() {
    elements.deleteConfirmModal.classList.remove('active');
    state.deletingTaskId = null;
  }

  /**
   * Confirm Delete Task with Instant UI Update
   */
  async function handleConfirmDelete() {
    const taskId = state.deletingTaskId;
    if (!taskId) return;

    const taskIndex = state.tasks.findIndex((t) => (t._id || t.id) === taskId);
    if (taskIndex !== -1) {
      const deletedTask = state.tasks.splice(taskIndex, 1)[0];
      saveLocalTasks();
      computeStats();
      renderTasks();
      addLocalHistory('Task Deleted', deletedTask.name, 'Task permanently removed');
    }

    showToast('Task deleted successfully.', 'success');
    closeDeleteModal();

    // Background sync to backend
    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      await fetchWithTimeout(`${baseUrl}/${taskId}`, { method: 'DELETE' }, 3500);
    } catch (err) {
      console.log('Background delete sync note:', err.message);
    }
  }

  /* ==========================================================================
     Navigation & Views
     ========================================================================== */

  function switchView(viewName) {
    state.activeView = viewName;

    elements.navItems.forEach((item) => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    closeMobileSidebar();
    state.searchQuery = '';
    elements.searchInput.value = '';

    if (viewName === 'history') {
      elements.pageTitle.textContent = 'Task History';
      elements.pageSubtitle.textContent = 'Complete audit log of all dashboard actions and events.';
      elements.statsSection.style.display = 'none';
      elements.sectionHeader.style.display = 'none';
      elements.tasksContainer.style.display = 'none';
      elements.historyContainer.style.display = 'block';
      renderHistory();
      return;
    }

    elements.statsSection.style.display = 'grid';
    elements.sectionHeader.style.display = 'flex';
    elements.tasksContainer.style.display = 'block';
    elements.historyContainer.style.display = 'none';

    switch (viewName) {
      case 'dashboard':
        elements.pageTitle.textContent = 'Dashboard';
        elements.pageSubtitle.textContent = 'Manage your tasks and stay productive.';
        elements.sectionTitle.textContent = 'All Tasks';
        elements.sectionSubtitle.textContent = 'View and manage your individual tasks.';
        break;
      case 'all-tasks':
        elements.pageTitle.textContent = 'All Tasks';
        elements.pageSubtitle.textContent = 'Overview of all pending, active, and completed tasks.';
        elements.sectionTitle.textContent = 'All Tasks List';
        elements.sectionSubtitle.textContent = 'Filter and manage all tasks.';
        break;
      case 'pending':
        elements.pageTitle.textContent = 'Pending Tasks';
        elements.pageSubtitle.textContent = 'Tasks that are waiting to be started.';
        elements.sectionTitle.textContent = 'Pending Tasks';
        elements.sectionSubtitle.textContent = 'Tasks waiting to start.';
        break;
      case 'in-progress':
        elements.pageTitle.textContent = 'In Progress Tasks';
        elements.pageSubtitle.textContent = 'Tasks that are currently being actively worked on.';
        elements.sectionTitle.textContent = 'In Progress Tasks';
        elements.sectionSubtitle.textContent = 'Currently working.';
        break;
      case 'completed':
        elements.pageTitle.textContent = 'Completed Tasks';
        elements.pageSubtitle.textContent = 'Tasks that have been successfully finished.';
        elements.sectionTitle.textContent = 'Completed Tasks';
        elements.sectionSubtitle.textContent = 'Successfully finished.';
        break;
    }

    renderTasks();
  }

  /* ==========================================================================
     Modal Controls
     ========================================================================== */

  function openAddModal() {
    elements.addTaskModal.classList.add('active');
    elements.taskNameInput.focus();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    tomorrow.setHours(11, 1, 0, 0);
    elements.taskReminderInput.value = formatForDateTimeInput(tomorrow);
  }

  function closeAddModal() {
    elements.addTaskModal.classList.remove('active');
    elements.nameError.textContent = '';
  }

  function openMobileSidebar() {
    elements.sidebar.classList.add('mobile-open');
    elements.sidebarOverlay.classList.add('active');
  }

  function closeMobileSidebar() {
    elements.sidebar.classList.remove('mobile-open');
    elements.sidebarOverlay.classList.remove('active');
  }

  /* ==========================================================================
     Initialization & Event Binding
     ========================================================================== */

  function initEventListeners() {
    elements.navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        switchView(view);
      });
    });

    elements.mobileMenuToggle.addEventListener('click', openMobileSidebar);
    elements.mobileCloseBtn.addEventListener('click', closeMobileSidebar);
    elements.sidebarOverlay.addEventListener('click', closeMobileSidebar);

    let searchDebounce;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.searchQuery = e.target.value;
        renderTasks();
      }, 200);
    });

    elements.openAddTaskBtn.addEventListener('click', openAddModal);
    elements.emptyAddTaskBtn.addEventListener('click', openAddModal);
    elements.closeAddModalBtn.addEventListener('click', closeAddModal);
    elements.cancelAddModalBtn.addEventListener('click', closeAddModal);
    elements.addTaskForm.addEventListener('submit', handleSaveNewTask);

    elements.closeEditModalBtn.addEventListener('click', closeEditModal);
    elements.cancelEditModalBtn.addEventListener('click', closeEditModal);
    elements.editTaskForm.addEventListener('submit', handleUpdateTask);

    elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

    [elements.addTaskModal, elements.editTaskModal, elements.deleteConfirmModal].forEach(
      (modal) => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.remove('active');
        });
      }
    );

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAddModal();
        closeEditModal();
        closeDeleteModal();
      }
    });
  }

  function init() {
    initEventListeners();

    // 1. Immediately initialize with cached tasks or default practical record tasks
    try {
      const cached = localStorage.getItem('taskflow_tasks_cache');
      if (cached) {
        state.tasks = JSON.parse(cached);
      } else {
        state.tasks = [...DEFAULT_TASKS];
      }

      const cachedHist = localStorage.getItem('taskflow_history_cache');
      if (cachedHist) {
        state.history = JSON.parse(cachedHist);
      } else {
        state.history = [
          {
            id: '1',
            action: 'Task Created',
            taskName: 'FSWD Lab',
            details: 'Initial status: Pending',
            timestamp: new Date('2026-11-17T11:01:00').toISOString()
          },
          {
            id: '2',
            action: 'Task Created',
            taskName: 'alr restest',
            details: 'Initial status: Pending',
            timestamp: new Date('2026-11-17T10:57:00').toISOString()
          }
        ];
      }
    } catch (e) {
      state.tasks = [...DEFAULT_TASKS];
    }

    // 2. Hide loading spinner and render instantly!
    if (elements.loadingState) elements.loadingState.style.display = 'none';
    computeStats();
    renderTasks();

    // 3. Connect to backend in the background without blocking the UI
    checkHealth();
    syncWithServer();

    setInterval(checkHealth, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
