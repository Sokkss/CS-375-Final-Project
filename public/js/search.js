import { initMap } from './index.js';

const listViewButton = document.getElementById('listViewButton');
const mapViewButton = document.getElementById('mapViewButton');
const listView = document.getElementById('listView');
const mapView = document.getElementById('mapView');

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

mapViewButton.addEventListener('click', () => initMap('mapContainer'));

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
        document.getElementById('hasCoordinates').value = '';
    });
}

export function getFilterValues() {
    return {
        searchText: document.getElementById('searchInput').value.trim(),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        location: document.getElementById('locationFilter').value.trim(),
        owner: document.getElementById('ownerFilter').value.trim(),
        hasCoordinates: document.getElementById('hasCoordinates').value
    };
}