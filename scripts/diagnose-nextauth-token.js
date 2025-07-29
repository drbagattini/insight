#!/usr/bin/env node

/**
 * DIAGNÓSTICO: Analizar el token de NextAuth
 */

async function diagnoseNextAuthToken() {
  console.log('🔍 DIAGNÓSTICO: Token de NextAuth');
  console.log('=' .repeat(50));

  try {
    // Simular una llamada al endpoint con autenticación para ver qué token se genera
    console.log('📊 Analizando implementación actual del endpoint...');
    
    // Leer el archivo del endpoint para ver cómo maneja el token
    const fs = require('fs');
    const endpointPath = '/Users/NICOBAGA/CascadeProjects/windsurf-project/app/api/patients/[patientId]/supervision/chat/route.ts';
    
    if (fs.existsSync(endpointPath)) {
      const content = fs.readFileSync(endpointPath, 'utf8');
      
      // Buscar cómo se usa el token
      const tokenUsageMatch = content.match(/token\.(.*?)/g);
      if (tokenUsageMatch) {
        console.log('\n🔍 USO DEL TOKEN EN EL CÓDIGO:');
        tokenUsageMatch.forEach(usage => {
          console.log('   ', usage);
        });
      }
      
      // Buscar la sección donde se construye psychologist
      const psychologistMatch = content.match(/psychologist:\s*{[^}]*}/s);
      if (psychologistMatch) {
        console.log('\n👤 CONSTRUCCIÓN DEL PSICÓLOGO:');
        console.log(psychologistMatch[0]);
      }
    }
    
    console.log('\n🎯 ANÁLISIS:');
    console.log('El endpoint está usando datos hardcodeados del token:');
    console.log('- token.id || "unknown"');
    console.log('- token.name || "Psicólogo"');
    console.log('- token.email || "unknown@example.com"');
    
    console.log('\n❌ PROBLEMA IDENTIFICADO:');
    console.log('El token de NextAuth no contiene los datos reales del usuario');
    console.log('o la consulta a la base de datos del psicólogo no se está haciendo');
    
    console.log('\n💡 SOLUCIÓN PROPUESTA:');
    console.log('1. Verificar qué datos contiene realmente el token NextAuth');
    console.log('2. Consultar la tabla de psicólogos/usuarios en Supabase');
    console.log('3. Usar el email/id del token para obtener datos reales');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

diagnoseNextAuthToken();
