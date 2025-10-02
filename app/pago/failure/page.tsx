// app/pago/failure/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams?.get('payment_id') ?? null;
  const status = searchParams?.get('status') ?? null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="mb-6">
          <XCircle className="h-16 w-16 text-red-600 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Pago rechazado
        </h1>
        
        <p className="text-gray-600 mb-6">
          No pudimos procesar tu pago. Esto puede deberse a fondos insuficientes, datos incorrectos o un problema temporal.
        </p>

        {paymentId && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 mb-1">ID de pago</p>
            <p className="text-sm font-mono text-red-900">{paymentId}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">¿Qué puedes hacer?</h3>
          <ul className="text-sm text-blue-800 text-left space-y-1">
            <li>• Verificar los datos de tu tarjeta</li>
            <li>• Asegurarte de tener fondos suficientes</li>
            <li>• Intentar con otro método de pago</li>
            <li>• Contactar a tu banco si persiste</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/credits')}
            className="w-full bg-sky-600 hover:bg-sky-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar nuevamente
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
