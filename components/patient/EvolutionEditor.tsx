"use client";

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Check, AlertCircle } from 'lucide-react';
import { EntryType, ManualEntryType, MANUAL_ENTRY_TYPE_LABELS, ENTRY_TYPE_ICONS } from '@/types/evolucion-clinica';
import { validateEvolutionEntry } from '@/lib/validations/evolucion-clinica';
import { ZodError } from 'zod';

interface EvolutionEditorProps {
  patientId: string;
  onSave: (data: {
    entry_type: ManualEntryType;
    content: string;
    tags: string[];
    metadata?: Record<string, any>;
    isDraft?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  editingEntry?: any; // Para futuras ediciones
}

export function EvolutionEditor({ patientId, onSave, onCancel, isLoading = false }: EvolutionEditorProps) {
  const [entryType, setEntryType] = useState<ManualEntryType>('clinica');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = useCallback(async () => {
    setValidationErrors([]);
    
    // Validar con Zod antes de enviar
    try {
      validateEvolutionEntry({
        entry_type: entryType,
        content: content.trim(),
        tags,
        metadata: {}
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        setValidationErrors(errors);
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSave({
        entry_type: entryType,
        content: content.trim(),
        tags,
        metadata,
        isDraft: isDraftMode
      });
      
      // Mostrar feedback de éxito
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Reset form
      setEntryType('clinica');
      setContent('');
      setTags([]);
      setMetadata({});
      setIsDraftMode(false);
      setValidationErrors([]);
    } catch (error) {
      console.error('Error saving entry:', error);
      setValidationErrors(['Error al guardar la entrada. Intente nuevamente.']);
    } finally {
      setIsSaving(false);
    }
  }, [entryType, content, tags, onSave]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Nueva Evolución Clínica</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Errores de validación */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 mb-2">Errores de validación:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Feedback de éxito */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-400 mr-3" />
            <span className="text-sm font-medium text-green-800">
              ¡Entrada guardada exitosamente!
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Selector de tipo de entrada */}
        <div>
          <label 
            htmlFor="entry-type-select" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Tipo de Entrada *
          </label>
          <Select 
            value={entryType} 
            onValueChange={(value: ManualEntryType) => setEntryType(value)}
          >
            <SelectTrigger 
              id="entry-type-select"
              className="w-full"
              aria-label="Seleccionar tipo de entrada"
              aria-describedby="entry-type-help"
            >
              <SelectValue placeholder="Seleccione el tipo de entrada" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MANUAL_ENTRY_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span role="img" aria-label={`Icono ${label}`}>
                      {ENTRY_TYPE_ICONS[key as EntryType]}
                    </span>
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p id="entry-type-help" className="text-xs text-gray-500 mt-1">
            Seleccione el tipo de registro que desea crear
          </p>
        </div>

        {/* Editor de contenido */}
        <div>
          <label 
            htmlFor="content-textarea" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Contenido *
          </label>
          <Textarea
            id="content-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escriba aquí la evolución clínica del paciente..."
            className="min-h-[200px] resize-none"
            disabled={isSaving}
          />
        </div>

        {/* Sistema de etiquetas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Etiquetas
          </label>
          
          {/* Tags existentes */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600"
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Input para nueva etiqueta */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Agregar etiqueta..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSaving}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTag}
              disabled={!newTag.trim() || isSaving}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          
          <div className="flex gap-3">
            {/* Guardar Borrador */}
            <Button
              variant="outline"
              onClick={() => {
                setIsDraftMode(true);
                handleSave();
              }}
              disabled={!content.trim() || isSaving}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              {isSaving && isDraftMode ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Guardando borrador...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Borrador
                </>
              )}
            </Button>
            
            {/* Finalizar y Guardar */}
            <Button
              onClick={() => {
                setIsDraftMode(false);
                handleSave();
              }}
              disabled={!content.trim() || isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving && !isDraftMode ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Finalizar y Guardar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
