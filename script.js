
const taskInput = document.getElementById("taskInput");
const categoryInput = document.getElementById("categoryInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");

const taskForm = document.getElementById("taskForm");
const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");

const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const taskCount = document.getElementById("taskCount");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressTrack = document.getElementById("progressTrack");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const filterButtons = document.querySelectorAll(".filter-btn");
const themeBtn = document.getElementById("themeBtn");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");

let currentFilter = "all";
let editingTaskId = null;

// Load saved tasks. Also supports tasks from the earlier version.
function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem("tasks") || "[]");

        if (!Array.isArray(saved)) return [];

        return saved
            .filter(task =>
                task &&
                typeof task.text === "string" &&
                task.id !== undefined
            )
            .map(task => ({
                id: task.id,
                text: task.text,
                completed: task.completed === true,
                category: [
                    "Personal", "Work", "Study",
                    "Shopping", "Health", "Other"
                ].includes(task.category)
                    ? task.category
                    : "Personal",
                priority: ["Low", "Medium", "High"].includes(task.priority)
                    ? task.priority
                    : "Medium",
                dueDate: typeof task.dueDate === "string"
                    ? task.dueDate
                    : ""
            }));
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

let tasks = loadTasks();

// Save all tasks
function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
        alert("Unable to save tasks. Check your browser storage.");
    }
}

// Update dashboard and progress bar
function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    totalTasks.textContent = total;
    pendingTasks.textContent = pending;
    completedTasks.textContent = completed;

    progressBar.style.width = percentage + "%";
    progressText.textContent = percentage + "%";
    progressTrack.setAttribute("aria-valuenow", percentage);

    taskCount.textContent =
        `${pending} task(s) remaining out of ${total}`;
}

// Format due date for display
function formatDate(dateString) {
    if (!dateString) return "";

    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Create a task element safely
function createTaskElement(task) {
    const li = document.createElement("li");
    li.className = "task-item";

    if (task.completed) {
        li.classList.add("completed");
    }

    // Completion checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", "Mark task as completed");

    checkbox.addEventListener("change", () => {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
    });

    // Task details
    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.text;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priorityTag = document.createElement("span");
    priorityTag.className =
        "tag priority-" + task.priority.toLowerCase();
    priorityTag.textContent = task.priority + " Priority";

    const categoryTag = document.createElement("span");
    categoryTag.className = "tag category-tag";
    categoryTag.textContent = task.category;

    meta.append(priorityTag, categoryTag);

    // Due date and deadline status
    if (task.dueDate) {
        const due = document.createElement("span");
        due.className = "due-date";

        const today = new Date();
        const todayString =
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");

        due.textContent = "Due: " + formatDate(task.dueDate);

        if (!task.completed && task.dueDate < todayString) {
            due.classList.add("overdue");
            due.textContent += " · Overdue";
        } else if (!task.completed && task.dueDate === todayString) {
            due.classList.add("due-today");
            due.textContent += " · Due today";
        }

        meta.appendChild(due);
    }

    content.append(title, meta);

    // Edit and Delete buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "edit-btn";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("aria-label", "Edit " + task.text);

    editBtn.addEventListener("click", () => {
        startEdit(task);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("aria-label", "Delete " + task.text);

    deleteBtn.addEventListener("click", () => {
        tasks = tasks.filter(item => item.id !== task.id);

        if (editingTaskId === task.id) {
            resetForm();
        }

        saveTasks();
        renderTasks();
    });

    actions.append(editBtn, deleteBtn);
    li.append(checkbox, content, actions);

    return li;
}

// Display tasks according to filters and search
function renderTasks() {
    taskList.innerHTML = "";

    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredTasks = tasks.filter(task => {
        const matchesStatus =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        const matchesSearch =
            task.text.toLowerCase().includes(searchTerm) ||
            task.category.toLowerCase().includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            task.category === selectedCategory;

        return matchesStatus && matchesSearch && matchesCategory;
    });

    filteredTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });

    emptyMessage.style.display =
        filteredTasks.length === 0 ? "block" : "none";

    updateDashboard();
}

// Update active filter button
function updateActiveFilter() {
    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

// Add a new task or save edited task
taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        alert("Please enter a task name.");
        taskInput.focus();
        return;
    }

    const category = categoryInput.value;
    const priority = priorityInput.value;
    const dueDate = dueDateInput.value;

    if (editingTaskId !== null) {
        const task = tasks.find(item => item.id === editingTaskId);

        if (task) {
            task.text = text;
            task.category = category;
            task.priority = priority;
            task.dueDate = dueDate;
        }
    } else {
        tasks.push({
            id: Date.now() + Math.random(),
            text,
            category,
            priority,
            dueDate,
            completed: false
        });
    }

    saveTasks();
    resetForm();

    currentFilter = "all";
    categoryFilter.value = "all";
    searchInput.value = "";

    updateActiveFilter();
    renderTasks();
});

// Start editing a task
function startEdit(task) {
    editingTaskId = task.id;

    taskInput.value = task.text;
    categoryInput.value = task.category;
    priorityInput.value = task.priority;
    dueDateInput.value = task.dueDate || "";

    formTitle.textContent = "Edit Task";
    saveBtn.textContent = "Save Changes";
    cancelEditBtn.hidden = false;

    document.querySelector(".app").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    taskInput.focus();
}

// Reset form after adding or cancelling
function resetForm() {
    taskForm.reset();

    editingTaskId = null;

    formTitle.textContent = "Add a New Task";
    saveBtn.textContent = "+ Add Task";
    cancelEditBtn.hidden = true;

    categoryInput.value = "Personal";
    priorityInput.value = "Medium";
    dueDateInput.value = "";
}

cancelEditBtn.addEventListener("click", resetForm);

// Status filters
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;
        updateActiveFilter();
        renderTasks();
    });
});

// Search tasks
searchInput.addEventListener("input", renderTasks);

// Filter by category
categoryFilter.addEventListener("change", renderTasks);

// Clear all completed tasks
clearCompletedBtn.addEventListener("click", () => {
    const completedCount =
        tasks.filter(task => task.completed).length;

    if (completedCount === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    const confirmed = confirm(
        `Delete all ${completedCount} completed task(s)?`
    );

    if (!confirmed) return;

    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    resetForm();
    renderTasks();
});

// Dark / Light Mode
function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark", isDark);

    themeBtn.textContent = isDark
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";

    themeBtn.setAttribute("aria-pressed", String(isDark));

    try {
        localStorage.setItem("taskTheme", theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.");
    }
}

themeBtn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark");

    applyTheme(isDark ? "light" : "dark");
});

// Load saved theme
let savedTheme = "light";

try {
    savedTheme = localStorage.getItem("taskTheme") || "light";
} catch (error) {
    console.warn("Theme preference could not be loaded.");
}

applyTheme(savedTheme === "dark" ? "dark" : "light");

// Initial display
updateActiveFilter();
renderTasks();
