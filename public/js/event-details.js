import { initMap, updateMapMarkers } from './index.js';

let currentUser = null;
let currentUserEmail = null;

/**
 * Fetches a dynamic image URL for an event based on its title and description.
 * Falls back to gradient placeholder if image fetch fails.
 */
async function getEventImageUrl(event) {
    // If event already has an image, use it
    if (event.image) {
        return event.image;
    }
    
    // Build search query from event title and description
    const titleWords = (event.title || '').split(/\s+/).slice(0, 3).join(' ');
    const descWords = (event.description || '').split(/\s+/).slice(0, 5).join(' ');
    const query = `${titleWords} ${descWords}`.trim().replace(/\s+/g, ' ');
    
    if (!query) {
        return null;
    }
    
    try {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`/api/event-image?query=${encodedQuery}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.imageUrl) {
                return data.imageUrl;
            }
        }
    } catch (error) {
        console.debug('Image fetch failed, using placeholder:', error);
    }
    
    return null;
}

/**
 * Loads and displays an event image with graceful fallback to gradient placeholder.
 */
async function loadEventImage(imageContainer, event) {
    const imageUrl = await getEventImageUrl(event);
    
    if (imageUrl) {
        const eventImage = document.getElementById('eventImage');
        if (eventImage) {
            eventImage.src = imageUrl;
            eventImage.alt = `Image for ${event.title}`;
            eventImage.onload = () => {
                eventImage.classList.remove('hidden');
                // Remove gradient background when image loads
                if (imageContainer) {
                    imageContainer.classList.remove('bg-gradient-to-br', 'from-indigo-400', 'via-purple-400', 'to-pink-400');
                }
            };
            eventImage.onerror = () => {
                console.error('Image load failed, keeping gradient placeholder');
                // Keep gradient, hide broken image
                eventImage.classList.add('hidden');
            };
        }
    }
    // If no image URL, gradient placeholder remains
}

async function fetchCurrentUser() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();
        
        if (data.authenticated && data.user) {
            currentUser = data.user.name;
            currentUserEmail = data.user.email;
        } else {
            currentUser = null;
            currentUserEmail = null;
        }
    } catch {
        currentUser = null;
        currentUserEmail = null;
    }
}

function getEventIdFromURL() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function loadEventDetails() {
    let eventId = getEventIdFromURL();
    let loadingSpinner = document.getElementById('loadingSpinner');
    let errorMessage = document.getElementById('errorMessage');
    let errorText = document.getElementById('errorText');
    let eventDetails = document.getElementById('eventDetails');

    if (!eventId) {
        loadingSpinner.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        errorText.textContent = 'No event ID provided. Please select an event from the cards on the events page.';
        return;
    }

    let url = `/api/events/${eventId}`;
    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(body => {
            loadingSpinner.classList.add('hidden');

            if (!body.event) {
                errorMessage.classList.remove('hidden');
                errorText.textContent = body.error || 'Event not found';
                return;
            }

            displayEventDetails(body.event);
            eventDetails.classList.remove('hidden');
        })
        .catch(error => {
            console.error('Error loading event details:', error);
            loadingSpinner.classList.add('hidden');
            errorMessage.classList.remove('hidden');
            errorText.textContent = 'Failed to load event details. Please try again.';
        });
}

function displayEventDetails(event) {
    document.getElementById('eventTitle').textContent = event.title;
    document.title = `${event.title} - Event Details`;

    let eventDate = new Date(event.time);
    let formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('eventDate').textContent = formattedDate;

    document.getElementById('eventLocation').textContent = event.locationDescription || 'Location not specified';

    document.getElementById('eventOwner').textContent = `Created by ${event.owner}`;

    // Handle event image - use existing image or load dynamic image
    let eventImage = document.getElementById('eventImage');
    let imageContainer = document.getElementById('eventImageContainer');
    
    if (event.image) {
        // If event has a custom image, use it immediately
        eventImage.src = event.image;
        eventImage.alt = event.title;
        eventImage.onload = () => {
            eventImage.classList.remove('hidden');
            // Remove gradient background when image loads
            if (imageContainer) {
                imageContainer.classList.remove('bg-gradient-to-br', 'from-indigo-400', 'via-purple-400', 'to-pink-400');
            }
        };
        eventImage.onerror = () => {
            // If custom image fails, try dynamic image
            loadEventImage(imageContainer, event);
        };
    } else {
        // No custom image - load dynamic image based on event title/description
        loadEventImage(imageContainer, event);
    }

    let descContainer = document.getElementById('eventDescriptionContainer');
    if (event.description) {
        document.getElementById('eventDescription').textContent = event.description;
        descContainer.classList.remove('hidden');
    }
  
    if (event.lat && event.long) {
        initEventMap(event);
    }

    let externalLinkContainer = document.getElementById('externalLinkContainer');
    if (event.external_link || event.externalLink) {
        let link = document.getElementById('externalLink');
        link.href = event.external_link || event.externalLink;
        externalLinkContainer.classList.remove('hidden');
    }

    loadAttendees(event.id);
    setupRSVPButton(event.id, event.owner);
}

function initEventMap(event) {
    let mapContainer = document.getElementById('eventMapContainer');
    mapContainer.classList.remove('hidden');

    initMap('eventMap', false).then(() => {
        updateMapMarkers([event]);
    }).catch(error => {
        console.error('Error initializing map:', error);
    });
}

function loadAttendees(eventId) {
    let url = `/api/events/${eventId}/attendees`;
    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(body => {
            let count = body.count || 0;
            document.getElementById('attendeeCount').textContent = `${count} attendee(s)`;
        })
        .catch(error => {
            console.error('Error loading attendees:', error);
            document.getElementById('attendeeCount').textContent = 'Unable to load attendee count';
        });
}

function setupRSVPButton(eventId, eventOwner) {
    let rsvpButton = document.getElementById('rsvpButton');

    if (currentUser && currentUser !== eventOwner) {
        rsvpButton.classList.remove('hidden');
        rsvpButton.onclick = () => handleRSVP(eventId);
    }
}

function handleRSVP(eventId) {
    if (!currentUser || !currentUserEmail) {
        alert('Please log in to RSVP to events');
        return;
    }

    let url = `/api/events/${eventId}/rsvp`;
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: currentUser,
            userEmail: currentUserEmail
        })
    })
        .then(response => {
            return response.json();
        })
        .then(body => {
            if (body.message) {
                alert('Successfully RSVP\'d to event!');
                loadAttendees(eventId);
                let rsvpButton = document.getElementById('rsvpButton');
                rsvpButton.disabled = true;
                rsvpButton.textContent = 'RSVP\'d Successfully';
                rsvpButton.classList.remove('bg-blue-500', 'hover:bg-blue-600');
                rsvpButton.classList.add('bg-gray-400', 'cursor-not-allowed');
            } else {
                alert(body.error || 'Failed to RSVP');
            }
        })
        .catch(error => {
            console.error('Error RSVPing to event:', error);
            alert('An error occurred. Please try again.');
        });
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCurrentUser();
    loadEventDetails();
});
