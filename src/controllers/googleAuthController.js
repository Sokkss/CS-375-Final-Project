const session = require('express-session');
const { google } = require('googleapis');

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

function getSession() { 
    return session({
        name: 'philly.sid',
        secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // can remove ??
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000
        }
    });
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

        return res.redirect("/auth/close");

    } catch (err) {
        console.error('OAuth callback error:', err);
        return res.status(500).send('Authentication error');
    }
}

async function getCalendar(req, res) {
    if (!req.session?.user?.tokens?.access_token) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    const { access_token } = req.session.user.tokens;

    try {
        const calendarId = 'primary';
        const encodedCalendarId = encodeURIComponent(calendarId);
        const embedUrl = `https://calendar.google.com/calendar/embed?src=${encodedCalendarId}&ctz=America%2FNew_York&access_token=${access_token}`;

        return res.json({ embedUrl });

    } catch (err) {
        console.error('Error generating embed URL:', err);
        return res.status(500).json({ error: 'Failed to generate embed URL' });
    }
}

async function getLogout(req, res) {
    req.session.destroy((err) => {
      res.clearCookie('philly.sid');
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
