// ==============================================
// DATABASE CONNECTION CONFIGURATION
// ==============================================
// This file sets up the PostgreSQL connection to Supabase
// and provides helper functions for running queries

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Destructure Pool from pg module
const { Pool } = pg;

// ==============================================
// CREATE DATABASE CONNECTION POOL
// ==============================================
// A "pool" manages multiple database connections
// This is more efficient than creating a new connection for each query
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,  // Get connection string from .env
  ssl: { 
    rejectUnauthorized: false  // Required for Supabase connections
  },
  max: 20,  // Maximum number of connections in pool
  idleTimeoutMillis: 30000,  // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000  // Timeout if connection takes more than 2 seconds
});

// ==============================================
// CONNECTION EVENT HANDLERS
// ==============================================

// Log when database connects successfully
db.on('connect', () => {
  console.log('✅ Database connected to PostgreSQL (Supabase)');
});

// Log errors if connection fails
db.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// ==============================================
// HELPER FUNCTION: EXECUTE SIMPLE QUERIES
// ==============================================
// Use this for single queries (SELECT, INSERT, UPDATE, DELETE)
// Example: query('SELECT * FROM users WHERE phone = $1', ['01712345678'])
export const query = async (text, params) => {
  const start = Date.now();  // Track query execution time
  try {
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    
    // Log query details for debugging
    console.log('Executed query:', { 
      text: text.substring(0, 50) + '...', 
      duration: duration + 'ms', 
      rows: res.rowCount 
    });
    
    return res;  // Return query result
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;  // Re-throw error to be handled by caller
  }
};

// ==============================================
// HELPER FUNCTION: GET CLIENT FOR TRANSACTIONS
// ==============================================
// Use this when you need to run multiple queries as a single transaction
// Example usage:
//   const client = await db.connect();
//   await client.query('BEGIN');
//   await client.query('INSERT INTO ...');
//   await client.query('UPDATE ...');
//   await client.query('COMMIT');
//   client.release();
export { db as default };
