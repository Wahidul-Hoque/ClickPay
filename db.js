require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getConnection() {
  console.log('Supabase client initialized successfully!');
  return supabase;
}

module.exports = { getConnection, supabase };