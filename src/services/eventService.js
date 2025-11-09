const Event = require('../models/Event');

// Event Service - handles database operations for events

// Save a new event to the database
async function saveEvent(pool, eventData) {
    const { title, description, location, time, owner, image, externalLink } = eventData;
    
    const query = `
        INSERT INTO events (title, description, location, time, owner, image, external_link)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    
    const values = [title, description, location, time, owner, image, externalLink];
    
    try {
        const result = await pool.query(query, values);
        const row = result.rows[0];
        
        // Convert database row to Event object
        return new Event(
            row.id,
            row.title,
            row.description,
            row.location,
            row.time,
            row.owner,
            row.image,
            row.external_link
        );
    } catch (error) {
        console.error('Error saving event:', error);
        throw error;
    }
}

// Get all events from the database
async function getAllEvents(pool) {
    const query = 'SELECT * FROM events ORDER BY time ASC';
    
    try {
        const result = await pool.query(query);
        
        // Convert each database row to Event object
        return result.rows.map(row => new Event(
            row.id,
            row.title,
            row.description,
            row.location,
            row.time,
            row.owner,
            row.image,
            row.external_link
        ));
    } catch (error) {
        console.error('Error getting all events:', error);
        throw error;
    }
}

// Get a single event by ID
async function getEventById(pool, eventId) {
    const query = 'SELECT * FROM events WHERE id = $1';
    
    try {
        const result = await pool.query(query, [eventId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const row = result.rows[0];
        return new Event(
            row.id,
            row.title,
            row.description,
            row.location,
            row.time,
            row.owner,
            row.image,
            row.external_link
        );
    } catch (error) {
        console.error('Error getting event by ID:', error);
        throw error;
    }
}

// Update an existing event
async function updateEvent(pool, eventId, eventData) {
    const { title, description, location, time, image, externalLink } = eventData;
    
    const query = `
        UPDATE events 
        SET title = $1, description = $2, location = $3, time = $4, image = $5, external_link = $6
        WHERE id = $7
        RETURNING *
    `;
    
    const values = [title, description, location, time, image, externalLink, eventId];
    
    try {
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const row = result.rows[0];
        return new Event(
            row.id,
            row.title,
            row.description,
            row.location,
            row.time,
            row.owner,
            row.image,
            row.external_link
        );
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
}

// Delete an event
async function deleteEvent(pool, eventId) {
    const query = 'DELETE FROM events WHERE id = $1 RETURNING *';
    
    try {
        const result = await pool.query(query, [eventId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}

// Add RSVP for a user to an event
async function addRSVP(pool, userId, eventId) {
    const query = `
        INSERT INTO rsvps (user_id, event_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, event_id) DO NOTHING
        RETURNING *
    `;
    
    try {
        const result = await pool.query(query, [userId, eventId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error adding RSVP:', error);
        throw error;
    }
}

// Remove RSVP for a user from an event
async function removeRSVP(pool, userId, eventId) {
    const query = 'DELETE FROM rsvps WHERE user_id = $1 AND event_id = $2 RETURNING *';
    
    try {
        const result = await pool.query(query, [userId, eventId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error removing RSVP:', error);
        throw error;
    }
}

// Get all attendees for an event
async function getEventAttendees(pool, eventId) {
    const query = 'SELECT user_id FROM rsvps WHERE event_id = $1';
    
    try {
        const result = await pool.query(query, [eventId]);
        return result.rows.map(row => row.user_id);
    } catch (error) {
        console.error('Error getting event attendees:', error);
        throw error;
    }
}

module.exports = {
    saveEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    addRSVP,
    removeRSVP,
    getEventAttendees
};