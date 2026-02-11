const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// If these are missing, the app will crash early with a clear message
if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase Environment Variables!");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;