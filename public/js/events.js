// Events Page - Handles creating and displaying events

// Get DOM elements
const toggleFormBtn = document.getElementById('toggleFormBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelBtn = document.getElementById('cancelBtn');
const createEventForm = document.getElementById('createEventForm');
const eventForm = document.getElementById('eventForm');
const messageDiv = document.getElementById('message');
const eventsList = document.getElementById('eventsList');
const loadingSpinner = document.getElementById('loadingSpinner');
const noEvents = document.getElementById('noEvents');

// Show/Hide create event form
toggleFormBtn.addEventListener('click', () => {
    createEventForm.classList.remove('hidden');
    toggleFormBtn.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

closeFormBtn.addEventListener('click', hideForm);
cancelBtn.addEventListener('click', hideForm);

function hideForm() {
    createEventForm.classList.add('hidden');
    toggleFormBtn.classList.remove('hidden');
    eventForm.reset();
    hideMessage();
}

// Handle form submission
eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const locationDescription = document.getElementById('locationDescription').value.trim();
    const lat = document.getElementById('lat').value.trim() || null;
    const long = document.getElementById('long').value.trim() || null;
    const datetime = document.getElementById('datetime').value;
    const owner = document.getElementById('owner').value.trim();
    const image = document.getElementById('image').value.trim() || null;
    const externalLink = document.getElementById('externalLink').value.trim() || null;
    
    // Validate required fields
    if (!title || !locationDescription || !datetime || !owner) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    // Convert datetime to ISO format
    const time = new Date(datetime).toISOString();
    
    // Create event object
    const eventData = {
        title,
        description,
        locationDescription,
        lat: lat ? parseFloat(lat) : null,
        long: long ? parseFloat(long) : null,
        time,
        owner,
        image,
        externalLink
    };
    
    try {
        // Send POST request
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Success!
            showMessage('Event created successfully!', 'success');
            eventForm.reset();
            hideForm();
            
            // Reload events list
            loadEvents();
        } else {
            // Error from server
            showMessage(data.error || 'Failed to create event', 'error');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showMessage('An error occurred. Please try again.', 'error');
    }
});

// Load and display all events
async function loadEvents() {
    try {
        loadingSpinner.classList.remove('hidden');
        eventsList.classList.add('hidden');
        noEvents.classList.add('hidden');
        
        const response = await fetch('/api/events');
        const data = await response.json();
        
        loadingSpinner.classList.add('hidden');
        
        if (response.ok && data.events && data.events.length > 0) {
            displayEvents(data.events);
        } else {
            eventsList.classList.add('hidden');
            noEvents.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        loadingSpinner.classList.add('hidden');
        showMessage('Failed to load events', 'error');
    }
}

// Display events in the grid
function displayEvents(events) {
    eventsList.innerHTML = '';
    eventsList.classList.remove('hidden');
    
    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsList.appendChild(eventCard);
    });
}

// Create an event card element
function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow';
    
    // Format date
    const eventDate = new Date(event.time);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    card.innerHTML = `
        ${event.image ? `<img src="${event.image}" alt="${event.title}" class="w-full h-48 object-cover">` : 
          '<div class="w-full h-48 bg-gradient-to-r from-blue-400 to-purple-500"></div>'}
        <div class="p-4">
            <h3 class="font-bold text-xl mb-2 text-gray-800">${escapeHtml(event.title)}</h3>
            <p class="text-gray-600 text-sm mb-2">📍 ${escapeHtml(event.locationDescription || event.location || 'Location not specified')}</p>
            ${event.lat && event.long ? `<p class="text-gray-500 text-xs mb-2">📍 Coordinates: ${parseFloat(event.lat).toFixed(6)}, ${parseFloat(event.long).toFixed(6)}</p>` : ''}
            <p class="text-gray-600 text-sm mb-2">📅 ${formattedDate}</p>
            <p class="text-gray-600 text-sm mb-2">👤 Created by ${escapeHtml(event.owner)}</p>
            ${event.description ? `<p class="text-gray-700 text-sm mt-3">${escapeHtml(event.description)}</p>` : ''}
            ${event.external_link || event.externalLink ? 
              `<a href="${event.external_link || event.externalLink}" target="_blank" 
                 class="inline-block mt-3 text-blue-500 hover:text-blue-700 text-sm">
                 View Details →
               </a>` : ''}
        </div>
    `;
    
    return card;
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show message
function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `mb-4 p-4 rounded ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
    messageDiv.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Hide message
function hideMessage() {
    messageDiv.classList.add('hidden');
}

// Load events when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});