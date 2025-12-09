const eventService = require('../services/eventService');


// Event Controller - handles HTTP requests for events

// Create a new event
async function createEvent(req, res, pool) {
    try {
        const { title, description, locationDescription, lat, long, time, owner, image, externalLink } = req.body;
        
        // Validate required fields
        if (!title || !locationDescription || !time || !owner) {
            return res.status(400).json({ 
                error: 'Missing required fields: title, locationDescription, time, and owner are required' 
            });
        }
        
        // Create event data object
        const eventData = {
            title,
            description: description || '',
            locationDescription,
            lat: lat || null,
            long: long || null,
            time,
            owner,
            image: image || null,
            externalLink: externalLink || null
        };
        
        // Save to database
        const savedEvent = await eventService.saveEvent(pool, eventData);
        
        return res.status(201).json({
            message: 'Event created successfully',
            event: savedEvent
        });
    } catch (error) {
        console.error('Error in createEvent controller:', error);
        return res.status(500).json({ error: 'Failed to create event' });
    }
}

// Get all events
async function getAllEvents(req, res, pool) {
    try {
        const events = await eventService.getAllEvents(pool);
        
        return res.status(200).json({
            count: events.length,
            events
        });
    } catch (error) {
        console.error('Error in getAllEvents controller:', error);
        return res.status(500).json({ error: 'Failed to retrieve events' });
    }
}

// Get a single event by ID
async function getEventById(req, res, pool) {
    try {
        const eventId = req.params.id;
        const event = await eventService.getEventById(pool, eventId);
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        return res.status(200).json({ event });
    } catch (error) {
        console.error('Error in getEventById controller:', error);
        return res.status(500).json({ error: 'Failed to retrieve event' });
    }
}

// Update an event
async function updateEvent(req, res, pool) {
    try {
        const eventId = req.params.id;
        const { title, description, locationDescription, lat, long, time, image, externalLink } = req.body;
        
        // Validate required fields
        if (!title || !locationDescription || !time) {
            return res.status(400).json({ 
                error: 'Missing required fields: title, locationDescription, and time are required' 
            });
        }

        const { owner } = req.body; // Owner making the request
        
        if (!owner) {
            return res.status(400).json({ 
                error: 'Owner identification required to update event' 
            });
        }
        
        // Get the existing event to check ownership
        const existingEvent = await eventService.getEventById(pool, eventId);
        
        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        // Check if the requester is the owner
        if (existingEvent.owner !== owner) {
            return res.status(403).json({ 
                error: 'Forbidden: Only the event owner can update this event' 
            });
        }
        
        const eventData = {
            title,
            description: description || '',
            locationDescription,
            lat: lat || null,
            long: long || null,
            time,
            image: image || null,
            externalLink: externalLink || null
        };
        
        const updatedEvent = await eventService.updateEvent(pool, eventId, eventData);
        
        if (!updatedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        return res.status(200).json({
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Error in updateEvent controller:', error);
        return res.status(500).json({ error: 'Failed to update event' });
    }
}

// Delete an event
async function deleteEvent(req, res, pool) {
    try {
        const eventId = req.params.id;
        const { owner } = req.body; // Owner making the request
        
        if (!owner) {
            return res.status(400).json({ 
                error: 'Owner identification required to delete event' 
            });
        }
        
        // Get the existing event to check ownership
        const existingEvent = await eventService.getEventById(pool, eventId);
        
        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        // Check if the requester is the owner
        if (existingEvent.owner !== owner) {
            return res.status(403).json({ 
                error: 'Forbidden: Only the event owner can delete this event' 
            });
        }
        
        const deleted = await eventService.deleteEvent(pool, eventId);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        return res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error in deleteEvent controller:', error);
        return res.status(500).json({ error: 'Failed to delete event' });
    }
}

// RSVP to an event
async function rsvpToEvent(req, res, pool) {
    try {
        const eventId = req.params.id;
        const { userId, userEmail } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
        const added = await eventService.addRSVP(pool, userId, userEmail || null, eventId);
        
        if (!added) {
            return res.status(400).json({ error: 'Already RSVP\'d to this event' });
        }
        
        return res.status(200).json({ message: 'RSVP added successfully' });
    } catch (error) {
        console.error('Error in rsvpToEvent controller:', error);
        return res.status(500).json({ error: 'Failed to add RSVP' });
    }
}

// Cancel RSVP to an event
async function cancelRSVP(req, res, pool) {
    try {
        const eventId = req.params.id;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }
        
        const removed = await eventService.removeRSVP(pool, userId, eventId);
        
        if (!removed) {
            return res.status(404).json({ error: 'RSVP not found' });
        }
        
        return res.status(200).json({ message: 'RSVP cancelled successfully' });
    } catch (error) {
        console.error('Error in cancelRSVP controller:', error);
        return res.status(500).json({ error: 'Failed to cancel RSVP' });
    }
}

// Get attendees for an event
async function getEventAttendees(req, res, pool) {
    try {
        const eventId = req.params.id;
        const attendees = await eventService.getEventAttendees(pool, eventId);
        
        return res.status(200).json({
            count: attendees.length,
            attendees
        });
    } catch (error) {
        console.error('Error in getEventAttendees controller:', error);
        return res.status(500).json({ error: 'Failed to retrieve attendees' });
    }
}

function searchEvents(req, res, pool) {
    let filters = {
        searchText: req.query.searchText || '',
        startDate: req.query.startDate || '',
        endDate: req.query.endDate || '',
        location: req.query.location || '',
        owner: req.query.owner || '',
        hasLocationData: req.query.hasLocationData || ''
    };

    if (!filters.searchText && !filters.startDate && !filters.endDate && 
        !filters.location && !filters.owner && !filters.hasLocationData) {
        res.status(400);
        return res.json({ message: 'At least one search criteria is required' });
    }

    eventService.searchEvents(pool, filters)
        .then(eventRecords => {
            if (eventRecords.length === 0) {
                res.status(404);
                return res.json({ message: "No events found for that criteria." });
            }
            
            res.status(200);
            return res.json({ events: eventRecords });
        })
        .catch(error => {
            res.status(500);
            return res.json({ message: 'Internal error fetching the events for your criteria' });
        });
}

function getUserEventSummary(req, res, pool) {
    let sessionUser;
    
    if (req.session && req.session.user && req.session.user.profile && req.session.user.profile.name) {
        sessionUser = req.session.user.profile.name;
    } else {
        sessionUser = null;
    }
    
    if (!sessionUser) {
        res.status(401);
        return res.json({ error: 'Not authenticated' });
    }
    
    let ownedPromise = eventService.getEventsByOwner(pool, sessionUser);
    let rsvpPromise = eventService.getRsvpedEvents(pool, sessionUser);
    
    return Promise.all([ownedPromise, rsvpPromise])
        .then(([createdEvents, rsvpEvents]) => {
            res.status(200);
            return res.json({ createdEvents, rsvpEvents });
        })
        .catch(error => {
            console.error('Error in getUserEventSummary controller:', error);
            res.status(500);
            return res.json({ error: 'Failed to load user events' });
        });
}

module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    rsvpToEvent,
    cancelRSVP,
    getEventAttendees,
    searchEvents,
    getUserEventSummary
};