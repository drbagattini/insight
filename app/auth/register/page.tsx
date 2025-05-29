import RegisterForm from '@/components/auth/RegisterForm';
import InsightLogo from '@/components/common/InsightLogo';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <InsightLogo textSize="lg" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Crear cuenta
            </h2>
            <p className="mt-1 text-center text-sm text-gray-600">
              Regístrate como psicólogo profesional
            </p>
          </div>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
