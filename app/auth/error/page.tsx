// app/auth/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const errorMessages: { [key: string]: string } = {
  default: 'Ocurrió un error durante el proceso de autenticación. Por favor, intenta de nuevo.',
  Configuration: 'Hubo un problema con la configuración del servidor.',
  AccessDenied: 'Acceso denegado. No tienes permiso para acceder a esta página.',
  Verification: 'El token de verificación ha expirado o ya ha sido utilizado. Por favor, intenta de nuevo.',
  // Errores personalizados desde nuestra función authorize
  MissingCredentials: 'Por favor, ingresa tu email y contraseña.',
  EmailNotConfirmed: 'Tu email no ha sido confirmado. Por favor, revisa tu bandeja de entrada (y la carpeta de spam) y sigue el enlace de confirmación. Puedes solicitar un nuevo correo de confirmación si es necesario.',
  InvalidCredentials: 'Email o clave incorrecta. Por favor, verifica tus datos e inténtalo de nuevo.',
  AuthenticationFailed: 'Error de autenticación. Ocurrió un problema al intentar iniciar sesión.',
  UserNotFoundAfterAuth: 'Error interno del servidor (código: UNAA). Por favor, intenta de nuevo más tarde.',
  UserQueryFailedInPublicTable: 'Error interno del servidor (código: UQFPT). Por favor, intenta de nuevo más tarde.',
  UserNotFoundInPublicTablePostTrigger: 'Problema con la configuración de tu cuenta (código: UNFPT). Por favor, contacta a soporte.',
  UnhandledAuthenticationError: 'Ocurrió un error inesperado (código: UAE). Por favor, inténtalo de nuevo.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const errorType = searchParams?.get('error');
  const [message, setMessage] = useState(errorMessages.default);

  useEffect(() => {
    if (errorType && errorMessages[errorType]) {
      setMessage(errorMessages[errorType]);
    } else if (errorType) {
      // Si el errorType no está en nuestro mapa, mostramos un mensaje genérico con el tipo de error
      setMessage(`${errorMessages.default} (Error: ${errorType})`);
    }
  }, [errorType]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error de Autenticación</h1>
        <p className="text-gray-700 mb-6">{message}</p>
        <Link href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Volver al Login
          </Link>
        {errorType === 'EmailNotConfirmed' && (
          <p className="mt-4 text-sm text-gray-600">
            ¿No recibiste el correo?{' '}
            {/* Aquí podrías añadir un enlace/botón para reenviar el correo de confirmación si implementas esa funcionalidad */}
            {/* <button onClick={() => console.log('Reenviar email...')} className="text-blue-600 hover:underline">
              Reenviar email de confirmación
            </button> */}
          </p>
        )}
      </div>
    </div>
  );
}
