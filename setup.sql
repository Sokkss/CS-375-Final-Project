\c cs_375_final_project

-- use this to clear any existing tables to reinsert fresh data
-- you'll need to add a DROP TABLE for every table you add
-- we don't drop the database because that causes errors with fly
-- Drop tables in order (drop dependent tables first)
DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS foo;
DROP TABLE IF EXISTS session;

-- create whatever tables you need here
CREATE TABLE foo (
	id SERIAL PRIMARY KEY,
	datum TEXT
);

-- Events table for user-created events
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location_description TEXT NOT NULL,
    lat DECIMAL(17, 15),
    long DECIMAL(17, 15),
    time TIMESTAMP NOT NULL,
    owner TEXT NOT NULL,
    image TEXT,
    external_link TEXT,
    is_external BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RSVPs table to track which users are attending which events
CREATE TABLE rsvps (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE TABLE session (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (sid)
);
CREATE INDEX idx_session_expire ON session (expire);

-- dummy data
INSERT INTO foo (datum) VALUES ('Hello this is some text');
INSERT INTO foo (datum) VALUES ('Another sentence');
INSERT INTO foo (datum) VALUES ('How are you?');

-- Sample events for testing
INSERT INTO events (title, description, location_description, lat, long, time, owner, image, external_link) VALUES 
('Winter Market at City Hall', 'Annual holiday market featuring local vendors, crafts, and seasonal treats. Free admission.', 'Dilworth Park, City Hall, Philadelphia, PA', 39.9526, -75.1635, '2025-12-14 11:00:00', 'PhillyEvents', NULL, NULL),
('First Friday Art Walk', 'Explore galleries and studios in Old City. Meet local artists and enjoy complimentary refreshments.', 'Old City District, 2nd & Market St, Philadelphia, PA', 39.9505, -75.1441, '2026-01-03 17:00:00', 'OldCityArts', NULL, NULL),
('Jazz Night at South', 'Live jazz trio performing classic standards and original compositions. No cover charge.', 'South Restaurant, 600 N Broad St, Philadelphia, PA', 39.9648, -75.1604, '2025-12-20 20:00:00', 'SouthJazz', NULL, NULL),
('Philly Tech Meetup', 'Monthly gathering for developers, designers, and tech enthusiasts. Lightning talks and networking.', 'WeWork, 1900 Market St, Philadelphia, PA', 39.9534, -75.1727, '2026-01-15 18:30:00', 'PhillyTech', NULL, NULL),
('Running Club at Schuylkill Banks', 'Weekly 5K run along the river trail. All paces welcome. Meet at the gazebo.', 'Schuylkill Banks Boardwalk, Philadelphia, PA', 39.9567, -75.1823, '2025-12-21 09:00:00', 'PhillyRunners', NULL, NULL),
('Board Game Night', 'Casual board game meetup at a local cafe. Bring your own games or play from our collection.', 'Thirsty Dice Board Game Cafe, 1642 Fairmount Ave, Philadelphia, PA', 39.9686, -75.1698, '2025-12-18 19:00:00', 'GameNight', NULL, NULL),
('Reading Terminal Market Tour', 'Guided food tour through one of America oldest public markets. Tastings included.', 'Reading Terminal Market, 1136 Arch St, Philadelphia, PA', 39.9533, -75.1590, '2025-12-28 10:30:00', 'FoodTours', NULL, NULL),
('Open Mic Comedy Night', 'Try out your best jokes or just come to laugh. Sign-up starts at 7pm.', 'Good Good Comedy Theatre, 215 N 11th St, Philadelphia, PA', 39.9571, -75.1568, '2026-01-08 19:30:00', 'GoodGoodComedy', NULL, NULL);


\q

