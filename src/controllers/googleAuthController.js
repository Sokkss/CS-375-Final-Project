let session = require('express-session');
let { google } = require('googleapis');
let pgSession = require('connect-pg-simple')(session);

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [ 
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar'
];

let isProduction = process.env.NODE_ENV === 'production';

function getSession(pool) {
    let sessionConfig = {
        name: 'philly.sid',
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }
    };
    
    if (pool) {
        sessionConfig.store = new pgSession({
            pool: pool,
            tableName: 'session',
            createTableIfMissing: true
        });
    }
    
    return session(sessionConfig);
}

async function getGoogleAuth(req, res) {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', 
      scope: SCOPES
    });
    res.redirect(url);
}

async function getGoogleAuthCallback(req, res) {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing authorization code');

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

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

        await req.session.save((err) => {
            if (err) console.error('Session save error:', err);
            return res.redirect('/auth/close');
        });

    } catch (err) {
        console.error('OAuth callback error:', err);
        return res.status(500).send('Authentication error');
    }
}

async function getCalendar(req, res) {
    if (!req.session?.user?.tokens?.access_token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    let tokens = req.session.user.tokens;

    try {
        oauth2Client.setCredentials({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token
        });

        let calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        let now = new Date();
        let oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

        let response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: oneMonthFromNow.toISOString(),
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime'
        });

        let events = response.data.items || [];
        
        let formattedEvents = events.map(function(event) {
            return {
                id: event.id,
                title: event.summary || 'No title',
                description: event.description || '',
                start: event.start.dateTime || event.start.date,
                end: event.end.dateTime || event.end.date,
                location: event.location || '',
                htmlLink: event.htmlLink
            };
        });

        return res.json({ events: formattedEvents });

    } catch (err) {
        console.error('Error fetching calendar events:', err);
        return res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
}

function getLogout(req, res) {
    req.session.destroy(function(err) {
        if (err) {
            console.error('Session destroy error:', err);
        }
        res.clearCookie('philly.sid', {
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        res.redirect('/');
    });
}

async function getUser(req, res) {
    if (!req.session || !req.session.user) {
      return res.json({ authenticated: false });
    }
    return res.json({
      authenticated: true,
      user: req.session.user.profile
    });
}

async function getProfile(req, res) {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.json({ user: req.session.user.profile });
}

module.exports = {
    getSession,
    getGoogleAuth,
    getGoogleAuthCallback,
    getLogout,
    getCalendar,
    getUser,
    getProfile
};