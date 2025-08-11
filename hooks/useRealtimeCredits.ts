// hooks/useRealtimeCredits.ts
'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SSEMessage {
  type: 'connected' | 'balance_update' | 'heartbeat';
  balance?: number;
  transaction?: any;
  timestamp?: number;
  message?: string;
}

export function useRealtimeCredits() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Verificar que estamos en el cliente y EventSource está disponible
    if (typeof window === 'undefined' || !window.EventSource) {
      console.warn('[SSE] EventSource no disponible en este entorno');
      return;
    }

    // Crear conexión SSE
    const eventSource = new EventSource('/api/credits/sse');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[SSE] Conectado a actualizaciones de créditos');
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('[SSE] Conexión establecida:', data.message);
            break;
            
          case 'balance_update':
            console.log('[SSE] Balance actualizado:', data.balance);
            
            // Invalidar queries relacionadas con créditos
            queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] });
            queryClient.invalidateQueries({ queryKey: ['credits', 'history'] });
            
            // Opcional: Mostrar notificación toast
            if (data.transaction) {
              console.log('[SSE] Nueva transacción:', data.transaction);
            }
            break;
            
          case 'heartbeat':
            // Mantener conexión viva
            break;
            
          default:
            console.log('[SSE] Mensaje desconocido:', data);
        }
      } catch (error) {
        console.error('[SSE] Error procesando mensaje:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[SSE] Error de conexión:', error);
      
      // Reconectar después de 5 segundos
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.EventSource && 
            eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log('[SSE] Intentando reconectar...');
          eventSourceRef.current = new EventSource('/api/credits/sse');
        }
      }, 5000);
    };

    // Cleanup al desmontar
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [queryClient]);

  // Función para cerrar conexión manualmente
  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  return {
    disconnect,
    isConnected: typeof window !== 'undefined' && window.EventSource ? 
      eventSourceRef.current?.readyState === EventSource.OPEN : false
  };
}
