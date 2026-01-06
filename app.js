// ===== Global State =====
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;
let notificationsEnabled = false;

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen
    showLoadingScreen();

    // Load data from localStorage
    loadFromStorage();

    // Initialize date
    updateCurrentDate();

    // Setup event listeners
    setupEventListeners();

    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited');

    setTimeout(() => {
        hideLoadingScreen();

        if (!hasVisited) {
            showWelcomeScreen();
            localStorage.setItem('hasVisited', 'true');
        } else {
            showApp();
        }
    }, 2500);
});

// ===== Loading Screen =====
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('active');
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.remove('active');
}

// ===== Welcome Screen =====
function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    welcomeScreen.classList.add('active');
}

function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    welcomeScreen.classList.remove('active');
}

function startApp() {
    hideWelcomeScreen();
    setTimeout(() => {
        showApp();
        requestNotificationPermission();
    }, 300);
}

function showApp() {
    const appContainer = document.getElementById('appContainer');
    appContainer.classList.add('active');
    renderTasks();
    updateStats();
    updateTodaySchedule();
}

// ===== Navigation =====
function navigateTo(viewId) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.classList.remove('active'));

    // Show selected view
    const selectedView = document.getElementById(viewId);
    if (selectedView) {
        selectedView.classList.add('active');
    }

    // Update bottom nav
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.dataset.view === viewId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update header title
    const headerTitle = document.getElementById('headerTitle');
    const titles = {
        'homeView': 'Manajemen Tugas',
        'tasksView': 'Daftar Tugas',
        'completedView': 'Tugas Selesai',
        'statsView': 'Statistik',
        'settingsView': 'Pengaturan'
    };
    headerTitle.textContent = titles[viewId] || 'Manajemen Tugas';

    // Render appropriate content
    if (viewId === 'tasksView') {
        renderTasks();
    } else if (viewId === 'completedView') {
        renderCompletedTasks();
    } else if (viewId === 'statsView') {
        updateStats();
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Task form
    const taskForm = document.getElementById('taskForm');
    taskForm.addEventListener('submit', handleTaskSubmit);

    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderTasks();
        });
    });

    // Character counter
    const taskNotes = document.getElementById('taskNotes');
    taskNotes.addEventListener('input', updateCharCounter);

    // Check for reminders every minute
    setInterval(checkReminders, 60000);
}

// ===== Date & Time =====
function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('id-ID', options);
}

function formatDeadline(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diff < 0) {
        return 'Terlambat';
    } else if (days === 0 && hours < 24) {
        return `${hours} jam lagi`;
    } else if (days === 0) {
        return 'Hari ini';
    } else if (days === 1) {
        return 'Besok';
    } else {
        return `${days} hari lagi`;
    }
}

function isOverdue(dateString) {
    return new Date(dateString) < new Date();
}

function isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

// ===== Task Management =====
function handleTaskSubmit(e) {
    e.preventDefault();

    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const deadline = document.getElementById('taskDeadline').value;
    const notes = document.getElementById('taskNotes').value.trim();

    if (!title || !deadline) {
        showToast('Mohon lengkapi semua field yang wajib', 'error');
        return;
    }

    if (taskId) {
        // Edit existing task
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.title = title;
            task.priority = priority;
            task.deadline = deadline;
            task.notes = notes;
            task.updatedAt = new Date().toISOString();
            showToast('Tugas berhasil diperbarui', 'success');
        }
    } else {
        // Create new task
        const newTask = {
            id: generateId(),
            title,
            priority,
            deadline,
            notes,
            completed: false,
            subTasks: [],
            expanded: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        tasks.push(newTask);
        showToast('Tugas berhasil ditambahkan', 'success');
    }

    saveToStorage();
    renderTasks();
    updateStats();
    updateTodaySchedule();
    closeTaskModal();
}

function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        saveToStorage();
        renderTasks();
        updateStats();
        updateTodaySchedule();

        if (task.completed) {
            showToast('Tugas selesai! 🎉', 'success');
        }
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('modalTitle').textContent = 'Edit Tugas';
        document.getElementById('submitBtnText').textContent = 'Update Tugas';
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDeadline').value = task.deadline;
        document.getElementById('taskNotes').value = task.notes || '';
        updateCharCounter();
        openTaskModal();
    }
}

function deleteTask(taskId) {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToStorage();
        renderTasks();
        updateStats();
        updateTodaySchedule();
        showToast('Tugas berhasil dihapus', 'success');
    }
}

// ===== Sub-tasks Management =====
function toggleTaskExpand(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.expanded = !task.expanded;
        renderTasks();
        renderCompletedTasks();
        if (selectedDate) renderCalendarTasks();
    }
}

function addSubTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const description = prompt('Masukkan deskripsi sub-task:');
        if (description && description.trim()) {
            if (!task.subTasks) task.subTasks = [];

            const newSubTask = {
                id: generateId(),
                description: description.trim(),
                progress: 0
            };

            task.subTasks.push(newSubTask);
            task.updatedAt = new Date().toISOString();
            saveToStorage();
            renderTasks();
            renderCompletedTasks();
            if (selectedDate) renderCalendarTasks();
            showToast('Sub-task berhasil ditambahkan', 'success');
        }
    }
}

function updateSubTaskProgress(taskId, subTaskId, progress) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subTasks) {
        const subTask = task.subTasks.find(st => st.id === subTaskId);
        if (subTask) {
            subTask.progress = parseInt(progress);
            task.updatedAt = new Date().toISOString();
            saveToStorage();

            // Update overall progress bar without re-rendering
            const overallProgress = calculateOverallProgress(task);
            const taskCard = document.querySelector(`[onclick*="toggleTaskExpand('${taskId}')"]`)?.closest('.task-card');
            if (taskCard) {
                const progressBar = taskCard.querySelector('.progress-bar-fill');
                const progressPercentage = taskCard.querySelector('.progress-percentage');
                if (progressBar) progressBar.style.width = `${overallProgress}%`;
                if (progressPercentage) progressPercentage.textContent = `${overallProgress}%`;
            }
        }
    }
}

function deleteSubTask(taskId, subTaskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.subTasks) {
        task.subTasks = task.subTasks.filter(st => st.id !== subTaskId);
        task.updatedAt = new Date().toISOString();
        saveToStorage();
        renderTasks();
        renderCompletedTasks();
        if (selectedDate) renderCalendarTasks();
        showToast('Sub-task berhasil dihapus', 'success');
    }
}

function calculateOverallProgress(task) {
    if (!task.subTasks || task.subTasks.length === 0) return 0;
    const total = task.subTasks.reduce((sum, st) => sum + st.progress, 0);
    return Math.round(total / task.subTasks.length);
}

// ===== Rendering =====
function renderTasks() {
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');

    let filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        if (currentFilter === 'overdue') return !task.completed && isOverdue(task.deadline);
        return true;
    });

    // Apply search filter
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    if (searchQuery) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery) ||
            (task.notes && task.notes.toLowerCase().includes(searchQuery))
        );
    }

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
        taskList.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
    }
}

function createTaskCard(task) {
    const overdueClass = !task.completed && isOverdue(task.deadline) ? 'overdue' : '';
    const completedClass = task.completed ? 'completed' : '';
    const priorityClass = `priority-${task.priority}`;
    const expandedClass = task.expanded ? 'expanded' : '';
    const overallProgress = calculateOverallProgress(task);

    // Sub-tasks HTML
    let subTasksHTML = '';
    if (task.expanded) {
        if (task.subTasks && task.subTasks.length > 0) {
            subTasksHTML = `
                <div class="subtasks-section">
                    <div class="subtasks-header">
                        <h4>Sub-Tasks</h4>
                        <div class="overall-progress">
                            <span class="progress-label">Progress Keseluruhan:</span>
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${overallProgress}%"></div>
                            </div>
                            <span class="progress-percentage">${overallProgress}%</span>
                        </div>
                    </div>
                    <div class="subtasks-list">
                        ${task.subTasks.map(subTask => `
                            <div class="subtask-item">
                                <div class="subtask-info">
                                    <p class="subtask-description">${subTask.description}</p>
                                    <div class="subtask-progress">
                                        <input type="range" min="0" max="100" value="${subTask.progress}" 
                                            class="progress-slider" 
                                            oninput="updateSubTaskProgress('${task.id}', '${subTask.id}', this.value); this.nextElementSibling.textContent = this.value + '%'">
                                        <span class="progress-value">${subTask.progress}%</span>
                                    </div>
                                </div>
                                <button class="subtask-delete-btn" onclick="event.stopPropagation(); deleteSubTask('${task.id}', '${subTask.id}')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="add-subtask-btn" onclick="event.stopPropagation(); addSubTask('${task.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Tambah Sub-Task
                    </button>
                </div>
            `;
        } else {
            subTasksHTML = `
                <div class="subtasks-section">
                    <div class="subtasks-empty">
                        <p>Belum ada sub-task</p>
                        <button class="add-subtask-btn" onclick="event.stopPropagation(); addSubTask('${task.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Tambah Sub-Task
                        </button>
                    </div>
                </div>
            `;
        }
    }

    return `
        <div class="task-card ${completedClass} ${overdueClass} ${priorityClass} ${expandedClass}">
            <div class="task-header" onclick="toggleTaskExpand('${task.id}')">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="event.stopPropagation(); toggleTaskComplete('${task.id}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L6 11L13 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
                <div class="task-info">
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-meta">
                        <span class="task-deadline">
                            ⏰ ${formatDeadline(task.deadline)}
                        </span>
                        <span class="task-priority-badge ${task.priority}">
                            ${task.priority === 'high' ? 'Tinggi' : task.priority === 'medium' ? 'Sedang' : 'Rendah'}
                        </span>
                        ${task.subTasks && task.subTasks.length > 0 ? `<span class="subtask-count">📋 ${task.subTasks.length} sub-task</span>` : ''}
                    </div>
                    ${task.notes ? `<p class="task-notes">${task.notes}</p>` : ''}
                </div>
                <div class="expand-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </div>
            </div>
            ${subTasksHTML}
            <div class="task-actions">
                <button class="task-btn edit" onclick="event.stopPropagation(); editTask('${task.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Edit
                </button>
                <button class="task-btn delete" onclick="event.stopPropagation(); deleteTask('${task.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Hapus
                </button>
            </div>
        </div>
    `;
}

function renderCompletedTasks() {
    const completedTaskList = document.getElementById('completedTaskList');
    const emptyState = document.getElementById('emptyCompletedState');

    const completedTasks = tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        completedTaskList.innerHTML = '';
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
        completedTaskList.innerHTML = completedTasks.map(task => createTaskCard(task)).join('');
    }
}

function updateTodaySchedule() {
    const scheduleCard = document.getElementById('todaySchedule');
    const todayTasks = tasks.filter(task => !task.completed && isToday(task.deadline));

    if (todayTasks.length === 0) {
        scheduleCard.innerHTML = '<p class="empty-message">Tidak ada jadwal untuk hari ini</p>';
    } else {
        scheduleCard.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${todayTasks.map(task => `
                    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f9fafb; border-radius: 8px;">
                        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskComplete('${task.id}')">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8L6 11L13 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </div>
                        <div style="flex: 1;">
                            <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem;">${task.title}</p>
                            <p style="font-size: 0.75rem; color: var(--text-muted);">⏰ ${formatDeadline(task.deadline)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed).length;
    const overdueTasks = tasks.filter(t => !t.completed && isOverdue(t.deadline)).length;

    // Update stat cards
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('overdueTasks').textContent = overdueTasks;

    // Update progress circle
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('progressPercentage').textContent = `${percentage}%`;

    const progressCircle = document.getElementById('progressCircle');
    const circumference = 534; // 2 * PI * 85
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    // Add gradient definition if not exists
    if (!document.getElementById('progressGradient')) {
        const svg = progressCircle.closest('svg');
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea"/>
                <stop offset="100%" style="stop-color:#764ba2"/>
            </linearGradient>
        `;
        svg.insertBefore(defs, svg.firstChild);
    }

    // Update notification badge
    const notificationBadge = document.getElementById('notificationBadge');
    const upcomingTasks = tasks.filter(t => !t.completed && !isOverdue(t.deadline)).length;
    notificationBadge.textContent = upcomingTasks;
}

// ===== Modal =====
function openTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Reset form
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('modalTitle').textContent = 'Tambah Tugas Baru';
    document.getElementById('submitBtnText').textContent = 'Simpan Tugas';
    updateCharCounter();
}
// ===== Reminder Modal Functions =====
// Tambahkan fungsi-fungsi ini setelah fungsi closeTaskModal() di app.js (sekitar baris 454)

function openReminderModal() {
    const modal = document.getElementById('reminderModal');
    if (!modal) {
        showToast('Fitur reminder sedang dalam pengembangan', 'info');
        return;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderReminders();
}

function closeReminderModal() {
    const modal = document.getElementById('reminderModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderReminders() {
    const reminderList = document.getElementById('reminderList');
    const emptyState = document.getElementById('emptyReminderState');

    if (!reminderList || !emptyState) return;

    // Get upcoming tasks (not completed, not overdue) sorted by deadline
    const upcomingTasks = tasks
        .filter(task => !task.completed && !isOverdue(task.deadline))
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 10); // Show max 10 upcoming tasks

    if (upcomingTasks.length === 0) {
        reminderList.innerHTML = '';
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
        reminderList.innerHTML = upcomingTasks.map(task => createReminderItem(task)).join('');
    }
}

function createReminderItem(task) {
    const deadline = new Date(task.deadline);
    const formattedDate = deadline.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });

    const priorityColors = {
        'high': '#ef4444',
        'medium': '#f59e0b',
        'low': '#3b82f6'
    };

    return `
        <div class="reminder-item" onclick="navigateTo('tasksView'); closeReminderModal();">
            <div class="reminder-icon" style="background: ${priorityColors[task.priority]};">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V12L15 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="12" cy="12" r="10" stroke="white" stroke-width="2"/>
                </svg>
            </div>
            <div class="reminder-info">
                <h4 class="reminder-title">${task.title}</h4>
                <p class="reminder-deadline">📅 ${formattedDate}</p>
                <p class="reminder-countdown">${formatDeadline(task.deadline)}</p>
            </div>
            <div class="reminder-priority">
                <span class="priority-dot" style="background: ${priorityColors[task.priority]};"></span>
            </div>
        </div>
    `;
}


// ===== Search =====
function handleSearch() {
    renderTasks();
}

// ===== Character Counter =====
function updateCharCounter() {
    const taskNotes = document.getElementById('taskNotes');
    const charCount = document.getElementById('charCount');
    charCount.textContent = taskNotes.value.length;
}

// ===== Notifications =====
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notificationsEnabled = true;
                document.getElementById('notificationToggle').checked = true;
                localStorage.setItem('notificationsEnabled', 'true');
            }
        });
    } else if (Notification.permission === 'granted') {
        notificationsEnabled = true;
        document.getElementById('notificationToggle').checked = true;
    }
}

function toggleNotifications() {
    const toggle = document.getElementById('notificationToggle');
    notificationsEnabled = toggle.checked;
    localStorage.setItem('notificationsEnabled', notificationsEnabled);

    if (notificationsEnabled && Notification.permission === 'default') {
        requestNotificationPermission();
    }

    showToast(notificationsEnabled ? 'Notifikasi diaktifkan' : 'Notifikasi dinonaktifkan', 'success');
}

function checkReminders() {
    if (!notificationsEnabled || Notification.permission !== 'granted') return;

    const now = new Date();

    tasks.forEach(task => {
        if (task.completed) return;

        const deadline = new Date(task.deadline);
        const timeDiff = deadline - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Reminder 24 hours before
        if (hoursDiff > 23 && hoursDiff <= 24 && !task.reminded24h) {
            showNotification(task.title, '24 jam lagi!');
            task.reminded24h = true;
            saveToStorage();
        }

        // Reminder 1 hour before
        if (hoursDiff > 0 && hoursDiff <= 1 && !task.reminded1h) {
            showNotification(task.title, '1 jam lagi!');
            task.reminded1h = true;
            saveToStorage();
        }
    });
}

function showNotification(title, body) {
    new Notification('Manajemen Tugas', {
        body: `${title} - ${body}`,
        icon: 'https://ui-avatars.com/api/?name=MT&background=6366f1&color=fff&size=128',
        badge: 'https://ui-avatars.com/api/?name=MT&background=6366f1&color=fff&size=128'
    });
}

// ===== Settings =====
function saveUserName() {
    const userName = document.getElementById('userNameInput').value.trim();
    if (userName) {
        localStorage.setItem('userName', userName);
        document.getElementById('userName').textContent = userName;

        // Update avatar
        const userAvatar = document.getElementById('userAvatar');
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=80`;

        showToast('Nama berhasil disimpan', 'success');
    }
}

function clearAllData() {
    if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan.')) {
        tasks = [];
        localStorage.removeItem('tasks');
        renderTasks();
        updateStats();
        updateTodaySchedule();
        showToast('Semua data berhasil dihapus', 'success');
    }
}

// ===== Storage =====
function saveToStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadFromStorage() {
    // Load tasks
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }

    // Load user name
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.getElementById('userName').textContent = userName;
        document.getElementById('userNameInput').value = userName;

        const userAvatar = document.getElementById('userAvatar');
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=80`;
    }

    // Load notification settings
    const notifEnabled = localStorage.getItem('notificationsEnabled');
    if (notifEnabled === 'true') {
        notificationsEnabled = true;
        document.getElementById('notificationToggle').checked = true;
    }
}

// ===== Toast =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.textContent = message;
    toastIcon.textContent = type === 'success' ? '✓' : '✕';

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== Utilities =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
// ===== Calendar View Functions =====
// Tambahkan fungsi-fungsi ini di akhir file app.js

let currentCalendarDate = new Date();
let selectedDate = null;

function changeMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    // Update month display
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Generate calendar days
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const currentDate = new Date(year, month, day);

        // Check if this day is today
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        // Check if this day is selected
        if (selectedDate && currentDate.toDateString() === selectedDate.toDateString()) {
            dayElement.classList.add('selected');
        }

        // Check if there are tasks on this day
        const tasksOnDay = tasks.filter(task => {
            const taskDate = new Date(task.deadline);
            return taskDate.toDateString() === currentDate.toDateString();
        });

        if (tasksOnDay.length > 0) {
            dayElement.classList.add('has-tasks');
            const taskDot = document.createElement('div');
            taskDot.className = 'task-dot';
            taskDot.textContent = tasksOnDay.length;
            dayElement.appendChild(taskDot);
        }

        // Add click handler
        dayElement.onclick = () => selectDate(new Date(year, month, day));

        calendarDays.appendChild(dayElement);
    }
}

function selectDate(date) {
    selectedDate = date;
    renderCalendar();
    renderCalendarTasks();

    // Update selected date info
    const dateInfo = document.getElementById('selectedDateInfo');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateInfo.innerHTML = `<p class="selected-date-text">📅 ${date.toLocaleDateString('id-ID', options)}</p>`;
}

function renderCalendarTasks() {
    const taskList = document.getElementById('calendarTaskList');
    const emptyState = document.getElementById('emptyCalendarState');

    if (!selectedDate) {
        taskList.innerHTML = '';
        emptyState.classList.remove('show');
        return;
    }

    // Filter tasks for selected date
    const tasksOnDate = tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        return taskDate.toDateString() === selectedDate.toDateString();
    });

    if (tasksOnDate.length === 0) {
        taskList.innerHTML = '';
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
        taskList.innerHTML = tasksOnDate.map(task => createTaskCard(task)).join('');
    }
}

// Initialize calendar when navigating to calendar view
// Update navigateTo function to include calendar initialization
const originalNavigateTo = navigateTo;
navigateTo = function (viewId) {
    originalNavigateTo(viewId);

    if (viewId === 'calendarView') {
        currentCalendarDate = new Date();
        renderCalendar();

        // Auto-select today
        selectedDate = new Date();
        renderCalendarTasks();

        const dateInfo = document.getElementById('selectedDateInfo');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateInfo.innerHTML = `<p class="selected-date-text">📅 ${selectedDate.toLocaleDateString('id-ID', options)}</p>`;
    }
};
