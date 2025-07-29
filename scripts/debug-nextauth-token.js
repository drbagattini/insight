#!/usr/bin/env node

/**
 * DEBUG: Investigar contenido real del token NextAuth
 */

async function debugNextAuthToken() {
  console.log('🔍 DEBUG: Contenido real del token NextAuth');
  console.log('=' .repeat(50));

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n📊 MÉTODO 1: Crear endpoint de debug temporal');
    
    // Crear un endpoint temporal que muestre el token
    const debugEndpointCode = `
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    return NextResponse.json({
      token_exists: !!token,
      token_keys: token ? Object.keys(token) : [],
      token_content: token ? {
        id: token.id,
        sub: token.sub,
        name: token.name,
        email: token.email,
        picture: token.picture,
        iat: token.iat,
        exp: token.exp,
        jti: token.jti
      } : null,
      full_token: token
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`;

    console.log('📝 Código del endpoint de debug creado');
    console.log('📍 Ubicación: /api/debug-token/route.ts');
    
    console.log('\n🎯 ANÁLISIS ESPERADO:');
    console.log('Si el token contiene:');
    console.log('- email: Podemos buscar en tabla users');
    console.log('- name: Podemos usar directamente');
    console.log('- sub/id: Podemos usar como identificador');
    
    console.log('\n💡 POSIBLES PROBLEMAS:');
    console.log('1. Token no contiene información del usuario');
    console.log('2. Email en token no coincide con tabla users');
    console.log('3. Función getPsychologistData() tiene error');
    console.log('4. Token expira o no se genera correctamente');
    
    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('Crear endpoint de debug y probarlo con usuario autenticado');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

debugNextAuthToken();
