/**
 * Script para verificar que el saludo personalizado aparece correctamente
 * al inicializar el chat de supervisión
 */

const PATIENT_ID = '2385677e-cf3e-45e3-8d28-9100afa90a3a'; // Pedro Subiria

async function testPersonalizedGreeting() {
  console.log('🧪 VERIFICANDO SALUDO PERSONALIZADO EN SUPERVISIÓN CLÍNICA');
  console.log('=' .repeat(70));
  console.log(`👤 Paciente ID: ${PATIENT_ID}`);

  try {
    console.log('\n📞 Llamando al endpoint de inicialización...');
    
    const response = await fetch(`http://localhost:3000/api/patients/${PATIENT_ID}/supervision/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.log(`❌ Error HTTP: ${response.status}`);
      const errorData = await response.text();
      console.log('📄 Respuesta:', errorData);
      return;
    }

    const data = await response.json();
    
    console.log('✅ Endpoint de inicialización respondió correctamente');
    console.log('\n📋 DATOS DE RESPUESTA:');
    console.log('---');
    console.log(`🆔 Session ID: ${data.sessionId}`);
    console.log(`⏰ Timestamp: ${data.timestamp}`);
    console.log(`👤 Patient ID: ${data.patientId}`);
    console.log('\n💬 MENSAJE INICIAL:');
    console.log('---');
    console.log(`"${data.initialMessage}"`);
    console.log('---');

    // Verificaciones específicas
    console.log('\n🔍 VERIFICACIONES:');
    
    // 1. Verificar que incluye "Hola"
    if (data.initialMessage.includes('Hola')) {
      console.log('✅ Incluye saludo "Hola"');
    } else {
      console.log('❌ No incluye saludo "Hola"');
    }

    // 2. Verificar que incluye nombre del profesional (Dr./Dra.)
    if (data.initialMessage.includes('Dr.') || data.initialMessage.includes('Dra.')) {
      console.log('✅ Incluye título profesional (Dr./Dra.)');
    } else {
      console.log('❌ No incluye título profesional');
    }

    // 3. Verificar que incluye nombre del paciente
    if (data.initialMessage.includes('Pedro')) {
      console.log('✅ Incluye nombre del paciente (Pedro)');
    } else {
      console.log('❌ No incluye nombre del paciente');
    }

    // 4. Verificar formato según prompt v12
    if (data.initialMessage.includes('he leído toda la información')) {
      console.log('✅ Formato correcto según prompt v12');
    } else {
      console.log('❌ Formato no coincide con prompt v12');
    }

    // 5. Verificar pregunta final
    if (data.initialMessage.includes('¿Qué te interesa explorar')) {
      console.log('✅ Incluye pregunta de exploración');
    } else {
      console.log('❌ No incluye pregunta de exploración');
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎯 RESULTADO:');
    
    if (data.initialMessage.includes('Hola') && 
        data.initialMessage.includes('Dr') && 
        data.initialMessage.includes('Pedro') &&
        data.initialMessage.includes('he leído')) {
      console.log('✅ SALUDO PERSONALIZADO FUNCIONANDO CORRECTAMENTE');
      console.log('🚀 El problema del placeholder ha sido solucionado');
    } else {
      console.log('❌ SALUDO PERSONALIZADO NECESITA AJUSTES');
      console.log('⚠️  El problema del placeholder persiste');
    }

  } catch (error) {
    console.log('❌ Error ejecutando prueba:', error.message);
  }
}

testPersonalizedGreeting().catch(console.error);
