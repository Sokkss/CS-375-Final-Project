const axios = require('axios');

async function getLatLong(address) {
    const params = {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY
    };

    const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params });
    const data = res.data;

    if (!data.results || data.results.length === 0) {
        return { lat: null, long: null };
    }

    const location = data.results[0].geometry.location; 
    return { lat: location.lat, long: location.lng };
}

module.exports = { getLatLong };