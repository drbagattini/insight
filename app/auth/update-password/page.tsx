'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import InsightLogo from '@/components/common/InsightLogo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to access search params
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorParam, setErrorParam] = useState<string | null>(null);

  // Supabase sends recovery info in the URL hash, not search params.
  // We need to parse it on the client side.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // Remove #
      const errorDescription = params.get('error_description');
      if (errorDescription) {
        setMessage({ type: 'error', text: decodeURIComponent(errorDescription) });
      }
      // Supabase uses the hash for the access_token during recovery flow.
      // The session is automatically set by Supabase JS library if tokens are in hash.
    }

    // Also check for error in query parameters (e.g., if Supabase redirects with ?error=...)
    const queryError = searchParams.get('error');
    const queryErrorDescription = searchParams.get('error_description');
    if (queryError) {
        setErrorParam(queryErrorDescription || queryError);
        setMessage({ type: 'error', text: queryErrorDescription || queryError });
    }

  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!supabase) {
      setMessage({ type: 'error', text: 'Error de configuración: No se pudo inicializar el cliente de Supabase.' });
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) { // O la política de contraseñas que tengas
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({ password: password });

      if (error) {
        console.error('Error al actualizar contraseña:', error);
        setMessage({ type: 'error', text: error.message || 'Ocurrió un error al actualizar tu contraseña.' });
      } else {
        setMessage({ type: 'success', text: '¡Tu contraseña ha sido actualizada exitosamente! Ahora puedes iniciar sesión.' });
        // Opcionalmente, redirigir al login después de un momento
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setMessage({ type: 'error', text: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (errorParam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
            <InsightLogo textSize="lg" />
            <h2 className="mt-6 text-2xl font-extrabold text-gray-900">Error en la Recuperación</h2>
            <p className="mt-2 text-sm text-red-600">{errorParam}</p>
            <div className="mt-6">
                <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Intentar de nuevo
                </Link>
            </div>
            <div className="mt-2">
                <Link href="/auth/login" className="font-medium text-gray-600 hover:text-gray-500 text-xs">
                    Volver a Iniciar Sesión
                </Link>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
            <InsightLogo textSize="lg" />
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
                Actualizar Contraseña
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
                Ingresa tu nueva contraseña.
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">Nueva Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-4"
              placeholder="Nueva Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="sr-only">Confirmar Nueva Contraseña</label>
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Confirmar Nueva Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {message && (
            <div className={`p-3 mt-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 mt-6 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
         <div className="text-sm text-center mt-6">
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
