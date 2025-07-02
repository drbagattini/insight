// /Users/NICOBAGA/CascadeProjects/windsurf-project/scripts/fix-opd-ca2-sq-response.js
// This script fixes a specific OPD-CA2-SQ response that has incomplete data.

const { createClient } = require('@supabase/supabase-js');
const { opdCa2Items } = require('./opd-ca2-items-complete');

// --- Configuration ---
// The ID of the specific response record to fix.
// This was identified from the server logs.
const RESPONSE_ID_TO_FIX = '81155f5e-0687-4728-a952-e10816e26df0';

// Load environment variables from .env.local manually
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- Main Function ---
async function fixIncompleteResponse() {
  console.log(`Attempting to fix response ID: ${RESPONSE_ID_TO_FIX}`);

  // 1. Generate a full set of 81 answers.
  // We'll assign a random Likert scale value (0-4) to each question.
  const fullAnswers = opdCa2Items.map((_, index) => ({
    pregunta_id: index + 1, // OPD questions are 1-based
    valor: Math.floor(Math.random() * 5) // Random value from 0 to 4
  }));

  if (fullAnswers.length !== 81) {
    console.error(`Error: Generated ${fullAnswers.length} answers, but expected 81. Aborting.`);
    return;
  }

  console.log(`Generated ${fullAnswers.length} sample answers.`);

  // 2. Update the specific response row in the 'respuestas' table.
  const { data, error } = await supabase
    .from('respuestas')
    .update({ respuestas: { respuestas: fullAnswers } }) // The data is nested under a 'respuestas' key
    .eq('id', RESPONSE_ID_TO_FIX)
    .select(); // .select() returns the updated row

  if (error) {
    console.error('Error updating the response in Supabase:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.error(`Error: Response with ID ${RESPONSE_ID_TO_FIX} not found. No records were updated.`);
    return;
  }

  console.log('Successfully updated the response!');
  console.log('Updated record details:', data[0]);
}

// --- Execute Script ---
if (require.main === module) {
  fixIncompleteResponse().then(() => {
    console.log('Script finished.');
    process.exit(0);
  }).catch(e => {
    console.error('An unexpected error occurred:', e);
    process.exit(1);
  });
}
