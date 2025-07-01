require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Make sure .env.local is set up.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyQuestionnaire() {
  console.log('Connecting to Supabase to verify questionnaire...');

  try {
    const { data, error } = await supabase
      .from('cuestionarios')
      .select('items')
      .eq('codigo', 'OPD-CA2-SQ')
      .single();

    if (error) {
      throw error;
    }

    if (data && data.items) {
      console.log(`Verification successful!`);
      console.log(`The 'OPD-CA2-SQ' questionnaire currently has ${data.items.length} items in the database.`);
    } else {
      console.log(`Could not find the 'OPD-CA2-SQ' questionnaire or it has no items.`);
    }
  } catch (error) {
    console.error('Error verifying questionnaire:', error.message);
  } finally {
    console.log('Verification script finished.');
  }
}

verifyQuestionnaire();
