import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Crear cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Regístrate como paciente
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
