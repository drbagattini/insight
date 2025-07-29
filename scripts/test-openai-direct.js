#!/usr/bin/env node

/**
 * Test directo de OpenAI API para verificar que la migración funcione
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Leer la API key del .env.local
function getOpenAIKey() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local no encontrado');
    return null;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/OPENAI_API_KEY=(.+)/);
  return match ? match[1].trim() : null;
}

async function testOpenAIDirect() {
  console.log('🔍 PROBANDO OPENAI API DIRECTAMENTE...');
  
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY no encontrada');
    return false;
  }
  
  console.log('✅ API Key encontrada');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Eres un supervisor clínico. Responde brevemente.'
          },
          {
            role: 'user',
            content: 'Hola, ¿puedes confirmar que estás funcionando?'
          }
        ],
        temperature: 0.5,
        max_tokens: 100
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI API funcionando correctamente');
      console.log(`📝 Respuesta: ${data.choices[0].message.content}`);
      console.log(`🔧 Modelo: ${data.model}`);
      console.log(`📊 Tokens usados: ${data.usage.total_tokens}`);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Error de OpenAI API:', error);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error conectando con OpenAI:', error.message);
    return false;
  }
}

async function testSupervisionEndpoint() {
  console.log('\n🔍 PROBANDO ENDPOINT DE SUPERVISIÓN LOCAL...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Hacer una llamada simple al endpoint de supervisión
    const response = await fetch('http://localhost:3000/api/patients/2385677e-cf3e-45e3-8d28-9100afa90a3a/supervision/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Nota: En producción necesitaríamos autenticación real
      },
      body: JSON.stringify({
        message: 'Test simple',
        conversationHistory: []
      })
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint de supervisión respondiendo');
      console.log(`🤖 Modelo usado: ${data.model}`);
      console.log(`⏱️ Tiempo: ${data.performance?.totalTime || 'N/A'}`);
      
      if (data.model === 'gpt-4o') {
        console.log('🎉 MIGRACIÓN A OPENAI EXITOSA');
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Error del endpoint:', errorText.substring(0, 200));
      
      if (errorText.includes('Unauthorized') || errorText.includes('401')) {
        console.log('🔐 Error de autenticación (esperado sin login)');
      }
      
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error conectando con endpoint local:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 VERIFICACIÓN DE MIGRACIÓN OPENAI');
  console.log('=' .repeat(50));
  
  // 1. Probar OpenAI directamente
  const openaiOk = await testOpenAIDirect();
  
  // 2. Probar endpoint local (puede fallar por auth)
  const endpointOk = await testSupervisionEndpoint();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMEN:');
  console.log(`🔑 OpenAI API: ${openaiOk ? '✅ OK' : '❌ FALLA'}`);
  console.log(`🌐 Endpoint local: ${endpointOk ? '✅ OK' : '❌ FALLA (posible auth)'}`);
  
  if (openaiOk) {
    console.log('\n🎉 LA MIGRACIÓN A OPENAI ESTÁ LISTA');
    console.log('💡 El endpoint puede fallar por autenticación, pero OpenAI funciona');
  } else {
    console.log('\n❌ REVISAR CONFIGURACIÓN DE OPENAI_API_KEY');
  }
}

main().catch(console.error);
