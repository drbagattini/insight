import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-2">Insight</h1>
        <p className="text-xl text-gray-600">Plataforma de Gestión Clínica</p>
      </header>

      <div className="space-y-4 w-full max-w-sm">
        <Link
          href="/auth/login"
          className="block w-full px-6 py-3 text-center bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/auth/register"
          className="block w-full px-6 py-3 text-center bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold"
        >
          Registrarse
        </Link>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>&copy; 2024 Insight. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
