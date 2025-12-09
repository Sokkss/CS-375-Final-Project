import { initMap, updateMapMarkers } from './index.js';

let currentUser = null;
let currentUserEmail = null;

function showRsvpModal(type, title, message) {
    let modal = document.getElementById('rsvpModal');
    let modalIcon = document.getElementById('rsvpModalIcon');
    let modalTitle = document.getElementById('rsvpModalTitle');
    let modalMessage = document.getElementById('rsvpModalMessage');
    let modalClose = document.getElementById('rsvpModalClose');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    modalIcon.className = 'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center';
    
    if (type === 'success') {
        modalIcon.classList.add('bg-green-100');
        modalIcon.textContent = '\u2713';
        modalIcon.style.color = '#22c55e';
        modalIcon.style.fontSize = '2rem';
    } else if (type === 'error') {
        modalIcon.classList.add('bg-red-100');
        modalIcon.textContent = '\u2715';
        modalIcon.style.color = '#ef4444';
        modalIcon.style.fontSize = '2rem';
    } else {
        modalIcon.classList.add('bg-blue-100');
        modalIcon.textContent = '\u2139';
        modalIcon.style.color = '#3b82f6';
        modalIcon.style.fontSize = '2rem';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    modalClose.onclick = function() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };
    
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };
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

    let eventImage = document.getElementById('eventImage');
    let imageContainer = document.getElementById('eventImageContainer');
    
    if (event.image) {
        eventImage.src = event.image;
        eventImage.alt = event.title;
        eventImage.onload = function() {
            eventImage.classList.remove('hidden');
            if (imageContainer) {
                imageContainer.classList.remove('bg-gradient-to-br', 'from-indigo-400', 'via-purple-400', 'to-pink-400');
            }
        };
        eventImage.onerror = function() {
            eventImage.classList.add('hidden');
        };
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
    setupViewAttendeesButton(event.owner);
}

function initEventMap(event) {
    let mapContainer = document.getElementById('eventMapContainer');
    mapContainer.classList.remove('hidden');

    let centerLat = parseFloat(event.lat);
    let centerLng = parseFloat(event.long);
    
    initMap('eventMap', false, centerLat, centerLng).then(function() {
        updateMapMarkers([event]);
    }).catch(function(error) {
        console.error('Error initializing map:', error);
    });
}

let currentEventAttendees = [];

function loadAttendees(eventId) {
    let url = '/api/events/' + eventId + '/attendees';
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(body) {
            let count = body.count || 0;
            currentEventAttendees = body.attendees || [];
            document.getElementById('attendeeCount').textContent = count + ' attendee(s)';
        })
        .catch(function(error) {
            console.error('Error loading attendees:', error);
            document.getElementById('attendeeCount').textContent = 'Unable to load attendee count';
        });
}

function setupViewAttendeesButton(eventOwner) {
    let viewAttendeesBtn = document.getElementById('viewAttendeesBtn');
    let attendeesListContainer = document.getElementById('attendeesListContainer');
    let closeAttendeesListBtn = document.getElementById('closeAttendeesListBtn');
    let copyEmailsBtn = document.getElementById('copyEmailsBtn');
    let emailAllBtn = document.getElementById('emailAllBtn');
    
    if (!currentUser || currentUser !== eventOwner) {
        return;
    }
    
    viewAttendeesBtn.classList.remove('hidden');
    
    viewAttendeesBtn.onclick = function() {
        let emailList = document.getElementById('attendeesEmailList');
        let allEmailsTextarea = document.getElementById('allEmails');
        
        while (emailList.firstChild) {
            emailList.removeChild(emailList.firstChild);
        }
        
        let emails = [];
        
        if (currentEventAttendees.length === 0) {
            let emptyMsg = document.createElement('p');
            emptyMsg.className = 'text-gray-500 text-sm';
            emptyMsg.textContent = 'No attendees yet.';
            emailList.appendChild(emptyMsg);
        } else {
            currentEventAttendees.forEach(function(attendee) {
                let attendeeDiv = document.createElement('div');
                attendeeDiv.className = 'flex justify-between items-center py-1 border-b border-gray-200';
                
                let nameSpan = document.createElement('span');
                nameSpan.className = 'font-medium text-gray-800';
                nameSpan.textContent = attendee.name || 'Unknown';
                attendeeDiv.appendChild(nameSpan);
                
                if (attendee.email) {
                    let emailLink = document.createElement('a');
                    emailLink.href = 'mailto:' + attendee.email;
                    emailLink.className = 'text-blue-600 hover:text-blue-800 text-sm';
                    emailLink.textContent = attendee.email;
                    attendeeDiv.appendChild(emailLink);
                    emails.push(attendee.email);
                }
                
                emailList.appendChild(attendeeDiv);
            });
        }
        
        allEmailsTextarea.value = emails.join(', ');
        attendeesListContainer.classList.remove('hidden');
    };
    
    closeAttendeesListBtn.onclick = function() {
        attendeesListContainer.classList.add('hidden');
    };
    
    copyEmailsBtn.onclick = function() {
        let allEmailsTextarea = document.getElementById('allEmails');
        allEmailsTextarea.select();
        document.execCommand('copy');
        
        let originalText = copyEmailsBtn.textContent;
        copyEmailsBtn.textContent = 'Copied!';
        setTimeout(function() {
            copyEmailsBtn.textContent = originalText;
        }, 2000);
    };
    
    emailAllBtn.onclick = function() {
        let emails = [];
        currentEventAttendees.forEach(function(attendee) {
            if (attendee.email) {
                emails.push(attendee.email);
            }
        });
        
        if (emails.length > 0) {
            window.location.href = 'mailto:' + emails.join(',');
        }
    };
}

function setupRSVPButton(eventId, eventOwner) {
    let rsvpButton = document.getElementById('rsvpButton');

    if (!currentUser || currentUser === eventOwner) {
        return;
    }
    
    rsvpButton.classList.remove('hidden');
    
    fetch('/api/events/' + eventId + '/attendees')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            let attendees = data.attendees || [];
            let hasRsvpd = attendees.some(function(attendee) {
                return attendee.email === currentUserEmail || attendee.name === currentUser;
            });
            
            if (hasRsvpd) {
                setButtonToCancelState(rsvpButton, eventId);
            } else {
                setButtonToRsvpState(rsvpButton, eventId);
            }
        })
        .catch(function() {
            setButtonToRsvpState(rsvpButton, eventId);
        });
}

function setButtonToRsvpState(button, eventId) {
    button.textContent = 'RSVP to Event';
    button.disabled = false;
    button.classList.remove('bg-red-500', 'hover:bg-red-600', 'bg-gray-400', 'cursor-not-allowed');
    button.classList.add('bg-blue-500', 'hover:bg-blue-600');
    button.onclick = function() {
        handleRSVP(eventId);
    };
}

function setButtonToCancelState(button, eventId) {
    button.textContent = 'Cancel RSVP';
    button.disabled = false;
    button.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'bg-gray-400', 'cursor-not-allowed');
    button.classList.add('bg-red-500', 'hover:bg-red-600');
    button.onclick = function() {
        handleCancelRSVP(eventId);
    };
}

function handleRSVP(eventId) {
    if (!currentUser || !currentUserEmail) {
        showRsvpModal('info', 'Login Required', 'Please log in to RSVP to events.');
        return;
    }

    let url = '/api/events/' + eventId + '/rsvp';
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
        .then(function(response) {
            return response.json();
        })
        .then(function(body) {
            if (body.message) {
                showRsvpModal('success', 'RSVP Confirmed!', 'You have successfully RSVP\'d to this event.');
                loadAttendees(eventId);
                let rsvpButton = document.getElementById('rsvpButton');
                setButtonToCancelState(rsvpButton, eventId);
            } else {
                showRsvpModal('error', 'RSVP Failed', body.error || 'Unable to complete your RSVP. Please try again.');
            }
        })
        .catch(function(error) {
            console.error('Error RSVPing to event:', error);
            showRsvpModal('error', 'Something Went Wrong', 'An error occurred while processing your RSVP. Please try again.');
        });
}

function handleCancelRSVP(eventId) {
    if (!currentUser || !currentUserEmail) {
        showRsvpModal('info', 'Login Required', 'Please log in to manage your RSVP.');
        return;
    }

    let url = '/api/events/' + eventId + '/rsvp';
    fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: currentUser,
            userEmail: currentUserEmail
        })
    })
        .then(function(response) {
            return response.json();
        })
        .then(function(body) {
            if (body.message) {
                showRsvpModal('success', 'RSVP Cancelled', 'Your RSVP has been cancelled.');
                loadAttendees(eventId);
                let rsvpButton = document.getElementById('rsvpButton');
                setButtonToRsvpState(rsvpButton, eventId);
            } else {
                showRsvpModal('error', 'Cancel Failed', body.error || 'Unable to cancel your RSVP. Please try again.');
            }
        })
        .catch(function(error) {
            console.error('Error cancelling RSVP:', error);
            showRsvpModal('error', 'Something Went Wrong', 'An error occurred while cancelling your RSVP. Please try again.');
        });
}

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCurrentUser();
    loadEventDetails();
});
