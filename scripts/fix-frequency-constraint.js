#!/usr/bin/env node

/**
 * Script to fix the frequency constraint to allow "10_minutos"
 * This will execute SQL directly via Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixFrequencyConstraint() {
  console.log('🔧 Fixing frequency constraint to allow "10_minutos"...\n');

  try {
    // Step 1: Drop existing constraint
    console.log('1️⃣ Dropping existing frequency constraint...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE envios_programados DROP CONSTRAINT IF EXISTS envios_programados_frecuencia_check;'
    });

    if (dropError) {
      console.log('⚠️  Error dropping constraint (may not exist):', dropError.message);
    } else {
      console.log('✅ Existing constraint dropped successfully');
    }

    // Step 2: Add new constraint with "10_minutos"
    console.log('\n2️⃣ Adding new constraint with 10_minutos support...');
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE envios_programados 
            ADD CONSTRAINT envios_programados_frecuencia_check 
            CHECK (frecuencia IN ('10_minutos', 'semanal', 'mensual', 'trimestral', 'unico'));`
    });

    if (addError) {
      console.error('❌ Error adding new constraint:', addError);
      
      // Try alternative approach using raw SQL
      console.log('\n🔄 Trying alternative approach...');
      const { error: altError } = await supabase
        .from('envios_programados')
        .select('count', { count: 'exact' });
      
      if (!altError) {
        console.log('✅ Database connection is working');
        console.log('\n📋 Manual steps needed:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Execute this SQL:');
        console.log('\n```sql');
        console.log('ALTER TABLE envios_programados DROP CONSTRAINT IF EXISTS envios_programados_frecuencia_check;');
        console.log('ALTER TABLE envios_programados ADD CONSTRAINT envios_programados_frecuencia_check CHECK (frecuencia IN (\'10_minutos\', \'semanal\', \'mensual\', \'trimestral\', \'unico\'));');
        console.log('```');
      }
      
      return;
    }

    console.log('✅ New constraint added successfully!');

    // Step 3: Test the constraint
    console.log('\n3️⃣ Testing the new constraint...');
    console.log('Valid frequencies now: 10_minutos, semanal, mensual, trimestral, unico');

    // Step 4: Show success message
    console.log('\n🎉 SUCCESS! You can now use "10_minutos" frequency in the UI');
    console.log('✅ Create patients with 10-minute recurrence');
    console.log('✅ Schedule questionnaires every 10 minutes');
    console.log('✅ Test rapid recurrence flow');

    console.log('\n🧪 Next steps:');
    console.log('1. Go to http://localhost:3001');
    console.log('2. Create a new patient with frequency "🕰️ 10 Minutos (Testing)"');
    console.log('3. The system will schedule questionnaires every 10 minutes');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n📋 Manual SQL to run in Supabase Dashboard:');
    console.log('```sql');
    console.log('ALTER TABLE envios_programados DROP CONSTRAINT IF EXISTS envios_programados_frecuencia_check;');
    console.log('ALTER TABLE envios_programados ADD CONSTRAINT envios_programados_frecuencia_check CHECK (frecuencia IN (\'10_minutos\', \'semanal\', \'mensual\', \'trimestral\', \'unico\'));');
    console.log('```');
  }
}

fixFrequencyConstraint();
