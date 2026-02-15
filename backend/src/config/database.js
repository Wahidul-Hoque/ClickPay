// ==============================================
// DATABASE CONNECTION CONFIGURATION
// ==============================================
// This file sets up PostgreSQL connection to Supabase

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

// ==============================================
// CREATE DATABASE CONNECTION POOL
// ==============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Supabase
  },
  max: 20,                      // Maximum connections in pool
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 2000 // Timeout if connection takes more than 2s
});

// Connection event handlers
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  process.exit(-1);
});

// ==============================================
// HELPER FUNCTION: EXECUTE QUERIES
// ==============================================
// Use this for simple queries
// Example: query('SELECT * FROM users WHERE phone = $1', ['01712345678'])
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 60) + '...', duration: duration + 'ms', rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
};

// ==============================================
// GET CLIENT FOR TRANSACTIONS
// ==============================================
// Use this when you need to run multiple queries as a single transaction
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Set a timeout
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Monkey patch the query method
  client.query = (...args) => {
    client.lastQuery = args;
    return query(...args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release();
  };
  
  return client;
};

export default pool;
