const eventController = require('../controllers/eventController');
const externalEventController = require('../controllers/externalEventController');
const express = require('express');

const getPhillyNextWeek = require('../controllers/controller');
const googleAuthController = require('../controllers/googleAuthController');

// citation: largely from Professor Long's sample code
function createRoutes(pool) {
    let router = express.Router();
    
    router.use(googleAuthController.getSession(pool));

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

    // External events (seatgeek + visitphilly + eventbrite)
    router.post('/api/events/collect-external', (req, res) => externalEventController.collectExternalEvents(req, res, pool));

    // Event image endpoint (for dynamic stock images)
    router.get('/api/event-image', (req, res) => eventController.getEventImage(req, res));

    // Google OAuth + calendar
    router.get('/auth/google', (req, res) => googleAuthController.getGoogleAuth(req, res));
    router.get('/auth/google/callback', (req, res) => googleAuthController.getGoogleAuthCallback(req, res));
    router.get('/auth/logout', (req, res) => googleAuthController.getLogout(req, res));
    router.get('/api/user', (req, res) => googleAuthController.getUser(req, res));
    router.get('/api/user/events-summary', (req, res) => eventController.getUserEventSummary(req, res, pool));
    router.get('/profile', (req, res) => googleAuthController.getProfile(req, res));
    router.get('/api/calendar/embed', (req, res) => googleAuthController.getCalendar(req, res));
    router.get("/auth/close", (req, res) => {
        const user = req.session?.user || null;
        const loggedIn = !!user;
        const picture = user?.profile?.picture || null;

        // Only signal success to the opener if the session was actually created.
        // Otherwise notify the opener that authentication failed so it doesn't
        // reload expecting a logged-in state.
        res.send(`
            <script>
                window.opener.postMessage(
                    ${loggedIn ? `{ loggedIn: true, redirectUrl: "/", user: { picture: "${picture}" } }` : `{ loggedIn: false }`},
                    window.location.origin
                );
                window.close();
            </script>
        `);
    });



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