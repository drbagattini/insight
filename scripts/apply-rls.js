const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ctrncyswjdvckozsosnv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cm5jeXN3amR2Y2tvenNvc252Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxMjA4NywiZXhwIjoyMDU5OTg4MDg3fQ.NkS4I4IOE_8V4PHmpuBAEydJ6zMntw0ceALdDvXPkHM';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and service role key are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function applyRLSPolicies() {
  try {
    const sqlPath = path.join(__dirname, 'final-rls-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying RLS policies...');
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) throw error;
    
    console.log('✅ RLS policies applied successfully!');
    
    // Verificar las políticas actuales
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');
      
    if (policiesError) throw policiesError;
    
    console.log('\nCurrent policies:');
    console.table(policies);
    
  } catch (error) {
    console.error('Error applying RLS policies:', error);
    process.exit(1);
  }
}

applyRLSPolicies();
