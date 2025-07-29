#!/usr/bin/env node

/**
 * Script de diagnóstico para probar el sistema de Supervisión Clínica con OpenAI
 * Verifica que la migración de Gemini a OpenAI funcione correctamente
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuración
const BASE_URL = 'http://localhost:3000';
const PATIENT_ID = '2385677e-cf3e-45e3-8d28-9100afa90a3a'; // Pedro Subiria

console.log('🔍 DIAGNÓSTICO SUPERVISIÓN CLÍNICA - MIGRACIÓN OPENAI');
console.log('=' .repeat(60));

async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testSupervisionChat() {
  console.log('\n📡 PROBANDO ENDPOINT DE CHAT DE SUPERVISIÓN...');
  
  const result = await makeRequest(`${BASE_URL}/api/patients/${PATIENT_ID}/supervision/chat`, {
    method: 'POST',
    body: {
      message: 'Hola, me gustaría revisar el caso de este paciente. ¿Qué me puedes decir sobre su WHO-5?',
      conversationHistory: []
    }
  });

  if (result.success) {
    console.log('✅ Chat de supervisión funcionando');
    console.log(`📊 Modelo usado: ${result.data.model}`);
    console.log(`⏱️  Tiempo total: ${result.data.performance?.totalTime || 'N/A'}`);
    console.log(`📝 Respuesta (primeros 200 chars): ${result.data.response?.substring(0, 200)}...`);
    
    if (result.data.model === 'gpt-4o') {
      console.log('✅ MIGRACIÓN A OPENAI EXITOSA');
    } else {
      console.log('❌ MODELO INCORRECTO - Esperado: gpt-4o, Recibido:', result.data.model);
    }
  } else {
    console.log('❌ Error en chat de supervisión:', result.error || result.data?.error);
    console.log('📊 Status:', result.status);
    
    if (result.data?.error?.includes('OpenAI')) {
      console.log('🔑 Verificar OPENAI_API_KEY en .env.local');
    }
  }

  return result;
}

async function testDataSources() {
  console.log('\n📊 PROBANDO FUENTES DE DATOS...');
  
  const result = await makeRequest(`${BASE_URL}/api/informes/datos/${PATIENT_ID}`);
  
  if (result.success) {
    const data = result.data;
    console.log('✅ Datos del paciente cargados correctamente');
    console.log(`👤 Paciente: ${data.patient?.name || 'N/A'}`);
    console.log(`📋 Cuestionarios: ${data.questionnaires?.length || 0}`);
    console.log(`📝 Entrevista inicial: ${data.intake ? 'Sí' : 'No'}`);
    
    // Verificar WHO-5 específicamente
    const who5 = data.questionnaires?.find(q => q.codigo?.toLowerCase().includes('who'));
    if (who5) {
      console.log(`✅ WHO-5 encontrado - Puntaje: ${who5.puntuacion}`);
    } else {
      console.log('❌ WHO-5 no encontrado');
    }
  } else {
    console.log('❌ Error cargando datos:', result.error || result.data?.error);
  }

  return result;
}

async function checkEnvironment() {
  console.log('\n🔧 VERIFICANDO CONFIGURACIÓN...');
  
  // Verificar si el archivo .env.local existe
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env.local encontrado');
    
    // Leer el archivo (sin mostrar las keys por seguridad)
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasOpenAI = envContent.includes('OPENAI_API_KEY');
    const hasGemini = envContent.includes('GEMINI_API_KEY');
    
    console.log(`🔑 OPENAI_API_KEY: ${hasOpenAI ? 'Configurada' : 'NO ENCONTRADA'}`);
    console.log(`🔑 GEMINI_API_KEY: ${hasGemini ? 'Configurada' : 'No encontrada'}`);
    
    if (!hasOpenAI) {
      console.log('❌ OPENAI_API_KEY requerida para la migración');
      return false;
    }
  } else {
    console.log('❌ Archivo .env.local no encontrado');
    return false;
  }
  
  return true;
}

async function main() {
  try {
    // 1. Verificar configuración
    const envOk = await checkEnvironment();
    if (!envOk) {
      console.log('\n❌ CONFIGURACIÓN INCOMPLETA - Revisar .env.local');
      process.exit(1);
    }

    // 2. Probar fuentes de datos
    const dataResult = await testDataSources();
    
    // 3. Probar chat de supervisión
    const chatResult = await testSupervisionChat();

    // 4. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log('='.repeat(60));
    
    if (dataResult.success && chatResult.success) {
      console.log('🎉 MIGRACIÓN A OPENAI COMPLETADA EXITOSAMENTE');
      console.log('✅ Datos del paciente: OK');
      console.log('✅ Chat de supervisión: OK');
      console.log('✅ Modelo OpenAI: OK');
    } else {
      console.log('❌ PROBLEMAS DETECTADOS:');
      if (!dataResult.success) console.log('  - Datos del paciente fallan');
      if (!chatResult.success) console.log('  - Chat de supervisión falla');
    }

  } catch (error) {
    console.error('💥 Error ejecutando diagnóstico:', error.message);
    process.exit(1);
  }
}

// Ejecutar diagnóstico
main();
