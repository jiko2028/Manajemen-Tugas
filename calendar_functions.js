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
