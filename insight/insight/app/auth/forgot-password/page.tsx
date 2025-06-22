'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import InsightLogo from '@/components/common/InsightLogo'; // Ajusta la ruta si es necesario

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Solo crea el cliente Supabase si las variables de entorno están presentes
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!supabase) {
      setMessage({ type: 'error', text: 'Error de configuración: No se pudo inicializar el cliente de Supabase.' });
      setIsSubmitting(false);
      return;
    }

    if (!email) {
      setMessage({ type: 'error', text: 'Por favor, ingresa tu dirección de email.' });
      setIsSubmitting(false);
      return;
    }

    try {
      // Asegúrate de que la URL de redirección sea la correcta para tu flujo de actualización de contraseña
      // Por ejemplo, una página donde el usuario pueda ingresar su nueva contraseña después de hacer clic en el enlace del email.
      // Esta página debe ser capaz de manejar los tokens de Supabase en la URL.
      const redirectTo = `${window.location.origin}/auth/update-password`; // O la ruta que hayas definido para esto

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) {
        console.error('Error al solicitar reseteo de contraseña:', error);
        setMessage({ type: 'error', text: error.message || 'Ocurrió un error al intentar enviar el email de reseteo.' });
      } else {
        setMessage({ type: 'success', text: 'Si tu email está registrado, recibirás un enlace para resetear tu contraseña. Revisa tu bandeja de entrada (y spam).' });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setMessage({ type: 'error', text: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <InsightLogo textSize="lg" />
          <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Recuperar Contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu email y te enviaremos un enlace para resetearla.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Tu dirección de email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
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
