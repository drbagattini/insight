#!/usr/bin/env node

/**
 * TEST: Endpoint de debug del token NextAuth
 */

async function testDebugToken() {
  console.log('🔍 TESTING: Debug del token NextAuth');
  console.log('=' .repeat(50));

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n📊 Probando endpoint de debug...');
    console.log('URL: http://localhost:3000/api/debug-token');
    
    const response = await fetch('http://localhost:3000/api/debug-token');
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n🔍 RESULTADO DEL DEBUG:');
      console.log('Autenticado:', data.authenticated);
      
      if (data.authenticated) {
        console.log('\n📋 INFORMACIÓN DEL TOKEN:');
        console.log('   Tiene ID:', data.token_info.has_id);
        console.log('   Tiene SUB:', data.token_info.has_sub);
        console.log('   Tiene NAME:', data.token_info.has_name);
        console.log('   Tiene EMAIL:', data.token_info.has_email);
        console.log('   Valor ID:', data.token_info.id_value);
        console.log('   Valor SUB:', data.token_info.sub_value);
        console.log('   Valor NAME:', data.token_info.name_value);
        console.log('   Valor EMAIL:', data.token_info.email_value);
        
        console.log('\n👤 USUARIO EN BASE DE DATOS:');
        console.log('   Encontrado:', data.user_in_database.found);
        console.log('   ID:', data.user_in_database.id);
        console.log('   Email:', data.user_in_database.email);
        console.log('   Nombre:', data.user_in_database.first_name);
        console.log('   Apellido:', data.user_in_database.last_name);
        console.log('   Rol:', data.user_in_database.role);
        console.log('   Activo:', data.user_in_database.is_active);
        
        console.log('\n🎯 DIAGNÓSTICO:');
        console.log('   Token tiene email:', data.diagnosis.token_has_email);
        console.log('   Usuario existe en BD:', data.diagnosis.user_exists_in_db);
        console.log('   Puede obtener nombre real:', data.diagnosis.can_get_real_name);
        console.log('   Problema identificado:', data.diagnosis.problem_identified);
      } else {
        console.log('\n❌ NO AUTENTICADO');
        console.log('Mensaje:', data.message);
        console.log('\n💡 SOLUCIÓN:');
        console.log('Necesitas estar logueado en la aplicación para probar esto');
        console.log('1. Abre http://localhost:3000 en el navegador');
        console.log('2. Inicia sesión con un usuario');
        console.log('3. Luego prueba este endpoint desde el navegador');
      }
    } else {
      console.log('❌ Error:', response.status);
      const errorText = await response.text();
      console.log('Detalles:', errorText);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testDebugToken();
