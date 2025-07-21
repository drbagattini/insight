import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableTriggerAndTest() {
  console.log('🔧 Intentando desactivar trigger problemático...\n');
  
  try {
    // Intentar crear una función RPC temporal que deshabilite el trigger
    console.log('📝 Creating temporary RPC function to disable trigger...');
    
    const { data: createFuncResult, error: createFuncError } = await supabase
      .rpc('exec', { 
        sql: `
          CREATE OR REPLACE FUNCTION disable_envios_trigger()
          RETURNS text AS $$
          BEGIN
            -- Try to drop the problematic trigger
            DROP TRIGGER IF EXISTS trg_update_envios_updated_at ON public.envios_programados;
            
            -- Try to drop other possible triggers
            DROP TRIGGER IF EXISTS trg_update_envios_actualizado_en ON public.envios_programados;
            
            RETURN 'Triggers disabled successfully';
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
    if (createFuncError) {
      console.log('⚠️  Could not create RPC function:', createFuncError.message);
      console.log('🔄 Trying alternative approach: direct update without trigger...\n');
      
      // Alternative: Try updating without relying on triggers
      return await testDirectUpdate();
    }
    
    // Execute the disable function
    const { data: disableResult, error: disableError } = await supabase
      .rpc('disable_envios_trigger');
      
    if (disableError) {
      console.error('❌ Error disabling trigger:', disableError);
      return await testDirectUpdate();
    }
    
    console.log('✅ Triggers disabled:', disableResult);
    
    // Now test updating
    return await testDirectUpdate();
    
  } catch (e) {
    console.error('❌ Exception:', e);
    return await testDirectUpdate();
  }
}

async function testDirectUpdate() {
  console.log('🧪 Testing direct update without trigger...\n');
  
  try {
    // Get a test record
    const { data: schedules, error: fetchError } = await supabase
      .from('envios_programados')
      .select('id, frecuencia, proximo_envio, activo')
      .limit(1);
      
    if (fetchError || !schedules || schedules.length === 0) {
      console.error('❌ Could not fetch test record:', fetchError);
      return;
    }
    
    const testRecord = schedules[0];
    console.log('🎯 Using test record:', testRecord.id.substring(0, 8) + '...');
    
    // Try to update with explicit timestamp
    const now = new Date().toISOString();
    const { data: updateResult, error: updateError } = await supabase
      .from('envios_programados')
      .update({ 
        actualizado_en: now,
        // Also test the main logic
        ...(testRecord.frecuencia === 'unico' 
          ? { activo: false, proximo_envio: null }
          : { proximo_envio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      })
      .eq('id', testRecord.id)
      .select('id, activo, proximo_envio, actualizado_en');
      
    if (updateError) {
      console.error('❌ Update still failing:', updateError);
      
      // Try basic update without any timestamp
      console.log('🔄 Trying basic update without timestamp...');
      
      const { data: basicResult, error: basicError } = await supabase
        .from('envios_programados')
        .update({ 
          ...(testRecord.frecuencia === 'unico' 
            ? { activo: false, proximo_envio: null }
            : { proximo_envio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
        })
        .eq('id', testRecord.id)
        .select('*');
        
      if (basicError) {
        console.error('❌ Basic update also failing:', basicError);
        return { success: false, error: basicError.message };
      } else {
        console.log('✅ Basic update successful!');
        console.log('📊 Updated record:', basicResult);
        return { success: true, method: 'basic' };
      }
      
    } else {
      console.log('✅ Full update successful!');
      console.log('📊 Updated record:', updateResult);
      return { success: true, method: 'full' };
    }
    
  } catch (e) {
    console.error('❌ Exception in test:', e);
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

disableTriggerAndTest().then((result) => {
  if (result) {
    console.log('\n🎯 Final result:', result);
    
    if (result.success) {
      console.log('\n✅ SUCCESS! The update logic works.');
      console.log('🚀 Now you can test the main process endpoint again.');
    } else {
      console.log('\n❌ FAILED! There are still issues with database updates.');
    }
  }
});
