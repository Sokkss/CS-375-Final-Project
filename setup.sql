\c cs_375_final_project

-- use this to clear any existing tables to reinsert fresh data
-- you'll need to add a DROP TABLE for every table you add
-- we don't drop the database because that causes errors with fly
DROP TABLE IF EXISTS foo;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS rsvps;

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
    location TEXT NOT NULL,
    time TIMESTAMP NOT NULL,
    owner TEXT NOT NULL,
    image TEXT,
    external_link TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RSVPs table to track which users are attending which events
CREATE TABLE rsvps (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- dummy data
INSERT INTO foo (datum) VALUES ('Hello this is some text');
INSERT INTO foo (datum) VALUES ('Another sentence');
INSERT INTO foo (datum) VALUES ('How are you?');

-- Sample events for testing
INSERT INTO events (title, description, location, time, owner, image, external_link) VALUES 
('Philly Food Fest', 'A fun food festival in Center City', 'City Hall, Philadelphia, PA', '2025-11-20 12:00:00', 'midhusi', NULL, NULL),
('Music Concert', 'Live jazz music at Rittenhouse Square', 'Rittenhouse Square, Philadelphia, PA', '2025-11-22 19:00:00', 'sean', NULL, NULL);


\q

