#!/usr/bin/env node

/**
 * Clean all scheduled sends to start fresh testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanScheduledSends() {
  console.log('🧹 Cleaning all scheduled sends...');

  try {
    // Get count before deletion
    const { count: beforeCount } = await supabase
      .from('envios_programados')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Found ${beforeCount} scheduled sends to delete`);

    // Delete all scheduled sends
    const { error } = await supabase
      .from('envios_programados')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      console.error('❌ Error deleting scheduled sends:', error);
      return;
    }

    // Verify deletion
    const { count: afterCount } = await supabase
      .from('envios_programados')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Deleted ${beforeCount} scheduled sends`);
    console.log(`📊 Remaining scheduled sends: ${afterCount}`);

    console.log('\n🎯 Ready for fresh testing!');
    console.log('1. Go to UI and create a patient with "🕰️ 10 Minutos (Testing)"');
    console.log('2. The automatic processor will handle the recurrence');
    console.log('3. You should receive emails every 10 minutes automatically');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanScheduledSends();
