\c cs_375_final_project

-- use this to clear any existing tables to reinsert fresh data
-- you'll need to add a DROP TABLE for every table you add
-- we don't drop the database because that causes errors with fly
-- Drop tables in order (drop dependent tables first)
DROP TABLE IF EXISTS rsvps;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS foo;

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

-- dummy data
INSERT INTO foo (datum) VALUES ('Hello this is some text');
INSERT INTO foo (datum) VALUES ('Another sentence');
INSERT INTO foo (datum) VALUES ('How are you?');

-- Sample events for testing
INSERT INTO events (title, description, location_description, lat, long, time, owner, image, external_link) VALUES 
('Philly Food Fest', 'A fun food festival in Center City', 'City Hall, Philadelphia, PA', 39.9526, -75.1652, '2025-11-20 12:00:00', 'midhusi', NULL, NULL),
('Music Concert', 'Live jazz music at Rittenhouse Square', 'Rittenhouse Square, Philadelphia, PA', 39.9496, -75.1718, '2025-11-22 19:00:00', 'sean', NULL, NULL);


\q

