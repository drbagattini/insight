"use client";

import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, AlertCircle, Search } from 'lucide-react';
import { EvolutionEditor } from './EvolutionEditorAdvanced';
import { EvolutionList } from './EvolutionList';
import { EvolutionStats } from './EvolutionStats';
import { EvolutionSynthesis } from './EvolutionSynthesis';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useEvolutionEntries } from '@/hooks/useEvolutionEntries';
import { 
  EntryType,
  ManualEntryType,
  ENTRY_TYPE_LABELS 
} from '@/types/evolucion-clinica';

interface EvolutionTabProps {
  patientId: string;
  patientName?: string;
}

export const EvolutionTab = memo(function EvolutionTab({ patientId, patientName }: EvolutionTabProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; entryId: string | null }>({ isOpen: false, entryId: null });

  
  // Hook personalizado para manejar entradas con optimizaciones
  const {
    entries,
    isLoading,
    error,
    stats,
    filters,
    updateFilters,
    clearFilters,
    createEntry,
    updateEntry,
    deleteEntry,
    loadEntries
  } = useEvolutionEntries({ patientId });



  // Guardar o actualizar entrada usando el hook optimizado
  const handleSaveEntry = useCallback(async (data: {
    entry_type: ManualEntryType;
    content: string;
    metadata?: any;
    isDraft?: boolean;
    // Campos estructurados opcionales
    session_duration_minutes?: number;
    mood_scale?: number;
    anxiety_scale?: number;
    energy_scale?: number;
    progress_rating?: number;
    session_type?: string;
    primary_focus?: string;
    risk_level?: string;
  }) => {
    setIsSaving(true);
    try {
      let savedEntry;
      if (editingEntry) {
        // Actualizar entrada existente
        savedEntry = await updateEntry(editingEntry.id, data);
      } else {
        // Crear nueva entrada
        savedEntry = await createEntry(data);
      }
      setIsEditorOpen(false);
      setEditingEntry(null);
      return savedEntry;
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [createEntry, updateEntry, editingEntry]);

  // Editar entrada
  const handleEditEntry = useCallback((entry: any) => {
    setEditingEntry(entry);
    setIsEditorOpen(true);
  }, []);

  // Eliminar entrada usando el hook optimizado
  const handleDeleteEntry = useCallback((entryId: string) => {
    setDeleteDialog({ isOpen: true, entryId });
  }, []);

  const confirmDeleteEntry = useCallback(async () => {
    if (!deleteDialog.entryId) return;

    try {
      await deleteEntry(deleteDialog.entryId);
      setDeleteDialog({ isOpen: false, entryId: null });
    } catch (error) {
      console.error('Error deleting entry:', error);
      // Aquí podríamos mostrar otro modal de error
      alert('Error al eliminar la entrada. Intente nuevamente.');
    }
  }, [deleteEntry, deleteDialog.entryId]);

  // Cancelar edición
  const handleCancelEdit = useCallback(() => {
    setIsEditorOpen(false);
    setEditingEntry(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header con botones principales */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-gray-900 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">Registro de Evoluciones</h2>
            <p className="text-gray-500 mt-0.5 text-sm">
              Historial cronológico del paciente
            </p>
          </div>
        
        {!isEditorOpen && (
          <div className="flex items-center gap-3">
            <EvolutionSynthesis 
              patientId={patientId} 
              onSynthesisCreated={handleSaveEntry}
            />
            <Button
              onClick={() => {
                setEditingEntry(null);
                setIsEditorOpen(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Nueva Evolución
            </Button>
          </div>
        )}
        </div>
      </div>

      {/* Editor (si está abierto) */}
      {isEditorOpen && (
        <EvolutionEditor
          patientId={patientId}
          onSave={handleSaveEntry}
          onCancel={handleCancelEdit}
          isLoading={isSaving}
          editingEntry={editingEntry}
        />
      )}

      {/* Filtros */}
      {!isEditorOpen && (
        <div className="bg-gray-50/50 rounded-lg border border-gray-200/60 p-3">
          <div className="flex items-center justify-between gap-4">
            {/* Filtros izquierda */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filtro por tipo */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Tipo:</label>
                <Select value={filters.type} onValueChange={(value: EntryType | 'all') => updateFilters({ type: value })}>
                  <SelectTrigger className="w-32 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ver Todo</SelectItem>
                    {Object.entries(ENTRY_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por fecha desde */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Desde:</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  className="w-36 h-9 text-sm"
                />
              </div>

              {/* Filtro por fecha hasta */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium">Hasta:</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  className="w-36 h-9 text-sm"
                />
              </div>

              {/* Limpiar filtros */}
              {stats.hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 px-3 text-sm"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            {/* Búsqueda derecha */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar..."
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-48 h-9 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de entradas */}
      {!isEditorOpen && (
        <EvolutionList
          entries={entries}
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
          isLoading={isLoading}
        />
      )}



      {/* Modal de confirmación de borrado */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, entryId: null })}
        onConfirm={confirmDeleteEntry}
        title="Eliminar Entrada"
        description="¿Está seguro de que desea eliminar esta entrada de evolución clínica? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
});
