// app/pago/pending/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams?.get('payment_id') ?? null;
  const status = searchParams?.get('status') ?? null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 text-center">
        <div className="mb-6">
          <Clock className="h-16 w-16 text-yellow-600 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Pago pendiente
        </h1>
        
        <p className="text-gray-600 mb-6">
          Tu pago está siendo procesado. Esto puede tomar unos minutos. Te notificaremos cuando esté confirmado.
        </p>

        {paymentId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 mb-1">ID de pago</p>
            <p className="text-sm font-mono text-yellow-900">{paymentId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar estado
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/credits')}
            className="w-full"
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
