// components/credits/DirectPurchase.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, DollarSign, Zap, X } from 'lucide-react';
import { useCreatePaymentPreference } from '@/hooks/usePayments';

interface DirectPurchaseProps {
  isOpen: boolean;
  onClose: () => void;
}

// Opciones de compra directa - 100 créditos por USD (igual que los planes)
const PURCHASE_OPTIONS = [
  {
    id: 'small',
    amount_usd: 5,
    amount_uyu: 200,
    credits: 500, // 5 USD × 100 créditos/USD
    popular: false,
    description: 'Perfecto para empezar'
  },
  {
    id: 'medium',
    amount_usd: 10,
    amount_uyu: 400,
    credits: 1000, // 10 USD × 100 créditos/USD
    popular: true,
    description: 'Mejor relación precio-valor'
  },
  {
    id: 'large',
    amount_usd: 20,
    amount_uyu: 800,
    credits: 2000, // 20 USD × 100 créditos/USD
    popular: false,
    description: 'Máximo ahorro'
  }
];

export default function DirectPurchase({ isOpen, onClose }: DirectPurchaseProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const createPaymentPreference = useCreatePaymentPreference();

  const handlePurchase = async (optionId: string) => {
    try {
      setSelectedOption(optionId);
      
      const option = PURCHASE_OPTIONS.find(opt => opt.id === optionId);
      if (!option) return;

      // Usar hook de pagos para compra directa
      const response = await createPaymentPreference.mutateAsync({
        purchase_type: 'direct',
        amount_usd: option.amount_usd,
        credits: option.credits,
        description: option.description
      });

      // Redirigir a Mercado Pago para pago real
      if (response.init_point) {
        window.location.href = response.init_point;
      } else {
        throw new Error('No se recibió URL de pago');
      }
      
    } catch (err) {
      console.error('Error en compra directa:', err);
      alert(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSelectedOption(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-semibold">Comprar Créditos</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 text-green-600">✅</div>
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
              <p className="text-green-600 text-sm mt-1">
                Redirigiendo en unos segundos...
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-600">
            Elige la cantidad de créditos que deseas comprar:
          </p>
          
          {PURCHASE_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                option.popular
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* Popular badge */}
              {option.popular && (
                <div className="absolute -top-2 left-4">
                  <div className="flex items-center space-x-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    <Zap className="h-3 w-3" />
                    <span>Recomendado</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        ${option.amount_usd} USD
                      </div>
                      <div className="text-sm text-gray-500">
                        ${option.amount_uyu} UYU
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 ml-11">
                    <div className="text-lg font-bold text-blue-600">
                      {option.credits.toLocaleString()} créditos
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => handlePurchase(option.id)}
                  disabled={createPaymentPreference.isPending}
                  className={`ml-4 ${
                    option.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  {createPaymentPreference.isPending && selectedOption === option.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Comprando...
                    </>
                  ) : (
                    'Comprar'
                  )}
                </Button>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              💳 Pagos seguros procesados por Mercado Pago<br/>
              🔒 Los créditos se acreditan automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
