const axios = require('axios');
const Event = require('../models/Event');

async function fetchPhillyEventsNextWeek() {
    const startDateTime = new Date();
    const now = new Date();
    const endDateTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const params = {
        client_id: process.env.SEATGEEK_CLIENT_ID,
        lat: 39.9526,
        lon: -75.1652,  // this is roughly city hall coords
        range: '25mi',
        'datetime_utc.gte': startDateTime,
        'datetime_utc.lte': endDateTime,
        per_page: 50,
        page: 1,
    };

    const res = await axios.get('https://api.seatgeek.com/2/events', { params });

    const mappedEvents = res.data.events.map((item, index) => {
        const id = `seatgeek-event-${index}`;
        const title = item.short_title;
        const description = `${item.title} at ${item.venue.name}. More information here: ${item.url}`;
        const locationDescription = `${item.venue.address} ${item.venue.city} ${item.venue.state} ${item.venue.postal_code}`;
        const lat = item.venue.location.lat;
        const long = item.venue.location.lon;
        const time = item.datetime_utc;
        const owner = 'Seatgeek';
        const image = null;
        const externalLink = item.url;

        return new Event(id, title, description, locationDescription, lat, long, time, owner, image, externalLink);
    });

    return mappedEvents;
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
