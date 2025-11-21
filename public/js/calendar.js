export async function initCalendar(calendarContainerId) {
    const calendar = document.getElementById(calendarContainerId);
    calendar.textContent = '';

    try {
        const userResponse = await fetch('/api/user', { cache: 'no-store' });
        if (!userResponse.ok) throw new Error('Failed to check user');

        const userData = await userResponse.json();
        if (!userData.authenticated) {
            throw new Error('User not logged in');
        }

        const response = await fetch('/api/calendar/embed', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to get embed URL');

        const data = await response.json();

        const iframe = document.createElement('iframe');
        iframe.src = data.embedUrl;
        iframe.style.border = '0';
        iframe.style.width = '80%';
        iframe.style.height = '800px';

        calendar.appendChild(iframe);

    } catch (err) {
        console.error('Error loading calendar:', err);

        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'You must be logged in to view the calendar.';
        errorMessage.classList.add('text-red-500', 'font-semibold', 'text-center', 'mt-4');

        calendar.appendChild(errorMessage);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCalendar('calendar'));
} else {
    initCalendar('calendar');
}
