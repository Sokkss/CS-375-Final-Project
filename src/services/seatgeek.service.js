const axios = require('axios');
const Event = require('../models/Event');

async function fetchPhillyEventsNextWeek() {
    const startDateTime = new Date();
    const now = new Date();
    const endDateTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const params = {
        client_id: process.env.SEATGEEK_CLIENT_ID,
        //client_secret: process.env.SEATGEEK_CLIENT_SECRET,
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
        const title = item.title;
        const description = item.url;
        const location = item.venue.location;
        const time = item.datetime_utc;
        const owner = 'Seatgeek';
        const image = null;
        const externalLink = item.url;

        return new Event(id, title, description, location, time, owner, image, externalLink);
    });

    return mappedEvents;
}

module.exports = fetchPhillyEventsNextWeek;
