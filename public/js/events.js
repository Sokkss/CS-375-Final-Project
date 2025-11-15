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

// Track current user (for RSVP and edit/delete permissions)
let currentUser = localStorage.getItem('currentUser') || '';

// Add user input field listener if it exists
document.addEventListener('DOMContentLoaded', () => {
    const ownerInput = document.getElementById('owner');
    if (ownerInput && ownerInput.value) {
        currentUser = ownerInput.value;
        localStorage.setItem('currentUser', currentUser);
    }
    
    ownerInput?.addEventListener('input', (e) => {
        currentUser = e.target.value;
        localStorage.setItem('currentUser', currentUser);
    });
});

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
    
    // Reset edit mode
    delete eventForm.dataset.editingId;
    const submitBtn = eventForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Create Event';
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
    
    // Check if we're editing or creating
    const editingId = eventForm.dataset.editingId;
    const isEditing = !!editingId;
    
    try {
        let response;
        
        if (isEditing) {
            response = await fetch(`/api/events/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
        } else {
            response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
        }
        
        const data = await response.json();
        
        if (response.ok) {
            // Success!
            showMessage(isEditing ? 'Event updated successfully!' : 'Event created successfully!', 'success');
            eventForm.reset();
            delete eventForm.dataset.editingId; // Clear edit mode
            
            // Reset submit button text
            const submitBtn = eventForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Create Event';
            
            hideForm();
            
            // Reload events list
            loadEvents();
        } else {
            // Error from server
            showMessage(data.error || (isEditing ? 'Failed to update event' : 'Failed to create event'), 'error');
        }
    } catch (error) {
        console.error('Error saving event:', error);
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
    
        // Create image element
    if (event.image) {
        const img = document.createElement('img');
        img.src = event.image;
        img.alt = event.title;
        img.className = 'w-full h-48 object-cover';
        card.appendChild(img);
    } else {
        const placeholderDiv = document.createElement('div');
        placeholderDiv.className = 'w-full h-48 bg-gradient-to-r from-blue-400 to-purple-500';
        card.appendChild(placeholderDiv);
    }

    // Create content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'p-4';

    // Title
    const titleH3 = document.createElement('h3');
    titleH3.className = 'font-bold text-xl mb-2 text-gray-800';
    titleH3.textContent = event.title;
    contentDiv.appendChild(titleH3);

    // Location
    const locationP = document.createElement('p');
    locationP.className = 'text-gray-600 text-sm mb-2';
    locationP.textContent = `📍 ${event.locationDescription || event.location || 'Location not specified'}`;
    contentDiv.appendChild(locationP);

    // Coordinates (if available)
    if (event.lat && event.long) {
        const coordP = document.createElement('p');
        coordP.className = 'text-gray-500 text-xs mb-2';
        coordP.textContent = `📍 Coordinates: ${parseFloat(event.lat).toFixed(6)}, ${parseFloat(event.long).toFixed(6)}`;
        contentDiv.appendChild(coordP);
    }

    // Date
    const dateP = document.createElement('p');
    dateP.className = 'text-gray-600 text-sm mb-2';
    dateP.textContent = `📅 ${formattedDate}`;
    contentDiv.appendChild(dateP);

    // Owner
    const ownerP = document.createElement('p');
    ownerP.className = 'text-gray-600 text-sm mb-2';
    ownerP.textContent = `👤 Created by ${event.owner}`;
    contentDiv.appendChild(ownerP);

    // RSVP section container
    const rsvpContainer = document.createElement('div');
    rsvpContainer.className = 'mb-2';

    // RSVP count
    const rsvpP = document.createElement('p');
    rsvpP.className = 'text-gray-600 text-sm mb-1';
    rsvpP.id = `rsvp-count-${event.id}`;
    rsvpP.textContent = '👥 Loading attendees...';
    rsvpContainer.appendChild(rsvpP);

    // RSVP button (only show if user is logged in and not the owner)
    if (currentUser && currentUser !== event.owner) {
        const rsvpBtn = document.createElement('button');
        rsvpBtn.className = 'bg-blue-500 hover:bg-blue-600 text-gray-900 text-xs py-1 px-3 rounded mt-1';
        rsvpBtn.textContent = 'RSVP to Event';
        rsvpBtn.id = `rsvp-btn-${event.id}`;
        rsvpBtn.onclick = () => handleRSVP(event.id);
        rsvpContainer.appendChild(rsvpBtn);
    }

    // View attendees button (only for event owner)
    if (currentUser && currentUser === event.owner) {
        const viewAttendeesBtn = document.createElement('button');
        viewAttendeesBtn.className = 'bg-green-500 hover:bg-green-600 text-gray-900 text-xs py-1 px-3 rounded mt-1';
        viewAttendeesBtn.textContent = 'View Attendees';
        viewAttendeesBtn.onclick = () => showAttendees(event.id, event.title);
        rsvpContainer.appendChild(viewAttendeesBtn);
    }

    contentDiv.appendChild(rsvpContainer);

    // Fetch RSVP count
    fetchRSVPCount(event.id);

    // Description (if available)
    if (event.description) {
        const descP = document.createElement('p');
        descP.className = 'text-gray-700 text-sm mt-3';
        descP.textContent = event.description;
        contentDiv.appendChild(descP);
    }

    // External link (if available)
    if (event.external_link || event.externalLink) {
        const linkA = document.createElement('a');
        linkA.href = event.external_link || event.externalLink;
        linkA.target = '_blank';
        linkA.className = 'inline-block mt-3 text-blue-500 hover:text-blue-700 text-sm';
        linkA.textContent = 'View Details →';
        contentDiv.appendChild(linkA);
    }

    // Edit/Delete buttons (only for event owner)
    if (currentUser && currentUser === event.owner) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mt-4 flex gap-2';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-sm py-2 px-4 rounded';
        editBtn.textContent = 'Edit Event';
        editBtn.onclick = () => editEvent(event);
        buttonContainer.appendChild(editBtn);
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'bg-red-500 hover:bg-red-600 text-gray-900 text-sm py-2 px-4 rounded';
        deleteBtn.textContent = 'Delete Event';
        deleteBtn.onclick = () => deleteEventConfirm(event.id, event.title);
        buttonContainer.appendChild(deleteBtn);
        
        contentDiv.appendChild(buttonContainer);
    }

    card.appendChild(contentDiv);

    return card;
}

// Fetch and display RSVP count for an event
async function fetchRSVPCount(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}/attendees`);
        const data = await response.json();
        
        const rsvpElement = document.getElementById(`rsvp-count-${eventId}`);
        if (rsvpElement) {
            const count = data.count || 0;
            rsvpElement.textContent = `👥 ${count} attendee${count !== 1 ? 's' : ''}`;
        }
    } catch (error) {
        console.error('Error fetching RSVP count:', error);
        const rsvpElement = document.getElementById(`rsvp-count-${eventId}`);
        if (rsvpElement) {
            rsvpElement.textContent = '👥 Attendees unavailable';
        }
    }
}

// Handle RSVP to an event
async function handleRSVP(eventId) {
    if (!currentUser) {
        showMessage('Please enter your name in the "Owner" field to RSVP', 'error');
        return;
    }
    
    // Ask for email
    const userEmail = prompt('Please enter your email address (so the event owner can contact you):');
    
    if (!userEmail || !userEmail.includes('@')) {
        showMessage('Valid email address required to RSVP', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                userId: currentUser,
                userEmail: userEmail
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Successfully RSVP\'d to event!', 'success');
            
            // Update the button
            const btn = document.getElementById(`rsvp-btn-${eventId}`);
            if (btn) {
                btn.textContent = 'RSVP\'d ✓';
                btn.disabled = true;
                btn.className = 'bg-gray-400 text-white text-xs py-1 px-3 rounded mt-1 cursor-not-allowed';
            }
            
            // Refresh RSVP count
            fetchRSVPCount(eventId);
        } else {
            showMessage(data.error || 'Failed to RSVP', 'error');
        }
    } catch (error) {
        console.error('Error RSVPing to event:', error);
        showMessage('An error occurred. Please try again.', 'error');
    }
}

// Show attendees list (for event owner)
async function showAttendees(eventId, eventTitle) {
    try {
        const response = await fetch(`/api/events/${eventId}/attendees`);
        const data = await response.json();
        
        if (response.ok) {
            const attendees = data.attendees || [];
            const count = data.count || 0;
            
            if (count === 0) {
                alert(`No attendees yet for "${eventTitle}".`);
                return;
            }
            
            // Build attendee list with emails
            let message = `Attendees for "${eventTitle}":\n\n`;
            const emails = [];
            
            attendees.forEach(attendee => {
                message += `${attendee.name}`;
                if (attendee.email) {
                    message += ` - ${attendee.email}`;
                    emails.push(attendee.email);
                }
                message += '\n';
            });
            
            message += `\n\nTotal: ${count} attendee${count !== 1 ? 's' : ''}`;
            
            if (emails.length > 0) {
                message += `\n\n--- COPY ALL EMAILS ---\n${emails.join(', ')}`;
                message += '\n\nTip: You can copy the emails above and paste into your email client!';
            }
            
            alert(message);
        } else {
            showMessage('Failed to load attendees', 'error');
        }
    } catch (error) {
        console.error('Error loading attendees:', error);
        showMessage('Failed to load attendees', 'error');
    }
}

// Edit an event
function editEvent(event) {
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show the form
    createEventForm.classList.remove('hidden');
    toggleFormBtn.classList.add('hidden');
    
    // Populate form fields
    document.getElementById('title').value = event.title;
    document.getElementById('description').value = event.description || '';
    document.getElementById('locationDescription').value = event.locationDescription || event.location || '';
    document.getElementById('lat').value = event.lat || '';
    document.getElementById('long').value = event.long || '';
    
    // Convert ISO time to datetime-local format
    const eventDate = new Date(event.time);
    const dateString = eventDate.toISOString().slice(0, 16);
    document.getElementById('datetime').value = dateString;
    
    document.getElementById('owner').value = event.owner;
    document.getElementById('image').value = event.image || '';
    document.getElementById('externalLink').value = event.externalLink || event.external_link || '';
    
    // Change form to edit mode
    const submitBtn = eventForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Event';
    
    // Store event ID for update
    eventForm.dataset.editingId = event.id;
    
    showMessage('Editing event - make your changes and click "Update Event"', 'success');
}

// Delete event with confirmation
async function deleteEventConfirm(eventId, eventTitle) {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ owner: currentUser })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Event deleted successfully!', 'success');
            loadEvents(); // Reload events list
        } else {
            showMessage(data.error || 'Failed to delete event', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showMessage('An error occurred. Please try again.', 'error');
    }
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