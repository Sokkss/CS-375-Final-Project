const eventController = require('../controllers/eventController');
const express = require('express');

const getPhillyNextWeek = require('../controllers/controller');

// citation: largely from Professor Long's sample code
function createRoutes(pool) {
    const router = express.Router();

    router.get('/events/philly/next-week', getPhillyNextWeek);

    // Event CRUD routes
    router.post('/api/events', (req, res) => eventController.createEvent(req, res, pool));
    router.get('/api/events', (req, res) => eventController.getAllEvents(req, res, pool));
    router.get('/api/events/search', (req, res) => eventController.searchEvents(req, res, pool));
    router.get('/api/events/:id', (req, res) => eventController.getEventById(req, res, pool));
    router.put('/api/events/:id', (req, res) => eventController.updateEvent(req, res, pool));
    router.delete('/api/events/:id', (req, res) => eventController.deleteEvent(req, res, pool));

    // RSVP routes
    router.post('/api/events/:id/rsvp', (req, res) => eventController.rsvpToEvent(req, res, pool));
    router.delete('/api/events/:id/rsvp', (req, res) => eventController.cancelRSVP(req, res, pool));
    router.get('/api/events/:id/attendees', (req, res) => eventController.getEventAttendees(req, res, pool));

    // Google OAuth
    router.use(() => eventController.getSession());
    router.get('/auth/google', (req, res) => eventController.getGoogleAuth(req, res));
    router.get('/auth/google/callback', (req, res) => eventController.getGoogleAuthCallback(req, res));
    router.get('/auth/logout', (req, res) => eventController.getLogout(req, res));
    router.get('/api/user', (req, res) => eventController.getUser(req, res));
    router.get('/profile', (req, res) => eventController.getProfile(req, res));

    router.post("/datum", (req, res) => {
        let { datum } = req.body;
        if (datum === undefined) {
            return res.status(400).send({});
        }
        pool.query("INSERT INTO foo (datum) VALUES ($1)", [datum]).then(result => {
            return res.send({});
        }).catch(error => {
            console.log(error);
            return res.status(500).send({});
        })
    });

    router.get("/data", (req, res) => {
        pool.query("SELECT * FROM foo").then(result => {
            return res.send({data: result.rows});
        }).catch(error => {
            console.log(error);
            return res.status(500).send({data: []});
        })
    });

    router.get("/", (req, res) => {
        res.sendFile("./index.html", {root: "public"});
    });
    
  return router;
}

module.exports = createRoutes;
