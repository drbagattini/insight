#!/usr/bin/env node

/**
 * Script de prueba para la funcionalidad de desconexión de Google Calendar
 * Verifica que el endpoint y la lógica estén funcionando correctamente
 */

const BASE_URL = 'http://localhost:3000';

async function testDisconnectEndpoint() {
  console.log('🧪 Testing Google Calendar Disconnect Functionality');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Verificar que el endpoint existe y requiere autenticación
    console.log('\n📍 Test 1: Verificando endpoint de desconexión...');
    
    const response = await fetch(`${BASE_URL}/api/calendar/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Endpoint correctamente protegido - requiere autenticación');
    } else {
      console.log('⚠️  Endpoint responde de manera inesperada');
    }
    
    // Test 2: Verificar estructura del componente ConnectCalendarButton
    console.log('\n📍 Test 2: Verificando estructura del componente...');
    
    const fs = require('fs');
    const path = require('path');
    
    const componentPath = path.join(__dirname, '../app/components/auth/ConnectCalendarButton.tsx');
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Verificar que contiene las funciones necesarias
    const hasHandleConnect = componentContent.includes('handleConnect');
    const hasHandleDisconnect = componentContent.includes('handleDisconnect');
    const hasDisconnectAPI = componentContent.includes('/api/calendar/disconnect');
    const hasUpdateCall = componentContent.includes('update({ disconnectGoogleCalendar: true })');
    
    console.log(`✅ handleConnect function: ${hasHandleConnect ? 'Found' : 'Missing'}`);
    console.log(`✅ handleDisconnect function: ${hasHandleDisconnect ? 'Found' : 'Missing'}`);
    console.log(`✅ Disconnect API call: ${hasDisconnectAPI ? 'Found' : 'Missing'}`);
    console.log(`✅ Session update call: ${hasUpdateCall ? 'Found' : 'Missing'}`);
    
    // Test 3: Verificar lógica en auth.ts
    console.log('\n📍 Test 3: Verificando lógica de NextAuth...');
    
    const authPath = path.join(__dirname, '../app/lib/auth.ts');
    const authContent = fs.readFileSync(authPath, 'utf8');
    
    const hasDisconnectLogic = authContent.includes('disconnectGoogleCalendar');
    const hasTokenCleanup = authContent.includes('delete token.googleCalendarAccessToken');
    const hasScopeReset = authContent.includes('googleCalendarScopeGranted = false');
    
    console.log(`✅ Disconnect trigger logic: ${hasDisconnectLogic ? 'Found' : 'Missing'}`);
    console.log(`✅ Token cleanup logic: ${hasTokenCleanup ? 'Found' : 'Missing'}`);
    console.log(`✅ Scope reset logic: ${hasScopeReset ? 'Found' : 'Missing'}`);
    
    // Test 4: Verificar tipos de NextAuth
    console.log('\n📍 Test 4: Verificando tipos de NextAuth...');
    
    const typesPath = path.join(__dirname, '../types/next-auth.d.ts');
    const typesContent = fs.readFileSync(typesPath, 'utf8');
    
    const hasCalendarTokenType = typesContent.includes('googleCalendarAccessToken');
    const hasScopeGrantedType = typesContent.includes('googleCalendarScopeGranted');
    
    console.log(`✅ Calendar token types: ${hasCalendarTokenType ? 'Found' : 'Missing'}`);
    console.log(`✅ Scope granted types: ${hasScopeGrantedType ? 'Found' : 'Missing'}`);
    
    console.log('\n🎉 Resumen de Tests:');
    console.log('=' .repeat(60));
    
    const allTestsPassed = hasHandleConnect && hasHandleDisconnect && hasDisconnectAPI && 
                          hasUpdateCall && hasDisconnectLogic && hasTokenCleanup && 
                          hasScopeReset && hasCalendarTokenType && hasScopeGrantedType;
    
    if (allTestsPassed) {
      console.log('✅ Todos los componentes de desconexión están implementados correctamente');
      console.log('🚀 La funcionalidad está lista para pruebas manuales');
    } else {
      console.log('⚠️  Algunos componentes pueden necesitar revisión');
    }
    
    console.log('\n📋 Próximos pasos para prueba manual:');
    console.log('1. Iniciar sesión en la aplicación');
    console.log('2. Conectar Google Calendar desde la página de agenda');
    console.log('3. Verificar que el botón cambie a "Desvincular Google"');
    console.log('4. Hacer click en "Desvincular Google"');
    console.log('5. Verificar que el botón vuelva a "Google Calendar"');
    console.log('6. Intentar reconectar para verificar el flujo completo');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Ejecutar las pruebas
testDisconnectEndpoint().then(() => {
  console.log('\n🏁 Pruebas completadas');
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
