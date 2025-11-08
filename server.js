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

app.listen(port, host, () => {
	console.log(`http://${host}:${port}`);
});
