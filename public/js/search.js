import { initMap, updateMapMarkers } from './index.js';

const listViewButton = document.getElementById('listViewButton');
const mapViewButton = document.getElementById('mapViewButton');
const listView = document.getElementById('listView');
const mapView = document.getElementById('mapView');

let currentSearchResults = [];

function switchView(viewType) {
    if (viewType === 'list') {
        listView.classList.remove('hidden');
        mapView.classList.add('hidden');
        // active state
        listViewButton.classList.remove('bg-transparent', 'text-gray-500', 'hover:bg-gray-100');
        listViewButton.classList.add('bg-blue-500', 'text-white');
        // inactive state
        mapViewButton.classList.remove('bg-blue-500', 'text-white');
        mapViewButton.classList.add('bg-transparent', 'text-gray-500', 'hover:bg-gray-100');
    } else if (viewType === 'map') {
        mapView.classList.remove('hidden');
        listView.classList.add('hidden');
        // active state
        mapViewButton.classList.remove('bg-transparent', 'text-gray-500', 'hover:bg-gray-100');
        mapViewButton.classList.add('bg-blue-500', 'text-white');
        // inactive state
        listViewButton.classList.remove('bg-blue-500', 'text-white');
        listViewButton.classList.add('bg-transparent', 'text-gray-500', 'hover:bg-gray-100');
    }
}

listViewButton.addEventListener('click', () => switchView('list'));
mapViewButton.addEventListener('click', () => switchView('map'));

mapViewButton.addEventListener('click', () => {
    initMap('mapContainer', false).then(() => {
        if (currentSearchResults.length > 0) {
            updateMapMarkers(currentSearchResults);
        } else {
            updateMapMarkers([]);
        }
    }).catch(error => {
        console.error('Error initializing map:', error);
    });
});

const toggleFiltersBtn = document.getElementById('toggleFilters');
const filtersContent = document.getElementById('filtersContent');
const filtersToggleText = document.getElementById('filtersToggleText');
const clearFiltersBtn = document.getElementById('clearFilters');

if (toggleFiltersBtn && filtersContent && filtersToggleText) {
    toggleFiltersBtn.addEventListener('click', () => {
        let isHidden = filtersContent.classList.contains('hidden');
        if (isHidden) {
            filtersContent.classList.remove('hidden');
            filtersToggleText.textContent = 'Hide';
        } else {
            filtersContent.classList.add('hidden');
            filtersToggleText.textContent = 'Show';
        }
    });
}

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('locationFilter').value = '';
        document.getElementById('ownerFilter').value = '';
        document.getElementById('hasLocationData').value = '';
    });
}

export function getFilterValues() {
    return {
        searchText: document.getElementById('searchInput').value.trim(),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        location: document.getElementById('locationFilter').value.trim(),
        owner: document.getElementById('ownerFilter').value.trim(),
        hasLocationData: document.getElementById('hasLocationData').value
    };
}

function displayEvents(events) {
    const eventsList = document.getElementById('listResults');
    if (!eventsList) return;
    
    while (eventsList.firstChild) {
        eventsList.removeChild(eventsList.firstChild);
    }
    eventsList.classList.remove('hidden');
    
    for (let event of events) {
        let eventCard = createEventCard(event);
        eventsList.appendChild(eventCard);
    }
}

function createEventCard(event) {
    let card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer';
    
    card.onclick = (e) => {
        // prevent clicking on buttons or links within the card
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
            return;
        }

        let url = `/pages/event-details.html?id=${event.id}`;
        window.location.href = url;
    };
    
    let eventDate = new Date(event.time);
    let formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (event.image) {
        let img = document.createElement('img');
        img.src = event.image;
        img.alt = event.title || '';
        img.className = 'w-full h-48 object-cover';
        card.appendChild(img);
    } else {
        let placeholder = document.createElement('div');
        placeholder.className = 'w-full h-48 bg-gradient-to-r from-blue-400 to-purple-500';
        card.appendChild(placeholder);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'p-4';
    
    let title = document.createElement('h3');
    title.className = 'font-bold text-xl mb-2 text-gray-800';
    title.textContent = event.title || '';
    contentDiv.appendChild(title);
    
    let location = document.createElement('p');
    location.className = 'text-gray-600 text-sm mb-2';
    location.textContent = event.locationDescription || event.location || 'Location not specified';
    contentDiv.appendChild(location);
    
    if (event.lat && event.long) {
        let coordinates = document.createElement('p');
        coordinates.className = 'text-gray-500 text-xs mb-2';
        coordinates.textContent = 'Coordinates: ' + parseFloat(event.lat).toFixed(6) + ', ' + parseFloat(event.long).toFixed(6);
        contentDiv.appendChild(coordinates);
    }
    
    let date = document.createElement('p');
    date.className = 'text-gray-600 text-sm mb-2';
    date.textContent = formattedDate;
    contentDiv.appendChild(date);
    
    let owner = document.createElement('p');
    owner.className = 'text-gray-600 text-sm mb-2';
    owner.textContent = 'Created by ' + (event.owner || '');
    contentDiv.appendChild(owner);
    
    if (event.description) {
        let description = document.createElement('p');
        description.className = 'text-gray-700 text-sm mt-3';
        description.textContent = event.description;
        contentDiv.appendChild(description);
    }
    
    if (event.external_link || event.externalLink) {
        let link = document.createElement('a');
        link.href = event.external_link || event.externalLink;
        link.target = '_blank';
        link.className = 'inline-block mt-3 text-blue-500 hover:text-blue-700 text-sm';
        link.textContent = 'View Details →';
        contentDiv.appendChild(link);
    }
    
    card.appendChild(contentDiv);
    return card;
}

function searchEvents() {
    let filters = getFilterValues();
    
    let queryParams = new URLSearchParams();
    if (filters.searchText && filters.searchText.trim()) queryParams.append('searchText', filters.searchText.trim());
    if (filters.startDate && filters.startDate.trim()) queryParams.append('startDate', filters.startDate.trim());
    if (filters.endDate && filters.endDate.trim()) queryParams.append('endDate', filters.endDate.trim());
    if (filters.location && filters.location.trim()) queryParams.append('location', filters.location.trim());
    if (filters.owner && filters.owner.trim()) queryParams.append('owner', filters.owner.trim());
    if (filters.hasLocationData && filters.hasLocationData.trim()) queryParams.append('hasLocationData', filters.hasLocationData.trim());

    let queryString = queryParams.toString();
    let url = `/api/events/search${queryString ? '?' + queryString : ''}`;

    let eventsList = document.getElementById('listResults');
    let noEvents = document.getElementById('noEvents');
    let loadingSpinner = document.getElementById('loadingSpinner');

    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    if (eventsList) eventsList.classList.add('hidden');
    if (noEvents) noEvents.classList.add('hidden');

    fetch(url)
        .then(response => {
            return response.json().then(data => {
                return { statusCode: response.status, data: data };
            });
        })
        .then(({ statusCode, data }) => {
            if (loadingSpinner) loadingSpinner.classList.add('hidden');

            if (statusCode === 200 && data.events && data.events.length > 0) {
                currentSearchResults = data.events;
                displayEvents(data.events);
                initMap('mapContainer', false).then(() => {
                    updateMapMarkers(data.events);
                }).catch(error => {
                    console.error('Error initializing map for markers:', error);
                });
            } else {
                currentSearchResults = [];
                if (eventsList) eventsList.classList.add('hidden');
                if (noEvents) {
                    noEvents.classList.remove('hidden');
                    noEvents.textContent = data.error || 'No events found';
                }
                initMap('mapContainer', false).then(() => {
                    updateMapMarkers([]);
                }).catch(error => {
                    console.error('Error initializing map for markers:', error);
                });
            }
        })
        .catch(error => {
            console.error('Error loading events:', error);
            currentSearchResults = [];
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            if (noEvents) {
                noEvents.classList.remove('hidden');
                noEvents.textContent = 'Failed to load events. Please try again.';
            }
            initMap('mapContainer', false).then(() => {
                updateMapMarkers([]);
            }).catch(err => {
                console.error('Error initializing map for markers:', err);
            });
        });
}

let searchButton = document.getElementById('searchButton');
if (searchButton) {
    searchButton.addEventListener('click', searchEvents);
}

let searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchEvents();
        }
    });
}

export { searchEvents };