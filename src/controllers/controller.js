const fetchPhillyEventsNextWeek = require('../services/seatgeek.service');

async function getPhillyNextWeek(req, res) {
    const events = await fetchPhillyEventsNextWeek();
    res.json({
        count: events.length,
        events });
}

module.exports = getPhillyNextWeek;
