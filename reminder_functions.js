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
