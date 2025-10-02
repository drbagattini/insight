// app/dashboard/credits/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRefreshCredits } from '@/hooks/useCredits';
import CreditBalance from '@/components/credits/CreditBalance';
import CreditPlans from '@/components/credits/CreditPlans';
import CreditHistory from '@/components/credits/CreditHistory';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

function CreditsContent() {
  const searchParams = useSearchParams();
  const refreshCredits = useRefreshCredits();
  const paymentStatus = searchParams?.get('payment');

  // Refrescar datos cuando se regresa de un pago
  useEffect(() => {
    if (paymentStatus) {
      refreshCredits();
    }
  }, [paymentStatus, refreshCredits]);

  const getPaymentStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  ¡Pago exitoso!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Tus créditos han sido acreditados correctamente. Ya puedes usar todas las funcionalidades.
                </p>
              </div>
            </div>
          </div>
        );
      case 'failure':
        return (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Pago fallido
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  No se pudo procesar tu pago. Por favor, intenta nuevamente o contacta soporte.
                </p>
              </div>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Pago pendiente
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Tu pago está siendo procesado. Los créditos se acreditarán automáticamente una vez confirmado.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Créditos</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tus créditos para usar todas las funcionalidades de la plataforma
        </p>
      </div>

      {/* Payment status message */}
      {getPaymentStatusMessage()}

      {/* Credit balance */}
      <CreditBalance />

      {/* Credit plans */}
      <CreditPlans />

      {/* Credit history */}
      <CreditHistory />
    </div>
  );
}
