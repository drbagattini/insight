'use client';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export function SignIn({ providers = ['google', 'credentials'] }: { providers?: string[] }) {
  return (
    <div className="auth-container space-y-6 max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      {providers.includes('google') && (
        <button
          onClick={() => signIn('google')}
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
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            signIn('credentials', {
              email: formData.get('email'),
              password: formData.get('password'),
              callbackUrl: '/dashboard'
            });
          }} className="space-y-4">
            <div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <button
              type="submit"
              className="w-full bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
            >
              Iniciar sesión
            </button>
          </form>
          <div className="text-center text-sm">
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
