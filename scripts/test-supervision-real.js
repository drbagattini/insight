/**
 * TEST REAL DEL ENDPOINT DE SUPERVISIÓN CLÍNICA
 * 
 * Simula una llamada real al endpoint para identificar el problema específico
 */

require('dotenv').config({ path: '.env.local' });

async function testSupervisionEndpoint() {
  console.log('🧪 INICIANDO TEST REAL DE SUPERVISIÓN CLÍNICA');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  const patientId = "20856aa1-f69f-414a-943a-17989809e12b"; // ID encontrado en diagnóstico

  try {
    // 1. PROBAR ENDPOINT DE INICIALIZACIÓN
    console.log('\n1️⃣ PROBANDO ENDPOINT DE INICIALIZACIÓN...');
    const initStartTime = Date.now();
    
    const initResponse = await fetch(`http://localhost:3000/api/patients/${patientId}/supervision/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const initTime = Date.now() - initStartTime;
    console.log(`   ✓ Tiempo de inicialización: ${initTime}ms`);
    console.log(`   ✓ Status: ${initResponse.status} ${initResponse.statusText}`);

    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log(`   ✓ Mensaje inicial: "${initData.message?.substring(0, 100)}..."`);
    } else {
      const errorText = await initResponse.text();
      console.log(`   ❌ Error de inicialización: ${errorText}`);
      return;
    }

    // 2. PROBAR ENDPOINT DE CHAT
    console.log('\n2️⃣ PROBANDO ENDPOINT DE CHAT...');
    const chatStartTime = Date.now();
    
    const testMessage = "Hola, me gustaría explorar la contratransferencia con este paciente";
    
    console.log(`   📤 Enviando mensaje: "${testMessage}"`);
    
    const chatResponse = await fetch(`http://localhost:3000/api/patients/${patientId}/supervision/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        conversationHistory: []
      })
    });

    const chatTime = Date.now() - chatStartTime;
    console.log(`   ✓ Tiempo total de chat: ${chatTime}ms`);
    console.log(`   ✓ Status: ${chatResponse.status} ${chatResponse.statusText}`);

    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log(`   ✓ Respuesta recibida: ${!!chatData.response}`);
      console.log(`   ✓ Longitud de respuesta: ${chatData.response?.length || 0} caracteres`);
      console.log(`   ✓ Performance data:`, chatData.performance);
      
      if (chatData.response) {
        console.log(`   📝 Respuesta (primeros 200 chars): "${chatData.response.substring(0, 200)}..."`);
      } else {
        console.log(`   ❌ PROBLEMA: Respuesta vacía`);
        console.log(`   📄 Datos completos:`, JSON.stringify(chatData, null, 2));
      }
    } else {
      const errorText = await chatResponse.text();
      console.log(`   ❌ Error de chat: ${errorText}`);
      
      // Intentar parsear como JSON para más detalles
      try {
        const errorData = JSON.parse(errorText);
        console.log(`   📄 Error detallado:`, JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log(`   📄 Error raw: ${errorText}`);
      }
    }

    // 3. ANÁLISIS DE PERFORMANCE
    console.log('\n3️⃣ ANÁLISIS DE PERFORMANCE...');
    const totalTime = Date.now() - startTime;
    
    console.log(`   ⏱️  Tiempo total del test: ${totalTime}ms`);
    console.log(`   ⏱️  Tiempo de inicialización: ${initTime}ms`);
    console.log(`   ⏱️  Tiempo de chat: ${chatTime}ms`);
    
    // Identificar problemas
    const issues = [];
    
    if (initTime > 2000) {
      issues.push(`🐌 Inicialización muy lenta: ${initTime}ms`);
    }
    
    if (chatTime > 10000) {
      issues.push(`🐌 Chat extremadamente lento: ${chatTime}ms`);
    } else if (chatTime > 5000) {
      issues.push(`⚠️ Chat lento: ${chatTime}ms`);
    }
    
    if (issues.length > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('\n✅ No se detectaron problemas de performance obvios');
    }

  } catch (error) {
    console.error('❌ Error durante test:', error.message);
    console.error(error.stack);
  }
  
  console.log('\n🧪 Test real finalizado');
}

// Ejecutar test
testSupervisionEndpoint().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
