'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUser, checkEmailExists } from '@/lib/supabase-client';
import type { UserCreateInput } from '@/types/user';

export default function RegisterForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

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
        } else if (createError instanceof Error) {
          // Si es un objeto Error, verificar su mensaje
          if (createError.message.includes('Email ya registrado') || createError.message.includes('duplicate key') || createError.message.includes('already registered')) {
            errorMessage = 'Email ya registrado';
          } else {
            errorMessage = createError.message;
          }
        }
        setError(errorMessage);
        return;
      }

      // Redireccionar al login
      router.push('/auth/login?registered=true');
    } catch (err) { // Este catch maneja errores generales del handleSubmit
      console.error('Error en registro (catch general):', err);
      // Asegurar que el error mostrado sea un string
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return null;
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
