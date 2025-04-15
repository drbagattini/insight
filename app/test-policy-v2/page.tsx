'use client';

import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

// Verificar que tenemos las variables de entorno correctas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Variables disponibles:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase');
}

// Crear cliente anónimo con la configuración más simple (como en test-rls-simple)
const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
    // Omitimos detectSessionInUrl que podía estar causando problemas
  }
});

console.log('Cliente creado con:', {
  url: supabaseUrl,
  keyType: 'anon',
  keyStart: supabaseAnonKey.substring(0, 10) + '...',
  configType: 'simplificado'
});

export default function TestPolicyV2() {
  const [result, setResult] = useState<string>('');

  // Limpiar estado de autenticación al montar
  useEffect(() => {
    const cleanAuth = async () => {
      // Limpiar cualquier sesión existente
      await anonClient.auth.signOut();
      console.log('Sesión limpiada al iniciar');
    };
    cleanAuth();
  }, []);

  const testPaciente = async () => {
    try {
      setResult('Intentando crear paciente...');
      
      // Asegurar nuevamente que no hay sesión
      await anonClient.auth.signOut();
      
      // Crear paciente con implementación simplificada (como en test-rls-simple)
      const email = `test.paciente.${Date.now()}@example.com`;
      
      const { data, error } = await anonClient
        .from('users')
        .insert({
          email,
          password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
          role: 'paciente',
          first_name: 'Test',
          last_name: 'Paciente',
          is_active: true
        });
      
      if (error) {
        console.error('Error completo:', error);
        setResult(`Error: ${error.message}\nCódigo: ${error.code}`);
      } else {
        setResult(`¡ÉXITO! Usuario paciente creado con email ${email}`);
      }
    } catch (e) {
      console.error('Error inesperado:', e);
      setResult(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const testPsicologo = async () => {
    try {
      setResult('Intentando crear psicólogo...');
      
      // Asegurar nuevamente que no hay sesión
      await anonClient.auth.signOut();
      
      // Crear psicólogo (debería fallar por política RLS)
      const email = `test.psicologo.${Date.now()}@example.com`;
      
      const { data, error } = await anonClient
        .from('users')
        .insert({
          email,
          password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
          role: 'psicologo',
          first_name: 'Test',
          last_name: 'Psicologo',
          is_active: true
        });
      
      if (error) {
        // Esto es lo esperado: debería fallar
        if (error.message.includes('row-level security')) {
          setResult(`COMPORTAMIENTO CORRECTO: Error de política RLS: ${error.message}\nCódigo: ${error.code}`);
        } else {
          setResult(`Error inesperado: ${error.message}\nCódigo: ${error.code}`);
        }
      } else {
        // Esto no debería ocurrir
        setResult(`⚠️ ADVERTENCIA: Se creó un psicólogo cuando debería haber fallado.`);
      }
    } catch (e) {
      console.error('Error inesperado:', e);
      setResult(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Prueba de Políticas RLS (Versión Simplificada)</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-yellow-100 rounded">
          <h2 className="text-lg font-semibold">Pruebas de Inserción:</h2>
          <p>Usando cliente anónimo con configuración simplificada</p>
        </div>

        <div>
          <h2 className="text-xl mb-2">Crear Paciente (debería funcionar)</h2>
          <button
            onClick={testPaciente}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Probar Crear Paciente
          </button>
        </div>

        <div>
          <h2 className="text-xl mb-2">Crear Psicólogo (debería fallar)</h2>
          <button
            onClick={testPsicologo}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Probar Crear Psicólogo
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
