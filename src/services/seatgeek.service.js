const axios = require('axios');

async function fetchPhillyEventsNextWeek() {
    const startDateTime = new Date();
    const now = new Date();
    const endDateTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const params = {
        client_id: process.env.SEATGEEK_CLIENT_ID,
        client_secret: process.env.SEATGEEK_CLIENT_SECRET,
        geoip: '39.9526,-75.1652',  // this is roughly city hall coords
        range: '25mi',
        'datetime_utc.gte': startDateTime,
        'datetime_utc.lte': endDateTime,
        per_page: 50,
        page: 1,
    };

    const res = await axios.get('https://api.seatgeek.com/2/events', { params });
    return res.data?.events ?? [];
}

module.exports = fetchPhillyEventsNextWeek;
