import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const client = await pool.connect();
    console.log("Connected to DB.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(user_id),
        type VARCHAR(20) NOT NULL CHECK (type IN ('number', 'agent')),
        phone VARCHAR(30) NOT NULL,
        name VARCHAR(150) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, phone, type)
      );
    `);
    console.log("Table 'favorites' created successfully.");
    client.release();
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
  }
}

run();
