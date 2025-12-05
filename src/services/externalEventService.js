const fetchSeatGeekEvents = require('../services/seatgeek.service');
const fetchVisitPhillyEvents = require('../helpers/visitPhlScraper');
const fetchEventbriteEvents = require('../helpers/eventBriteScraper');
const eventService = require('./eventService');

async function collectAndStoreExternalEvents(pool) {
    await clearPastExternalEvents(pool);

    const existingEvents = await getExistingExternalEvents(pool);

    const [seatGeekEvents, visitPhillyEvents, eventbriteEvents] = await Promise.allSettled([
        fetchSeatGeekEvents(),
        fetchVisitPhillyEvents(),
        // fetchEventbriteEvents()
    ]);

    if (seatGeekEvents.status === 'rejected') {
        console.error('SeatGeek error:', seatGeekEvents.reason);
    }
    if (visitPhillyEvents.status === 'rejected') {
        console.error('Visit Philadelphia error:', visitPhillyEvents.reason);
    }
    
    const allEvents = [
        ...(seatGeekEvents.status === 'fulfilled' ? seatGeekEvents.value : []),
        ...(visitPhillyEvents.status === 'fulfilled' ? visitPhillyEvents.value : []),
    ];
    
    let savedCount = 0;
    for (const event of allEvents) {
        try {
            if (isDuplicate(event, existingEvents)) {
                continue;
            }
            
            const eventData = {
                title: event.title,
                description: event.description || '',
                locationDescription: event.locationDescription || '',
                lat: event.lat,
                long: event.long,
                time: event.time,
                owner: event.owner,
                image: event.image || null,
                externalLink: event.externalLink || null,
                isExternal: true
            };
            await eventService.saveEvent(pool, eventData);
            savedCount++;
        } catch {}
    }
    
    return { success: true, saved: savedCount, total: allEvents.length };
}

async function clearPastExternalEvents(pool) {
    const query = 'DELETE FROM events WHERE is_external = true AND time < NOW()';
    await pool.query(query);
}

async function getExistingExternalEvents(pool) {
    const query = 'SELECT * FROM events WHERE is_external = true';
    try {
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting existing external events:', error);
        return [];
    }
}

function isDuplicate(newEvent, existingEvents) {
    const normalize = (str) => (str || '').toLowerCase().trim();
    const newTitle = normalize(newEvent.title);
    const newLocation = normalize(newEvent.locationDescription);
    const newOwner = newEvent.owner;
    const newTime = new Date(newEvent.time);
    
    for (const existing of existingEvents) {
        const existingTitle = normalize(existing.title);
        const existingLocation = normalize(existing.location_description);
        const existingOwner = existing.owner;
        const existingTime = new Date(existing.time);
        
        if (newTitle === existingTitle && 
            newLocation === existingLocation && 
            newOwner === existingOwner) {
            
            const timeDiff = Math.abs(newTime.getTime() - existingTime.getTime());
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                return true;
            }
        }
    }
    
    return false;
}

module.exports = {
    collectAndStoreExternalEvents
};

