'use client';

import { useState, useEffect } from 'react';
import { createSupabaseClient, isRLSError } from '@/utils/supabase';

// Utilizar la función centralizada para crear el cliente
const anonClient = createSupabaseClient();

console.log('Cliente Supabase creado con utilidad centralizada');


export default function TestPolicy() {
  const [result, setResult] = useState<string>('');

  // Verificar estado de autenticación al montar
  useEffect(() => {
    const checkAuth = async () => {
      // Intentar limpiar cualquier sesión
      await anonClient.auth.signOut();
      
      // Verificar estado después de limpiar
      const { data: { session } } = await anonClient.auth.getSession();
      const { data: { user } } = await anonClient.auth.getUser();
      
      console.log('Estado de autenticación:', {
        hasSession: !!session,
        hasUser: !!user,
        userId: user?.id,
        role: user?.role
      });
    };
    checkAuth();
  }, []);

  const testPaciente = async () => {
    try {
      setResult('Intentando crear paciente...');
      
      // Limpiar sesión para garantizar estado anónimo
      await anonClient.auth.signOut();
      
      // Email único por timestamp
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
        setResult(`ERROR: ${error.message}
Código: ${error.code}`);
      } else {
        setResult(`¡ÉXITO! Usuario paciente creado con email ${email}`);
      }
    } catch (e) {
      console.error('Error al crear paciente:', e);
      setResult(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const testPsicologo = async () => {
    try {
      setResult('Intentando crear psicólogo...');
      
      // Limpiar sesión para garantizar estado anónimo
      await anonClient.auth.signOut();
      
      // Email único por timestamp
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
        // Verificar si es un error de RLS (lo esperado)
        if (isRLSError(error)) {
          setResult(`COMPORTAMIENTO CORRECTO: Error de política RLS: ${error.message}
Código: ${error.code}`);
        } else {
          setResult(`Error inesperado: ${error.message}
Código: ${error.code}`);
        }
      } else {
        // Esto no debería ocurrir
        setResult(`⚠️ ADVERTENCIA: Se creó un psicólogo cuando debería haber fallado.`);
      }
    } catch (e) {
      console.error('Error al crear psicólogo:', e);
      setResult(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Prueba de Políticas RLS</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-100 rounded">
          <h2 className="text-lg font-semibold">Pruebas de Inserción:</h2>
          <p>Usando cliente anónimo para probar políticas RLS</p>
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
