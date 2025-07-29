#!/usr/bin/env node

/**
 * VERIFICACIÓN COMPLETA: Acceso a todos los datos requeridos
 */

async function verifyCompleteDataAccess() {
  console.log('🔍 VERIFICACIÓN COMPLETA: Acceso a todos los datos');
  console.log('=' .repeat(70));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    // Cargar variables de entorno
    require('dotenv').config({ path: '.env.local' });
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('\n📊 VERIFICACIÓN 1: Entrevista inicial estructurada');
    
    const { data: intakeData, error: intakeError } = await supabase
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', testPatientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (intakeData && intakeData.length > 0) {
      const intake = intakeData[0];
      console.log('✅ Entrevista inicial encontrada');
      console.log('   📋 Estado:', intake.estado);
      console.log('   📅 Fecha:', intake.fecha_inicio);
      console.log('   📊 Campos de datos:', Object.keys(intake.datos || {}).length);
      
      // Verificar campos específicos importantes
      const datos = intake.datos || {};
      const camposImportantes = [
        'nombrePaciente', 'edad', 'sexo', 'motivoConsulta', 
        'diagnosticoTexto', 'antecedentesSM', 'grupoFamiliar'
      ];
      
      console.log('\n   📝 CAMPOS IMPORTANTES:');
      camposImportantes.forEach(campo => {
        const valor = datos[campo];
        const disponible = valor !== undefined && valor !== null && valor !== '';
        console.log(`      ${disponible ? '✅' : '❌'} ${campo}: ${disponible ? 'Disponible' : 'Faltante'}`);
      });
    } else {
      console.log('❌ No se encontró entrevista inicial');
    }

    console.log('\n📊 VERIFICACIÓN 2: Evolución clínica');
    
    const { data: evolutionData, error: evolutionError } = await supabase
      .from('evolucion_clinica')
      .select('*')
      .eq('paciente_id', testPatientId)
      .order('created_at', { ascending: false });

    if (evolutionData && evolutionData.length > 0) {
      console.log(`✅ ${evolutionData.length} entradas de evolución encontradas`);
      evolutionData.forEach((entry, index) => {
        console.log(`   📝 Entrada ${index + 1}:`);
        console.log(`      Tipo: ${entry.entry_type}`);
        console.log(`      Fecha: ${entry.created_at}`);
        console.log(`      Contenido: ${entry.content?.substring(0, 100)}...`);
        console.log(`      Tags: ${entry.tags?.join(', ') || 'N/A'}`);
      });
    } else {
      console.log('❌ No se encontraron entradas de evolución clínica');
    }

    console.log('\n📊 VERIFICACIÓN 3: Cuestionarios completos');
    
    const { data: responses, error: responsesError } = await supabase
      .from('respuestas')
      .select(`
        *,
        cuestionarios!inner(codigo, titulo, items, descripcion)
      `)
      .eq('paciente_id', testPatientId)
      .order('creado_en', { ascending: false });

    if (responses && responses.length > 0) {
      console.log(`✅ ${responses.length} cuestionarios encontrados`);
      
      // Agrupar por tipo
      const tiposCuestionarios = {};
      responses.forEach(response => {
        const codigo = response.cuestionarios.codigo;
        if (!tiposCuestionarios[codigo]) {
          tiposCuestionarios[codigo] = [];
        }
        tiposCuestionarios[codigo].push(response);
      });

      Object.entries(tiposCuestionarios).forEach(([codigo, cuestionarios]) => {
        console.log(`\n   📋 ${codigo}: ${cuestionarios.length} cuestionarios`);
        
        cuestionarios.forEach((cuestionario, index) => {
          console.log(`      📊 Cuestionario ${index + 1}:`);
          console.log(`         Fecha: ${cuestionario.creado_en}`);
          console.log(`         Puntuación: ${cuestionario.puntuacion}`);
          console.log(`         Respuestas: ${Object.keys(cuestionario.respuestas || {}).length} ítems`);
          console.log(`         Score detallado: ${cuestionario.score_detallado ? 'SÍ' : 'NO'}`);
          console.log(`         Ítems disponibles: ${cuestionario.cuestionarios.items?.items?.length || 0}`);
          
          // Para OPD-CA2-SQ, verificar acceso a preguntas específicas
          if (codigo === 'OPD-CA2-SQ' && cuestionario.cuestionarios.items?.items) {
            const items = cuestionario.cuestionarios.items.items;
            console.log(`         ✅ Pregunta ítem 1: ${items[0]?.text?.substring(0, 50)}...`);
            console.log(`         ✅ Pregunta ítem 81: ${items[80]?.text?.substring(0, 50)}...`);
          }
        });
      });
    } else {
      console.log('❌ No se encontraron cuestionarios');
    }

    console.log('\n📊 VERIFICACIÓN 4: Usuario/Psicólogo');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (users && users.length > 0) {
      console.log(`✅ ${users.length} usuarios encontrados en la base de datos`);
      users.forEach((user, index) => {
        console.log(`   👤 Usuario ${index + 1}:`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Nombre: ${user.first_name} ${user.last_name}`);
        console.log(`      Rol: ${user.role}`);
        console.log(`      Activo: ${user.is_active}`);
      });
    } else {
      console.log('❌ No se encontraron usuarios');
    }

    console.log('\n🎯 RESUMEN DE VERIFICACIÓN:');
    console.log('─'.repeat(50));
    
    const verificaciones = {
      'Entrevista inicial': !!(intakeData && intakeData.length > 0),
      'Evolución clínica': !!(evolutionData && evolutionData.length > 0),
      'Cuestionarios completos': !!(responses && responses.length > 0),
      'Usuarios en BD': !!(users && users.length > 0),
      'OPD-CA2-SQ con ítems': !!(responses?.some(r => 
        r.cuestionarios.codigo === 'OPD-CA2-SQ' && 
        r.cuestionarios.items?.items?.length > 0
      ))
    };

    Object.entries(verificaciones).forEach(([item, disponible]) => {
      console.log(`   ${disponible ? '✅' : '❌'} ${item}`);
    });

    const totalDisponible = Object.values(verificaciones).filter(Boolean).length;
    const totalItems = Object.keys(verificaciones).length;
    
    console.log(`\n📊 PUNTUACIÓN FINAL: ${totalDisponible}/${totalItems} (${Math.round(totalDisponible/totalItems*100)}%)`);

    if (totalDisponible === totalItems) {
      console.log('\n🎉 ¡TODOS LOS DATOS ESTÁN DISPONIBLES!');
      console.log('El sistema tiene acceso completo a toda la información requerida.');
    } else {
      console.log('\n⚠️ Algunos datos faltan o no están disponibles.');
    }

  } catch (error) {
    console.error('\n❌ ERROR en verificación:', error.message);
  }
}

verifyCompleteDataAccess();
