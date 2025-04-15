'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Signin':
        return 'Intenta iniciar sesión de nuevo.';
      case 'OAuthSignin':
        return 'Error al iniciar sesión con Google.';
      case 'OAuthCallback':
        return 'Error en la respuesta de Google.';
      case 'OAuthCreateAccount':
        return 'Error al crear la cuenta con Google.';
      case 'EmailCreateAccount':
        return 'Error al crear la cuenta con email.';
      case 'Callback':
        return 'Error en el proceso de autenticación.';
      case 'OAuthAccountNotLinked':
        return 'El email ya está registrado con otro método de inicio de sesión.';
      case 'EmailSignin':
        return 'Error al iniciar sesión con email.';
      case 'CredentialsSignin':
        return 'Email o contraseña incorrectos.';
      default:
        return 'Ocurrió un error durante la autenticación.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Error de autenticación</h2>
          <p className="text-red-600 mb-4">{getErrorMessage()}</p>
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
