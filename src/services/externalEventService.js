const fetchSeatGeekEvents = require('../services/seatgeek.service');
const fetchVisitPhillyEvents = require('../helpers/visitPhlScraper');
const fetchEventbriteEvents = require('../helpers/eventBriteScraper');
const eventService = require('./eventService');

async function collectAndStoreExternalEvents(pool) {
    await clearExternalEvents(pool);

    const [seatGeekEvents, visitPhillyEvents, eventbriteEvents] = await Promise.allSettled([
        fetchSeatGeekEvents(),
        fetchVisitPhillyEvents(),
        fetchEventbriteEvents()
    ]);

    if (seatGeekEvents.status === 'rejected') {
        console.error('SeatGeek error:', seatGeekEvents.reason);
    }
    if (visitPhillyEvents.status === 'rejected') {
        console.error('Visit Philadelphia error:', visitPhillyEvents.reason);
    }
    if (eventbriteEvents.status === 'rejected') {
        console.error('Eventbrite error:', eventbriteEvents.reason);
    }
    
    const allEvents = [
        ...(seatGeekEvents.status === 'fulfilled' ? seatGeekEvents.value : []),
        ...(visitPhillyEvents.status === 'fulfilled' ? visitPhillyEvents.value : []),
        ...(eventbriteEvents.status === 'fulfilled' ? eventbriteEvents.value : [])
    ];
    
    let savedCount = 0;
    for (const event of allEvents) {
        try {
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

async function clearExternalEvents(pool) {
    const query = 'DELETE FROM events WHERE is_external = true';
    const result = await pool.query(query);
    return result.rowCount;
}

module.exports = {
    collectAndStoreExternalEvents
};

