'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUser, checkEmailExists } from '@/app/lib/userAPI';
import type { UserCreateInput } from '@/types/user';

export default function RegisterForm() {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  // const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Moved up

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;

      // Validaciones
      if (!firstName?.trim() || !lastName?.trim()) {
        setError('Por favor, completa todos los campos');
        return;
      }

      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }

      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return;
      }

      // Verificar email único
      try {
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          setError('Email ya registrado');
          return;
        }
      } catch (err) {
        throw new Error('Error al verificar email');
      }

      // Preparar datos del usuario
      const userData = {
        email,
        password: password, // Enviamos la contraseña directamente
        role: 'paciente', // Rol se puede manejar en backend también vía metadata
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        // is_active ya no es necesario aquí, createUser lo maneja
      };

      // Crear usuario - Asegurarse que createUser ahora envía esto a la API correcta
      // y que la API espera 'password'
      const { user, error: createError } = await createUser(userData as any); // createError is string | Error | null

      if (createError) {
        console.error('Error al crear usuario:', createError);

        // CORREGIDO: Verificar tipo de error antes de acceder a .message
        let errorMessage = 'Error al crear la cuenta. Por favor, intenta de nuevo.';
        if (typeof createError === 'string') {
          if (createError.includes('Email ya registrado') || createError.includes('duplicate key') || createError.includes('already registered')) {
            errorMessage = 'Email ya registrado';
          } else {
            errorMessage = createError; // Usar el mensaje de error string directamente
          }
        } else if (typeof createError === 'object' && createError !== null) {
          // Es un objeto y no es nulo. Verificamos si tiene la propiedad 'message'.
          // Esto es "duck typing" para tratarlo como un objeto de error.
          if ('message' in createError && typeof (createError as { message?: unknown }).message === 'string') {
            // Tiene una propiedad 'message' de tipo string, lo tratamos como un error.
            const errorWithMessage = createError as { message: string }; // Ahora es seguro hacer este cast
            if (errorWithMessage.message.includes('Email ya registrado') || errorWithMessage.message.includes('duplicate key') || errorWithMessage.message.includes('already registered')) {
              errorMessage = 'Email ya registrado';
            } else {
              errorMessage = errorWithMessage.message;
            }
          }
          // Si es un objeto pero no tiene una propiedad 'message' de tipo string (es decir, no parece un Error),
          // errorMessage conservará el valor por defecto asignado antes de este bloque.
          // Este comportamiento es consistente con la lógica original donde un objeto
          // que no era `instanceof Error` no actualizaba errorMessage en esta ruta.
        }
        setError(errorMessage);
        return;
      }

      // Mostrar mensaje de éxito y preparar redirección
      setShowSuccessMessage(true);
    } catch (err) { // Este catch maneja errores generales del handleSubmit
      console.error('Error en registro (catch general):', err);
      // Asegurar que el error mostrado sea un string
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000); // 3 segundos de retraso
      return () => clearTimeout(timer); // Limpiar el temporizador si el componente se desmonta
    }
  }, [showSuccessMessage, router]);

  if (!isMounted) {
    return null;
  }

  if (showSuccessMessage) {
    return (
      <div className="text-center p-6 bg-white shadow-md rounded-lg">
        <svg className="mx-auto mb-4 w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">¡Registro Exitoso!</h2>
        <p className="text-gray-600">Serás redirigido a la página de inicio de sesión en unos momentos...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Apellido
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu apellido"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
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
            minLength={8}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
      >
        {loading ? 'Registrando...' : 'Crear cuenta'}
      </button>

      <div className="text-center text-sm">
        <Link
          href="/auth/login"
          className="text-blue-600 hover:text-blue-500 transition-colors"
        >
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </div>
    </form>
  );
}
