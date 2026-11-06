const API_URL = "https://task-management-dashboard-j8sy.onrender.com/api/tasks";

let tasks = [];
let editingTaskId = null;
let currentView = "dashboard";

const taskList = document.getElementById("taskList");
const taskModal = document.getElementById("taskModal");
const taskForm = document.getElementById("taskForm");
const searchInput = document.getElementById("searchInput");

// Show messages
function showMessage(message) {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.style.cssText = `
            position:fixed;
            bottom:25px;
            right:25px;
            background:#24243d;
            color:white;
            padding:14px 22px;
            border-radius:8px;
            z-index:2000;
            font-size:13px;
            box-shadow:0 4px 15px #0002;
        `;
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

// Escape user-entered text before displaying it in HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Load tasks from MongoDB
async function loadTasks() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load tasks.");
        }

        tasks = await response.json();

        updateStatistics();
        renderTasks();

    } catch (error) {
        console.error(error);
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load tasks</h3>
                <p>Please check your server connection.</p>
            </div>
        `;
    }
}

// Update dashboard statistics
function updateStatistics() {
    document.getElementById("totalCount").textContent = tasks.length;

    document.getElementById("pendingCount").textContent =
        tasks.filter(task => task.status === "Pending").length;

    document.getElementById("ongoingCount").textContent =
        tasks.filter(task => task.status === "Ongoing").length;

    document.getElementById("completedCount").textContent =
        tasks.filter(task => task.status === "Completed").length;
}

// Format reminder date
function formatDate(date) {
    if (!date) return "No reminder set";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "Invalid date";

    return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Display tasks
function renderTasks() {
    let filteredTasks = [...tasks];

    if (currentView === "pending") {
        filteredTasks = filteredTasks.filter(
            task => task.status === "Pending"
        );
    }

    if (currentView === "ongoing") {
        filteredTasks = filteredTasks.filter(
            task => task.status === "Ongoing"
        );
    }

    if (currentView === "completed") {
        filteredTasks = filteredTasks.filter(
            task => task.status === "Completed"
        );
    }

    if (currentView === "history") {
        filteredTasks.sort((a, b) =>
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
    }

    const searchText = searchInput.value.toLowerCase().trim();

    if (searchText) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchText) ||
            (task.description || "").toLowerCase().includes(searchText)
        );
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>No tasks found</h3>
                <p>Add a new task or try another search.</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-card">

            <h3>${escapeHTML(task.title)}</h3>

            <p class="task-description">
                ${escapeHTML(task.description || "No description provided.")}
            </p>

            <p class="task-date">
                🔔 Reminder: ${escapeHTML(formatDate(task.dueDate))}
            </p>

            <p class="task-date">
                Created: ${escapeHTML(formatDate(task.createdAt))}
            </p>

            <div class="task-footer">

                <select class="status-select"
                    data-status-id="${escapeHTML(task._id)}">

                    <option value="Pending"
                        ${task.status === "Pending" ? "selected" : ""}>
                        Pending
                    </option>

                    <option value="Ongoing"
                        ${task.status === "Ongoing" ? "selected" : ""}>
                        In Progress
                    </option>

                    <option value="Completed"
                        ${task.status === "Completed" ? "selected" : ""}>
                        Completed
                    </option>

                </select>

                <div class="task-actions">

                    <button class="edit-btn"
                        data-edit-id="${escapeHTML(task._id)}">
                        Edit
                    </button>

                    <button class="delete-btn"
                        data-delete-id="${escapeHTML(task._id)}">
                        Delete
                    </button>

                </div>

            </div>
        </div>
    `).join("");
}

// Open Add Task popup
document.getElementById("openAddModal").addEventListener("click", () => {
    editingTaskId = null;

    taskForm.reset();

    document.getElementById("modalTitle").textContent = "Add New Task";

    taskModal.classList.add("show");
});

// Close popup
function closeModal() {
    taskModal.classList.remove("show");
    taskForm.reset();
    editingTaskId = null;
}

document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelModal").addEventListener("click", closeModal);

// Close popup by clicking outside
taskModal.addEventListener("click", event => {
    if (event.target === taskModal) {
        closeModal();
    }
});

// Add or Edit Task
taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const dueDate = document.getElementById("taskDueDate").value;

    if (!title) {
        showMessage("Please enter a task name.");
        return;
    }

    const taskData = {
        title,
        description,
        dueDate
    };

    try {
        const url = editingTaskId
            ? `${API_URL}/${editingTaskId}`
            : API_URL;

        const method = editingTaskId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(taskData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not save task.");
        }

        const wasEditing = editingTaskId !== null;

        closeModal();

        showMessage(
            wasEditing
                ? "Task updated successfully!"
                : "New task added successfully!"
        );

        if (dueDate && Notification.permission === "default") {
            try {
                await Notification.requestPermission();
            } catch (error) {
                console.log("Notification permission unavailable.");
            }
        }

        await loadTasks();

    } catch (error) {
        console.error(error);
        showMessage(error.message);
    }
});

// Edit Task
async function editTask(id) {
    const task = tasks.find(item => item._id === id);

    if (!task) return;

    editingTaskId = id;

    document.getElementById("modalTitle").textContent = "Edit Task";
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value =
        task.description || "";

    document.getElementById("taskDueDate").value =
        task.dueDate || "";

    taskModal.classList.add("show");
}

// Delete Task
async function deleteTask(id) {
    const confirmed = confirm(
        "Are you sure you want to permanently delete this task?"
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not delete task.");
        }

        showMessage("Task deleted successfully!");

        await loadTasks();

    } catch (error) {
        console.error(error);
        showMessage(error.message);
    }
}

// Change Task Status
async function changeStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Could not update status.");
        }

        showMessage("Task status updated!");

        await loadTasks();

    } catch (error) {
        console.error(error);
        showMessage(error.message);
    }
}

// Handle task buttons
taskList.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (editButton) {
        editTask(editButton.dataset.editId);
    }

    if (deleteButton) {
        deleteTask(deleteButton.dataset.deleteId);
    }
});

// Handle status dropdown
taskList.addEventListener("change", event => {
    const select = event.target.closest("[data-status-id]");

    if (select) {
        changeStatus(select.dataset.statusId, select.value);
    }
});

// Sidebar Navigation
const viewNames = {
    dashboard: "Dashboard",
    all: "All Tasks",
    pending: "Pending Tasks",
    ongoing: "In Progress",
    completed: "Completed Tasks",
    history: "Task History"
};

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");

        currentView = link.dataset.view;

        document.getElementById("pageTitle").textContent =
            viewNames[currentView];

        document.getElementById("sectionTitle").textContent =
            currentView === "dashboard" ? "All Tasks" : viewNames[currentView];

        document.getElementById("sectionDescription").textContent =
            currentView === "history"
                ? "View your tasks with their latest status."
                : "View and manage your individual tasks.";

        renderTasks();
    });
});

// Search tasks
searchInput.addEventListener("input", renderTasks);

// Reminder Notifications
const notifiedReminders = new Set();

async function checkReminders() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const now = new Date();

    tasks.forEach(task => {
        if (!task.dueDate) return;

        if (task.status === "Completed") return;

        const reminderDate = new Date(task.dueDate);

        if (isNaN(reminderDate.getTime())) return;

        const reminderKey = `${task._id}_${task.dueDate}`;

        if (
            reminderDate <= now &&
            !notifiedReminders.has(reminderKey)
        ) {
            notifiedReminders.add(reminderKey);

            new Notification("Task Reminder!", {
                body: `Time to work on: ${task.title}`,
                icon: ""
            });
        }
    });
}

// Check reminders every 15 seconds
setInterval(checkReminders, 15000);

// Start dashboard
loadTasks().then(checkReminders);