let currentDate = new Date();
let calendarEvents = [];

export function initCalendar(calendarContainerId) {
    let calendar = document.getElementById(calendarContainerId);
    
    while (calendar.firstChild) {
        calendar.removeChild(calendar.firstChild);
    }

    fetch('/api/user', { cache: 'no-store', credentials: 'include' })
        .then(function(userResponse) {
            return userResponse.json();
        })
        .then(function(userData) {
            if (!userData.authenticated) {
                throw new Error('User not logged in');
            }
            return fetch('/api/calendar/embed', { cache: 'no-store', credentials: 'include' });
        })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to fetch calendar');
            }
            return response.json();
        })
        .then(function(data) {
            calendarEvents = data.events || [];
            renderCalendar(calendar);
        })
        .catch(function(err) {
            console.error('Error loading calendar:', err);

            let errorMessage = document.createElement('p');
            errorMessage.textContent = 'You must be logged in to view your calendar.';
            errorMessage.className = 'font-semibold text-center mt-4';

            calendar.appendChild(errorMessage);
        });
}

function renderCalendar(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    let wrapper = document.createElement('div');
    wrapper.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden';
    
    let header = document.createElement('div');
    header.className = 'flex items-center justify-between px-6 py-4 border-b border-gray-100';
    
    let prevBtn = document.createElement('button');
    prevBtn.className = 'p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors';
    prevBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>';
    prevBtn.onclick = function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(container);
    };
    header.appendChild(prevBtn);
    
    let monthYear = document.createElement('h2');
    monthYear.className = 'text-xl font-semibold text-gray-900';
    monthYear.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    header.appendChild(monthYear);
    
    let nextBtn = document.createElement('button');
    nextBtn.className = 'p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors';
    nextBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
    nextBtn.onclick = function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(container);
    };
    header.appendChild(nextBtn);
    
    wrapper.appendChild(header);
    
    let daysHeader = document.createElement('div');
    daysHeader.className = 'grid grid-cols-7 border-b border-gray-100';
    let dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(function(day) {
        let dayCell = document.createElement('div');
        dayCell.className = 'py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide';
        dayCell.textContent = day;
        daysHeader.appendChild(dayCell);
    });
    wrapper.appendChild(daysHeader);
    
    let grid = document.createElement('div');
    grid.className = 'grid grid-cols-7';
    
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    let firstDay = new Date(year, month, 1).getDay();
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    let today = new Date();
    
    for (let i = 0; i < firstDay; i++) {
        let emptyCell = document.createElement('div');
        emptyCell.className = 'min-h-[90px] p-2 border-b border-r border-gray-50 bg-gray-50/50';
        grid.appendChild(emptyCell);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        let cellDate = new Date(year, month, day);
        let isToday = cellDate.toDateString() === today.toDateString();
        
        let cell = document.createElement('div');
        cell.className = 'min-h-[90px] p-2 border-b border-r border-gray-50 bg-white hover:bg-gray-50/50 transition-colors';
        
        let dayNum = document.createElement('div');
        dayNum.className = 'text-sm mb-1';
        if (isToday) {
            let todayBadge = document.createElement('span');
            todayBadge.className = 'inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs font-medium';
            todayBadge.textContent = day;
            dayNum.appendChild(todayBadge);
        } else {
            dayNum.className += ' text-gray-600';
            dayNum.textContent = day;
        }
        cell.appendChild(dayNum);
        
        let dayEvents = getEventsForDate(cellDate);
        dayEvents.slice(0, 3).forEach(function(event) {
            let eventEl = document.createElement('a');
            eventEl.href = event.htmlLink || '#';
            eventEl.target = '_blank';
            eventEl.className = 'block text-xs px-1.5 py-0.5 mb-1 rounded bg-green-50 text-green-700 hover:bg-green-100 truncate cursor-pointer border-l-2 border-green-500';
            
            let startTime = new Date(event.start);
            let timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            eventEl.textContent = timeStr + ' ' + event.title;
            eventEl.title = event.title + (event.location ? ' - ' + event.location : '');
            
            cell.appendChild(eventEl);
        });
        
        if (dayEvents.length > 3) {
            let moreEl = document.createElement('div');
            moreEl.className = 'text-xs text-gray-500 mt-1';
            moreEl.textContent = '+' + (dayEvents.length - 3) + ' more';
            cell.appendChild(moreEl);
        }
        
        grid.appendChild(cell);
    }
    
    let remainingCells = (7 - ((firstDay + daysInMonth) % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
        let emptyCell = document.createElement('div');
        emptyCell.className = 'min-h-[90px] p-2 border-b border-r border-gray-50 bg-gray-50/50';
        grid.appendChild(emptyCell);
    }
    
    wrapper.appendChild(grid);
    container.appendChild(wrapper);
}

function getEventsForDate(date) {
    let dateStr = date.toDateString();
    return calendarEvents.filter(function(event) {
        let eventDate = new Date(event.start);
        return eventDate.toDateString() === dateStr;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initCalendar('calendar');
    });
} else {
    initCalendar('calendar');
}