'use client';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function SignIn({ providers = ['google', 'credentials'] }: { providers?: string[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handlePasswordReset = async () => {
    if (!supabase) {
      setMessage({ type: 'error', text: 'Error de configuración del cliente.' });
      return;
    }
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor, ingresa tu email primero.' });
      return;
    }
    setIsResetting(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) {
        console.error('Error al solicitar reseteo:', error.message);
        setMessage({ type: 'error', text: `Error: ${error.message}` });
      } else {
        setMessage({ type: 'success', text: 'Si el email es válido, recibirás un enlace para resetear tu contraseña.' });
      }
    } catch (err: any) {
      console.error('Error inesperado en reseteo:', err);
      setMessage({ type: 'error', text: `Error inesperado: ${err.message || 'Intentelo de nuevo.'}` });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="auth-container space-y-6 max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      {providers.includes('google') && (
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>
      )}

      {providers.includes('credentials') && (
        <div className="space-y-6">
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
              const formData = new FormData(e.currentTarget);
              await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                callbackUrl: '/dashboard',
                redirect: true
              });
            } catch (error) {
              console.error('Error en inicio de sesión:', error);
            } finally {
              setIsSubmitting(false);
            }
          }} className="space-y-4">
            <div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                placeholder="Contraseña"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {message && (
              <div
                className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {message.text}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>
          <div className="text-center text-sm flex flex-col items-center">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault(); // Prevenir navegación por defecto del href
                if (!isResetting && email) { // Solo ejecutar si no se está reseteando y hay email
                  handlePasswordReset();
                }
              }}
              // Aplicar clases de estilo y deshabilitado condicionalmente
              className={`text-blue-600 hover:text-blue-800 transition-colors ${isResetting || !email ? 'opacity-50 cursor-not-allowed' : ''} mb-2`}
              // Evitar click si está deshabilitado visualmente
              style={{ pointerEvents: isResetting || !email ? 'none' : 'auto' }}
              aria-disabled={isResetting || !email}
            >
              {isResetting ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
            </a>
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
