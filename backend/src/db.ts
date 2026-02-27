import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

// Ensure env vars are loaded
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

console.log(`🔌 Database Config: ${connectionString ? 'Using DATABASE_URL' : 'Using individual variables'}`);

let poolConfig: PoolConfig;

if (connectionString) {
  // Mask password for logging
  const masked = connectionString.replace(/:[^:@]*@/, ':****@');
  console.log(`🔌 Connection String: ${masked}`);
  
  // Check for localhost usage in production
  if (isProduction && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'))) {
    console.error(`
      ⚠️  CRITICAL CONFIGURATION WARNING ⚠️
      You are running in PRODUCTION mode but your DATABASE_URL points to 'localhost' or '127.0.0.1'.
      In a containerized environment (Docker/Cloud), 'localhost' refers to the container itself, not the host machine or database service.
      
      👉 ACTION REQUIRED:
      Update your cloud dashboard (Render/Railway/etc.) environment variables:
      DATABASE_URL = <your_actual_cloud_database_url>
      
      Example: postgres://user:pass@dpg-xxxx-a.oregon-postgres.render.com:5432/db_name
    `);
  }
  
  poolConfig = {
    connectionString,
    // Enable SSL for production, but allow self-signed certs (common in cloud DBs)
    // Also enable SSL if explicitly requested via DB_SSL=true
    ssl: (isProduction || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : undefined,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: (isProduction || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : undefined,
  };
}

export const pool = new Pool(poolConfig);

export async function ensurePool() {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL database.');
    client.release();
    return pool;
  } catch (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err);
    throw err;
  }
}
