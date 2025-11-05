const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    console.log('Database connection pool created');
  }
  
  return pool;
}

function testConnection() {
  const dbPool = getPool();
  
  return dbPool.connect()
    .then((client) => {
      return client.query('SELECT NOW()')
        .then((result) => {
          client.release();
          console.log('Database connection successful:', result.rows[0]);
          return true;
        })
        .catch((error) => {
          client.release();
          console.error('Database query failed:', error);
          throw error;
        });
    })
    .catch((error) => {
      console.error('Database connection failed:', error);
      throw error;
    });
}

module.exports = {
  getPool,
  testConnection
};
