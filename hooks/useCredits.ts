// hooks/useCredits.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreditBalance, TransactionHistory, DebitCreditsRequest } from '@/types/credits';

// Hook para obtener balance de créditos
export function useCredits() {
  return useQuery<CreditBalance>({
    queryKey: ['credits', 'balance'],
    queryFn: async () => {
      const response = await fetch('/api/credits/balance', { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Error al obtener balance de créditos');
      }
      return response.json();
    },
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: true
  });
}

// Hook para obtener historial de transacciones
export function useCreditHistory(page = 1, limit = 20) {
  return useQuery<TransactionHistory>({
    queryKey: ['credits', 'history', page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/credits/history?page=${page}&limit=${limit}` , { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Error al obtener historial de créditos');
      }
      return response.json();
    },
    staleTime: 60000 // 1 minuto
  });
}

// Hook para debitar créditos
export function useDebitCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: DebitCreditsRequest) => {
      const response = await fetch('/api/credits/debit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al debitar créditos');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar cache de balance y historial
      queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['credits', 'history'] });
    }
  });
}

// Hook para refrescar datos de créditos
export function useRefreshCredits() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['credits'] });
  };
}
