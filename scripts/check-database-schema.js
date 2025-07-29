require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 VERIFICANDO ESQUEMA DE BASE DE DATOS');
  console.log('============================================================\n');

  try {
    // 1. VERIFICAR TABLAS DISPONIBLES
    console.log('1️⃣ VERIFICANDO TABLAS DISPONIBLES...');
    
    // Intentar diferentes nombres de tabla
    const tablesToCheck = ['patients', 'pacientes', 'resultados_cuestionarios', 'cuestionarios'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: ${data?.length || 0} registros encontrados`);
          if (data && data.length > 0) {
            console.log(`      📋 Columnas: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`   ❌ ${table}: ${err.message}`);
      }
    }

    // 2. VERIFICAR PACIENTE ESPECÍFICO
    console.log('\n2️⃣ VERIFICANDO PACIENTE ESPECÍFICO...');
    const patientId = '20856aa1-f69f-414a-943a-17989809e12b';
    
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();
    
    if (patientError) {
      console.log(`   ❌ Error cargando paciente: ${patientError.message}`);
    } else {
      console.log(`   ✅ Paciente encontrado: ${patientData.name}`);
      console.log(`   📋 Datos: ${JSON.stringify(patientData, null, 2)}`);
    }

    // 3. VERIFICAR CUESTIONARIOS
    console.log('\n3️⃣ VERIFICANDO CUESTIONARIOS...');
    
    // Probar diferentes queries para cuestionarios
    const questionnaireQueries = [
      // Query original
      {
        name: 'Con relación cuestionarios',
        query: () => supabase
          .from('resultados_cuestionarios')
          .select(`*, cuestionarios(codigo, titulo)`)
          .eq('paciente_id', patientId)
      },
      // Query sin relación
      {
        name: 'Sin relación',
        query: () => supabase
          .from('resultados_cuestionarios')
          .select('*')
          .eq('paciente_id', patientId)
      },
      // Query con patient_id
      {
        name: 'Con patient_id',
        query: () => supabase
          .from('resultados_cuestionarios')
          .select('*')
          .eq('patient_id', patientId)
      }
    ];

    for (const { name, query } of questionnaireQueries) {
      try {
        const { data, error } = await query();
        if (error) {
          console.log(`   ❌ ${name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${name}: ${data?.length || 0} registros`);
          if (data && data.length > 0) {
            console.log(`      📋 Primer registro: ${JSON.stringify(data[0], null, 2)}`);
          }
        }
      } catch (err) {
        console.log(`   ❌ ${name}: ${err.message}`);
      }
    }

    // 4. VERIFICAR EVOLUCIONES
    console.log('\n4️⃣ VERIFICANDO EVOLUCIONES CLÍNICAS...');
    
    const evolutionQueries = [
      {
        name: 'Con paciente_id',
        query: () => supabase
          .from('evolucion_clinica')
          .select('*')
          .eq('paciente_id', patientId)
      },
      {
        name: 'Con patient_id',
        query: () => supabase
          .from('evolucion_clinica')
          .select('*')
          .eq('patient_id', patientId)
      }
    ];

    for (const { name, query } of evolutionQueries) {
      try {
        const { data, error } = await query();
        if (error) {
          console.log(`   ❌ ${name}: ${error.message}`);
        } else {
          console.log(`   ✅ ${name}: ${data?.length || 0} registros`);
          if (data && data.length > 0) {
            console.log(`      📋 Primer registro: ${JSON.stringify(data[0], null, 2)}`);
          }
        }
      } catch (err) {
        console.log(`   ❌ ${name}: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
  }
}

checkDatabaseSchema();
