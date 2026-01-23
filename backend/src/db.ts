import { Pool } from 'pg';

// Create a new pool instance using the connection string from environment variables
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to ensure the pool is connected/ready (mostly for compatibility with previous logic)
export async function ensurePool() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL database.');
    client.release();
    return pool;
  } catch (err) {
    console.error('Error connecting to PostgreSQL database:', err);
    throw err;
  }
}
