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

async function getSession() { 
    session({
        name: 'philly.sid',
        secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // requires HTTPS in prod // can remove ??
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    });
}

async function getGoogleAuth(req, res) {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // request refresh token for long-lived access
      prompt: 'consent',      // force consent to ensure refresh_token on first auth
      scope: SCOPES
    });
    res.redirect(url);
}

async function getGoogleAuthCallback(req, res) {
    const code = req.query.code;
    if (!code) return res.status(400).send('Missing authorization code');

    try {
        const { tokens } = await oauth2Client.getToken(code);
        // Keep credentials on oauth2Client for any immediate server-side calls
        oauth2Client.setCredentials(tokens);

        // Fetch basic profile
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: profile } = await oauth2.userinfo.get();

        // Persist minimal profile in session and store tokens server-side (dev: session)
        // Production: persist refresh_token securely to DB and do not expose tokens via APIs.
        req.session.user = {
        profile: {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            picture: profile.picture
        },
        // store tokens in session for dev convenience; remove/secure in prod
        tokens: {
            refresh_token: tokens.refresh_token || null,
            access_token: tokens.access_token || null,
            scope: tokens.scope,
            expiry_date: tokens.expiry_date || null
        }
        };

        return res.redirect('/pages/index.html'); // redirect to app entry point
    } catch (err) {
        console.error('OAuth callback error:', err);
        return res.status(500).send('Authentication error');
    }
}

async function getLogout(req, res) {
    req.session.destroy((err) => {
      res.clearCookie('philly.sid');
      res.redirect('/pages/login.html');
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
    // return only profile fields for safety
    return res.json({ user: req.session.user.profile });
}
