const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const { google } = require('googleapis');

dotenv.config();

const hostname = 'localhost';
const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session({
  name: 'philly.sid',
  secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar' // full read/write calendar access
];

// --- Middleware helpers ---

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.tokens) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  oauth2Client.setCredentials(req.session.user.tokens);
  req.googleCalendar = google.calendar({ version: 'v3', auth: oauth2Client });
  next();
}

function updateSessionTokensFromClient(req) {
  if (oauth2Client.credentials && req.session && req.session.user) {
    req.session.user.tokens = {
      ...req.session.user.tokens,
      ...oauth2Client.credentials
    };
  }
}

// --- Calendar API routes ---

// Create a new calendar event (used by your event details page)
app.post('/api/calendar/events', requireAuth, async (req, res) => {
  const calendar = req.googleCalendar;

  try {
    const { summary, start, end, description, location } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: 'Missing required start or end datetime' });
    }

    const resource = {
      summary: summary || 'New Event',
      description: description || '',
      location: location || '',
      start: { dateTime: start },
      end: { dateTime: end }
    };

    const resp = await calendar.events.insert({
      calendarId: 'primary',
      resource
    });

    updateSessionTokensFromClient(req);
    return res.json(resp.data);
  } catch (err) {
    console.error('create event error:', err.response?.data || err.message, err);
    return res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update an existing calendar event (still used from the calendar UI for edit)
app.put('/api/calendar/events/:id', requireAuth, async (req, res) => {
  const calendar = req.googleCalendar;

  try {
    const eventId = req.params.id;
    const { summary, start, end, description, location } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: 'Missing required start or end datetime' });
    }

    const resource = {
      summary: summary || '',
      description: description || '',
      location: location || '',
      start: { dateTime: start },
      end: { dateTime: end }
    };

    const resp = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      resource
    });

    updateSessionTokensFromClient(req);
    return res.json(resp.data);
  } catch (err) {
    console.error('update event error:', err.response?.data || err.message, err);
    return res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete a calendar event
app.delete('/api/calendar/events/:id', requireAuth, async (req, res) => {
  const calendar = req.googleCalendar;

  try {
    const eventId = req.params.id;

    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });

    updateSessionTokensFromClient(req);
    return res.sendStatus(204);
  } catch (err) {
    console.error('delete event error:', err.response?.data || err.message, err);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
});

// List calendar events (supports timeMin/timeMax for week view)
app.get('/api/calendar/events', requireAuth, async (req, res) => {
  const calendar = req.googleCalendar;

  try {
    const { timeMin, timeMax, maxResults } = req.query;

    const now = new Date().toISOString();
    const params = {
      calendarId: 'primary',
      timeMin: timeMin || now,
      singleEvents: true,
      orderBy: 'startTime'
    };

    if (timeMax) params.timeMax = timeMax;
    if (maxResults) params.maxResults = Number(maxResults);
    else params.maxResults = 100;

    const resp = await calendar.events.list(params);

    updateSessionTokensFromClient(req);

    const items = (resp.data.items || []).map(e => ({
      id: e.id,
      summary: e.summary,
      start: e.start && (e.start.dateTime || e.start.date),
      end: e.end && (e.end.dateTime || e.end.date),
      location: e.location,
      description: e.description
    }));

    return res.json(items);
  } catch (err) {
    console.error('Calendar API error:', err.response?.data || err.message, err);
    return res.status(500).json({ error: 'Calendar fetch error' });
  }
});

// --- Auth routes ---

// redirect to Google for consent
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });
  res.redirect(url);
});

// OAuth2 callback
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing authorization code');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch basic profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    req.session.user = {
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture
      },
      tokens: {
        refresh_token: tokens.refresh_token || null,
        access_token: tokens.access_token || null,
        scope: tokens.scope,
        expiry_date: tokens.expiry_date || null
      }
    };

    return res.redirect('/pages/login.html'); // or /pages/calendar.html if you prefer
  } catch (err) {
    console.error('OAuth callback error:', err.response?.data || err.message, err);
    return res.status(500).send('Authentication error');
  }
});

// Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('philly.sid');
    res.redirect('/pages/login.html');
  });
});

// API: sanitized user status (no tokens)
app.get('/api/user', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.json({ authenticated: false });
  }
  return res.json({
    authenticated: true,
    user: req.session.user.profile
  });
});

// Dev-friendly /profile route (sanitized)
app.get('/profile', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user: req.session.user.profile });
});

app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
