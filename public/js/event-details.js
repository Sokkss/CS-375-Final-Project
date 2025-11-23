import { initMap, updateMapMarkers } from './index.js';

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

    let eventImage = document.getElementById('eventImage');
    if (event.image) {
        eventImage.src = event.image;
        eventImage.alt = event.title;
        eventImage.classList.remove('hidden');
    }

    let descContainer = document.getElementById('eventDescriptionContainer');
    if (event.description) {
        document.getElementById('eventDescription').textContent = event.description;
        descContainer.classList.remove('hidden');
    }
  
    if (event.lat && event.long) {
        initEventMap(parseFloat(event.lat), parseFloat(event.long), event.title);
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

function initEventMap(lat, lng, title) {
    let mapContainer = document.getElementById('eventMapContainer');
    mapContainer.classList.remove('hidden');

    initMap('eventMap', false).then(() => {
        let eventObj = {
            lat: lat,
            long: lng,
            title: title
        };
        
        updateMapMarkers([eventObj]);
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
    let currentUser = localStorage.getItem('currentUser') || '';
    let rsvpButton = document.getElementById('rsvpButton');

    if (currentUser && currentUser !== eventOwner) {
        rsvpButton.classList.remove('hidden');
        rsvpButton.onclick = () => handleRSVP(eventId);
    }
}

function handleRSVP(eventId) {
    let currentUser = localStorage.getItem('currentUser') || '';
    
    if (!currentUser) {
        alert('Please enter your name to RSVP');
        return;
    }

    let userEmail = prompt('Please enter your email address:');
    if (!userEmail || !userEmail.includes('@')) {
        alert('Valid email address required to RSVP');
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
            userEmail: userEmail
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

document.addEventListener('DOMContentLoaded', loadEventDetails);
