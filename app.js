/**
 * TaskFlow - Task Management Dashboard Frontend Application
 * Fully functional task manager interacting with Express & MongoDB Atlas backend
 */

(function () {
  'use strict';

  // State
  const state = {
    tasks: [],
    stats: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    activeView: 'dashboard',
    searchQuery: '',
    editingTaskId: null,
    deletingTaskId: null,
    isLoading: false,
    backendHealthy: false
  };

  // DOM Elements
  const elements = {
    // Nav & Views
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

  /**
   * Format date into college record style: "19 Nov 2026, 11:01 am"
   */
  function formatDate(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    const day = date.getDate();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
  }

  /**
   * Format ISO for datetime-local input: "YYYY-MM-DDTHH:mm"
   */
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

  /**
   * Show Toast Notification
   */
  function showToast(message, type = 'info') {
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

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ==========================================================================
     API Calls
     ========================================================================== */

  /**
   * Check Server & Database Health
   */
  async function checkHealth() {
    try {
      const url = window.CONFIG ? window.CONFIG.getHealthUrl() : '/api/health';
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.database) {
        state.backendHealthy = true;
        if (data.database.connected) {
          elements.dbStatusDot.className = 'status-dot connected';
          elements.dbStatusText.textContent = 'MongoDB Atlas: Connected';
          elements.dbStatusBadge.title = `Connected to ${data.database.databaseName} on Atlas`;
        } else {
          elements.dbStatusDot.className = 'status-dot fallback';
          elements.dbStatusText.textContent = 'Storage: Local Fallback';
          elements.dbStatusBadge.title = 'Running on resilient local storage. Set MONGODB_URI to connect Atlas.';
        }
      }
    } catch (err) {
      console.warn('Backend health check error:', err.message);
      elements.dbStatusDot.className = 'status-dot';
      elements.dbStatusText.textContent = 'Backend: Connecting...';
    }
  }

  /**
   * Fetch Tasks from Backend API
   */
  async function loadTasks() {
    state.isLoading = true;
    elements.loadingState.style.display = 'block';
    elements.emptyState.style.display = 'none';
    elements.tasksGrid.innerHTML = '';

    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const params = new URLSearchParams();

      // Apply view filter if Pending, In Progress, or Completed
      if (state.activeView === 'pending') {
        params.append('status', 'Pending');
      } else if (state.activeView === 'in-progress') {
        params.append('status', 'In Progress');
      } else if (state.activeView === 'completed') {
        params.append('status', 'Completed');
      }

      if (state.searchQuery.trim()) {
        params.append('search', state.searchQuery.trim());
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${baseUrl}${queryString}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();
      state.tasks = data.tasks || [];
      renderTasks();
      loadStats();
    } catch (err) {
      console.error('Failed to load tasks:', err);
      showToast('Could not load tasks from server. Checking local fallback...', 'error');
      // If server is unavailable, fallback to localStorage cache if present
      const cached = localStorage.getItem('taskflow_tasks_cache');
      if (cached) {
        state.tasks = JSON.parse(cached);
        renderTasks();
      } else {
        renderTasks();
      }
    } finally {
      state.isLoading = false;
      elements.loadingState.style.display = 'none';
    }
  }

  /**
   * Fetch Task Stats
   */
  async function loadStats() {
    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const res = await fetch(`${baseUrl}/stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          state.stats = data.stats;
          updateStatsUI();
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch stats, computing client-side:', err.message);
    }

    // Client-side stats calculation fallback
    const total = state.tasks.length;
    const pending = state.tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = state.tasks.filter((t) => t.status === 'In Progress').length;
    const completed = state.tasks.filter((t) => t.status === 'Completed').length;
    state.stats = { total, pending, inProgress, completed };
    updateStatsUI();
  }

  /**
   * Update Stats on the UI
   */
  function updateStatsUI() {
    elements.statTotal.textContent = state.stats.total || 0;
    elements.statPending.textContent = state.stats.pending || 0;
    elements.statInProgress.textContent = state.stats.inProgress || 0;
    elements.statCompleted.textContent = state.stats.completed || 0;
  }

  /**
   * Load Activity History
   */
  async function loadHistory() {
    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const res = await fetch(`${baseUrl}/history/all`);
      if (res.ok) {
        const data = await res.json();
        renderHistory(data.history || []);
      }
    } catch (err) {
      console.warn('Failed to load history:', err.message);
    }
  }

  /* ==========================================================================
     Render Functions
     ========================================================================== */

  /**
   * Render Task Cards matching the College Record Screenshots
   */
  function renderTasks() {
    // Cache tasks locally for instant display on revisit
    localStorage.setItem('taskflow_tasks_cache', JSON.stringify(state.tasks));

    // Filter tasks based on search and active view
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

    // Build Task Cards
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

    // Attach Event Listeners to Card controls
    attachCardListeners();
  }

  /**
   * Attach Card Click Listeners (Status change, Edit, Delete)
   */
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

  /**
   * Render History Activity Items
   */
  function renderHistory(history) {
    if (!history || history.length === 0) {
      elements.historyList.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--text-muted);">
          No activity recorded yet. Create or update tasks to view history here.
        </div>
      `;
      return;
    }

    elements.historyList.innerHTML = history
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
   * Handle Task Status Change
   */
  async function handleStatusChange(taskId, newStatus) {
    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const res = await fetch(`${baseUrl}/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Status update failed');

      // Update local state
      const task = state.tasks.find((t) => (t._id || t.id) === taskId);
      if (task) {
        task.status = newStatus;
      }

      showToast(`Status updated to "${newStatus}"`, 'success');
      loadStats();

      // If active view is filtered, re-render tasks
      if (state.activeView !== 'dashboard' && state.activeView !== 'all-tasks') {
        renderTasks();
      }
    } catch (err) {
      console.error('Status change error:', err);
      showToast('Failed to update status on server.', 'error');
      // Revert select UI
      loadTasks();
    }
  }

  /**
   * Save New Task
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

    const payload = {
      name,
      description,
      reminderDate: reminderDate ? new Date(reminderDate).toISOString() : null,
      status: 'Pending'
    };

    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save task');
      }

      const result = await res.json();
      showToast('Task added successfully!', 'success');

      closeAddModal();
      elements.addTaskForm.reset();

      // Refresh list and stats
      await loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      showToast(err.message || 'Could not save task.', 'error');
    }
  }

  /**
   * Open Edit Modal
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
   * Submit Edit Task
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

    const payload = {
      name,
      description,
      reminderDate: reminderDate ? new Date(reminderDate).toISOString() : null,
      status
    };

    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const res = await fetch(`${baseUrl}/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update task');
      }

      showToast('Task updated successfully!', 'success');
      closeEditModal();
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      showToast(err.message || 'Could not update task.', 'error');
    }
  }

  /**
   * Open Delete Modal
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
   * Confirm Delete Task
   */
  async function handleConfirmDelete() {
    const taskId = state.deletingTaskId;
    if (!taskId) return;

    try {
      let baseUrl = window.CONFIG ? window.CONFIG.getApiBaseUrl() : '/api/tasks';
      const res = await fetch(`${baseUrl}/${taskId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete operation failed');

      showToast('Task deleted successfully.', 'success');
      closeDeleteModal();
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Could not delete task from server.', 'error');
    }
  }

  /* ==========================================================================
     Navigation & Views
     ========================================================================== */

  function switchView(viewName) {
    state.activeView = viewName;

    // Update active nav button
    elements.navItems.forEach((item) => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Close mobile menu if open
    closeMobileSidebar();

    // Reset search
    state.searchQuery = '';
    elements.searchInput.value = '';

    // Adjust view titles and container visibility
    if (viewName === 'history') {
      elements.pageTitle.textContent = 'Task History';
      elements.pageSubtitle.textContent = 'Complete audit log of all dashboard actions and events.';
      elements.statsSection.style.display = 'none';
      elements.sectionHeader.style.display = 'none';
      elements.tasksContainer.style.display = 'none';
      elements.historyContainer.style.display = 'block';
      loadHistory();
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

    loadTasks();
  }

  /* ==========================================================================
     Modal Controls
     ========================================================================== */

  function openAddModal() {
    elements.addTaskModal.classList.add('active');
    elements.taskNameInput.focus();
    // Default reminder date to tomorrow 11:00 AM
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
    // Nav Items
    elements.navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        switchView(view);
      });
    });

    // Mobile Sidebar Toggle
    elements.mobileMenuToggle.addEventListener('click', openMobileSidebar);
    elements.mobileCloseBtn.addEventListener('click', closeMobileSidebar);
    elements.sidebarOverlay.addEventListener('click', closeMobileSidebar);

    // Search Input with debounce
    let searchDebounce;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.searchQuery = e.target.value;
        renderTasks();
      }, 250);
    });

    // Add Modal Triggers
    elements.openAddTaskBtn.addEventListener('click', openAddModal);
    elements.emptyAddTaskBtn.addEventListener('click', openAddModal);
    elements.closeAddModalBtn.addEventListener('click', closeAddModal);
    elements.cancelAddModalBtn.addEventListener('click', closeAddModal);
    elements.addTaskForm.addEventListener('submit', handleSaveNewTask);

    // Edit Modal Triggers
    elements.closeEditModalBtn.addEventListener('click', closeEditModal);
    elements.cancelEditModalBtn.addEventListener('click', closeEditModal);
    elements.editTaskForm.addEventListener('submit', handleUpdateTask);

    // Delete Modal Triggers
    elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

    // Close modals on clicking outside card
    [elements.addTaskModal, elements.editTaskModal, elements.deleteConfirmModal].forEach(
      (modal) => {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('active');
          }
        });
      }
    );

    // ESC key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAddModal();
        closeEditModal();
        closeDeleteModal();
      }
    });
  }

  // App Startup
  function init() {
    initEventListeners();
    checkHealth();
    loadTasks();
    loadStats();

    // Periodic health re-check every 30 seconds
    setInterval(checkHealth, 30000);
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
