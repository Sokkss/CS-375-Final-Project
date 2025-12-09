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
        const response = await fetch('/api/user', { 
            credentials: 'include' 
        });
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
    // Check if user is logged in immediately
    if (!currentUser) {
        showMessage('Please log in to create events', 'error');
        return;
    }
    
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


function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:scale-[1.02] hover:border-gray-300 transition-all duration-200 cursor-pointer';
    
    card.onclick = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
            return;
        }
        
        let url = `/pages/event-details.html?id=${event.id}`;
        window.location.href = url;
    };
    
    const eventDate = new Date(event.time);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative overflow-hidden';
    
    if (event.image) {
        const img = document.createElement('img');
        img.src = event.image;
        img.alt = `Image for ${event.title}`;
        img.className = 'w-full h-52 object-cover';
        img.onerror = () => {
            const placeholder = document.createElement('div');
            placeholder.className = 'w-full h-52 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400';
            imageContainer.replaceChild(placeholder, img);
        };
        imageContainer.appendChild(img);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'w-full h-52 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400';
        imageContainer.appendChild(placeholder);
    }

    card.appendChild(imageContainer);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'p-6';

    const titleH3 = document.createElement('h3');
    titleH3.className = 'text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight';
    titleH3.textContent = event.title;
    contentDiv.appendChild(titleH3);

    const metadataContainer = document.createElement('div');
    metadataContainer.className = 'space-y-2.5 mb-4';
    
    const dateRow = document.createElement('div');
    dateRow.className = 'flex items-center text-sm text-gray-700';
    dateRow.innerHTML = `
        <svg class="w-4 h-4 mr-2.5 flex-shrink-0 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
        </svg>
        <span class="font-semibold text-gray-800">${formattedDate}</span>
    `;
    metadataContainer.appendChild(dateRow);
    
    const locationRow = document.createElement('div');
    locationRow.className = 'flex items-start text-sm text-gray-700';
    locationRow.innerHTML = `
        <svg class="w-4 h-4 mr-2.5 mt-0.5 flex-shrink-0 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        <span class="line-clamp-1 text-gray-700">${event.locationDescription || event.location || 'Location not specified'}</span>
    `;
    metadataContainer.appendChild(locationRow);
    
    contentDiv.appendChild(metadataContainer);

    // Secondary metadata bar (Owner & Attendees) - refined styling
    const secondaryBar = document.createElement('div');
    secondaryBar.className = 'flex items-center justify-between py-3 mb-4 border-t border-gray-200';
    
    const ownerDiv = document.createElement('div');
    ownerDiv.className = 'flex items-center text-xs text-gray-600';
    ownerDiv.innerHTML = `
        <svg class="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
        </svg>
        <span class="text-gray-600">${event.owner}</span>
    `;
    
    const attendeesDiv = document.createElement('div');
    attendeesDiv.className = 'flex items-center text-xs text-gray-600';
    attendeesDiv.id = `rsvp-count-${event.id}`;
    attendeesDiv.innerHTML = `
        <svg class="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
        <span class="font-medium text-gray-700">Loading...</span>
    `;
    
    secondaryBar.appendChild(ownerDiv);
    secondaryBar.appendChild(attendeesDiv);
    contentDiv.appendChild(secondaryBar);
    
    fetchRSVPCount(event.id);

    // Description (if available) - refined styling
    if (event.description) {
        const descP = document.createElement('p');
        descP.className = 'text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed';
        descP.textContent = event.description;
        contentDiv.appendChild(descP);
    }

    // Actions section - refined spacing and visual separation
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'flex items-center gap-2.5 pt-4 border-t border-gray-200';
    
    // RSVP button (only if logged in & not owner) - primary CTA
    if (currentUser && currentUser !== event.owner) {
        const rsvpBtn = document.createElement('button');
        rsvpBtn.className = 'flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2';
        rsvpBtn.textContent = 'RSVP to Event';
        rsvpBtn.id = `rsvp-btn-${event.id}`;
        rsvpBtn.onclick = (e) => {
            e.stopPropagation();
            handleRSVP(event.id);
        };
        actionsDiv.appendChild(rsvpBtn);
    }

    // View Attendees button (owner only, not external) - secondary action
    if (currentUser && currentUser === event.owner && !event.isExternal) {
        const viewBtn = document.createElement('button');
        viewBtn.className = 'flex-1 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 text-gray-700 text-sm font-medium py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';
        viewBtn.textContent = 'View Attendees';
        viewBtn.onclick = (e) => {
            e.stopPropagation();
            showAttendees(event.id, event.title);
        };
        actionsDiv.appendChild(viewBtn);
    }

    if (actionsDiv.children.length > 0) {
        contentDiv.appendChild(actionsDiv);
    }

    // Owner actions (Edit/Delete) - refined styling with better spacing
    if (currentUser && currentUser === event.owner && !event.isExternal) {
        const ownerActions = document.createElement('div');
        ownerActions.className = 'flex items-center gap-2.5 mt-3';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'flex-1 border border-amber-300 hover:border-amber-400 hover:bg-amber-50 active:bg-amber-100 text-amber-700 text-sm font-medium py-2 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2';
        editBtn.textContent = 'Edit Event';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editEvent(event);
        };
        ownerActions.appendChild(editBtn);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'flex-1 border border-red-300 hover:border-red-400 hover:bg-red-50 active:bg-red-100 text-red-700 text-sm font-medium py-2 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2';
        deleteBtn.textContent = 'Delete Event';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteEventConfirm(event.id, event.title);
        };
        ownerActions.appendChild(deleteBtn);
        
        contentDiv.appendChild(ownerActions);
    }

    // External link (if available) - refined styling
    if (event.external_link || event.externalLink) {
        const link = document.createElement('a');
        link.href = event.external_link || event.externalLink;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-4 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded';
        link.innerHTML = `
            View External Details
            <svg class="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        `;
        link.onclick = (e) => e.stopPropagation();
        contentDiv.appendChild(link);
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
            rsvpElement.innerHTML = `
                <svg class="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span class="font-medium text-gray-700">${count} attending</span>
            `;
        }
    } catch (error) {
        console.error('Error fetching RSVP count:', error);
        const rsvpElement = document.getElementById(`rsvp-count-${eventId}`);
        if (rsvpElement) {
            rsvpElement.innerHTML = `
                <svg class="w-3.5 h-3.5 mr-1.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span class="font-medium text-gray-500">—</span>
            `;
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
                btn.textContent = 'RSVP\'d \u2713';
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
