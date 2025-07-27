import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { EvolucionClinicaWithAuthor, EntryType, ManualEntryType, ENTRY_TYPE_LABELS } from '@/types/evolucion-clinica';

interface UseEvolutionEntriesOptions {
  patientId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface EvolutionFilters {
  type: EntryType | 'all';
  dateFrom: string;
  dateTo: string;
  search?: string;
}

export function useEvolutionEntries({ 
  patientId, 
  autoRefresh = false, 
  refreshInterval = 30000 
}: UseEvolutionEntriesOptions) {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<EvolucionClinicaWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EvolutionFilters>({
    type: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Función para cargar entradas con manejo de errores mejorado
  const loadEntries = useCallback(async () => {
    if (!patientId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/patients/${patientId}/evolution`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Error ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error loading evolution entries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  // Función para crear nueva entrada
  const createEntry = useCallback(async (data: {
    entry_type: ManualEntryType;
    content: string;
    metadata?: any;
    isDraft?: boolean;
  }) => {
    if (!session?.user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const response = await fetch(`/api/patients/${patientId}/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        author_id: session.user.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al crear entrada: ${errorData}`);
    }

    // Recargar entradas después de crear
    await loadEntries();
    return response.json();
  }, [patientId, session?.user?.id, loadEntries]);

  // Función para eliminar entrada
  const deleteEntry = useCallback(async (entryId: string) => {
    const response = await fetch(`/api/patients/${patientId}/evolution/${entryId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al eliminar entrada: ${errorData}`);
    }

    // Recargar entradas después de eliminar
    await loadEntries();
  }, [patientId, loadEntries]);

  // Función para actualizar entrada
  const updateEntry = useCallback(async (entryId: string, data: {
    entry_type?: ManualEntryType;
    content?: string;
    metadata?: any;
    isDraft?: boolean;
  }) => {
    if (!session?.user?.id) {
      throw new Error('Usuario no autenticado');
    }

    const response = await fetch(`/api/patients/${patientId}/evolution/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Error al actualizar entrada: ${errorData}`);
    }

    // Recargar entradas después de actualizar
    await loadEntries();
    return response.json();
  }, [patientId, session?.user?.id, loadEntries]);

  // Entradas filtradas con memoización para performance
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filtro por tipo
      if (filters.type !== 'all' && entry.entry_type !== filters.type) {
        return false;
      }

      // Filtro por fecha desde
      if (filters.dateFrom) {
        const entryDate = new Date(entry.created_at).toISOString().split('T')[0];
        if (entryDate < filters.dateFrom) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (filters.dateTo) {
        const entryDate = new Date(entry.created_at).toISOString().split('T')[0];
        if (entryDate > filters.dateTo) {
          return false;
        }
      }

      // Filtro por búsqueda de texto
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        const searchableText = [
          entry.content,
          entry.author_name || '',
          ENTRY_TYPE_LABELS[entry.entry_type] || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }, [entries, filters]);

  // Estadísticas memoizadas
  const stats = useMemo(() => ({
    total: entries.length,
    filtered: filteredEntries.length,
    byType: entries.reduce((acc, entry) => {
      acc[entry.entry_type] = (acc[entry.entry_type] || 0) + 1;
      return acc;
    }, {} as Record<EntryType, number>),
    hasActiveFilters: filters.type !== 'all' || filters.dateFrom || filters.dateTo || (filters.search && filters.search.trim())
  }), [entries, filteredEntries, filters]);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      type: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  }, []);

  // Función para actualizar filtros
  const updateFilters = useCallback((newFilters: Partial<EvolutionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Efecto para cargar entradas inicialmente
  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Efecto para auto-refresh opcional
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadEntries, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadEntries]);

  return {
    // Datos
    entries: filteredEntries,
    allEntries: entries,
    isLoading,
    error,
    stats,
    
    // Filtros
    filters,
    updateFilters,
    clearFilters,
    
    // Acciones
    loadEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    
    // Estado
    hasData: entries.length > 0,
    isEmpty: entries.length === 0 && !isLoading,
  };
}
