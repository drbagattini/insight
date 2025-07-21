const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function debugScheduledSends() {
  console.log('🔍 Debugging scheduled sends...');
  
  try {
    // Get current time
    const now = new Date();
    console.log(`🕐 Current time: ${now.toISOString()}`);
    console.log(`🕐 Current time (local): ${now.toLocaleString()}`);

    // Get all scheduled sends
    const { data: allSends, error: allError } = await supabase
      .from('envios_programados')
      .select('*')
      .order('proximo_envio', { ascending: true });

    if (allError) {
      console.error('❌ Error getting all sends:', allError);
      return;
    }

    console.log(`\n📊 Total scheduled sends in database: ${allSends.length}`);
    
    if (allSends.length === 0) {
      console.log('❌ No scheduled sends found in database');
      return;
    }

    // Show all sends
    console.log('\n📋 All scheduled sends:');
    allSends.forEach((send, index) => {
      const nextSend = new Date(send.proximo_envio);
      const isPast = nextSend < now;
      
      console.log(`   ${index + 1}. ID: ${send.id}`);
      console.log(`      Frequency: ${send.frecuencia}`);
      console.log(`      Channel: ${send.canal}`);
      console.log(`      Next send: ${send.proximo_envio} (${nextSend.toLocaleString()})`);
      console.log(`      Active: ${send.activo}`);
      console.log(`      Past due: ${isPast ? '🔴 YES' : '🟢 NO'}`);
      console.log(`      Time diff: ${isPast ? '-' : '+'}${Math.abs(now.getTime() - nextSend.getTime()) / (1000 * 60)} minutes`);
      console.log('');
    });

    // Get sends that should be processed (past due and active)
    const { data: dueSends, error: dueError } = await supabase
      .from('envios_programados')
      .select('*')
      .lte('proximo_envio', now.toISOString())
      .eq('activo', true);

    if (dueError) {
      console.error('❌ Error getting due sends:', dueError);
      return;
    }

    console.log(`🎯 Due sends (should be processed): ${dueSends.length}`);
    
    if (dueSends.length > 0) {
      dueSends.forEach((send, index) => {
        console.log(`   ${index + 1}. ${send.frecuencia} via ${send.canal} - Due: ${new Date(send.proximo_envio).toLocaleString()}`);
      });
    } else {
      console.log('❓ No sends are due for processing');
      
      // Check if there are any active sends
      const activeSends = allSends.filter(s => s.activo);
      console.log(`📈 Active sends: ${activeSends.length}`);
      
      // Check timezone issues
      console.log('\n🌍 Timezone analysis:');
      console.log(`   Current timezone offset: ${now.getTimezoneOffset()} minutes`);
      console.log(`   Current UTC time: ${now.toISOString()}`);
      console.log(`   Current local time: ${now.toLocaleString()}`);
    }

  } catch (error) {
    console.error('🔥 Unexpected error:', error);
  }
}

// Run the script
debugScheduledSends().then(() => {
  console.log('✨ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
