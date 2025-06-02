'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ResponseRow, ResponseDetail } from '@/types/patient-responses';

// Removed unused DateRange import

export function usePatientResponses(
  patientId: string,
  filters: { qcode: string; dateRange: { from: Date; to: Date } }
) {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<ResponseDetail | null>(null);

  // Fetch list of responses
  const { data: responses = [], isLoading, refetch } = useQuery<ResponseRow[]>({
    queryKey: ['responses', patientId, filters],
    queryFn: async () => {
      // Asegurarse de que las fechas sean válidas
      const fromDate = filters.dateRange.from instanceof Date ? filters.dateRange.from : new Date(filters.dateRange.from);
      const toDate = filters.dateRange.to instanceof Date ? filters.dateRange.to : new Date(filters.dateRange.to);
      
      // Agregar logs para depuración
      console.log('Solicitando respuestas con filtros:', {
        patientId,
        qcode: filters.qcode || '(todos)',
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      });

      const params = new URLSearchParams({
        qcode: filters.qcode || '',
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        limit: '100', // Aumentar el límite para asegurar que obtenemos todas las respuestas
        offset: '0',
      });
      
      try {
        const res = await fetch(
          `/api/patients/${patientId}/responses?${params.toString()}`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }
        );
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error en la respuesta del servidor:', {
            status: res.status,
            statusText: res.statusText,
            error: errorText
          });
          
          // Intentar obtener más detalles del error si es JSON
          try {
            const errorData = JSON.parse(errorText);
            console.error('Detalles del error:', errorData);
            throw new Error(`Error al cargar respuestas: ${res.status} - ${errorData.error || res.statusText}`);
          } catch (e) {
            throw new Error(`Error al cargar respuestas: ${res.status} - ${res.statusText}`);
          }
        }
        
        const data = await res.json();
        console.log('Respuestas recibidas del servidor:', data);
        return data;
      } catch (error) {
        console.error('Error al obtener respuestas:', error);
        throw error;
      }
    },
  });

  // Fetch detail of selected response
  const { isLoading: isLoadingDetail } = useQuery<ResponseDetail>({
    queryKey: ['response-detail', selectedResponse],
    enabled: !!selectedResponse,
    queryFn: async () => {
      if (!selectedResponse) return {} as ResponseDetail;
      const res = await fetch(`/api/responses/${selectedResponse}`);
      if (!res.ok) throw new Error('Error al cargar detalles');
      const data: ResponseDetail = await res.json();
      setDetailData(data);
      return data;
    },
  });

  const viewDetails = (id: string) => setSelectedResponse(id);
  const closeDetails = () => {
    setSelectedResponse(null);
    setDetailData(null);
  };

  return {
    responses,
    isLoading,
    refetch,
    viewDetails,
    closeDetails,
    selectedResponse,
    detailData,
    isLoadingDetail,
  };
}
