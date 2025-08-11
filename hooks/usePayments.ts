// hooks/usePayments.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreatePreferenceRequest, CreatePreferenceResponse } from '@/types/payments';

// Hook para crear preferencia de pago
export function useCreatePaymentPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreatePreferenceRequest): Promise<CreatePreferenceResponse> => {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear preferencia de pago');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache relacionado con pagos si es necesario
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    }
  });
}

// Hook para manejar redirección a Mercado Pago
export function usePaymentRedirect() {
  const createPreference = useCreatePaymentPreference();

  const redirectToPayment = async (planId: string) => {
    try {
      const preference = await createPreference.mutateAsync({ plan_id: planId });
      
      // Redirigir a Mercado Pago
      window.location.href = preference.init_point;
      
      return preference;
    } catch (error) {
      console.error('Error redirecting to payment:', error);
      throw error;
    }
  };

  return {
    redirectToPayment,
    isLoading: createPreference.isPending,
    error: createPreference.error
  };
}
