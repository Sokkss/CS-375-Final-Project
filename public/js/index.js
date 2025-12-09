import { getUserProfile } from './utils/user.js';

let userGreeting = document.getElementById('userGreeting');
let userStatus = document.getElementById('userStatus');
let upcomingSection = document.getElementById('upcomingSection');
let rsvpSection = document.getElementById('rsvpSection');
let hostingSection = document.getElementById('hostingSection');
let upcomingEventsList = document.getElementById('upcomingEventsList');
let rsvpEventsList = document.getElementById('rsvpEventsList');
let hostingEventsList = document.getElementById('hostingEventsList');
let upcomingEmptyState = document.getElementById('upcomingEmptyState');
let rsvpEmptyState = document.getElementById('rsvpEmptyState');
let hostingEmptyState = document.getElementById('hostingEmptyState');
let userProfileState = { isLoggedIn: false, data: null };

function clearNode(node) {
    if (!node) {
        return;
    }
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

// citation: https://developers.google.com/maps/documentation/javascript/adding-a-google-map
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "AIzaSyB6Vvh_yRrn-AI4tQSxz60pF67yPKmOEhI",
    v: "weekly",
    // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
    // Add other bootstrap parameters as needed, using camel case.
});

let map;
let markers = [];
let currentInfoWindow = null;

export function initMap(mapContainerId, loadAllEvents = true, centerLat = null, centerLng = null) {
    let mapElement = document.getElementById(mapContainerId);
    if (!mapElement) {
        console.error(`Map container with id "${mapContainerId}" not found`);
        return Promise.reject(new Error('Map container not found'));
    }
    
    if (map && window.PinElement) {
        if (centerLat !== null && centerLng !== null) {
            map.setCenter({ lat: centerLat, lng: centerLng });
            map.setZoom(15);
        }
        return Promise.resolve();
    }
    
    let lat = centerLat !== null ? centerLat : 39.9526;
    let lng = centerLng !== null ? centerLng : -75.1652;
    let zoom = centerLat !== null ? 15 : 13;
    
    return google.maps.importLibrary("maps").then(function({ Map }) {
        map = new Map(mapElement, {
            zoom: zoom,
            center: { lat: lat, lng: lng },
            mapId: "Main-Events-Map"
        });
        
        return google.maps.importLibrary("marker");
    }).then(({ PinElement }) => {
        window.PinElement = PinElement;
        
        // to close info boxes when you click off of them
        map.addListener('click', function() {
            if (currentInfoWindow) {
                currentInfoWindow.close();
                currentInfoWindow = null;
            }
        });
        
        if (loadAllEvents) {
            loadEvents();
        }
    }).catch(error => {
        console.error('Error loading libraries:', error);
        throw error;
    });
}

function loadEvents() {
    fetch('/api/events')
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error('Failed to fetch events');
            }
        })
        .then(data => {
            if (data.events) {
                console.log(data.events);
                addMarkers(data.events);
            }
        })
        .catch(error => {
            console.error('Error loading events:', error);
        });
}

function clearMarkers() {
    for (let marker of markers) {
        marker.map = null;
    }
    markers = [];
    if (currentInfoWindow) {
        currentInfoWindow.close();
        currentInfoWindow = null;
    }
}

function addMarkers(events) {
    if (!window.PinElement) {
        console.error('PinElement not available');
        return;
    }
    
    if (!map) {
        console.error('Map not initialized');
        return;
    }
    
    for (let event of events) {
        if (event.lat && event.long) {
            let position = { 
                lat: parseFloat(event.lat), 
                lng: parseFloat(event.long) 
            };
            
            let pinElement = new window.PinElement({
                background: "#0b452f",
                borderColor: "#001400",
                glyphColor: "#f6eedc"
            });
            
            let marker = new google.maps.marker.AdvancedMarkerElement({
                map: map,
                position: position,
                title: event.title || 'Event in Philly',
                content: pinElement.element
            });
            
            let infoWindow = new google.maps.InfoWindow({
                content: '<div style="padding: 8px;"><strong>' + (event.title || 'Event in Philly') + '</strong><br>' + 
                        (event.locationDescription || 'Location not specified') + '<br>' +
                        '<a href="/pages/event-details.html?id=' + event.id + '" style="color: #3b82f6; text-decoration: underline; margin-top: 8px; display: inline-block;">View Details \u2192</a></div>',
                disableAutoPan: false
            });
            
            marker.addListener('click', function() {
                if (currentInfoWindow) {
                    currentInfoWindow.close();
                }
                infoWindow.open({
                    anchor: marker,
                    map: map
                });
                currentInfoWindow = infoWindow;
            });
            
            markers.push(marker);
        }
    }
}

function loadUserSummary() {
    if (!userGreeting || !userStatus) {
        return;
    }
    
    getUserProfile()
        .then(function(profile) {
            if (profile.authenticated && profile.user) {
                userProfileState.isLoggedIn = true;
                userProfileState.data = profile.user;
                let firstName = profile.user.name ? profile.user.name.split(' ')[0] : 'there';
                userGreeting.textContent = 'Welcome back, ' + firstName;
                userStatus.textContent = 'Here is what is coming up plus what you are attending and hosting.';
                if (rsvpSection) {
                    rsvpSection.classList.remove('hidden');
                }
                if (hostingSection) {
                    hostingSection.classList.remove('hidden');
                }
                clearUserLists();
                fetchUpcomingEvents();
                fetchUserEventSummary();
            } else {
                userProfileState.isLoggedIn = false;
                userProfileState.data = null;
                userGreeting.textContent = 'Sign in to personalize';
                userStatus.textContent = 'Browse events happening in Philly anytime. Sign in to keep track of your RSVPs.';
                if (rsvpSection) {
                    rsvpSection.classList.add('hidden');
                }
                if (hostingSection) {
                    hostingSection.classList.add('hidden');
                }
                clearUserLists({ upcoming: false, rsvp: true, hosting: true });
            }
        })
        .catch(function() {
            if (rsvpSection) {
                rsvpSection.classList.add('hidden');
            }
            if (hostingSection) {
                hostingSection.classList.add('hidden');
            }
            userStatus.textContent = 'Unable to load your personalized feed right now.';
        });
}

function fetchUpcomingEvents() {
    if (!upcomingEventsList || !upcomingEmptyState) {
        return;
    }
    
    fetch('/api/events', { cache: 'no-store' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load events');
            }
            return response.json();
        })
        .then(data => {
            let events = Array.isArray(data.events) ? data.events : [];
            let now = Date.now();
            let upcoming = events.filter(event => {
                if (!event.time) {
                    return false;
                }
                let eventDate = new Date(event.time);
                return !Number.isNaN(eventDate.getTime()) && eventDate.getTime() >= now;
            });
            upcoming.sort((a, b) => {
                let firstTime = new Date(a.time).getTime();
                let secondTime = new Date(b.time).getTime();
                return firstTime - secondTime;
            });
            renderUserSection(upcomingEventsList, upcomingEmptyState, upcoming, 'No upcoming events right now. Check back soon.', 'general');
        })
        .catch(() => {
            clearNode(upcomingEventsList);
            if (upcomingEmptyState) {
                upcomingEmptyState.textContent = 'Unable to load upcoming events.';
            }
        });
}

function fetchUserEventSummary() {
    if (!userProfileState.isLoggedIn) {
        return;
    }
    
    fetch('/api/user/events-summary', { credentials: 'include', cache: 'no-store' })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Failed to load user events');
            }
            return response.json();
        })
        .then(function(data) {
            renderUserSection(rsvpEventsList, rsvpEmptyState, data.rsvpEvents, 'RSVP to an event to see it here.', 'rsvp');
            renderUserSection(hostingEventsList, hostingEmptyState, data.createdEvents, 'Create an event to see it here.', 'hosting');
        })
        .catch(function() {
            if (userStatus) {
                userStatus.textContent = 'Unable to refresh your personalized feed.';
            }
        });
}

function renderUserSection(listNode, emptyNode, events, emptyMessage, type) {
    if (!listNode || !emptyNode) {
        return;
    }
    
    clearNode(listNode);
    
    if (!events || events.length === 0) {
        emptyNode.textContent = emptyMessage;
        return;
    }
    
    emptyNode.textContent = '';
    
    let limitedEvents = events.slice(0, 4);
    for (let event of limitedEvents) {
        listNode.appendChild(createUserCard(event, type));
    }
}

function createUserCard(event, type) {
    let card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors duration-200';
    
    let title = document.createElement('p');
    title.className = 'text-base font-semibold text-gray-900';
    title.textContent = event.title || 'Untitled event';
    card.appendChild(title);
    
    let date = document.createElement('p');
    date.className = 'text-sm text-gray-600 mt-1';
    date.textContent = formatEventDate(event.time);
    card.appendChild(date);
    
    let location = document.createElement('p');
    location.className = 'text-xs text-gray-500 mt-1';
    location.textContent = event.locationDescription || event.location || 'Location coming soon';
    card.appendChild(location);
    
    let footer = document.createElement('div');
    footer.className = 'mt-3 flex items-center justify-between text-sm';
    
    let badge = document.createElement('span');
    let badgeClass = 'text-xs font-semibold uppercase tracking-wide';
    let badgeColor = 'text-blue-600';
    let badgeText = 'Hosted by you';
    
    if (type === 'rsvp') {
        badgeColor = 'text-green-600';
        badgeText = 'RSVP\'d';
    } else if (type === 'general') {
        badgeColor = 'text-blue-600';
        badgeText = 'Not RSVP\'d';
    }
    
    badge.className = `${badgeClass} ${badgeColor}`;
    badge.textContent = badgeText;
    footer.appendChild(badge);
    
    let link = document.createElement('a');
    link.href = `/pages/event-details.html?id=${event.id}`;
    link.className = 'text-blue-600 font-semibold';
    link.textContent = 'View';
    footer.appendChild(link);
    
    card.appendChild(footer);
    
    return card;
}

function formatEventDate(dateValue) {
    if (!dateValue) {
        return 'Date coming soon';
    }
    
    let parsedDate = new Date(dateValue);
    
    if (Number.isNaN(parsedDate.getTime())) {
        return 'Date coming soon';
    }
    
    return parsedDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function clearUserLists(options) {
    let config = { upcoming: true, rsvp: true, hosting: true };
    
    if (options && typeof options === 'object') {
        if (options.upcoming !== undefined) {
            config.upcoming = options.upcoming;
        }
        if (options.rsvp !== undefined) {
            config.rsvp = options.rsvp;
        }
        if (options.hosting !== undefined) {
            config.hosting = options.hosting;
        }
    }
    
    if (config.upcoming && upcomingEventsList) {
        clearNode(upcomingEventsList);
    }
    if (config.rsvp && rsvpEventsList) {
        clearNode(rsvpEventsList);
    }
    if (config.hosting && hostingEventsList) {
        clearNode(hostingEventsList);
    }
    if (config.upcoming && upcomingEmptyState) {
        upcomingEmptyState.textContent = '';
    }
    if (config.rsvp && rsvpEmptyState) {
        rsvpEmptyState.textContent = '';
    }
    if (config.hosting && hostingEmptyState) {
        hostingEmptyState.textContent = '';
    }
}

export function updateMapMarkers(events) {
    if (!map || !window.PinElement) {
        return;
    }
    clearMarkers();
    addMarkers(events);
}

function bootHome() {
    initMap('map');
    fetchUpcomingEvents();
    loadUserSummary();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootHome);
} else {
    bootHome();
}