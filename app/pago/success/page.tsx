// app/pago/success/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCredits } from '@/hooks/useCredits';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const { refetch: refetchCredits } = useCredits();

  const paymentId = searchParams?.get('payment_id') ?? null;
  const status = searchParams?.get('status') ?? null;
  const externalReference = searchParams?.get('external_reference') ?? null;

  useEffect(() => {
    // Simular procesamiento y refrescar créditos
    const timer = setTimeout(() => {
      setIsProcessing(false);
      refetchCredits();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetchCredits]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="mb-6">
            <Loader2 className="h-16 w-16 text-sky-600 mx-auto animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Procesando tu pago...
          </h1>
          <p className="text-gray-600">
            Estamos confirmando tu pago y agregando los créditos a tu cuenta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ¡Pago exitoso!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tu pago ha sido procesado correctamente. Los créditos han sido agregados a tu cuenta.
        </p>

        {paymentId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">ID de pago</p>
            <p className="text-sm font-mono text-gray-900">{paymentId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/credits')}
            className="w-full bg-sky-600 hover:bg-sky-700"
          >
            Ver mis créditos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
