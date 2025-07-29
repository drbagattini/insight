require('dotenv').config({ path: '.env.local' });

/**
 * TEST DE SUPERVISIÓN CON AUTENTICACIÓN REAL
 * 
 * Este script simula una llamada autenticada al endpoint de supervisión
 * Para probarlo necesitas:
 * 1. Estar logueado en la aplicación web
 * 2. Copiar las cookies de tu navegador
 * 3. Pegarlas en la variable COOKIES abajo
 */

const COOKIES = `
// INSTRUCCIONES PARA OBTENER COOKIES:
// 1. Abre tu navegador y ve a http://localhost:3000
// 2. Loguéate en la aplicación
// 3. Abre DevTools (F12) > Network
// 4. Haz cualquier request a la app
// 5. Copia el header "Cookie" completo
// 6. Pégalo aquí reemplazando este comentario
`;

async function testSupervisionWithAuth() {
  console.log('🧪 INICIANDO TEST DE SUPERVISIÓN CON AUTENTICACIÓN');
  console.log('============================================================\n');

  // Verificar que las cookies estén configuradas
  if (COOKIES.includes('INSTRUCCIONES') || COOKIES.trim().length < 50) {
    console.log('❌ ERROR: Necesitas configurar las cookies primero');
    console.log('\n📋 INSTRUCCIONES:');
    console.log('1. Abre http://localhost:3000 en tu navegador');
    console.log('2. Loguéate en la aplicación');
    console.log('3. Abre DevTools (F12) > Network');
    console.log('4. Haz cualquier request');
    console.log('5. Copia el header "Cookie" completo');
    console.log('6. Pégalo en la variable COOKIES de este script');
    console.log('\n💡 Ejemplo de cookie:');
    console.log('next-auth.session-token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...');
    return;
  }

  try {
    // 1. BUSCAR PACIENTE DE PRUEBA
    console.log('1️⃣ BUSCANDO PACIENTE DE PRUEBA...');
    const testPatientResponse = await fetch('http://localhost:3000/api/test-supervision-direct');
    const testData = await testPatientResponse.json();
    
    if (!testData.success) {
      console.log('❌ Error buscando paciente:', testData.error);
      return;
    }
    
    const patientId = testData.patient_info.id;
    console.log(`✓ Paciente encontrado: ${testData.patient_info.name} (${patientId})`);

    // 2. PROBAR INICIALIZACIÓN CON AUTENTICACIÓN
    console.log('\n2️⃣ PROBANDO INICIALIZACIÓN CON AUTH...');
    const initStartTime = Date.now();
    
    const initResponse = await fetch(`http://localhost:3000/api/patients/${patientId}/supervision/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': COOKIES.trim()
      }
    });
    
    const initTime = Date.now() - initStartTime;
    console.log(`   ⏱️ Tiempo de inicialización: ${initTime}ms`);
    console.log(`   📊 Status: ${initResponse.status} ${initResponse.statusText}`);
    
    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.log(`   ❌ Error de inicialización: ${errorText}`);
      return;
    }
    
    const initData = await initResponse.json();
    console.log(`   ✓ Inicialización exitosa`);
    console.log(`   💬 Saludo: ${initData.message.substring(0, 100)}...`);

    // 3. PROBAR CHAT CON AUTENTICACIÓN
    console.log('\n3️⃣ PROBANDO CHAT CON AUTH...');
    const chatStartTime = Date.now();
    
    const chatResponse = await fetch(`http://localhost:3000/api/patients/${patientId}/supervision/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': COOKIES.trim()
      },
      body: JSON.stringify({
        message: "Hola, me gustaría explorar la contratransferencia con este paciente. ¿Qué aspectos debería considerar?"
      })
    });
    
    const chatTime = Date.now() - chatStartTime;
    console.log(`   ⏱️ Tiempo de chat: ${chatTime}ms`);
    console.log(`   📊 Status: ${chatResponse.status} ${chatResponse.statusText}`);
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.log(`   ❌ Error de chat: ${errorText}`);
      return;
    }
    
    const chatData = await chatResponse.json();
    console.log(`   ✓ Chat exitoso`);
    console.log(`   💬 Respuesta: ${chatData.message.substring(0, 200)}...`);
    console.log(`   📏 Longitud completa: ${chatData.message.length} caracteres`);

    // 4. RESUMEN DE RESULTADOS
    console.log('\n🎉 RESUMEN DE RESULTADOS:');
    console.log('============================================================');
    console.log(`✅ Autenticación: FUNCIONANDO`);
    console.log(`✅ Inicialización: ${initTime}ms`);
    console.log(`✅ Chat: ${chatTime}ms`);
    console.log(`✅ Respuesta AI: ${chatData.message.length} caracteres`);
    console.log(`✅ Total: ${initTime + chatTime}ms`);
    
    console.log('\n🔧 DIAGNÓSTICO:');
    if (initTime < 1000) console.log('✅ Inicialización rápida');
    else console.log('⚠️ Inicialización lenta');
    
    if (chatTime < 5000) console.log('✅ Chat rápido');
    else console.log('⚠️ Chat lento');
    
    if (chatData.message.length > 500) console.log('✅ Respuesta completa');
    else console.log('⚠️ Respuesta corta');

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error.message);
  }
}

// Ejecutar test
testSupervisionWithAuth();
