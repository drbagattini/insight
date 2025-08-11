// components/credits/CreditPlans.tsx
'use client';

import { useState } from 'react';
import { usePaymentRedirect } from '@/hooks/usePayments';
import { CREDIT_PLANS, TOKENS_PER_SUPERVISION_SESSION } from '@/types/credits';
import { Check, Star, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FairUsageDisplay from './FairUsageDisplay';

export default function CreditPlans() {
  const { redirectToPayment, isLoading, error } = usePaymentRedirect();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    try {
      setSelectedPlan(planId);
      await redirectToPayment(planId);
    } catch (err) {
      console.error('Error al procesar pago:', err);
      setSelectedPlan(null);
    }
  };



  return (
    <div id="credit-plans-section" className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Planes de Créditos</h2>
            <p className="text-sm text-gray-500">Elige el plan que mejor se adapte a tus necesidades</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-6 border-b border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">
              Error al procesar el pago: {error.message}
            </p>
          </div>
        </div>
      )}

      {/* Fair Usage Display */}
      <div className="p-6 border-b border-gray-200">
        <FairUsageDisplay />
      </div>

      {/* Plans */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CREDIT_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-lg border border-gray-200 p-6 bg-white hover:shadow-lg transition-shadow"
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-1 bg-sky-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    <Star className="h-3 w-3" />
                    <span>Más popular</span>
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {plan.credits.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">créditos</div>
                </div>
                <div className="mt-2">
                  <div className="text-xl font-semibold text-green-600">
                    ${plan.price_uyu.toLocaleString()} UYU
                  </div>
                  <div className="text-sm text-gray-500">
                    (${plan.price_usd} USD)
                  </div>
                </div>
              </div>

              {/* Plan features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    <strong>{plan.equivalences.supervision_sessions}</strong> sesiones de supervisión con IA
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    <strong>{plan.equivalences.sessions_45min}</strong> transcripción de sesiones
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    <strong>{plan.equivalences.synthesis_evolutions}</strong> informes de síntesis de evolución clínica
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">
                    <strong>{plan.equivalences.reports}</strong> informes clínicos por IA
                  </span>
                </div>
              </div>

              {/* Purchase button */}
              <Button
                onClick={() => handlePurchase(plan.id)}
                disabled={isLoading && selectedPlan === plan.id}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                {isLoading && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Comprar Plan'
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Included in all plans */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-900 font-medium mb-2">Incluido en todos los planes:</p>
          <ul className="space-y-1 text-sm text-green-900">
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Agenda</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Envío de cuestionarios</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Registro de evoluciones clínicas</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Registro de entrevista inicial</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Análisis de formularios psicométricos</span>
            </li>
          </ul>
        </div>

        {/* Payment info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Información de pago:</p>
              <ul className="space-y-1 text-xs">
                <li>• Pagos seguros procesados por Mercado Pago</li>
                <li>• Aceptamos tarjetas de crédito y débito</li>
                <li>• Los créditos se acreditan automáticamente tras el pago</li>
                <li>• Todos los precios incluyen impuestos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
