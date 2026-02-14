const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASEURL= process.env.SUPABASE_URL;
const SUPABASESERVICEKEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// If these are missing, the app will crash early with a clear message
if (!SUPABASEURL || !SUPABASESERVICEKEY ) {
    console.error("Missing Supabase Environment Variables!");
}

const supabase = createClient(SUPABASEURL, SUPABASESERVICEKEY );
module.exports = supabase;

