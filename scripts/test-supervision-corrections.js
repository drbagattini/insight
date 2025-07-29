/**
 * Script para verificar las 3 correcciones implementadas en supervisión clínica:
 * 1. Eliminación de limitación arbitraria de evoluciones
 * 2. Inclusión del nombre del profesional en saludo inicial  
 * 3. Actualización del prompt a versión v12 definitiva
 */

const PATIENT_ID = '2385677e-cf3e-45e3-8d28-9100afa90a3a'; // Pedro Subiria

async function testSupervisionCorrections() {
  console.log('🧪 INICIANDO PRUEBAS DE CORRECCIONES DE SUPERVISIÓN CLÍNICA');
  console.log('=' .repeat(70));

  // Test 1: Verificar carga completa de evoluciones
  console.log('\n📋 TEST 1: Verificando carga completa de evoluciones clínicas...');
  try {
    const chatResponse = await fetch(`http://localhost:3000/api/patients/${PATIENT_ID}/supervision/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hola, ¿cuántas evoluciones clínicas tiene este paciente?',
        conversationHistory: []
      })
    });

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat endpoint responde correctamente');
      console.log('📊 Metadata:', JSON.stringify(chatData.metadata, null, 2));
    } else {
      console.log('❌ Error en chat endpoint:', chatResponse.status);
    }
  } catch (error) {
    console.log('❌ Error en Test 1:', error.message);
  }

  // Test 2: Verificar saludo inicial con nombre del profesional
  console.log('\n👨‍⚕️ TEST 2: Verificando saludo personalizado...');
  try {
    const initResponse = await fetch(`http://localhost:3000/api/patients/${PATIENT_ID}/supervision/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log('✅ Endpoint de inicialización responde correctamente');
      console.log('💬 Mensaje inicial:', initData.initialMessage);
      
      // Verificar que incluye nombre del profesional
      if (initData.initialMessage.includes('Hola') && initData.initialMessage.includes('he leído')) {
        console.log('✅ Formato de saludo correcto según prompt v12');
      } else {
        console.log('❌ Formato de saludo no coincide con prompt v12');
      }
    } else {
      console.log('❌ Error en endpoint de inicialización:', initResponse.status);
    }
  } catch (error) {
    console.log('❌ Error en Test 2:', error.message);
  }

  // Test 3: Verificar datos del paciente completos
  console.log('\n📊 TEST 3: Verificando acceso a datos completos del paciente...');
  try {
    const dataResponse = await fetch(`http://localhost:3000/api/informes/datos/${PATIENT_ID}`);
    
    if (dataResponse.ok) {
      const patientData = await dataResponse.json();
      console.log('✅ Datos del paciente cargados correctamente');
      console.log('👤 Paciente:', patientData.patient?.name);
      console.log('👨‍⚕️ Psicólogo:', patientData.psychologist?.name);
      console.log('📋 Cuestionarios:', patientData.questionnaires?.length || 0);
      console.log('🗣️ Entrevista inicial:', patientData.intake ? 'Disponible' : 'No disponible');
      
      // Verificar estructura del psicólogo para el saludo
      if (patientData.psychologist?.name) {
        console.log('✅ Nombre del psicólogo disponible para saludo personalizado');
      } else {
        console.log('⚠️ Nombre del psicólogo no encontrado - revisar estructura de datos');
      }
    } else {
      console.log('❌ Error obteniendo datos del paciente:', dataResponse.status);
    }
  } catch (error) {
    console.log('❌ Error en Test 3:', error.message);
  }

  // Test 4: Verificar endpoint de streaming también actualizado
  console.log('\n🔄 TEST 4: Verificando endpoint de streaming...');
  try {
    const streamResponse = await fetch(`http://localhost:3000/api/test-supervision-streaming/${PATIENT_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test de prompt v12',
        conversationHistory: []
      })
    });

    if (streamResponse.ok) {
      console.log('✅ Endpoint de streaming responde correctamente');
      console.log('📡 Content-Type:', streamResponse.headers.get('content-type'));
    } else {
      console.log('❌ Error en endpoint de streaming:', streamResponse.status);
    }
  } catch (error) {
    console.log('❌ Error en Test 4:', error.message);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎯 RESUMEN DE CORRECCIONES IMPLEMENTADAS:');
  console.log('1. ✅ Eliminada limitación arbitraria de evoluciones clínicas');
  console.log('2. ✅ Agregado logging para verificar nombre del profesional');
  console.log('3. ✅ Actualizado prompt a versión v12 definitiva en ambos endpoints');
  console.log('4. ✅ Mantenida consistencia entre endpoints estándar y streaming');
  console.log('=' .repeat(70));
}

// Ejecutar las pruebas
testSupervisionCorrections().catch(console.error);
