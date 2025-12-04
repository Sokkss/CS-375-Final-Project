// citation: largely from the professor's sample code

let { Pool } = require("pg");
let createApp = require("./src/app");

process.chdir(__dirname);

let port = 3000;
let host;
let databaseConfig;

// fly.io sets NODE_ENV to production automatically, otherwise it's unset when running locally
if (process.env.NODE_ENV == "production") {
	host = "0.0.0.0";
	databaseConfig = { connectionString: process.env.DATABASE_URL };
} else {
	host = "localhost";
	let { PGUSER, PGPASSWORD, PGDATABASE, PGHOST, PGPORT } = process.env;
	databaseConfig = { user: PGUSER, password: PGPASSWORD, database: PGDATABASE, host: PGHOST, port: PGPORT };
}

// uncomment these to debug
console.log(JSON.stringify(process.env, null, 2));
console.log(JSON.stringify(databaseConfig, null, 2));


let pool = new Pool(databaseConfig);
pool.connect().then(() => {
	console.log("Connected to db");
});

/*
KEEP EVERYTHING ABOVE HERE
REPLACE THE FOLLOWING WITH YOUR SERVER CODE 
*/

let app = createApp(pool);

/*
KEEP EVERYTHING BELOW HERE
*/

const externalEventService = require('./src/services/externalEventService');

// Runs collection of external events on startup
setTimeout(() => {
    externalEventService.collectAndStoreExternalEvents(pool)
        .then(result => {
            console.log('External events collected:', result);
        })
        .catch(err => {
            console.error('Error collecting external events:', err);
        });
}, 5000);

// Runs collection of external events daily
const DAY = 24 * 60 * 60 * 1000;
setInterval(() => {
    externalEventService.collectAndStoreExternalEvents(pool)
        .then(result => {
            console.log('External events collected:', result);
        })
        .catch(err => {
            console.error('Error collecting external events:', err);
        });
}, DAY);

app.listen(port, host, () => {
	console.log(`http://${host}:${port}`);
});
