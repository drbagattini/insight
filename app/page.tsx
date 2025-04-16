'use client';

import Image from "next/image";
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Inicializar Supabase client (solo si las variables de entorno están disponibles)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function Home() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);

  useEffect(() => {
    // Detectar el hash de recuperación de contraseña en la URL
    const handlePasswordRecovery = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        setShowResetForm(true);
      }
    };

    handlePasswordRecovery();
  }, []);

  const handleResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) {
      setMessage({ type: 'error', text: 'Error de configuración del cliente.' });
      return;
    }

    setIsResetting(true);
    setMessage(null);

    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error('Error al actualizar contraseña:', error.message);
        setMessage({ type: 'error', text: `Error: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Contraseña actualizada correctamente. Redirigiendo al login...' });
        // Esperar 2 segundos antes de redirigir
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error inesperado:', err);
      setMessage({ type: 'error', text: `Error inesperado: ${err.message || 'Inténtelo de nuevo.'}` });
    } finally {
      setIsResetting(false);
    }
  };

  // Si hay token de recuperación, mostrar formulario de reseteo
  if (showResetForm) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Resetear Contraseña</h2>
            <p className="mt-2 text-gray-600">Ingresa tu nueva contraseña</p>
          </div>

          <form onSubmit={handleResetSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Nueva Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isResetting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResetting ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Si no hay token de recuperación, mostrar la página normal
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Bienvenido a Insight
        </p>
      </div>
      {/* Removed extraneous div and footer elements that were causing syntax errors */}
    </main>
  );
}
