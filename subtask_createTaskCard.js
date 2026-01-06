// ===== REPLACE createTaskCard function (around line 379) with this code =====

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
