'use client';

import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';

// Simplificando al máximo para aislar el problema
export default function TestRLSSimple() {
  const [result, setResult] = useState('');
  const [email, setEmail] = useState(`test.${Date.now()}@example.com`);

  const testInsert = async () => {
    try {
      setResult('Probando...');
      
      // Usar directamente las variables sin procesamiento
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setResult('Error: Faltan variables de entorno');
        return;
      }
      
      // Crear cliente exactamente igual al script que funcionó
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
          // Sin detectSessionInUrl y configuración minimalista
        }
      });
      
      // Insertar un usuario paciente con datos mínimos
      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
          role: 'paciente',
          first_name: 'Test',
          last_name: 'Simple',
          is_active: true
        });
      
      if (error) {
        console.error('Error completo:', error);
        setResult(`ERROR: ${error.message}\nCódigo: ${error.code}`);
      } else {
        setResult(`ÉXITO: Usuario creado con email ${email}`);
      }
    } catch (e) {
      setResult(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Consultar el estado actual de la política
  const checkPolicy = async () => {
    try {
      setResult('Consultando política...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setResult('Error: Faltan variables de entorno');
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Intentar una operación de lectura simple
      const { data, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        setResult(`Error al leer: ${error.message}`);
      } else {
        // Intentar obtener información sobre políticas (esto fallará sin permisos)
        const res = await fetch('/api/check-policies', {
          method: 'GET',
        });
        
        const policyData = await res.json();
        setResult(`Lectura OK. API response: ${JSON.stringify(policyData)}`);
      }
    } catch (e) {
      setResult(`Error inesperado: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Prueba RLS Simple</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-yellow-100 rounded">
          <p>Esta es una versión simplificada al máximo para aislar el problema</p>
        </div>
        
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        
        <div className="flex space-x-4">
          <button
            onClick={testInsert}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Probar Inserción Simple
          </button>
          
          <button
            onClick={checkPolicy}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Verificar Política
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
