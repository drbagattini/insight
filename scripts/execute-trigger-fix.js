import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

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

async function executeTriggerFix() {
  console.log('🔧 Aplicando corrección del trigger...\n');
  
  try {
    // Leer el script SQL
    const sqlScript = readFileSync(resolve(__dirname, 'fix-envios-programados-trigger.sql'), 'utf-8');
    
    console.log('📜 SQL Script to execute:');
    console.log(sqlScript);
    console.log('\n🚀 Executing...\n');
    
    // Ejecutar el script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_command: sqlScript });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      
      // Intentar ejecutar línea por línea
      console.log('\n🔄 Trying to execute commands individually...\n');
      
      const commands = sqlScript
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (command.length > 0) {
          console.log(`Executing command ${i + 1}/${commands.length}:`);
          console.log(command.substring(0, 60) + '...');
          
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql_command: command });
          
          if (cmdError) {
            console.error(`❌ Error in command ${i + 1}:`, cmdError);
          } else {
            console.log(`✅ Command ${i + 1} executed successfully`);
          }
        }
      }
    } else {
      console.log('✅ Script ejecutado exitosamente:', data);
    }
    
    // Probar que el trigger funcione
    console.log('\n🧪 Testing trigger...\n');
    
    const testResult = await testTrigger();
    
    if (testResult.success) {
      console.log('✅ Trigger funcionando correctamente');
    } else {
      console.error('❌ Trigger aún tiene problemas:', testResult.error);
    }
    
  } catch (e) {
    console.error('❌ Error general:', e);
  }
}

async function testTrigger() {
  try {
    // Intentar actualizar un registro existente
    const { data: schedules } = await supabase
      .from('envios_programados')
      .select('id')
      .limit(1);
      
    if (!schedules || schedules.length === 0) {
      return { success: false, error: 'No records to test' };
    }
    
    const testId = schedules[0].id;
    
    // Intentar actualización
    const { error: updateError } = await supabase
      .from('envios_programados')
      .update({ actualizado_en: new Date().toISOString() })
      .eq('id', testId);
      
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    return { success: true };
    
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) };
  }
}

executeTriggerFix();
