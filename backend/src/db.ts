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
  
  // Validate and fix common connection string issues
  let finalConnectionString = connectionString;
  
  // Fix: If URL is just a host without protocol or database, warn or try to fix
  if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
    console.error(`
      ⚠️  INVALID DATABASE_URL FORMAT DETECTED ⚠️
      The provided DATABASE_URL does not start with 'postgres://' or 'postgresql://'.
      Current value (masked): ${masked}
      
      It looks like you might have pasted just the hostname: '${connectionString}'
      
      👉 ACTION REQUIRED:
      The DATABASE_URL must be a full connection URI:
      postgres://<user>:<password>@<host>:<port>/<database_name>
      
      Check your cloud dashboard and copy the "Internal Database URL" or "Connection String".
    `);
  }
  
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
  
  // Workaround for potential port/db name parsing issues if connection string is malformed
  // Some cloud providers might append params that confuse the parser
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
