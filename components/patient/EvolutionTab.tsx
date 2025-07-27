"use client";

import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, AlertCircle, BarChart3, Search } from 'lucide-react';
import { EvolutionEditor } from './EvolutionEditorAdvanced';
import { EvolutionList } from './EvolutionList';
import { EvolutionStats } from './EvolutionStats';
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
}

export const EvolutionTab = memo(function EvolutionTab({ patientId }: EvolutionTabProps) {
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
    <div className="space-y-6">
      {/* Header con botón principal */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Evolución Clínica</h2>
          <p className="text-gray-600 mt-1 text-sm">
            Registro cronológico de la evolución del paciente
          </p>
        </div>
        
        {!isEditorOpen && (
          <Button
            onClick={() => {
              setEditingEntry(null);
              setIsEditorOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Nueva Evolución
          </Button>
        )}
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
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Filtro por tipo */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Tipo:</label>
                <Select value={filters.type} onValueChange={(value: EntryType | 'all') => updateFilters({ type: value })}>
                  <SelectTrigger className="w-36 h-8">
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
                <Calendar className="h-4 w-4 text-gray-500" />
                <label className="text-sm text-gray-600">Desde:</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  className="w-36 h-8"
                />
              </div>

              {/* Filtro por fecha hasta */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Hasta:</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  className="w-36 h-8"
                />
              </div>

              {/* Limpiar filtros */}
              {stats.hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-3 text-xs"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            {/* Búsqueda por texto */}
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar en contenido..."
                value={filters.search || ''}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-48 h-8 text-sm"
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
