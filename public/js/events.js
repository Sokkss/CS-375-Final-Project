const toggleFormBtn = document.getElementById('toggleFormBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelBtn = document.getElementById('cancelBtn');
const createEventForm = document.getElementById('createEventForm');
const eventForm = document.getElementById('eventForm');
const messageDiv = document.getElementById('message');
const eventsList = document.getElementById('eventsList');
const loadingSpinner = document.getElementById('loadingSpinner');
const noEvents = document.getElementById('noEvents');

// Track current user (from Google OAuth)
let currentUser = null;
let currentUserEmail = null;

// Fetch logged-in user from session
async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (data.authenticated && data.user) {
            currentUser = data.user.name;
            currentUserEmail = data.user.email;
            console.log('Logged in as:', currentUser, currentUserEmail);
        } else {
            currentUser = null;
            currentUserEmail = null;
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        currentUser = null;
        currentUserEmail = null;
    }
}

// Initialize user and set up modal listeners on page load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchCurrentUser();
    loadEvents();
    
    // Set up modal event listeners
    document.getElementById('confirmRsvp')?.addEventListener('click', confirmRSVP);
    document.getElementById('cancelRsvp')?.addEventListener('click', closeRsvpModal);
    document.getElementById('closeRsvpModal')?.addEventListener('click', closeRsvpModal);
    document.getElementById('closeAttendeesModal')?.addEventListener('click', closeAttendeesModal);
    document.getElementById('closeAttendeesBtn')?.addEventListener('click', closeAttendeesModal);
    document.getElementById('copyEmails')?.addEventListener('click', copyEmails);
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
    
    // Check if user is logged in
    if (!currentUser) {
        showMessage('Please log in to create events', 'error');
        return;
    }
    
    // Get form values
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const locationDescription = document.getElementById('locationDescription').value.trim();
    const lat = document.getElementById('lat').value.trim() || null;
    const long = document.getElementById('long').value.trim() || null;
    const datetime = document.getElementById('datetime').value;
    const owner = currentUser; // Use logged-in user automatically
    const image = document.getElementById('image').value.trim() || null;
    const externalLink = document.getElementById('externalLink').value.trim() || null;
    
    // Validate required fields
    if (!title || !locationDescription || !datetime) {
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
            showMessage(isEditing ? 'Event updated successfully!' : 'Event created successfully!', 'success');
            eventForm.reset();
            delete eventForm.dataset.editingId;
            
            // Reset submit button text
            const submitBtn = eventForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Create Event';
            
            hideForm();
            
            loadEvents();
        } else {
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
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer';
    
    card.onclick = (e) => {
        // prevent clicking on buttons or links within the card
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
            return;
        }
        
        let url = `/pages/event-details.html?id=${event.id}`;
        window.location.href = url;
    };
    
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

    if (currentUser && currentUser === event.owner) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mt-4 flex gap-2';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-sm py-2 px-4 rounded';
        editBtn.textContent = 'Edit Event';
        editBtn.onclick = () => editEvent(event);
        buttonContainer.appendChild(editBtn);
        
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


let pendingRsvpEventId = null;

async function handleRSVP(eventId) {
    if (!currentUser || !currentUserEmail) {
        showMessage('Please log in to RSVP to events', 'error');
        return;
    }
    
    pendingRsvpEventId = eventId;
    
    const modal = document.getElementById('rsvpModal');
    document.getElementById('rsvpName').value = currentUser;
    document.getElementById('rsvpEmail').value = currentUserEmail;
    
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    
    document.body.style.overflow = 'hidden';
    
    modal.classList.remove('hidden');
}

async function confirmRSVP() {
    if (!pendingRsvpEventId) return;
    
    try {
        const response = await fetch(`/api/events/${pendingRsvpEventId}/rsvp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                userId: currentUser,
                userEmail: currentUserEmail
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Successfully RSVP\'d to event!', 'success');
            
            const btn = document.getElementById(`rsvp-btn-${pendingRsvpEventId}`);
            if (btn) {
                btn.textContent = 'RSVP\'d ✓';
                btn.disabled = true;
                btn.className = 'bg-gray-400 text-white text-xs py-1 px-3 rounded mt-1 cursor-not-allowed';
            }
            
            fetchRSVPCount(pendingRsvpEventId);
            
            closeRsvpModal();
        } else {
            showMessage(data.error || 'Failed to RSVP', 'error');
            closeRsvpModal();
        }
    } catch (error) {
        console.error('Error RSVPing to event:', error);
        showMessage('An error occurred. Please try again.', 'error');
        closeRsvpModal();
    }
}

function closeRsvpModal() {
    document.body.style.overflow = ''; 
    document.getElementById('rsvpModal').classList.add('hidden');
    pendingRsvpEventId = null;
}

async function showAttendees(eventId, eventTitle) {
    try {
        const response = await fetch(`/api/events/${eventId}/attendees`);
        const data = await response.json();
        
        if (response.ok) {
            const attendees = data.attendees || [];
            const count = data.count || 0;
            
            document.getElementById('attendeesEventTitle').textContent = `Event: ${eventTitle}`;
            
            const attendeesList = document.getElementById('attendeesList');
            if (count === 0) {
                attendeesList.innerHTML = '<p class="text-gray-600">No attendees yet for this event.</p>';
                document.getElementById('attendeesEmailSection').classList.add('hidden');
            } else {
                let listHTML = `<p class="text-gray-600 mb-3">Total: ${count} attendee${count !== 1 ? 's' : ''}</p>`;
                listHTML += '<div class="space-y-2">';
                
                const emails = [];
                attendees.forEach(attendee => {
                    listHTML += `<div class="border-b pb-2">
                        <p class="font-semibold text-gray-800">${attendee.name}</p>`;
                    if (attendee.email) {
                        listHTML += `<p class="text-gray-600 text-sm">${attendee.email}</p>`;
                        emails.push(attendee.email);
                    }
                    listHTML += '</div>';
                });
                
                listHTML += '</div>';
                attendeesList.innerHTML = listHTML;
                
                // Show email section if there are emails
                if (emails.length > 0) {
                    document.getElementById('attendeesEmailSection').classList.remove('hidden');
                    document.getElementById('attendeesEmails').value = emails.join(', ');
                } else {
                    document.getElementById('attendeesEmailSection').classList.add('hidden');
                }
            }
            
            // Show modal with forced positioning
            const modal = document.getElementById('attendeesModal');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            
            document.body.style.overflow = 'hidden';
            modal.classList.remove('hidden');
        } else {
            showMessage('Failed to load attendees', 'error');
        }
    } catch (error) {
        console.error('Error loading attendees:', error);
        showMessage('Failed to load attendees', 'error');
    }
}

function closeAttendeesModal() {
    document.body.style.overflow = '';
    document.getElementById('attendeesModal').classList.add('hidden');
}

// Copy emails to clipboard
function copyEmails() {
    const emailsTextarea = document.getElementById('attendeesEmails');
    emailsTextarea.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copyEmails');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}


function editEvent(event) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    createEventForm.classList.remove('hidden');
    toggleFormBtn.classList.add('hidden');
    
    document.getElementById('title').value = event.title;
    document.getElementById('description').value = event.description || '';
    document.getElementById('locationDescription').value = event.locationDescription || event.location || '';
    document.getElementById('lat').value = event.lat || '';
    document.getElementById('long').value = event.long || '';
    
    // Convert ISO time to datetime-local format
    const eventDate = new Date(event.time);
    const dateString = eventDate.toISOString().slice(0, 16);
    document.getElementById('datetime').value = dateString;
    
    document.getElementById('image').value = event.image || '';
    document.getElementById('externalLink').value = event.externalLink || event.external_link || '';

    const submitBtn = eventForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Event';
    
    eventForm.dataset.editingId = event.id;
    
    showMessage('Editing event - make your changes and click "Update Event"', 'success');
}

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
            loadEvents();
        } else {
            showMessage(data.error || 'Failed to delete event', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showMessage('An error occurred. Please try again.', 'error');
    }
}

function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `mb-4 p-4 rounded ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
    messageDiv.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideMessage() {
    messageDiv.classList.add('hidden');
}
