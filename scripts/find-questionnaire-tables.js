require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findQuestionnaireTables() {
  console.log('🔍 BUSCANDO TABLAS DE CUESTIONARIOS');
  console.log('============================================================\n');

  // Posibles nombres de tablas relacionadas con cuestionarios
  const possibleTables = [
    'cuestionarios',
    'questionnaires', 
    'resultados_cuestionarios',
    'questionnaire_results',
    'respuestas_cuestionarios',
    'questionnaire_responses',
    'patient_questionnaires',
    'cuestionario_respuestas',
    'responses',
    'answers',
    'respuestas',
    'evaluaciones',
    'evaluations',
    'assessments',
    'forms',
    'formularios'
  ];

  console.log('1️⃣ PROBANDO NOMBRES POSIBLES DE TABLAS...');
  const existingTables = [];

  for (const table of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
        console.log(`   ✅ ${table}: EXISTE (${data?.length || 0} registros)`);
        if (data && data.length > 0) {
          console.log(`      📋 Columnas: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err) {
      // Tabla no existe, continuar
    }
  }

  if (existingTables.length === 0) {
    console.log('   ❌ No se encontraron tablas de cuestionarios');
    return;
  }

  console.log(`\n2️⃣ ANALIZANDO TABLAS ENCONTRADAS (${existingTables.length})...`);
  
  for (const table of existingTables) {
    console.log(`\n📊 TABLA: ${table}`);
    console.log('─'.repeat(50));
    
    try {
      // Obtener algunos registros para ver la estructura
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(3);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        continue;
      }

      console.log(`   📈 Total registros: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log(`   📋 Estructura del primer registro:`);
        console.log(JSON.stringify(data[0], null, 4));
        
        // Buscar campos que puedan relacionarse con pacientes
        const patientFields = Object.keys(data[0]).filter(key => 
          key.includes('patient') || 
          key.includes('paciente') || 
          key.includes('user') || 
          key.includes('usuario')
        );
        
        if (patientFields.length > 0) {
          console.log(`   🔗 Campos de relación con pacientes: ${patientFields.join(', ')}`);
        }
      }
      
    } catch (err) {
      console.log(`   ❌ Error analizando tabla: ${err.message}`);
    }
  }

  // 3. BUSCAR DATOS ESPECÍFICOS DEL PACIENTE DE PRUEBA
  console.log('\n3️⃣ BUSCANDO DATOS DEL PACIENTE DE PRUEBA...');
  const patientId = '20856aa1-f69f-414a-943a-17989809e12b';
  
  for (const table of existingTables) {
    console.log(`\n🔍 Buscando en ${table}:`);
    
    // Probar diferentes campos de relación
    const fieldsToTry = ['patient_id', 'paciente_id', 'user_id', 'usuario_id', 'id'];
    
    for (const field of fieldsToTry) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq(field, patientId)
          .limit(5);
        
        if (!error && data && data.length > 0) {
          console.log(`   ✅ Encontrado con ${field}: ${data.length} registros`);
          console.log(`      📋 Primer registro: ${JSON.stringify(data[0], null, 2)}`);
          break;
        }
      } catch (err) {
        // Campo no existe, continuar
      }
    }
  }
}

findQuestionnaireTables();
