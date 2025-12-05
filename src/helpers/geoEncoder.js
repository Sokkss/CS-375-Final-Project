const axios = require('axios');

async function geocodeAddress(address) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const params = {
        address: address,
        key: apiKey
    };

    try {
        const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', { params });
        const data = res.data;

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return { lat: location.lat, long: location.lng, success: true };
        }
        
        return { lat: null, long: null, success: false, status: data.status };
    } catch (error) {
        console.error(`Geocoding error for "${address}":`, error.message);
        return { lat: null, long: null, success: false, error: error.message };
    }
}

function extractAddressPortion(fullString) {
    const firstCommaIndex = fullString.indexOf(',');
    if (firstCommaIndex > 0 && firstCommaIndex < fullString.length - 1) {
        return fullString.substring(firstCommaIndex + 1).trim();
    }
    return fullString;
}

async function getLatLong(address) {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
        return { lat: null, long: null };
    }

    const normalizedAddress = address.trim();

    let result = await geocodeAddress(normalizedAddress);
    if (result.success) {
        return { lat: result.lat, long: result.long };
    }

    const addressOnly = extractAddressPortion(normalizedAddress);
    if (addressOnly !== normalizedAddress) {
        result = await geocodeAddress(addressOnly);
        if (result.success) {
            return { lat: result.lat, long: result.long };
        }
    }

    if (!normalizedAddress.toLowerCase().includes('usa') && 
        !normalizedAddress.toLowerCase().includes('united states')) {
        result = await geocodeAddress(`${normalizedAddress}, USA`);
        if (result.success) {
            return { lat: result.lat, long: result.long };
        }
    }

    if (addressOnly !== normalizedAddress) {
        if (!addressOnly.toLowerCase().includes('usa') && 
            !addressOnly.toLowerCase().includes('united states')) {
            result = await geocodeAddress(`${addressOnly}, USA`);
            if (result.success) {
                return { lat: result.lat, long: result.long };
            }
        }
    }

    if (!normalizedAddress.toLowerCase().includes('philadelphia') && 
        !normalizedAddress.toLowerCase().includes('philly')) {
        result = await geocodeAddress(`${normalizedAddress}, Philadelphia, PA`);
        if (result.success) {
            return { lat: result.lat, long: result.long };
        }
    }

    return { lat: null, long: null };
}

module.exports = { getLatLong };