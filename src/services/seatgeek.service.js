const axios = require('axios');
const Event = require('../models/Event');

async function fetchPhillyEventsNextWeek() {
    const startDateTime = new Date();
    const now = new Date();
    const endDateTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const allEvents = [];
    const numPages = 5;

    // Fetch multiple pages
    for (let page = 1; page <= numPages; page++) {
        const params = {
            client_id: process.env.SEATGEEK_CLIENT_ID,
            lat: 39.9526,
            lon: -75.1652,  // this is roughly city hall coords
            range: '25mi',
            'datetime_utc.gte': startDateTime,
            'datetime_utc.lte': endDateTime,
            per_page: 50,
            page: page,
        };
        const res = await axios.get('https://api.seatgeek.com/2/events', { params });
        
        if (!res.data.events || res.data.events.length === 0) {
            break;
        }

        const mappedEvents = res.data.events.map((item, index) => {
            let id = `seatgeek-event-${page}-${index}`;
            let title = item.short_title;
            let description = `${item.title} at ${item.venue.name}. More information here: ${item.url}`;
            let locationDescription = `${item.venue.address} ${item.venue.city} ${item.venue.state} ${item.venue.postal_code}`;
            let lat = item.venue.location.lat;
            let long = item.venue.location.lon;
            let time = item.datetime_utc;
            let owner = 'Seatgeek';
            let externalLink = item.url;
            
            let image = null;
            if (item.performers && item.performers.length > 0) {
                let performer = item.performers[0];
                if (performer.image) {
                    image = performer.image;
                } else if (performer.images && performer.images.huge) {
                    image = performer.images.huge;
                }
            }

            return new Event(id, title, description, locationDescription, lat, long, time, owner, image, externalLink);
        });

        allEvents.push(...mappedEvents);
    }

    return allEvents;
}

// uncomment below for testing

// (async () => {
//     try {
//         const events = await fetchPhillyEventsNextWeek();
//     } catch (err) {
//         console.error("Error fetching events:", err.message);
//     }
// })();

module.exports = fetchPhillyEventsNextWeek;
